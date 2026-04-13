import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Patient } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  clinic?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    contactNumber?: string;
  };
  mobile?: string;
  email?: string;
  experienceYears: number;
  rating: number;
  consultationFee: number;
  availableDays?: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  isActive: boolean;
  avatarColor?: string;
  createdAt?: string;
}

interface AuthContextType {
  patient: Patient | null;
  doctor: Doctor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDoctorAuthenticated: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
  updatePatient: (patient: Patient) => void;
  loginDoctor: (doctor: Doctor) => void;
  logoutDoctor: () => void;
  updateDoctor: (doctor: Doctor) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check patient auth
      const patientRes = await fetch("/api/auth/me", { credentials: "include" });
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatient(data.patient);
      }
    } catch (error) {
      console.error("Patient auth check failed:", error);
    }

    try {
      // Check doctor auth
      const doctorRes = await fetch("/api/doctor/auth/me", { credentials: "include" });
      if (doctorRes.ok) {
        const data = await doctorRes.json();
        setDoctor(data.doctor);
      }
    } catch (error) {
      console.error("Doctor auth check failed:", error);
    }

    setIsLoading(false);
  }

  function login(patientData: Patient) {
    setPatient(patientData);
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setPatient(null);
  }

  function updatePatient(patientData: Patient) {
    setPatient(patientData);
  }

  function loginDoctor(doctorData: Doctor) {
    setDoctor(doctorData);
  }

  async function logoutDoctor() {
    try {
      await apiRequest("POST", "/api/doctor/auth/logout");
    } catch (error) {
      console.error("Doctor logout failed:", error);
    }
    setDoctor(null);
  }

  function updateDoctor(doctorData: Doctor) {
    setDoctor(doctorData);
  }

  return (
    <AuthContext.Provider
      value={{
        patient,
        doctor,
        isLoading,
        isAuthenticated: !!patient,
        isDoctorAuthenticated: !!doctor,
        login,
        logout,
        updatePatient,
        loginDoctor,
        logoutDoctor,
        updateDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
