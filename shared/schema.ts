import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Patients table - main user entity
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  mobile: text("mobile").unique(),
  email: text("email").unique(),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  height: text("height"),
  weight: text("weight"),
  bloodGroup: text("blood_group"),
  existingConditions: text("existing_conditions"),
  currentMedications: text("current_medications"),
  lifestyle: text("lifestyle"),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP sessions for authentication
export const otpSessions = pgTable("otp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // mobile or email
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consultations - audio sessions with doctors
export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  audioUrl: text("audio_url"),
  transcript: text("transcript"),
  duration: integer("duration"), // in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSessionSchema = createInsertSchema(otpSessions).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

// Registration schema with validation
export const patientRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number").optional().or(z.literal("")).or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode").optional().or(z.literal("")),
  height: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  bloodGroup: z.string().optional().or(z.literal("")),
  existingConditions: z.string().optional().or(z.literal("")),
  currentMedications: z.string().optional().or(z.literal("")),
  lifestyle: z.string().optional().or(z.literal("")),
});

export const otpRequestSchema = z.object({
  identifier: z.string().min(1, "Mobile number or email is required"),
});

export const otpVerifySchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type OtpSession = typeof otpSessions.$inferSelect;
export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;

// Legacy types for compatibility
export const users = patients;
export type User = Patient;
export type InsertUser = InsertPatient;
