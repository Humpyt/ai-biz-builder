import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Try out UgBiz with basic features",
    features: [
      "1 AI-generated website",
      "yourname.ugbiz.com subdomain",
      "Basic templates",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Business",
    price: "UGX 50,000",
    period: "/month",
    description: "Everything you need to grow online",
    features: [
      "Up to 5 websites",
      "Custom subdomain",
      "Premium AI designs",
      "Priority support",
      "Analytics dashboard",
      "Custom contact forms",
    ],
    cta: "Start Business Plan",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "UGX 150,000",
    period: "/month",
    description: "For businesses that need more",
    features: [
      "Unlimited websites",
      "Custom domain support",
      "Advanced AI customization",
      "Dedicated support",
      "E-commerce features",
      "API access",
      "White-label option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingSection = () => (
  <section className="py-28 bg-muted/30 bg-dot-grid" id="pricing" aria-label="Pricing">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="text-sm font-semibold text-secondary uppercase tracking-widest">Pricing</span>
        <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          Choose the plan that fits your business. Upgrade or downgrade at any time.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-2xl p-8 ${
              plan.popular
                ? "bg-primary text-primary-foreground shadow-xl md:scale-105 animate-pulse-glow"
                : "bg-card shadow-card"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
            <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {plan.description}
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {plan.period}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-accent" : "text-secondary"}`} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? "accent" : "outline"}
              className="w-full"
              asChild
            >
              <Link to={plan.price === "Free" ? "/onboarding" : `/payment?plan=${plan.name.toLowerCase()}`}>
                {plan.cta}
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
