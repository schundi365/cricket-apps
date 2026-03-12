from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.schemas import (
    DiagnoseLabsRequest,
    DiagnoseLabsResponse,
    Encounter,
    LabResult,
    MedicationItem,
    Patient,
    PatientCatalogItem,
    ProcessPatientResponse,
)
from app.services.analyzer import analyze_labs
from app.services.hf_samples import load_hf_lab_samples
from app.services.hms_sql_dump import HmsSqlDumpRepository
from app.services.patient_memory import write_patient_memory


app = FastAPI(
    title="HMS Suite Realtime Lab API",
    version="0.1.0",
    description="Realtime lab findings API with integrated web form test harness",
)

templates = Jinja2Templates(directory="app/templates")
sql_repo = HmsSqlDumpRepository()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/", response_class=HTMLResponse)
def test_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/v1/samples/hf")
def hf_samples(limit: int = Query(default=3, ge=1, le=10)) -> dict:
    return {"items": load_hf_lab_samples(limit)}


@app.post("/api/v1/diagnose/labs", response_model=DiagnoseLabsResponse)
def diagnose_labs(payload: DiagnoseLabsRequest) -> DiagnoseLabsResponse:
    return analyze_labs(payload)


@app.get("/api/v1/patients")
def list_patients(limit: int = Query(default=25, ge=1, le=200)) -> dict:
    if not sql_repo.is_available():
        return {
            "source": "fallback",
            "message": "HMS SQL dump not found. Set HMS_SQL_DUMP_PATH or place hms_suite.sql in expected location.",
            "items": [],
        }
    items = sql_repo.list_patients_with_labs(limit=limit)
    return {"source": "hms_sql_dump", "items": items}


@app.post("/api/v1/patients/{patient_id}/process", response_model=ProcessPatientResponse)
def process_patient(patient_id: str) -> ProcessPatientResponse:
    if not sql_repo.is_available():
        raise HTTPException(status_code=404, detail="HMS SQL dump not available")

    patient, labs, medications, allergies = sql_repo.get_patient_snapshot(patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    if not labs:
        raise HTTPException(status_code=404, detail=f"No pathology records found for patient {patient_id}")

    lab_items = [
        LabResult(
            test_code=lab.test_code,
            test_name=f"{lab.test_name} - {lab.attribute_name}",
            value=lab.value if lab.value is not None else 0.0,
            unit=lab.unit or "",
            reference_range=lab.reference_range,
            abnormal_flag=lab.abnormal_flag,
        )
        for lab in labs
        if lab.value is not None
    ]

    if not lab_items:
        raise HTTPException(status_code=404, detail=f"No numeric pathology values found for patient {patient_id}")

    medication_items = [
        MedicationItem(
            drug_id=med.drug_id,
            drug_name=med.drug_name,
            generic_name=med.generic_name,
            dosage=med.dosage,
            frequency=med.frequency,
            number_of_days=med.number_of_days,
            source=med.source,
        )
        for med in medications
    ]

    request_payload = DiagnoseLabsRequest(
        request_id=f"hms-{patient_id}",
        source_system="hmssuite-sql-dump",
        patient=Patient(
            patient_id=patient.patient_id,
            mrn=patient.patient_id,
            name=patient.name,
            dob=patient.dob,
            sex=patient.sex,
        ),
        encounter=Encounter(
            encounter_id=None,
            collected_at=labs[0].collected_at,
            department="IPD/OPD",
        ),
        labs=lab_items,
        medications=medication_items,
        known_drug_allergies=allergies,
    )

    analysis = analyze_labs(request_payload)
    memory_file = write_patient_memory(
        patient=request_payload.patient,
        analysis=analysis,
        medications=medication_items,
        known_drug_allergies=allergies,
    )
    analysis.patient_memory_file = memory_file

    patient_item = PatientCatalogItem(
        patient_id=patient.patient_id,
        mrn=patient.patient_id,
        name=patient.name,
        sex=patient.sex,
        dob=patient.dob,
        encounter_id=None,
        department="IPD/OPD",
        latest_lab_at=labs[0].collected_at,
        medication_count=len(medication_items),
    )

    return ProcessPatientResponse(patient=patient_item, analysis=analysis)
