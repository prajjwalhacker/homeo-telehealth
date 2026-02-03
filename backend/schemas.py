from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re

class OTPRequest(BaseModel):
    identifier: str

class OTPVerify(BaseModel):
    identifier: str
    otp: str

class PatientProfile(BaseModel):
    fullName: str
    age: int
    gender: str
    mobile: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    bloodGroup: Optional[str] = None
    existingConditions: Optional[str] = None
    currentMedications: Optional[str] = None
    lifestyle: Optional[str] = None

    @field_validator('fullName')
    @classmethod
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v

    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if v < 1 or v > 120:
            raise ValueError('Age must be between 1 and 120')
        return v

class PatientResponse(BaseModel):
    id: int
    mobile: Optional[str] = None
    email: Optional[str] = None
    fullName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    bloodGroup: Optional[str] = None
    existingConditions: Optional[str] = None
    currentMedications: Optional[str] = None
    lifestyle: Optional[str] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConsultationResponse(BaseModel):
    id: int
    patientId: int
    audioPath: Optional[str] = None
    transcript: Optional[str] = None
    notes: Optional[str] = None
    status: str
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True
