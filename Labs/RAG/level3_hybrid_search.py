"""
Level 3: Hybrid Search
Combines semantic search (embeddings) with keyword search (BM25).
Catches cases where semantic similarity misses exact term matches.
"""

from openai import OpenAI
from anthropic import Anthropic
import chromadb
from rank_bm25 import BM25Okapi
import numpy as np
import os
from typing import List

# OpenAI for embeddings, Claude for generation
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
claude_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

chroma = chromadb.Client()
collection = chroma.create_collection("docs_hybrid")


class HybridRetriever:
    def __init__(self, documents: List[str]):
        self.documents = documents
        self.doc_ids = [f"doc_{i}" for i in range(len(documents))]

        # Expose clients so RAGTracer can reuse them without extra API calls
        self._openai_client = openai_client
        self._collection = collection

        # Index for semantic search with OpenAI
        for doc_id, doc in zip(self.doc_ids, documents):
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=doc
            )
            collection.add(
                ids=[doc_id],
                embeddings=[response.data[0].embedding],
                documents=[doc]
            )

        # Index for keyword search (BM25)
        tokenized_docs = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized_docs)
    
    def search(self, query: str, k: int = 3, alpha: float = 0.5) -> List[str]:
        """
        Hybrid search combining semantic and keyword search.
        
        Args:
            query: Search query
            k: Number of results to return
            alpha: Weight for semantic search (1-alpha for keyword search)
        """
        # Semantic search scores with OpenAI
        query_embedding = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        ).data[0].embedding
        
        semantic_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=len(self.documents)
        )
        
        # Create semantic scores (normalized)
        semantic_scores = {}
        for doc_id, distance in zip(semantic_results["ids"][0], semantic_results["distances"][0]):
            # Convert distance to similarity score
            semantic_scores[doc_id] = 1 / (1 + distance)
        
        # Keyword search scores (BM25)
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        
        # Normalize BM25 scores
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1
        bm25_scores = bm25_scores / max_bm25
        
        # Combine scores
        combined_scores = {}
        for i, doc_id in enumerate(self.doc_ids):
            semantic_score = semantic_scores.get(doc_id, 0)
            keyword_score = bm25_scores[i]
            combined_scores[doc_id] = alpha * semantic_score + (1 - alpha) * keyword_score
        
        # Get top-k documents
        top_doc_ids = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:k]
        top_docs = [self.documents[self.doc_ids.index(doc_id)] for doc_id, _ in top_doc_ids]
        
        return top_docs


def hybrid_rag(query: str, retriever: HybridRetriever, k: int = 3) -> str:
    """RAG with hybrid search using Claude."""
    retrieved_docs = retriever.search(query, k=k)
    
    context = "\n\n---\n\n".join(retrieved_docs)
    
    # Generate with Claude
    message = claude_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Answer based on this context:

Context:
{context}

Question: {query}"""
            }
        ]
    )
    return message.content[0].text


if __name__ == "__main__":
    from rag_tracer import RAGTracer

    documents = [
        "Our data retention policy requires keeping customer records for 7 years. Deletion requests must be processed within 30 days.",
        "Employee retention programs focus on career development and work-life balance.",
        "Data backup procedures should be performed daily to ensure business continuity.",
        "The retention schedule for financial records is 10 years per regulatory requirements."
    ]

    retriever = HybridRetriever(documents)
    tracer = RAGTracer(log_dir="logs/rag_traces")

    queries = [
        "What is the retention policy for customer data?",
        "How often should backups be done?",
    ]

    for query in queries:
        trace = tracer.run(
            query=query,
            retriever=retriever,
            claude_client=claude_client,
            model="claude-3-5-sonnet-20241022",
            k=3,
            alpha=0.5,
        )
        print(tracer.summary(trace))
