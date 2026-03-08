import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-24">
    <div className="container">
      <div className="bg-gradient-hero rounded-3xl p-12 md:p-20 text-center text-primary-foreground">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Take Your Business Online?
        </h2>
        <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8 text-lg">
          Join hundreds of Ugandan businesses already using UgBiz to reach customers online.
        </p>
        <Button variant="accent" size="lg" asChild>
          <Link to="/onboarding">
            Start Building Now <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CTASection;
