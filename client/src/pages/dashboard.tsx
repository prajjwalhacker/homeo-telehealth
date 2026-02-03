import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Stethoscope,
  User,
  Mic,
  History,
  LogOut,
  Settings,
  Phone,
  Mail,
  MapPin,
  Activity,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Consultation } from "@shared/schema";

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    default:
      return "secondary";
  }
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { patient, logout, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "consultation" | "history">("overview");

  const { data: consultations, isLoading: consultationsLoading } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations"],
    enabled: !!patient,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    navigate("/");
    return null;
  }

  const recentConsultations = consultations?.slice(0, 3) || [];
  const completedCount = consultations?.filter((c) => c.status === "completed").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">HomeoHealth</h1>
              <p className="text-xs text-muted-foreground">Telemedicine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/register")}
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                navigate("/");
              }}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {patient.fullName?.charAt(0)?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-patient-name">
                {patient.fullName || "Patient"}
              </h2>
              <p className="text-muted-foreground">
                {patient.age} years • {patient.gender}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab("overview")}
            data-testid="tab-overview"
          >
            <User className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === "consultation" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab("consultation")}
            data-testid="tab-consultation"
          >
            <Mic className="w-4 h-4 mr-2" />
            New Consultation
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab("history")}
            data-testid="tab-history"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="text-foreground" data-testid="text-mobile">
                        +91 {patient.mobile}
                      </span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground">{patient.email}</span>
                      </div>
                    )}
                    {patient.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">
                          {patient.city}
                          {patient.state && `, ${patient.state}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {patient.bloodGroup && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Blood Group:</span>
                        <Badge variant="secondary">{patient.bloodGroup}</Badge>
                      </div>
                    )}
                    {patient.height && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Height:</span>
                        <span className="text-foreground">{patient.height} cm</span>
                      </div>
                    )}
                    {patient.weight && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="text-foreground">{patient.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/register")}
                  data-testid="button-edit-profile"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Consultations</span>
                  <span className="text-2xl font-bold text-primary" data-testid="text-total-consultations">
                    {consultations?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-2xl font-bold text-foreground">
                    {completedCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Recent Consultations
                  </CardTitle>
                  <CardDescription>Your latest consultation sessions</CardDescription>
                </div>
                {consultations && consultations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("history")}
                    data-testid="button-view-all"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {consultationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentConsultations.length > 0 ? (
                  <div className="space-y-3">
                    {recentConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate cursor-pointer"
                        data-testid={`consultation-${consultation.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              Consultation #{consultation.id.slice(0, 8)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(consultation.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {consultation.duration && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDuration(consultation.duration)}
                            </div>
                          )}
                          <Badge variant={getStatusColor(consultation.status)}>
                            {consultation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No consultations yet</p>
                    <Button onClick={() => setActiveTab("consultation")} data-testid="button-start-first">
                      <Mic className="w-4 h-4 mr-2" />
                      Start Your First Consultation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "consultation" && (
          <ConsultationRecorder patientId={patient.id} />
        )}

        {activeTab === "history" && (
          <ConsultationHistory consultations={consultations || []} isLoading={consultationsLoading} />
        )}
      </main>
    </div>
  );
}

function ConsultationRecorder({ patientId }: { patientId: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recorder.addEventListener("stop", () => clearInterval(timer));
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const { mutate: submitConsultation, isPending } = useMutation({
    mutationFn: async () => {
      if (!audioBlob) return;
      
      const formData = new FormData();
      formData.append("audio", audioBlob, "consultation.webm");
      formData.append("patientId", patientId);
      formData.append("duration", recordingDuration.toString());

      const response = await fetch("/api/consultations", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to submit consultation");
      }

      return response.json();
    },
    onSuccess: () => {
      resetRecording();
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
    },
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Audio Consultation
        </CardTitle>
        <CardDescription>
          Record your symptoms and health concerns for the doctor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-6">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive/10 animate-pulse"
                : audioBlob
                ? "bg-primary/10"
                : "bg-muted"
            }`}
          >
            <Mic
              className={`w-16 h-16 ${
                isRecording
                  ? "text-destructive"
                  : audioBlob
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
          </div>

          {isRecording && (
            <div className="text-center">
              <p className="text-3xl font-mono text-foreground" data-testid="text-duration">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-destructive">Recording...</p>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="w-full space-y-4">
              <audio controls src={audioUrl} className="w-full" data-testid="audio-preview" />
              <p className="text-sm text-muted-foreground text-center">
                Duration: {formatDuration(recordingDuration)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {!isRecording && !audioBlob && (
              <Button size="lg" onClick={startRecording} data-testid="button-start-recording">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button variant="outline" onClick={resetRecording} data-testid="button-reset">
                  Record Again
                </Button>
                <Button
                  onClick={() => submitConsultation()}
                  disabled={isPending}
                  data-testid="button-submit-consultation"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Consultation"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-2">Tips for a good recording:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Find a quiet place to record</li>
            <li>• Speak clearly about your symptoms</li>
            <li>• Mention when symptoms started</li>
            <li>• Describe any triggers or patterns you've noticed</li>
            <li>• Include relevant medical history</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

function ConsultationHistory({
  consultations,
  isLoading,
}: {
  consultations: Consultation[];
  isLoading: boolean;
}) {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No consultation history</h3>
            <p className="text-muted-foreground">
              Your consultation records will appear here after your first session
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">All Consultations</h3>
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                selectedConsultation?.id === consultation.id
                  ? "border-primary bg-primary/5"
                  : "bg-card"
              }`}
              onClick={() => setSelectedConsultation(consultation)}
              data-testid={`history-item-${consultation.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">
                  Consultation #{consultation.id.slice(0, 8)}
                </p>
                <Badge variant={getStatusColor(consultation.status)}>
                  {consultation.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(consultation.createdAt)}
                </div>
                {consultation.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(consultation.duration)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedConsultation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultation Details</CardTitle>
              <CardDescription>
                ID: {selectedConsultation.id.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <Badge variant={getStatusColor(selectedConsultation.status)}>
                  {selectedConsultation.status}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
                <p className="text-foreground">{formatDate(selectedConsultation.createdAt)}</p>
              </div>

              {selectedConsultation.duration && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Duration</h4>
                  <p className="text-foreground">{formatDuration(selectedConsultation.duration)}</p>
                </div>
              )}

              {selectedConsultation.transcript && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Transcript</h4>
                  <p className="text-foreground bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                    {selectedConsultation.transcript}
                  </p>
                </div>
              )}

              {selectedConsultation.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Doctor's Notes</h4>
                  <p className="text-foreground bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                    {selectedConsultation.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
