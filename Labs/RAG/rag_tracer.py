"""
RAG Pipeline Tracer
Tracks and logs every step of the retrieval-augmented generation pipeline:
  - Query ingestion
  - Embedding latency
  - Per-document retrieval scores (semantic, BM25, combined)
  - Documents selected for context
  - LLM prompt / response / token usage
  - End-to-end latency
"""

import time
import json
import uuid
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pathlib import Path

# ── Logger ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("rag.tracer")


# ── Data classes (one per pipeline stage) ────────────────────────────────────

@dataclass
class DocumentScore:
    """Scores for a single retrieved document."""
    doc_id: str
    text_snippet: str          # first 120 chars
    semantic_score: float = 0.0
    keyword_score: float = 0.0
    combined_score: float = 0.0
    rank: int = 0


@dataclass
class RetrievalTrace:
    """Covers the full retrieval stage."""
    query: str
    k: int
    alpha: float                      # weight: alpha=semantic, (1-alpha)=BM25
    embed_latency_ms: float = 0.0
    semantic_latency_ms: float = 0.0
    bm25_latency_ms: float = 0.0
    fusion_latency_ms: float = 0.0
    total_retrieval_ms: float = 0.0
    docs_scored: List[DocumentScore] = field(default_factory=list)
    docs_selected: List[str] = field(default_factory=list)   # top-k texts


@dataclass
class LLMTrace:
    """Covers the generation stage."""
    model: str
    prompt_preview: str       # first 300 chars of the prompt
    full_context_length: int  # character count of the context block
    response: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0


@dataclass
class PipelineTrace:
    """Top-level trace for one query → answer call."""
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    query: str = ""
    answer: str = ""
    total_latency_ms: float = 0.0
    retrieval: Optional[RetrievalTrace] = None
    llm: Optional[LLMTrace] = None
    error: Optional[str] = None


# ── Tracer class ──────────────────────────────────────────────────────────────

class RAGTracer:
    """
    Wraps the hybrid RAG pipeline and records a PipelineTrace per query.

    Usage
    -----
    tracer = RAGTracer(log_dir="logs/rag_traces")
    trace  = tracer.run(query, retriever, claude_client, model, k, alpha)
    """

    def __init__(self, log_dir: str = "logs/rag_traces"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.history: List[PipelineTrace] = []

    # ── public entry point ────────────────────────────────────────────────────

    def run(
        self,
        query: str,
        retriever,          # HybridRetriever instance
        claude_client,      # Anthropic client
        model: str = "claude-3-5-sonnet-20241022",
        k: int = 3,
        alpha: float = 0.5,
    ) -> PipelineTrace:

        trace = PipelineTrace(query=query)
        t0 = time.perf_counter()

        log.info("▶ [%s] Query: %s", trace.trace_id, query)

        try:
            # ── Stage 1: Retrieval ────────────────────────────────────────
            retrieval_trace = self._trace_retrieval(query, retriever, k, alpha)
            trace.retrieval = retrieval_trace

            # ── Stage 2: Generation ───────────────────────────────────────
            llm_trace = self._trace_generation(
                query, retrieval_trace.docs_selected, claude_client, model
            )
            trace.llm = llm_trace
            trace.answer = llm_trace.response

        except Exception as exc:
            trace.error = str(exc)
            log.error("Pipeline error [%s]: %s", trace.trace_id, exc)

        trace.total_latency_ms = (time.perf_counter() - t0) * 1000
        self._log_trace(trace)
        self.history.append(trace)
        return trace

    # ── Stage 1: Retrieval ────────────────────────────────────────────────────

    def _trace_retrieval(
        self, query: str, retriever, k: int, alpha: float
    ) -> RetrievalTrace:
        from openai import OpenAI
        import numpy as np

        rt = RetrievalTrace(query=query, k=k, alpha=alpha)
        stage_start = time.perf_counter()

        # -- Embedding ---------------------------------------------------------
        openai_client = retriever._openai_client  # injected (see below)
        t = time.perf_counter()
        query_embedding = openai_client.embeddings.create(
            model="text-embedding-3-small", input=query
        ).data[0].embedding
        rt.embed_latency_ms = (time.perf_counter() - t) * 1000
        log.info("  ↳ Embedding done in %.1f ms", rt.embed_latency_ms)

        # -- Semantic (ChromaDB) -----------------------------------------------
        t = time.perf_counter()
        semantic_results = retriever._collection.query(
            query_embeddings=[query_embedding],
            n_results=len(retriever.documents),
        )
        rt.semantic_latency_ms = (time.perf_counter() - t) * 1000

        semantic_scores: Dict[str, float] = {}
        for doc_id, distance in zip(
            semantic_results["ids"][0], semantic_results["distances"][0]
        ):
            semantic_scores[doc_id] = 1 / (1 + distance)

        log.info(
            "  ↳ Semantic search done in %.1f ms (%d docs)",
            rt.semantic_latency_ms, len(semantic_scores)
        )

        # -- BM25 keyword ------------------------------------------------------
        t = time.perf_counter()
        tokenized_query = query.lower().split()
        bm25_raw = retriever.bm25.get_scores(tokenized_query)
        max_bm25 = max(bm25_raw) if max(bm25_raw) > 0 else 1.0
        bm25_norm = bm25_raw / max_bm25
        rt.bm25_latency_ms = (time.perf_counter() - t) * 1000
        log.info("  ↳ BM25 done in %.1f ms", rt.bm25_latency_ms)

        # -- Fusion ------------------------------------------------------------
        t = time.perf_counter()
        combined: Dict[str, float] = {}
        for i, doc_id in enumerate(retriever.doc_ids):
            s = semantic_scores.get(doc_id, 0.0)
            b = float(bm25_norm[i])
            combined[doc_id] = alpha * s + (1 - alpha) * b

        # Build per-document score records
        for i, doc_id in enumerate(retriever.doc_ids):
            rt.docs_scored.append(DocumentScore(
                doc_id=doc_id,
                text_snippet=retriever.documents[i][:120],
                semantic_score=round(semantic_scores.get(doc_id, 0.0), 4),
                keyword_score=round(float(bm25_norm[i]), 4),
                combined_score=round(combined[doc_id], 4),
            ))

        # Sort and assign ranks
        rt.docs_scored.sort(key=lambda d: d.combined_score, reverse=True)
        for rank, ds in enumerate(rt.docs_scored, start=1):
            ds.rank = rank

        # Top-k selection
        top_ids = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:k]
        rt.docs_selected = [
            retriever.documents[retriever.doc_ids.index(doc_id)]
            for doc_id, _ in top_ids
        ]
        rt.fusion_latency_ms = (time.perf_counter() - t) * 1000
        rt.total_retrieval_ms = (time.perf_counter() - stage_start) * 1000

        # Log score table
        log.info("  ↳ Score table (all docs):")
        log.info("    %-8s  %-8s  %-8s  %-6s  %s",
                 "Semantic", "BM25", "Combined", "Rank", "Snippet")
        for ds in rt.docs_scored:
            marker = "✓" if ds.rank <= k else " "
            log.info("    %s%-8.4f  %-8.4f  %-8.4f  #%-5d %s",
                     marker, ds.semantic_score, ds.keyword_score,
                     ds.combined_score, ds.rank, ds.text_snippet[:60] + "…")

        return rt

    # ── Stage 2: Generation ───────────────────────────────────────────────────

    def _trace_generation(
        self,
        query: str,
        docs: List[str],
        claude_client,
        model: str,
    ) -> LLMTrace:

        context = "\n\n---\n\n".join(docs)
        prompt = (
            f"Answer based on this context:\n\nContext:\n{context}\n\nQuestion: {query}"
        )

        lt = LLMTrace(
            model=model,
            prompt_preview=prompt[:300],
            full_context_length=len(context),
            response="",
        )

        log.info(
            "  ↳ Sending to LLM [%s] — context %d chars, %d docs",
            model, lt.full_context_length, len(docs)
        )

        t = time.perf_counter()
        message = claude_client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        lt.latency_ms = (time.perf_counter() - t) * 1000

        lt.response = message.content[0].text
        lt.input_tokens = message.usage.input_tokens
        lt.output_tokens = message.usage.output_tokens

        log.info(
            "  ↳ LLM response in %.1f ms | tokens in=%d out=%d",
            lt.latency_ms, lt.input_tokens, lt.output_tokens
        )

        return lt

    # ── Persistence ───────────────────────────────────────────────────────────

    def _log_trace(self, trace: PipelineTrace) -> None:
        """Append the trace as a JSON line to a daily log file."""
        log_file = self.log_dir / f"rag_{datetime.now().strftime('%Y-%m-%d')}.jsonl"

        def _serialize(obj):
            if hasattr(obj, "__dataclass_fields__"):
                return asdict(obj)
            raise TypeError(f"Not serializable: {type(obj)}")

        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(trace), default=str) + "\n")

        log.info(
            "◼ [%s] Total %.1f ms — answer: %s…",
            trace.trace_id,
            trace.total_latency_ms,
            trace.answer[:80] if trace.answer else "(error)",
        )
        log.info("  Trace saved → %s", log_file)

    # ── Convenience: pretty-print last trace ──────────────────────────────────

    def summary(self, trace: Optional[PipelineTrace] = None) -> str:
        t = trace or (self.history[-1] if self.history else None)
        if not t:
            return "No traces recorded."

        lines = [
            f"\n{'═'*60}",
            f"  TRACE  {t.trace_id}   {t.timestamp}",
            f"{'═'*60}",
            f"  Query : {t.query}",
            f"  Answer: {t.answer[:200]}",
            f"  Total : {t.total_latency_ms:.1f} ms",
        ]
        if t.retrieval:
            r = t.retrieval
            lines += [
                "",
                "  ── Retrieval ─────────────────────────────",
                f"  alpha={r.alpha}  k={r.k}",
                f"  Embed:    {r.embed_latency_ms:.1f} ms",
                f"  Semantic: {r.semantic_latency_ms:.1f} ms",
                f"  BM25:     {r.bm25_latency_ms:.1f} ms",
                f"  Fusion:   {r.fusion_latency_ms:.1f} ms",
                f"  Total:    {r.total_retrieval_ms:.1f} ms",
                "",
                "  Rank  Sem     BM25    Combined  Doc",
            ]
            for ds in r.docs_scored:
                marker = "✓" if ds.rank <= r.k else " "
                lines.append(
                    f"  {marker} #{ds.rank:<3} {ds.semantic_score:.4f}  "
                    f"{ds.keyword_score:.4f}  {ds.combined_score:.4f}  "
                    f"{ds.text_snippet[:55]}…"
                )
        if t.llm:
            l = t.llm
            lines += [
                "",
                "  ── LLM ───────────────────────────────────",
                f"  Model:   {l.model}",
                f"  Context: {l.full_context_length} chars",
                f"  Tokens:  in={l.input_tokens}  out={l.output_tokens}",
                f"  Latency: {l.latency_ms:.1f} ms",
            ]
        lines.append(f"{'═'*60}\n")
        return "\n".join(lines)
