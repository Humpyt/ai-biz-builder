import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, ArrowRight, Check, Globe, Sparkles } from "lucide-react";

const industries = [
  "Restaurant / Food", "Retail / Shop", "Salon / Beauty", "Health / Clinic",
  "Education / School", "Transport / Logistics", "Agriculture", "Real Estate",
  "Tech / IT Services", "Hospitality / Hotel", "Events / Entertainment", "Other",
];

const colorSchemes = [
  { name: "Earth Tones", colors: ["#8B6F47", "#2D5016", "#D4A574"] },
  { name: "Ocean Blue", colors: ["#1E40AF", "#06B6D4", "#F0F9FF"] },
  { name: "Sunset Warm", colors: ["#DC2626", "#F97316", "#FEF3C7"] },
  { name: "Forest Green", colors: ["#166534", "#4ADE80", "#F0FDF4"] },
  { name: "Royal Purple", colors: ["#7C3AED", "#A855F7", "#FAF5FF"] },
  { name: "Charcoal Modern", colors: ["#1F2937", "#6B7280", "#F9FAFB"] },
];

interface FormData {
  businessName: string;
  subdomain: string;
  industry: string;
  description: string;
  services: string;
  targetAudience: string;
  colorScheme: string;
  contactEmail: string;
  phone: string;
  location: string;
}

const steps = ["Business Info", "Details", "Appearance", "Contact"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    businessName: "", subdomain: "", industry: "", description: "",
    services: "", targetAudience: "", colorScheme: "", contactEmail: "",
    phone: "", location: "",
  });

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) return formData.businessName && formData.industry;
    if (step === 1) return formData.description;
    if (step === 2) return formData.colorScheme;
    if (step === 3) return formData.contactEmail;
    return true;
  };

  const handleGenerate = () => {
    // Store form data and navigate to dashboard
    localStorage.setItem("ugbiz_onboarding", JSON.stringify(formData));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-secondary text-secondary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="hidden sm:block text-sm font-medium text-muted-foreground">{label}</span>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl shadow-card p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
                      <p className="text-muted-foreground">Basic information to get started.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Business Name</label>
                        <Input
                          placeholder="e.g. Tom's Restaurant"
                          value={formData.businessName}
                          onChange={(e) => update("businessName", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Desired Subdomain</label>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="toms-restaurant"
                            value={formData.subdomain}
                            onChange={(e) => update("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">.ugbiz.com</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Industry</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {industries.map((ind) => (
                            <button
                              key={ind}
                              onClick={() => update("industry", ind)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                formData.industry === ind
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              }`}
                            >
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Describe your business</h2>
                      <p className="text-muted-foreground">The more detail you provide, the better your website will be.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Business Description</label>
                        <Textarea
                          placeholder="Tell us what your business does, what makes it special, its history..."
                          value={formData.description}
                          onChange={(e) => update("description", e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Products / Services</label>
                        <Textarea
                          placeholder="List your main products or services..."
                          value={formData.services}
                          onChange={(e) => update("services", e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Target Audience</label>
                        <Input
                          placeholder="e.g. Young professionals in Kampala"
                          value={formData.targetAudience}
                          onChange={(e) => update("targetAudience", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Choose your style</h2>
                      <p className="text-muted-foreground">Pick a color scheme for your website.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {colorSchemes.map((scheme) => (
                        <button
                          key={scheme.name}
                          onClick={() => update("colorScheme", scheme.name)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.colorScheme === scheme.name
                              ? "border-primary shadow-card-hover"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex gap-1 mb-2">
                            {scheme.colors.map((c) => (
                              <div
                                key={c}
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{scheme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                      <p className="text-muted-foreground">How can customers reach you?</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={formData.contactEmail}
                          onChange={(e) => update("contactEmail", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                        <Input
                          placeholder="+256 700 000 000"
                          value={formData.phone}
                          onChange={(e) => update("phone", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Location</label>
                        <Input
                          placeholder="e.g. Kampala, Uganda"
                          value={formData.location}
                          onChange={(e) => update("location", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleGenerate}
                  disabled={!canProceed()}
                >
                  <Sparkles className="w-4 h-4" /> Generate My Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
