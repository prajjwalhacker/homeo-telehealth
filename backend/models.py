from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    mobile = Column(String(15), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    full_name = Column(String(100), name="full_name")
    age = Column(Integer)
    gender = Column(String(10))
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(6))
    height = Column(String(10))
    weight = Column(String(10))
    blood_group = Column(String(5), name="blood_group")
    existing_conditions = Column(Text, name="existing_conditions")
    current_medications = Column(Text, name="current_medications")
    lifestyle = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), name="created_at")

class OTPSession(Base):
    __tablename__ = "otp_sessions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    identifier = Column(String(255), nullable=False)
    otp_code = Column(String(6), nullable=False, name="otp_code")
    expires_at = Column(DateTime, nullable=False, name="expires_at")
    attempts = Column(Integer, default=0)
    verified = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), name="created_at")

class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, name="patient_id")
    audio_path = Column(String(500), name="audio_path")
    transcript = Column(Text)
    notes = Column(Text)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, server_default=func.now(), name="created_at")
