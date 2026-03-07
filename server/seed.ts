import { db } from "./db";
import { patients, consultations } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Checking if seed data exists...");
  console.log(process.env.DATABASE_URL, "Database_url");

  // Check if we already have seed data
  const existingPatients = await db.select().from(patients).limit(1);
  if (existingPatients.length > 0) {
    console.log("Seed data already exists, skipping...");
    return;
  }

  console.log("Seeding database with sample data...");

  // Create sample patients
  const samplePatients = [
    {
      fullName: "Priya Sharma",
      age: 32,
      gender: "female",
      mobile: "9876543210",
      email: "priya.sharma@email.com",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      height: "162",
      weight: "58",
      bloodGroup: "B+",
      existingConditions: "Mild seasonal allergies",
      currentMedications: "None",
      lifestyle: "Vegetarian diet, regular yoga practice, no smoking or alcohol",
      isProfileComplete: true,
    },
    {
      fullName: "Rahul Patel",
      age: 45,
      gender: "male",
      mobile: "9123456789",
      email: "rahul.patel@email.com",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      height: "175",
      weight: "78",
      bloodGroup: "O+",
      existingConditions: "Type 2 Diabetes, managed with medication",
      currentMedications: "Metformin 500mg",
      lifestyle: "Mixed diet, walks 30 minutes daily, occasional social drinking",
      isProfileComplete: true,
    },
    {
      fullName: "Ananya Krishnan",
      age: 28,
      gender: "female",
      mobile: "9988776655",
      email: "ananya.k@email.com",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      height: "158",
      weight: "52",
      bloodGroup: "A-",
      existingConditions: "Migraine (occasional)",
      currentMedications: "None currently",
      lifestyle: "Pescatarian, practices meditation, works from home",
      isProfileComplete: true,
    },
  ];

  const insertedPatients = await db.insert(patients).values(samplePatients).returning();
  console.log(`Inserted ${insertedPatients.length} sample patients`);

  // Create sample consultations for the first patient
  const firstPatient = insertedPatients[0];
  const sampleConsultations = [
    {
      patientId: firstPatient.id,
      status: "completed",
      audioUrl: null,
      transcript:
        "Patient reports experiencing seasonal allergies for the past two weeks. Main symptoms include sneezing, runny nose, and itchy eyes, particularly in the morning. No fever or breathing difficulties. Allergies seem to be triggered by pollen during outdoor activities.",
      duration: 245,
      notes:
        "Recommended Allium Cepa 30C for runny nose and sneezing. Advised to keep windows closed during high pollen days. Follow-up in one week.",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      patientId: firstPatient.id,
      status: "completed",
      audioUrl: null,
      transcript:
        "Follow-up consultation. Patient reports significant improvement in allergy symptoms. Sneezing frequency reduced by 70%. Still experiencing mild itchy eyes in the evening. Overall feeling better and more energetic.",
      duration: 180,
      notes:
        "Continue with Allium Cepa 30C. Added Euphrasia 30C for eye symptoms. Patient showing good response to treatment.",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      patientId: firstPatient.id,
      status: "pending",
      audioUrl: null,
      transcript:
        "Patient describes new symptoms of mild digestive discomfort after meals. Occasional bloating and heaviness, especially after dinner. No pain or nausea. Symptoms started about 5 days ago.",
      duration: 156,
      notes: null,
      completedAt: null,
    },
  ];

  await db.insert(consultations).values(sampleConsultations);
  console.log(`Inserted ${sampleConsultations.length} sample consultations`);

  // Add a consultation for the second patient
  const secondPatient = insertedPatients[1];
  await db.insert(consultations).values([
    {
      patientId: secondPatient.id,
      status: "completed",
      audioUrl: null,
      transcript:
        "Patient with Type 2 Diabetes seeking complementary homeopathic support. Reports occasional fatigue and increased thirst. Blood sugar levels generally well-controlled with allopathic medication. Interested in natural remedies to support overall health.",
      duration: 320,
      notes:
        "Recommended Syzygium Jambolanum Q (Mother Tincture) as supportive therapy. Advised to continue allopathic medication as prescribed by endocrinologist. Diet and exercise counseling provided.",
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
  ]);

  console.log("Database seeding completed successfully!");
}
