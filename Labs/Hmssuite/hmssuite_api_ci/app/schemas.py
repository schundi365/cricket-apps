from datetime import datetime
from pydantic import BaseModel, Field


class Patient(BaseModel):
    patient_id: str
    mrn: str | None = None
    name: str | None = None
    dob: str | None = None
    sex: str | None = None


class Encounter(BaseModel):
    encounter_id: str | None = None
    collected_at: str
    department: str | None = None


class LabResult(BaseModel):
    test_code: str
    test_name: str
    value: float
    unit: str
    reference_range: str | None = None
    abnormal_flag: str | None = None


class MedicationItem(BaseModel):
    drug_id: int | None = None
    drug_name: str
    generic_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    number_of_days: int | None = None
    source: str | None = None


class MedicationAlert(BaseModel):
    severity: str
    issue: str
    implication: str


class RadiologyReport(BaseModel):
    modality: str | None = None
    body_part: str | None = None
    impression_text: str
    findings_text: str | None = None
    source: str | None = None


class RadiologyAlert(BaseModel):
    severity: str
    issue: str
    implication: str
    evidence: str


class ExtractedClaim(BaseModel):
    claim_id: str
    source: str
    category: str
    entity: str
    polarity: str = "present"
    confidence: float = 0.5
    claim_text: str


class ClaimReconciliation(BaseModel):
    claim_id: str
    status: str
    reason: str
    matched_evidence: list[str] = Field(default_factory=list)
    recommended_followup: str | None = None


class DiagnoseOptions(BaseModel):
    include_recommendations: bool = True
    include_normal_labs: bool = False


class DiagnoseLabsRequest(BaseModel):
    request_id: str
    source_system: str = "hmssuite"
    patient: Patient
    encounter: Encounter
    labs: list[LabResult] = Field(min_length=1)
    medications: list[MedicationItem] = Field(default_factory=list)
    known_drug_allergies: list[str] = Field(default_factory=list)
    radiology_reports: list[RadiologyReport] = Field(default_factory=list)
    patient_llm_questions: list[str] = Field(default_factory=list)
    external_llm_output_text: str | None = None
    options: DiagnoseOptions = DiagnoseOptions()


class KeyFinding(BaseModel):
    code: str
    label: str
    severity: str
    evidence: list[str]


class Summary(BaseModel):
    urgency: str
    headline: str
    confidence: float


class NormalizedInput(BaseModel):
    clinical_statements: list[str]
    abnormal_lab_count: int
    normal_lab_count: int


class DiagnoseLabsResponse(BaseModel):
    request_id: str
    analysis_id: str
    status: str = "completed"
    completed_at: datetime
    summary: Summary
    key_findings: list[KeyFinding]
    recommendations: list[str]
    medication_alerts: list[MedicationAlert] = Field(default_factory=list)
    radiology_alerts: list[RadiologyAlert] = Field(default_factory=list)
    doctor_question_flags: list[str] = Field(default_factory=list)
    extracted_claims: list[ExtractedClaim] = Field(default_factory=list)
    claim_reconciliation: list[ClaimReconciliation] = Field(default_factory=list)
    llm_extractor_used: bool = False
    llm_extractor_provider: str | None = None
    normalized_input: NormalizedInput
    natural_language_summary: str
    highlight_points: list[str]
    patient_memory_file: str | None = None
    trace: dict[str, str]


class PatientCatalogItem(BaseModel):
    patient_id: str
    mrn: str | None = None
    name: str | None = None
    sex: str | None = None
    dob: str | None = None
    encounter_id: str | None = None
    department: str | None = None
    latest_lab_at: str | None = None
    medication_count: int = 0


class ProcessPatientResponse(BaseModel):
    patient: PatientCatalogItem
    analysis: DiagnoseLabsResponse


class DoctorMismatchItem(BaseModel):
    claim_id: str
    status: str
    source: str
    category: str
    entity: str
    claim_text: str
    reason: str
    matched_evidence: list[str] = Field(default_factory=list)
    recommended_followup: str | None = None


class DoctorMismatchResponse(BaseModel):
    request_id: str
    analysis_id: str
    urgency: str
    mismatch_count: int
    items: list[DoctorMismatchItem] = Field(default_factory=list)
