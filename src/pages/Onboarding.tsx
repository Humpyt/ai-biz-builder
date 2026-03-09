import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sitesDomain } from "@/lib/domains";

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
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: "", subdomain: "", industry: "", description: "",
    services: "", targetAudience: "", colorScheme: "", contactEmail: "",
    phone: "", location: "",
  });

  // Subdomain validation state
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Debounced subdomain check
  const checkSubdomain = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus("idle");
      return;
    }
    setSubdomainStatus("checking");
    const { count } = await supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("subdomain", subdomain);
    setSubdomainStatus((count ?? 0) > 0 ? "taken" : "available");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSubdomain(formData.subdomain);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.subdomain, checkSubdomain]);

  const canProceed = () => {
    if (step === 0) {
      const subdomainOk = !formData.subdomain || subdomainStatus === "available";
      return formData.businessName && formData.industry && subdomainOk && subdomainStatus !== "checking";
    }
    if (step === 1) return formData.description;
    if (step === 2) return formData.colorScheme;
    if (step === 3) return formData.contactEmail;
    return true;
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const planLimits: Record<string, number> = {
        free: 1, starter: 1, business: 5, enterprise: Infinity,
      };

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentPlan = sub?.plan || "free";
      const limit = planLimits[currentPlan] ?? 1;

      if (sub?.expires_at && new Date(sub.expires_at) < new Date()) {
        toast.error("Your subscription has expired. Please renew to create websites.");
        setGenerating(false);
        return;
      }

      const { count } = await supabase
        .from("websites")
        .select("id", { count: "exact", head: true })
        .in("status", ["live", "generating"]);

      if ((count ?? 0) >= limit) {
        toast.error(`Your ${currentPlan} plan allows ${limit} website${limit > 1 ? "s" : ""}. Upgrade to create more.`);
        navigate("/pricing");
        setGenerating(false);
        return;
      }

      const subdomain = formData.subdomain || formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const { data: website, error: insertError } = await supabase
        .from("websites")
        .insert({
          user_id: user.id,
          name: formData.businessName,
          subdomain,
          industry: formData.industry,
          description: formData.description,
          services: formData.services,
          target_audience: formData.targetAudience,
          color_scheme: formData.colorScheme,
          contact_email: formData.contactEmail,
          phone: formData.phone,
          location: formData.location,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
          toast.error("That subdomain is already taken. Please choose another.");
        } else {
          toast.error("Failed to create website. Please try again.");
        }
        setGenerating(false);
        return;
      }

      navigate(`/generating?id=${website.id}`);

      const { error: fnError } = await supabase.functions.invoke("generate-website", {
        body: { websiteId: website.id },
      });

      if (fnError) {
        console.error("Generation trigger error:", fnError);
      }
    } catch (e) {
      console.error("Generate error:", e);
      toast.error("Something went wrong. Please try again.");
      setGenerating(false);
    }
  };

  const subdomainIndicator = () => {
    if (!formData.subdomain || formData.subdomain.length < 3) return null;
    switch (subdomainStatus) {
      case "checking":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case "available":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "taken":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
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
                          <div className="relative flex-1">
                            <Input
                              placeholder="toms-restaurant"
                              value={formData.subdomain}
                              onChange={(e) => update("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                              className={subdomainStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : subdomainStatus === "available" ? "border-primary focus-visible:ring-primary" : ""}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {subdomainIndicator()}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">.{sitesDomain}</span>
                        </div>
                        {subdomainStatus === "taken" && (
                          <p className="text-xs text-destructive mt-1">This subdomain is already taken. Try another.</p>
                        )}
                        {subdomainStatus === "available" && (
                          <p className="text-xs text-primary mt-1">This subdomain is available!</p>
                        )}
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
                  disabled={!canProceed() || generating}
                >
                  <Sparkles className="w-4 h-4" />
                  {generating ? "Creating..." : "Generate My Website"}
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
