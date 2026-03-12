from __future__ import annotations

from datetime import datetime, UTC
from uuid import uuid4

from app.schemas import (
    ClaimReconciliation,
    DiagnoseLabsRequest,
    DiagnoseLabsResponse,
    ExtractedClaim,
    KeyFinding,
    MedicationAlert,
    NormalizedInput,
    RadiologyAlert,
    Summary,
)
from app.services.llm_claim_extractor import extract_claims_via_llm


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


def _radiology_alerts(payload: DiagnoseLabsRequest) -> list[RadiologyAlert]:
    alerts: list[RadiologyAlert] = []

    high_risk_patterns: list[tuple[str, str, str]] = [
        (
            "intracranial hemorrhage|brain bleed|subdural hematoma|subarachnoid hemorrhage|intraparenchymal hemorrhage",
            "Critical intracranial bleed pattern",
            "Potential neurologic emergency requiring immediate specialist review.",
        ),
        (
            "pulmonary embol|saddle embol",
            "Pulmonary embolism pattern",
            "May indicate life-threatening thromboembolic event and urgent escalation.",
        ),
        (
            "pneumothorax|tension pneumothorax",
            "Pneumothorax pattern",
            "May compromise respiratory function and require urgent intervention.",
        ),
        (
            "aortic dissection|rupture",
            "Aortic catastrophe pattern",
            "May represent vascular emergency with high acute risk.",
        ),
    ]

    moderate_patterns: list[tuple[str, str, str]] = [
        (
            "acute infarct|acute ischemia|territorial infarct|stroke",
            "Acute ischemic/stroke pattern",
            "Could indicate acute cerebrovascular event; correlate with symptoms and timeline.",
        ),
        (
            "mass lesion|space occupying lesion|neoplasm|malignan|metast",
            "Possible malignant lesion pattern",
            "Potential oncologic finding that needs staging/confirmation and specialist pathway.",
        ),
        (
            "consolidation|lobar pneumonia|airspace opacity",
            "Pulmonary infectious pattern",
            "Could represent active pulmonary infection requiring treatment correlation.",
        ),
        (
            "fracture|displaced fracture|compression fracture",
            "Fracture pattern",
            "Structural injury may need immobilization, pain control, and orthopedic review.",
        ),
        (
            "pleural effusion|pericardial effusion|ascites",
            "Fluid accumulation pattern",
            "May indicate decompensation or systemic pathology requiring cause-directed workup.",
        ),
        (
            "small bowel obstruction|large bowel obstruction|hydrocephalus",
            "Obstructive pathology pattern",
            "Suggests obstruction physiology and may require urgent decompression planning.",
        ),
    ]

    for report in payload.radiology_reports:
        text = " ".join(
            [
                report.modality or "",
                report.body_part or "",
                report.impression_text or "",
                report.findings_text or "",
            ]
        ).lower()

        for pattern, issue, implication in high_risk_patterns:
            if any(token in text for token in pattern.split("|")):
                alerts.append(
                    RadiologyAlert(
                        severity="high",
                        issue=issue,
                        implication=implication,
                        evidence=report.impression_text,
                    )
                )

        for pattern, issue, implication in moderate_patterns:
            if any(token in text for token in pattern.split("|")):
                alerts.append(
                    RadiologyAlert(
                        severity="medium",
                        issue=issue,
                        implication=implication,
                        evidence=report.impression_text,
                    )
                )

    dedup: dict[tuple[str, str], RadiologyAlert] = {}
    for alert in alerts:
        dedup[(alert.severity, alert.issue)] = alert
    return list(dedup.values())


def _doctor_question_flags(payload: DiagnoseLabsRequest) -> list[str]:
    flags: list[str] = []
    concerns = [q.lower() for q in payload.patient_llm_questions if q.strip()]

    for question in concerns:
        if any(token in question for token in ["cancer", "tumor", "malignan", "metast"]):
            flags.append("Patient/LLM concern: possible malignancy - discuss certainty, differential, and next diagnostic step.")
        if any(token in question for token in ["stroke", "brain bleed", "hemorrhage", "paralysis"]):
            flags.append("Patient/LLM concern: neurologic emergency - verify red flags, onset timeline, and emergency referral threshold.")
        if any(token in question for token in ["urgent", "emergency", "life threatening", "danger"]):
            flags.append("Patient/LLM concern: urgency/severity - provide explicit triage advice and warning symptoms.")
        if any(token in question for token in ["surgery", "operation", "biopsy"]):
            flags.append("Patient/LLM concern: invasive procedure need - explain indication criteria and alternatives.")
        if any(token in question for token in ["wrong", "misread", "mistake", "chatgpt", "groq", "llm"]):
            flags.append("Patient/LLM concern: external AI interpretation reliability - provide clinician-verified interpretation and uncertainty boundaries.")

    return sorted(set(flags))


def _rule_based_claims(payload: DiagnoseLabsRequest) -> list[ExtractedClaim]:
    claims: list[ExtractedClaim] = []
    claim_index = 1

    for report in payload.radiology_reports:
        text = " ".join(
            [
                report.impression_text or "",
                report.findings_text or "",
            ]
        ).lower()

        mappings: list[tuple[str, str, str]] = [
            ("hemorrhage|hematoma|brain bleed", "radiology", "intracranial_hemorrhage"),
            ("stroke|infarct|ischemia", "radiology", "acute_stroke"),
            ("mass|tumor|neoplasm|metast", "radiology", "possible_malignancy"),
            ("pulmonary embol", "radiology", "pulmonary_embolism"),
            ("pneumothorax", "radiology", "pneumothorax"),
            ("fracture", "radiology", "fracture"),
            ("pleural effusion", "radiology", "pleural_effusion"),
            ("consolidation|pneumonia", "radiology", "pulmonary_infection"),
        ]

        for tokens, category, entity in mappings:
            if any(token in text for token in tokens.split("|")):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"rule-{claim_index}",
                        source="rule:radiology",
                        category=category,
                        entity=entity,
                        polarity="present",
                        confidence=0.8,
                        claim_text=report.impression_text,
                    )
                )
                claim_index += 1

        if "no " in text and any(token in text for token in ["no hemorrhage", "no fracture", "no mass"]):
            negations: list[tuple[str, str]] = [
                ("no hemorrhage", "intracranial_hemorrhage"),
                ("no fracture", "fracture"),
                ("no mass", "possible_malignancy"),
            ]
            for phrase, entity in negations:
                if phrase in text:
                    claims.append(
                        ExtractedClaim(
                            claim_id=f"rule-{claim_index}",
                            source="rule:radiology",
                            category="radiology",
                            entity=entity,
                            polarity="absent",
                            confidence=0.7,
                            claim_text=phrase,
                        )
                    )
                    claim_index += 1

    for question in payload.patient_llm_questions:
        q = question.lower().strip()
        if not q:
            continue
        question_mappings: list[tuple[str, str, str]] = [
            ("cancer|tumor|malignan|metast", "oncology", "possible_malignancy"),
            ("stroke|brain bleed|hemorrhage", "neurology", "acute_stroke"),
            ("urgent|emergency|life threatening", "triage", "high_urgency"),
            ("surgery|operation|biopsy", "procedure", "procedure_need"),
        ]
        for tokens, category, entity in question_mappings:
            if any(token in q for token in tokens.split("|")):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"rule-{claim_index}",
                        source="rule:patient-question",
                        category=category,
                        entity=entity,
                        polarity="uncertain",
                        confidence=0.65,
                        claim_text=question,
                    )
                )
                claim_index += 1

    for lab in payload.labs:
        low, high = _parse_reference_range(lab.reference_range)
        is_abnormal = False
        if lab.abnormal_flag and lab.abnormal_flag.upper() in {"L", "H"}:
            is_abnormal = True
        elif low is not None and lab.value < low:
            is_abnormal = True
        elif high is not None and lab.value > high:
            is_abnormal = True

        if not is_abnormal:
            continue

        entity = "lab_abnormality"
        lname = lab.test_name.lower()
        if "hemoglobin" in lname:
            entity = "anemia"
        elif "glucose" in lname:
            entity = "hyperglycemia"
        elif "potassium" in lname:
            entity = "potassium_disorder"
        elif "creatinine" in lname:
            entity = "renal_dysfunction"

        claims.append(
            ExtractedClaim(
                claim_id=f"rule-{claim_index}",
                source="rule:lab",
                category="lab",
                entity=entity,
                polarity="present",
                confidence=0.9,
                claim_text=f"{lab.test_name} abnormal ({lab.value} {lab.unit})",
            )
        )
        claim_index += 1

    return claims


def _build_fact_index(
    payload: DiagnoseLabsRequest,
    key_findings: list[KeyFinding],
    medication_alerts: list[MedicationAlert],
    radiology_alerts: list[RadiologyAlert],
    urgency: str,
) -> dict[str, list[str]]:
    facts: dict[str, list[str]] = {}

    def add_fact(entity: str, evidence: str) -> None:
        facts.setdefault(entity, []).append(evidence)

    for finding in key_findings:
        text = finding.label.lower()
        evidence = "; ".join(finding.evidence)
        if "hemoglobin" in text:
            add_fact("anemia", evidence)
        if "glucose" in text:
            add_fact("hyperglycemia", evidence)
        if "potassium" in text:
            add_fact("potassium_disorder", evidence)
        if "creatinine" in text:
            add_fact("renal_dysfunction", evidence)
        add_fact("lab_abnormality", evidence)

    for alert in medication_alerts:
        al = alert.issue.lower()
        if "allergy" in al:
            add_fact("medication_allergy_risk", alert.issue)
        if "hyperkalemia" in al:
            add_fact("potassium_disorder", alert.issue)
        if "renal" in al:
            add_fact("renal_dysfunction", alert.issue)

    for alert in radiology_alerts:
        issue = alert.issue.lower()
        if "hemorrhage" in issue:
            add_fact("intracranial_hemorrhage", alert.evidence)
        if "stroke" in issue or "ischemic" in issue:
            add_fact("acute_stroke", alert.evidence)
        if "malignant" in issue:
            add_fact("possible_malignancy", alert.evidence)
        if "pulmonary embol" in issue:
            add_fact("pulmonary_embolism", alert.evidence)
        if "pneumothorax" in issue:
            add_fact("pneumothorax", alert.evidence)
        if "fracture" in issue:
            add_fact("fracture", alert.evidence)
        if "effusion" in issue:
            add_fact("pleural_effusion", alert.evidence)
        if "infectious" in issue:
            add_fact("pulmonary_infection", alert.evidence)

    if urgency in {"HIGH", "MEDIUM"}:
        add_fact("high_urgency", f"Computed urgency {urgency}")

    return facts


def _reconcile_claims(
    claims: list[ExtractedClaim],
    fact_index: dict[str, list[str]],
) -> list[ClaimReconciliation]:
    reconciled: list[ClaimReconciliation] = []

    for claim in claims:
        evidence = fact_index.get(claim.entity, [])
        has_fact = bool(evidence)

        if claim.polarity == "uncertain":
            status = "needs_clinical_correlation"
            reason = "Claim is uncertain and needs clinician adjudication against timeline/exam."
            followup = "Review source report and correlate with current exam and repeat tests if needed."
        elif claim.polarity == "present" and has_fact:
            status = "match"
            reason = "Claim aligns with HMS-derived structured evidence."
            followup = None
        elif claim.polarity == "present" and not has_fact:
            status = "missing_in_hms"
            reason = "Claim not found in HMS-available structured evidence."
            followup = "Verify whether this finding exists in external report and update HMS records if confirmed."
        elif claim.polarity == "absent" and has_fact:
            status = "contradiction"
            reason = "Claim states absence while HMS-derived evidence indicates presence."
            followup = "Prioritize direct clinician review and reconcile discrepancy with original source documents."
        else:
            status = "match"
            reason = "Claim states absence and no conflicting HMS evidence was found."
            followup = None

        reconciled.append(
            ClaimReconciliation(
                claim_id=claim.claim_id,
                status=status,
                reason=reason,
                matched_evidence=evidence[:3],
                recommended_followup=followup,
            )
        )

    return reconciled


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
    radiology_alerts = _radiology_alerts(payload)
    doctor_question_flags = _doctor_question_flags(payload)
    extracted_claims = _rule_based_claims(payload)

    llm_input_text = "\n".join(
        [
            payload.external_llm_output_text or "",
            "\n".join(r.impression_text for r in payload.radiology_reports if r.impression_text),
            "\n".join(payload.patient_llm_questions),
        ]
    ).strip()
    llm_claims, llm_used, llm_provider = extract_claims_via_llm(llm_input_text)
    if llm_claims:
        extracted_claims.extend(llm_claims)
    if medication_alerts and urgency == "LOW":
        urgency = "MEDIUM"
    if any(a.severity == "high" for a in medication_alerts):
        urgency = "HIGH"
    if radiology_alerts and urgency == "LOW":
        urgency = "MEDIUM"
    if any(a.severity == "high" for a in radiology_alerts):
        urgency = "HIGH"

    fact_index = _build_fact_index(payload, key_findings, medication_alerts, radiology_alerts, urgency)
    claim_reconciliation = _reconcile_claims(extracted_claims, fact_index)

    highlight_points: list[str] = [
        f"{finding.label} ({finding.severity})"
        for finding in key_findings[:5]
    ]
    for alert in medication_alerts:
        highlight_points.append(f"Medication safety: {alert.issue}")
    for alert in radiology_alerts:
        highlight_points.append(f"Radiology: {alert.issue}")
    for item in doctor_question_flags:
        highlight_points.append(item)
    if any(item.status == "contradiction" for item in claim_reconciliation):
        highlight_points.append("Reconciliation: contradiction detected between external AI claim and HMS evidence.")

    natural_language_summary = headline
    if medication_alerts:
        natural_language_summary += " Medication review indicates potential safety conflicts that should be validated by a clinician."
    if radiology_alerts:
        natural_language_summary += " Radiology narrative contains risk patterns that need clinician correlation and triage."
    if doctor_question_flags:
        natural_language_summary += " External AI-generated patient concerns were flagged for structured doctor follow-up."
    if claim_reconciliation:
        natural_language_summary += " Claim reconciliation was performed against HMS data for audit-ready mismatch detection."

    if radiology_alerts:
        recommendations.append("Correlate imaging impression with clinical exam and order confirmatory/reflex imaging when indicated.")
    if doctor_question_flags:
        recommendations.append("Address patient LLM-derived concerns explicitly and document why diagnosis/urgency may differ from AI output.")
    if any(item.status == "contradiction" for item in claim_reconciliation):
        recommendations.append("Review contradiction claims first and validate with original imaging/lab reports before treatment changes.")
    if any(item.status == "missing_in_hms" for item in claim_reconciliation):
        recommendations.append("Check whether external findings are newer than HMS records and reconcile data currency.")

    return DiagnoseLabsResponse(
        request_id=payload.request_id,
        analysis_id=f"ANL-{uuid4().hex[:12].upper()}",
        completed_at=datetime.now(UTC),
        summary=Summary(urgency=urgency, headline=headline, confidence=confidence),
        key_findings=key_findings,
        recommendations=sorted(set(recommendations)),
        medication_alerts=medication_alerts,
        radiology_alerts=radiology_alerts,
        doctor_question_flags=doctor_question_flags,
        extracted_claims=extracted_claims,
        claim_reconciliation=claim_reconciliation,
        llm_extractor_used=llm_used,
        llm_extractor_provider=llm_provider,
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
            "reconciliation": "enabled",
        },
    )
