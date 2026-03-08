import { motion } from "framer-motion";
import { MessageSquare, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Describe Your Business",
    description: "Tell us about your business, services, and audience in simple words.",
  },
  {
    icon: Cpu,
    title: "AI Builds Your Site",
    description: "Our AI designs and writes a complete, professional website in seconds.",
  },
  {
    icon: Rocket,
    title: "Go Live Instantly",
    description: "Your site is published on your own ugbiz.com subdomain — ready to share.",
  },
];

const HowItWorksSection = () => (
  <section className="py-28" aria-label="How it works">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20"
      >
        <span className="text-sm font-semibold text-secondary uppercase tracking-widest">How It Works</span>
        <h2 className="text-3xl md:text-5xl font-bold mt-3">
          Three Steps to Your Website
        </h2>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        {/* Connector line */}
        <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-primary via-accent to-secondary" />

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-card shadow-card border flex items-center justify-center mb-6">
                <step.icon className="w-7 h-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
