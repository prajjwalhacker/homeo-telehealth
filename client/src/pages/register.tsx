import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, User, MapPin, Heart, Activity } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().min(1, "Age is required").transform((val) => parseInt(val, 10)),
  gender: z.string().min(1, "Please select your gender"),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode").optional().or(z.literal("")),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodGroup: z.string().optional(),
  existingConditions: z.string().optional(),
  currentMedications: z.string().optional(),
  lifestyle: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry"
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { patient, updatePatient } = useAuth();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: patient?.fullName || "",
      age: patient?.age?.toString() || "",
      gender: patient?.gender || "",
      city: patient?.city || "",
      state: patient?.state || "",
      pincode: patient?.pincode || "",
      height: patient?.height || "",
      weight: patient?.weight || "",
      bloodGroup: patient?.bloodGroup || "",
      existingConditions: patient?.existingConditions || "",
      currentMedications: patient?.currentMedications || "",
      lifestyle: patient?.lifestyle || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await apiRequest("PUT", "/api/patient/profile", data);
      return response.json();
    },
    onSuccess: (data) => {
      updatePatient(data.patient);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: RegistrationFormData) {
    updateMutation.mutate(data);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Help us provide you with personalized homeopathic care
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic details about you</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} data-testid="input-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Your age"
                            min={1}
                            max={120}
                            {...field}
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Your location details</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Your city" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="6-digit pincode"
                            maxLength={6}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                            data-testid="input-pincode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Health Information</CardTitle>
                  <CardDescription>Physical measurements and blood group</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 170" {...field} data-testid="input-height" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 65" {...field} data-testid="input-weight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-blood-group">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bloodGroups.map((bg) => (
                              <SelectItem key={bg} value={bg}>
                                {bg}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Help us understand your health better</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="existingConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any existing health conditions (e.g., diabetes, hypertension, allergies)"
                          className="resize-none"
                          {...field}
                          data-testid="input-conditions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentMedications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any medications you're currently taking"
                          className="resize-none"
                          {...field}
                          data-testid="input-medications"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifestyle Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Diet preferences, exercise habits, smoking/alcohol consumption, sleep patterns"
                          className="resize-none"
                          {...field}
                          data-testid="input-lifestyle"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile & Continue"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
