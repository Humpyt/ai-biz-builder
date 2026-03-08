import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-28">
    <div className="container">
      <div className="relative bg-gradient-hero rounded-3xl p-14 md:p-20 text-center text-primary-foreground overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/5"
          />
          <motion.div
            animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-10 right-16 w-32 h-32 rounded-full bg-white/5"
          />
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/2 right-1/4 w-16 h-16 rounded-2xl bg-white/5 rotate-45"
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-5">
            Ready to Take Your Business Online?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-4 text-lg">
            Join hundreds of Ugandan businesses already using UgBiz to reach customers online.
          </p>
          <p className="text-primary-foreground/60 text-sm mb-10">
            No credit card required · Free plan available · Live in minutes
          </p>
          <Button
            variant="accent"
            size="lg"
            asChild
            className="animate-pulse-glow"
          >
            <Link to="/onboarding">
              Start Building Now <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
