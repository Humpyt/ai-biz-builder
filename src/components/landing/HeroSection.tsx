import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => (
  <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-dot-grid" aria-label="Hero">
    <h1 className="sr-only">UgBiz — AI-Powered Website Builder for Ugandan Businesses</h1>

    {/* Ambient blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-10 -right-32 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px]" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
    </div>

    <div className="container relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left – Copy */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Websites for Uganda
            </span>
          </motion.div>

          <motion.p
            role="presentation"
            aria-hidden="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]"
          >
            Your Business Online{" "}
            <span className="inline-block h-[1.15em] overflow-hidden align-bottom">
              <span className="flex flex-col animate-rotate-words">
                <span className="text-gradient-hero h-[1.15em]">In Minutes</span>
                <span className="text-gradient-hero h-[1.15em]">With AI</span>
                <span className="text-gradient-hero h-[1.15em]">Today</span>
                <span className="text-gradient-hero h-[1.15em]">For Free</span>
                <span className="text-gradient-hero h-[1.15em]">In Minutes</span>
              </span>
            </span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg"
          >
            Describe your business and let AI create a stunning website for you.
            No coding needed. Get your own subdomain on ugbiz.com.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              variant="hero"
              size="lg"
              asChild
              className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary animate-shimmer bg-[length:200%_100%] text-primary-foreground"
            >
              <Link to="/onboarding">
                Build Your Website <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {[
                "bg-secondary",
                "bg-accent",
                "bg-primary",
                "bg-secondary/80",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground`}
                >
                  {["JK", "AN", "SM", "LO"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">500+</span> Ugandan businesses
            </p>
          </motion.div>
        </div>

        {/* Right – Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden lg:block"
        >
          <div className="relative">
            {/* Glow behind mockup */}
            <div className="absolute inset-4 bg-accent/20 rounded-3xl blur-[60px]" />

            <div className="relative bg-card border rounded-2xl shadow-card-hover overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/40" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                    yourbusiness.ugbiz.com
                  </div>
                </div>
              </div>

              {/* Simulated website content */}
              <div className="p-6 space-y-4">
                <div className="h-8 w-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-md animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse delay-100" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse delay-200" />
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg animate-pulse delay-300" />
                  <div className="h-24 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg animate-pulse delay-500" />
                </div>
                <div className="flex gap-3 mt-4">
                  <div className="h-10 w-28 bg-primary/20 rounded-md animate-pulse delay-700" />
                  <div className="h-10 w-28 bg-muted rounded-md animate-pulse delay-[800ms]" />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              ✨ AI Built
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
