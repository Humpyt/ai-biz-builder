import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Sparkles, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const generationSteps = [
  "Analyzing your business details...",
  "Designing layout and structure...",
  "Generating content and copy...",
  "Applying color scheme and styling...",
  "Finalizing your website...",
];

const Generating = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const websiteId = searchParams.get("id");
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"generating" | "live" | "failed">("generating");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!websiteId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Animate through steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < generationSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);

    // Poll for completion
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("websites")
        .select("status")
        .eq("id", websiteId)
        .single();

      if (data?.status === "live") {
        setStatus("live");
        clearInterval(pollInterval);
        clearInterval(interval);
        setCurrentStep(generationSteps.length - 1);
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      } else if (data?.status === "failed") {
        setStatus("failed");
        clearInterval(pollInterval);
        clearInterval(interval);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, [websiteId, navigate]);

  const handleRetry = async () => {
    if (!websiteId) return;
    setStatus("generating");
    setCurrentStep(0);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await supabase.functions.invoke("generate-website", {
      body: { websiteId },
    });

    if (response.error) {
      setError(response.error.message || "Generation failed");
      setStatus("failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          {status === "live" ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-primary flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
          ) : status === "failed" ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive-foreground" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-hero flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          )}
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">
          {status === "live"
            ? "Your website is ready!"
            : status === "failed"
            ? "Generation failed"
            : "Building your website..."}
        </h1>
        <p className="text-muted-foreground mb-8">
          {status === "live"
            ? "Redirecting to your dashboard..."
            : status === "failed"
            ? error || "Something went wrong. Please try again."
            : "Our AI is crafting a beautiful website for your business."}
        </p>

        {status === "generating" && (
          <div className="space-y-3 text-left bg-card rounded-xl shadow-card p-6">
            {generationSteps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-3"
              >
                {i < currentStep ? (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                ) : i === currentStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-secondary border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {status === "failed" && (
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button onClick={handleRetry}>
              <Sparkles className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generating;
