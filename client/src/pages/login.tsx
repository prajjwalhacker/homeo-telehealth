import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Stethoscope, Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";

type AuthStep = "identifier" | "otp";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [authType, setAuthType] = useState<"mobile" | "email">("mobile");

  const requestOtpMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await apiRequest("POST", "/api/auth/request-otp", { identifier });
      return response.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: `A 6-digit code has been sent to your ${authType === "mobile" ? "mobile" : "email"}. For demo: ${data.otp}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ identifier, otp }: { identifier: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { identifier, otp });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.patient);
      toast({
        title: "Welcome!",
        description: data.isNewUser ? "Please complete your registration." : "You've successfully logged in.",
      });
      navigate(data.isNewUser ? "/register" : "/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleRequestOtp() {
    if (!identifier.trim()) {
      toast({
        title: "Required",
        description: `Please enter your ${authType === "mobile" ? "mobile number" : "email address"}.`,
        variant: "destructive",
      });
      return;
    }

    if (authType === "mobile") {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(identifier)) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit Indian mobile number.",
          variant: "destructive",
        });
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
    }

    requestOtpMutation.mutate(identifier);
  }

  function handleVerifyOtp() {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ identifier, otp });
  }

  function handleBackToIdentifier() {
    setStep("identifier");
    setOtp("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">HomeoHealth</h1>
            <p className="text-muted-foreground mt-2">
              Your trusted homeopathic telemedicine partner
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {step === "identifier" ? "Welcome" : "Verify OTP"}
              </CardTitle>
              <CardDescription className="text-center">
                {step === "identifier"
                  ? "Sign in or create an account using OTP"
                  : `Enter the 6-digit code sent to ${identifier}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "identifier" ? (
                <div className="space-y-4">
                  <Tabs
                    value={authType}
                    onValueChange={(v) => {
                      setAuthType(v as "mobile" | "email");
                      setIdentifier("");
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mobile" data-testid="tab-mobile">
                        <Phone className="w-4 h-4 mr-2" />
                        Mobile
                      </TabsTrigger>
                      <TabsTrigger value="email" data-testid="tab-email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="mobile" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center px-3 bg-muted rounded-md border text-sm text-muted-foreground">
                            +91
                          </div>
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            maxLength={10}
                            data-testid="input-mobile"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="email" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          data-testid="input-email"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button
                    className="w-full"
                    onClick={handleRequestOtp}
                    disabled={requestOtpMutation.isPending}
                    data-testid="button-request-otp"
                  >
                    {requestOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      data-testid="input-otp"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={verifyOtpMutation.isPending || otp.length !== 6}
                    data-testid="button-verify-otp"
                  >
                    {verifyOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToIdentifier}
                      data-testid="button-back"
                    >
                      Change number
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestOtpMutation.mutate(identifier)}
                      disabled={requestOtpMutation.isPending}
                      data-testid="button-resend-otp"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
