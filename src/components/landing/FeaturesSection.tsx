import { motion } from "framer-motion";
import { Globe, Palette, Rocket, Shield } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Your Own Subdomain",
    description: "Get yourname.ugbiz.com — a professional web address for your business instantly.",
    span: "md:col-span-2 md:row-span-2",
    large: true,
  },
  {
    icon: Palette,
    title: "AI-Designed Website",
    description: "Our AI creates a beautiful, fully custom website from your description.",
    span: "",
    large: false,
  },
  {
    icon: Rocket,
    title: "Launch in Minutes",
    description: "No waiting weeks. Your website goes live as soon as it's generated.",
    span: "",
    large: false,
  },
  {
    icon: Shield,
    title: "Easy Updates",
    description: "Update content, images, and pages anytime from your simple dashboard.",
    span: "md:col-span-2",
    large: false,
  },
];

const FeaturesSection = () => (
  <section className="py-28 bg-muted/40" aria-label="Features" id="features">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="text-sm font-semibold text-secondary uppercase tracking-widest">Why UgBiz</span>
        <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
          Everything You Need to Go Online
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
          We handle the technical details so you can focus on running your business.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className={`group relative bg-card rounded-2xl p-7 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden ${feature.span}`}
          >
            {/* Subtle pattern on hover */}
            <div className="absolute inset-0 bg-dot-grid opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className={`rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-5 ${feature.large ? "w-16 h-16" : "w-12 h-12"}`}>
                <feature.icon className={`text-primary ${feature.large ? "w-8 h-8" : "w-6 h-6"}`} />
              </div>
              <h3 className={`font-bold mb-2 ${feature.large ? "text-2xl" : "text-lg"}`}>{feature.title}</h3>
              <p className={`text-muted-foreground ${feature.large ? "text-base" : "text-sm"}`}>{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
