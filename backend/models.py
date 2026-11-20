
from sqlalchemy import Column, Integer, String, Date, Numeric, Text, TIMESTAMP, func
from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    email = Column(String(150), nullable=False)

    glucose = Column(Numeric(6, 2), nullable=False)
    haemoglobin = Column(Numeric(6, 2), nullable=False)
    cholesterol = Column(Numeric(6, 2), nullable=False)

    remarks = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )
