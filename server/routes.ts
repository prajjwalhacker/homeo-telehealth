import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { otpRequestSchema, otpVerifySchema, patientRegistrationSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Session type extension
declare module "express-session" {
  interface SessionData {
    patientId?: string;
  }
}

// Multer configuration for audio uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `consultation-${uniqueSuffix}${path.extname(file.originalname) || ".webm"}`);
  },
});

const upload = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
});

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.patientId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "homeohealth-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Auth Routes
  app.post("/api/auth/request-otp", async (req: Request, res: Response) => {
    try {
      const result = otpRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const { identifier } = result.data;
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await storage.createOtpSession({
        identifier,
        otp,
        expiresAt,
        isUsed: false,
        attempts: 0,
      });

      // In production, send OTP via SMS/Email
      // For demo, we return the OTP
      console.log(`OTP for ${identifier}: ${otp}`);

      res.json({
        message: "OTP sent successfully",
        otp, // Remove in production
      });
    } catch (error) {
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const result = otpVerifySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const { identifier, otp } = result.data;
      const session = await storage.getActiveOtpSession(identifier);

      if (!session) {
        return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
      }

      if (session.attempts && session.attempts >= 3) {
        return res.status(400).json({ message: "Too many attempts. Please request a new OTP." });
      }

      if (session.otp !== otp) {
        await storage.incrementOtpAttempts(session.id);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      await storage.markOtpUsed(session.id);

      // Check if patient exists
      let patient = await storage.getPatientByIdentifier(identifier);
      let isNewUser = false;

      if (!patient) {
        // Create new patient with minimal info
        const isEmail = identifier.includes("@");
        patient = await storage.createPatient({
          fullName: "",
          age: 0,
          gender: "other",
          mobile: isEmail ? null : identifier,
          email: isEmail ? identifier : null,
          isProfileComplete: false,
        });
        isNewUser = true;
      }

      req.session.patientId = patient.id;

      res.json({
        message: "OTP verified successfully",
        patient,
        isNewUser: isNewUser || !patient.isProfileComplete,
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const patient = await storage.getPatient(req.session.patientId!);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json({ patient });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Patient Routes
  app.put("/api/patient/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = patientRegistrationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const patient = await storage.updatePatient(req.session.patientId!, result.data);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json({ patient });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Consultation Routes
  app.get("/api/consultations", requireAuth, async (req: Request, res: Response) => {
    try {
      const consultations = await storage.getConsultationsByPatient(req.session.patientId!);
      res.json(consultations);
    } catch (error) {
      console.error("Get consultations error:", error);
      res.status(500).json({ message: "Failed to get consultations" });
    }
  });

  app.get("/api/consultations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const consultation = await storage.getConsultation(req.params.id);
      if (!consultation || consultation.patientId !== req.session.patientId) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      res.json(consultation);
    } catch (error) {
      console.error("Get consultation error:", error);
      res.status(500).json({ message: "Failed to get consultation" });
    }
  });

  app.post(
    "/api/consultations",
    requireAuth,
    upload.single("audio"),
    async (req: Request, res: Response) => {
      try {
        const patientId = req.session.patientId!;
        const duration = parseInt(req.body.duration) || 0;
        const audioUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Generate simulated transcript (in production, use speech-to-text API)
        const transcript = generateSimulatedTranscript();

        const consultation = await storage.createConsultation({
          patientId,
          status: "pending",
          audioUrl,
          transcript,
          duration,
          notes: null,
          completedAt: null,
        });

        res.json(consultation);
      } catch (error) {
        console.error("Create consultation error:", error);
        res.status(500).json({ message: "Failed to create consultation" });
      }
    }
  );

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  return httpServer;
}

// Simulated transcript for demo purposes
function generateSimulatedTranscript(): string {
  const transcripts = [
    "Patient describes experiencing mild headaches for the past week, primarily in the morning. Symptoms seem to worsen after prolonged screen time. No fever or nausea reported.",
    "Patient reports digestive issues including occasional bloating and discomfort after meals. Symptoms have been present for approximately two weeks. Diet includes regular consumption of dairy products.",
    "Patient mentions experiencing fatigue and low energy levels, especially in the afternoon. Sleep patterns have been irregular lately. No significant changes in appetite.",
    "Patient describes joint pain in the knees, particularly noticeable when climbing stairs or after sitting for extended periods. No swelling observed. Pain has been present for about a month.",
    "Patient reports seasonal allergies with symptoms including sneezing, runny nose, and itchy eyes. Symptoms are more pronounced during morning hours and outdoor activities.",
  ];
  return transcripts[Math.floor(Math.random() * transcripts.length)];
}
