from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True)
    mobile = Column(Text, unique=True, nullable=True)
    email = Column(Text, unique=True, nullable=True)
    full_name = Column(Text, name="full_name", nullable=False, default="")
    age = Column(Integer, nullable=False, default=0)
    gender = Column(Text, nullable=False, default="other")
    city = Column(Text)
    state = Column(Text)
    pincode = Column(Text)
    height = Column(Text)
    weight = Column(Text)
    blood_group = Column(Text, name="blood_group")
    existing_conditions = Column(Text, name="existing_conditions")
    current_medications = Column(Text, name="current_medications")
    lifestyle = Column(Text)
    is_profile_complete = Column(Boolean, name="is_profile_complete", default=False)
    created_at = Column(DateTime, server_default=func.now(), name="created_at")

class OTPSession(Base):
    __tablename__ = "otp_sessions"
    
    id = Column(String, primary_key=True)
    identifier = Column(Text, nullable=False)
    otp = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False, name="expires_at")
    is_used = Column(Boolean, name="is_used", default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), name="created_at")

class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, name="patient_id")
    status = Column(Text, default="pending", nullable=False)
    audio_url = Column(Text, name="audio_url")
    transcript = Column(Text)
    duration = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), name="created_at")
    completed_at = Column(DateTime, name="completed_at")
