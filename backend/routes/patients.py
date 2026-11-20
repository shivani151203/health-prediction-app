
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from ai_service import generate_health_remarks


router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"]
)


# CREATE - Add a new patient with AI-generated remarks
@router.post(
    "/",
    response_model=schemas.PatientResponse,
    status_code=status.HTTP_201_CREATED
)
def create_patient(
    patient: schemas.PatientCreate,
    db: Session = Depends(get_db)
):
    try:
        remarks = generate_health_remarks(patient)

        new_patient = models.Patient(
            **patient.model_dump(),
            remarks=remarks
        )

        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        return new_patient

    except Exception as error:
        db.rollback()
        print("Patient creation error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to create patient record."
        )


# READ - Get all patients
@router.get(
    "/",
    response_model=list[schemas.PatientResponse]
)
def get_all_patients(db: Session = Depends(get_db)):
    patients = (
        db.query(models.Patient)
        .order_by(models.Patient.id.asc())
        .all()
    )

    return patients


# READ - Get one patient by ID
@router.get(
    "/{patient_id}",
    response_model=schemas.PatientResponse
)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient


# UPDATE - Update patient information and regenerate AI remarks
@router.put(
    "/{patient_id}",
    response_model=schemas.PatientResponse
)
def update_patient(
    patient_id: int,
    updated_data: schemas.PatientUpdate,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    try:
        updated_values = updated_data.model_dump()

        for key, value in updated_values.items():
            setattr(patient, key, value)

        patient.remarks = generate_health_remarks(updated_data)

        db.commit()
        db.refresh(patient)

        return patient

    except Exception as error:
        db.rollback()
        print("Patient update error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update patient record."
        )


# DELETE - Delete patient
@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    try:
        db.delete(patient)
        db.commit()

        return {
            "message": "Patient deleted successfully",
            "patient_id": patient_id
        }

    except Exception as error:
        db.rollback()
        print("Patient deletion error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to delete patient record."
        )
