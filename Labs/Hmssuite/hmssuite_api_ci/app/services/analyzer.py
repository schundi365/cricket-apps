from __future__ import annotations

from datetime import datetime, UTC
from uuid import uuid4

from app.schemas import (
    DiagnoseLabsRequest,
    DiagnoseLabsResponse,
    KeyFinding,
    MedicationAlert,
    NormalizedInput,
    Summary,
)


def _parse_reference_range(reference_range: str | None) -> tuple[float | None, float | None]:
    if not reference_range or "-" not in reference_range:
        return None, None

    parts = reference_range.split("-")
    if len(parts) != 2:
        return None, None

    try:
        return float(parts[0]), float(parts[1])
    except ValueError:
        return None, None


def _severity_for_lab(test_name: str, value: float, low: float | None, high: float | None) -> str:
    name = test_name.lower()
    if "hemoglobin" in name and value < 8:
        return "high"
    if "glucose" in name and value > 250:
        return "high"
    if "potassium" in name and value > 5.8:
        return "high"

    if low is not None and value < low:
        return "moderate"
    if high is not None and value > high:
        return "moderate"
    return "low"


def _lower_set(items: list[str]) -> set[str]:
    return {item.lower().strip() for item in items if item and item.strip()}


def _medication_safety_alerts(payload: DiagnoseLabsRequest) -> list[MedicationAlert]:
    alerts: list[MedicationAlert] = []

    meds = [m.drug_name.lower() for m in payload.medications]
    generics = [
        (m.generic_name or "").lower()
        for m in payload.medications
        if m.generic_name
    ]
    medication_text = " ".join(meds + generics)
    known_allergies = _lower_set(payload.known_drug_allergies)

    for med in payload.medications:
        med_name = med.drug_name.lower()
        generic_name = (med.generic_name or "").lower()
        for allergy in known_allergies:
            if allergy and (allergy in med_name or (generic_name and allergy in generic_name)):
                alerts.append(
                    MedicationAlert(
                        severity="high",
                        issue=f"Potential allergy conflict for {med.drug_name}",
                        implication="Prescribed drug appears to overlap with recorded allergy and may trigger adverse reaction.",
                    )
                )

    for lab in payload.labs:
        name = lab.test_name.lower()
        value = lab.value

        if "creatinine" in name and value >= 1.5:
            if any(token in medication_text for token in ["diclofenac", "ibuprofen", "naproxen", "nsaid"]):
                alerts.append(
                    MedicationAlert(
                        severity="high",
                        issue="Renal strain risk with NSAID use",
                        implication="Elevated creatinine with NSAID exposure may worsen renal function.",
                    )
                )

        if "potassium" in name and value >= 5.2:
            if any(token in medication_text for token in ["spironolactone", "ace", "lisinopril", "enalapril", "arb", "losartan"]):
                alerts.append(
                    MedicationAlert(
                        severity="high",
                        issue="Hyperkalemia medication interaction risk",
                        implication="High potassium with potassium-raising drugs can increase arrhythmia risk.",
                    )
                )

        if "glucose" in name and value >= 180:
            if any(token in medication_text for token in ["pred", "steroid", "dexamethasone", "methylprednisolone"]):
                alerts.append(
                    MedicationAlert(
                        severity="medium",
                        issue="Hyperglycemia likely worsened by steroid-class drug",
                        implication="Persistently high glucose may delay recovery and require medication adjustment.",
                    )
                )

        if "hemoglobin" in name and value < 9.0:
            if any(token in medication_text for token in ["warfarin", "heparin", "apixaban", "rivaroxaban", "anticoagulant"]):
                alerts.append(
                    MedicationAlert(
                        severity="medium",
                        issue="Anemia with concurrent anticoagulant exposure",
                        implication="Low hemoglobin plus anticoagulants may indicate elevated bleeding risk.",
                    )
                )

    # Deduplicate near-identical alerts
    dedup: dict[tuple[str, str], MedicationAlert] = {}
    for alert in alerts:
        dedup[(alert.severity, alert.issue)] = alert
    return list(dedup.values())


def analyze_labs(payload: DiagnoseLabsRequest) -> DiagnoseLabsResponse:
    key_findings: list[KeyFinding] = []
    statements: list[str] = []
    recommendations: list[str] = []

    abnormal_count = 0
    normal_count = 0
    urgency = "LOW"

    for lab in payload.labs:
        low, high = _parse_reference_range(lab.reference_range)
        is_abnormal = False

        if lab.abnormal_flag and lab.abnormal_flag.upper() in {"L", "H"}:
            is_abnormal = True
        elif low is not None and lab.value < low:
            is_abnormal = True
        elif high is not None and lab.value > high:
            is_abnormal = True

        if is_abnormal:
            abnormal_count += 1
            severity = _severity_for_lab(lab.test_name, lab.value, low, high)
            evidence = f"{lab.test_name} {lab.value} {lab.unit}"
            if lab.reference_range:
                evidence += f" (reference {lab.reference_range})"

            key_findings.append(
                KeyFinding(
                    code=f"{lab.test_code}-abnormal",
                    label=f"Abnormal {lab.test_name}",
                    severity=severity,
                    evidence=[evidence],
                )
            )
            statements.append(f"{lab.test_name} is abnormal and may need clinical review.")

            if "hemoglobin" in lab.test_name.lower():
                recommendations.append("Consider iron profile and reticulocyte count.")
            if "glucose" in lab.test_name.lower():
                recommendations.append("Review glycemic control and order HbA1c if needed.")

            if severity == "high":
                urgency = "HIGH"
            elif urgency != "HIGH":
                urgency = "MEDIUM"
        else:
            normal_count += 1
            if payload.options.include_normal_labs:
                statements.append(f"{lab.test_name} is within expected range.")

    if abnormal_count == 0:
        headline = "No abnormal lab pattern detected in submitted panel."
        confidence = 0.78
        if not recommendations:
            recommendations.append("Continue routine clinical monitoring.")
    else:
        headline = f"Detected {abnormal_count} abnormal lab finding(s) requiring review."
        confidence = 0.86 if urgency != "HIGH" else 0.9

    if not key_findings:
        key_findings.append(
            KeyFinding(
                code="no-critical-finding",
                label="No critical abnormalities",
                severity="low",
                evidence=["All provided values fall within expected thresholds."],
            )
        )

    medication_alerts = _medication_safety_alerts(payload)
    if medication_alerts and urgency == "LOW":
        urgency = "MEDIUM"
    if any(a.severity == "high" for a in medication_alerts):
        urgency = "HIGH"

    highlight_points: list[str] = [
        f"{finding.label} ({finding.severity})"
        for finding in key_findings[:5]
    ]
    for alert in medication_alerts:
        highlight_points.append(f"Medication safety: {alert.issue}")

    natural_language_summary = headline
    if medication_alerts:
        natural_language_summary += " Medication review indicates potential safety conflicts that should be validated by a clinician."

    return DiagnoseLabsResponse(
        request_id=payload.request_id,
        analysis_id=f"ANL-{uuid4().hex[:12].upper()}",
        completed_at=datetime.now(UTC),
        summary=Summary(urgency=urgency, headline=headline, confidence=confidence),
        key_findings=key_findings,
        recommendations=sorted(set(recommendations)),
        medication_alerts=medication_alerts,
        normalized_input=NormalizedInput(
            clinical_statements=statements,
            abnormal_lab_count=abnormal_count,
            normal_lab_count=normal_count,
        ),
        natural_language_summary=natural_language_summary,
        highlight_points=highlight_points,
        trace={
            "source_system": payload.source_system,
            "pipeline_version": "phase1-lab-agent-v1",
        },
    )
