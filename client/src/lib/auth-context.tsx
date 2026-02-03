import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Patient } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthContextType {
  patient: Patient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
  updatePatient: (patient: Patient) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <AuthContext.Provider
      value={{
        patient,
        isLoading,
        isAuthenticated: !!patient,
        login,
        logout,
        updatePatient,
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
