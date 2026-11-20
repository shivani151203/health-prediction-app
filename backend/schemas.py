
from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ConfigDict,
    field_validator
)


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    date_of_birth: date
    email: EmailStr

    glucose: Decimal = Field(ge=0, le=9999.99)
    haemoglobin: Decimal = Field(ge=0, le=9999.99)
    cholesterol: Decimal = Field(ge=0, le=9999.99)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Full name cannot be empty")

        return value

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, value):
        if value >= date.today():
            raise ValueError("Date of birth must be in the past")

        return value


class PatientUpdate(PatientCreate):
    pass


class PatientResponse(PatientCreate):
    id: int
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
