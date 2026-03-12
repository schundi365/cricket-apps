from __future__ import annotations

from datetime import datetime, UTC
from pathlib import Path

from app.schemas import DiagnoseLabsResponse, MedicationItem, Patient


def _safe_slug(value: str) -> str:
    return "".join(ch for ch in value if ch.isalnum() or ch in {"-", "_"}) or "unknown"


def write_patient_memory(
    patient: Patient,
    analysis: DiagnoseLabsResponse,
    medications: list[MedicationItem],
    known_drug_allergies: list[str],
) -> str:
    base_dir = Path(__file__).resolve().parents[2] / "patient_memory"
    base_dir.mkdir(parents=True, exist_ok=True)

    patient_slug = _safe_slug(patient.patient_id)
    memory_path = base_dir / f"{patient_slug}.md"

    lines: list[str] = []
    lines.append(f"# Patient Memory - {patient.patient_id}")
    lines.append("")
    lines.append(f"- Generated At (UTC): {datetime.now(UTC).isoformat()}")
    lines.append(f"- Patient Name: {patient.name or 'Unknown'}")
    lines.append(f"- DOB: {patient.dob or 'Unknown'}")
    lines.append(f"- Sex: {patient.sex or 'Unknown'}")
    lines.append(f"- Analysis ID: {analysis.analysis_id}")
    lines.append("")

    lines.append("## Clinical Summary")
    lines.append("")
    lines.append(f"- Urgency: {analysis.summary.urgency}")
    lines.append(f"- Headline: {analysis.summary.headline}")
    lines.append(f"- Confidence: {analysis.summary.confidence}")
    lines.append(f"- Natural Language Summary: {analysis.natural_language_summary}")
    lines.append("")

    lines.append("## Highlight Points")
    lines.append("")
    if analysis.highlight_points:
        for item in analysis.highlight_points:
            lines.append(f"- {item}")
    else:
        lines.append("- No highlight points generated.")
    lines.append("")

    lines.append("## Key Findings")
    lines.append("")
    for finding in analysis.key_findings:
        lines.append(f"- [{finding.severity.upper()}] {finding.label}")
        for ev in finding.evidence:
            lines.append(f"  - Evidence: {ev}")
    lines.append("")

    lines.append("## Medication Profile")
    lines.append("")
    if medications:
        for med in medications:
            lines.append(
                "- {name} | Generic: {generic} | Dose: {dose} | Frequency: {freq} | Days: {days} | Source: {source}".format(
                    name=med.drug_name,
                    generic=med.generic_name or "N/A",
                    dose=med.dosage or "N/A",
                    freq=med.frequency or "N/A",
                    days=med.number_of_days if med.number_of_days is not None else "N/A",
                    source=med.source or "N/A",
                )
            )
    else:
        lines.append("- No medication records found.")
    lines.append("")

    lines.append("## Medication Safety Alerts")
    lines.append("")
    if analysis.medication_alerts:
        for alert in analysis.medication_alerts:
            lines.append(f"- [{alert.severity.upper()}] {alert.issue}")
            lines.append(f"  - Implication: {alert.implication}")
    else:
        lines.append("- No medication safety alerts identified.")
    lines.append("")

    lines.append("## Known Drug Allergies")
    lines.append("")
    if known_drug_allergies:
        for allergy in known_drug_allergies:
            lines.append(f"- {allergy}")
    else:
        lines.append("- None documented in source data.")
    lines.append("")

    lines.append("## Recommendations")
    lines.append("")
    if analysis.recommendations:
        for rec in analysis.recommendations:
            lines.append(f"- {rec}")
    else:
        lines.append("- No recommendations generated.")

    memory_path.write_text("\n".join(lines), encoding="utf-8")
    return str(memory_path)
