import os
import random
import string
import uuid
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from backend.database import get_db, engine, Base
from backend.models import Patient, OTPSession, Consultation
from backend.schemas import OTPRequest, OTPVerify, PatientProfile

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HomeoHealth API")

app.add_middleware(SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET", "dev-secret-key"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def patient_to_response(patient: Patient) -> dict:
    return {
        "id": patient.id,
        "mobile": patient.mobile,
        "email": patient.email,
        "fullName": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "city": patient.city,
        "state": patient.state,
        "pincode": patient.pincode,
        "height": patient.height,
        "weight": patient.weight,
        "bloodGroup": patient.blood_group,
        "existingConditions": patient.existing_conditions,
        "currentMedications": patient.current_medications,
        "lifestyle": patient.lifestyle,
        "isProfileComplete": patient.is_profile_complete,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None
    }

def consultation_to_response(c: Consultation) -> dict:
    return {
        "id": c.id,
        "patientId": c.patient_id,
        "audioUrl": c.audio_url,
        "transcript": c.transcript,
        "duration": c.duration,
        "notes": c.notes,
        "status": c.status,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "completedAt": c.completed_at.isoformat() if c.completed_at else None
    }

@app.post("/api/auth/request-otp")
async def request_otp(data: OTPRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Mobile or email is required")
    
    otp = generate_otp()
    expires_at = datetime.now() + timedelta(minutes=10)
    
    otp_session = OTPSession(
        id=str(uuid.uuid4()),
        identifier=identifier,
        otp=otp,
        expires_at=expires_at,
        is_used=False,
        attempts=0
    )
    db.add(otp_session)
    db.commit()
    
    print(f"OTP for {identifier}: {otp}")
    
    return {"message": "OTP sent successfully", "otp": otp}

@app.post("/api/auth/verify-otp")
async def verify_otp(data: OTPVerify, request: Request, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()
    otp = data.otp.strip()
    
    otp_session = db.query(OTPSession).filter(
        OTPSession.identifier == identifier,
        OTPSession.is_used == False
    ).order_by(OTPSession.created_at.desc()).first()
    
    if not otp_session:
        raise HTTPException(status_code=400, detail="OTP expired or invalid. Please request a new one.")
    
    if otp_session.expires_at < datetime.now():
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if otp_session.attempts and otp_session.attempts >= 3:
        raise HTTPException(status_code=400, detail="Too many attempts. Please request a new OTP.")
    
    if otp_session.otp != otp:
        otp_session.attempts = (otp_session.attempts or 0) + 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_session.is_used = True
    db.commit()
    
    is_email = "@" in identifier
    if is_email:
        patient = db.query(Patient).filter(Patient.email == identifier).first()
    else:
        patient = db.query(Patient).filter(Patient.mobile == identifier).first()
    
    is_new_user = patient is None
    
    if is_new_user:
        patient = Patient(
            id=str(uuid.uuid4()),
            mobile=None if is_email else identifier,
            email=identifier if is_email else None,
            full_name="",
            age=0,
            gender="other",
            is_profile_complete=False
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    
    request.session["patient_id"] = patient.id
    
    return {
        "message": "OTP verified successfully",
        "patient": patient_to_response(patient),
        "isNewUser": is_new_user or not patient.is_profile_complete
    }

@app.get("/api/auth/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    patient_id = request.session.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=401, detail="Patient not found")
    
    return {"patient": patient_to_response(patient)}

@app.post("/api/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}

@app.put("/api/patient/profile")
async def update_profile(data: PatientProfile, request: Request, db: Session = Depends(get_db)):
    patient_id = request.session.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.full_name = data.fullName
    patient.age = data.age
    patient.gender = data.gender
    if data.mobile:
        patient.mobile = data.mobile
    if data.email:
        patient.email = data.email
    patient.city = data.city or ""
    patient.state = data.state or ""
    patient.pincode = data.pincode or ""
    patient.height = data.height or ""
    patient.weight = data.weight or ""
    patient.blood_group = data.bloodGroup or ""
    patient.existing_conditions = data.existingConditions or ""
    patient.current_medications = data.currentMedications or ""
    patient.lifestyle = data.lifestyle or ""
    patient.is_profile_complete = True
    
    db.commit()
    db.refresh(patient)
    
    return {"patient": patient_to_response(patient)}

@app.get("/api/consultations")
async def get_consultations(request: Request, db: Session = Depends(get_db)):
    patient_id = request.session.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id
    ).order_by(Consultation.created_at.desc()).all()
    
    return [consultation_to_response(c) for c in consultations]

@app.post("/api/consultations")
async def create_consultation(
    request: Request,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    patient_id = request.session.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    filename = f"{patient_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{audio.filename}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as f:
        content = await audio.read()
        f.write(content)
    
    transcripts = [
        "Patient describes experiencing mild headaches for the past week, primarily in the morning.",
        "Patient reports digestive issues including occasional bloating and discomfort after meals.",
        "Patient mentions experiencing fatigue and low energy levels, especially in the afternoon.",
        "Patient describes joint pain in the knees, particularly noticeable when climbing stairs.",
        "Patient reports seasonal allergies with symptoms including sneezing and runny nose.",
    ]
    transcript = random.choice(transcripts)
    
    consultation = Consultation(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        audio_url=f"/uploads/{filename}",
        transcript=transcript,
        status="pending"
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    
    return consultation_to_response(consultation)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
