import { motion } from "framer-motion";
import { Globe, Palette, Rocket, Shield } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Your Own Subdomain",
    description: "Get yourname.ugbiz.com — a professional web address for your business instantly.",
  },
  {
    icon: Palette,
    title: "AI-Designed Website",
    description: "Describe your business and our AI creates a beautiful, fully custom website for you.",
  },
  {
    icon: Rocket,
    title: "Launch in Minutes",
    description: "No waiting weeks for a developer. Your website goes live as soon as it's generated.",
  },
  {
    icon: Shield,
    title: "Easy Updates",
    description: "Update content, images, and pages anytime from your simple dashboard.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => (
  <section className="py-24 bg-muted/50" aria-label="Features">
    <div className="container">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Everything You Need to Go Online
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          We handle the technical details so you can focus on running your business.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={item}
            className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-muted-foreground text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
