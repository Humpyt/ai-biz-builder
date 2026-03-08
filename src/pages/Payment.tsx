import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Phone, Loader2, ArrowLeft, Smartphone } from "lucide-react";

const plans: Record<string, { name: string; price: number; features: string[] }> = {
  business: {
    name: "Business",
    price: 50000,
    features: [
      "Up to 5 websites",
      "Custom subdomain",
      "Premium AI designs",
      "Priority support",
      "Analytics dashboard",
      "Custom contact forms",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 150000,
    features: [
      "Unlimited websites",
      "Custom domain support",
      "Advanced AI customization",
      "Dedicated support",
      "E-commerce features",
      "API access",
      "White-label option",
    ],
  },
};

type PaymentProvider = "mtn" | "airtel";

const Payment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan") || "business";
  const plan = plans[planKey];

  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Invalid plan selected.</p>
        </main>
      </div>
    );
  }

  const handlePay = async () => {
    if (!user || !provider || !phone) return;
    setProcessing(true);

    // Simulate STK push / payment processing
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan: planKey,
        status: "active",
        payment_method: provider === "mtn" ? "MTN MoMo" : "Airtel Money",
        phone_number: phone,
        amount: plan.price,
        currency: "UGX",
        paid_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        toast.error("Failed to record subscription. Please contact support.");
        console.error(error);
        setProcessing(false);
        return;
      }

      setSuccess(true);
      toast.success("Payment successful! Your plan is now active.");
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl shadow-card p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your <strong>{plan.name}</strong> plan is now active. Enjoy premium features!
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Pricing
          </Button>

          <div className="bg-card rounded-2xl shadow-card p-8">
            {/* Plan Summary */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-2xl font-bold mb-1">{plan.name} Plan</h2>
              <p className="text-muted-foreground text-sm mb-3">Monthly subscription</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  UGX {plan.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-secondary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Provider Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">
                Choose payment method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setProvider("mtn")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "mtn"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: "#FFCC00", color: "#000" }}>
                    MTN
                  </div>
                  <span className="text-sm font-medium">MTN MoMo</span>
                </button>
                <button
                  onClick={() => setProvider("airtel")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "airtel"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: "#FF0000", color: "#FFF" }}>
                    Airtel
                  </div>
                  <span className="text-sm font-medium">Airtel Money</span>
                </button>
              </div>
            </div>

            {/* Phone Number */}
            {provider && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <label className="text-sm font-medium mb-1.5 block">
                  {provider === "mtn" ? "MTN" : "Airtel"} Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="+256 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  You'll receive a payment prompt on this number
                </p>
              </motion.div>
            )}

            {/* Pay Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!provider || !phone || processing}
              onClick={handlePay}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  Pay UGX {plan.price.toLocaleString()}
                </>
              )}
            </Button>

            {processing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground mt-4"
              >
                Check your phone for the payment prompt…
              </motion.p>
            )}

            <p className="text-xs text-muted-foreground text-center mt-4">
              🔒 Mock payment — no real charges. Beyonic integration coming soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
