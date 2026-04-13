from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

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
    id: str
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
    isProfileComplete: Optional[bool] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConsultationResponse(BaseModel):
    id: str
    patientId: str
    audioUrl: Optional[str] = None
    transcript: Optional[str] = None
    duration: Optional[int] = None
    notes: Optional[str] = None
    status: str
    createdAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClinicResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contactNumber: Optional[str] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: str
    fullName: str
    specialization: str
    clinic: Optional[ClinicResponse] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    experienceYears: int = 0
    rating: float = 4.5
    consultationFee: int = 500
    availableDays: Optional[str] = None
    availableTimeStart: Optional[str] = None
    availableTimeEnd: Optional[str] = None
    isActive: bool = True
    avatarColor: Optional[str] = None

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    doctorId: str
    appointmentDate: str
    appointmentTime: str
    notes: Optional[str] = ""

class AppointmentResponse(BaseModel):
    id: str
    patientId: str
    doctorId: str
    appointmentDate: str
    appointmentTime: str
    status: str
    notes: Optional[str] = ""
    createdAt: Optional[datetime] = None
    doctorName: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorProfile(BaseModel):
    fullName: str
    specialization: Optional[str] = None
    consultationFee: Optional[int] = None
    experienceYears: Optional[int] = None
    availableDays: Optional[str] = None
    availableTimeStart: Optional[str] = None
    availableTimeEnd: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    avatarColor: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str  # completed, cancelled
