import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/landing/PricingSection";

const Pricing = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 pt-8">
      <PricingSection />
    </main>
    <Footer />
  </div>
);

export default Pricing;
