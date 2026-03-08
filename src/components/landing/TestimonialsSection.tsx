import { Star } from "lucide-react";

const testimonials = [
  { name: "John Kato", biz: "Kato Auto Repairs, Kampala", quote: "I had a website up in 10 minutes. My customers can now find me on Google!" },
  { name: "Amina Nakato", biz: "Amina's Kitchen, Jinja", quote: "Beautiful design, zero effort. I just described my restaurant and it was done." },
  { name: "Samuel M.", biz: "SM Photography, Entebbe", quote: "The portfolio site looks so professional. I've already gotten new bookings." },
  { name: "Lucy Opio", biz: "Opio Legal Services", quote: "We went from no online presence to a full website in one afternoon. Amazing." },
  { name: "David Bbosa", biz: "Bbosa Hardware, Mukono", quote: "Even my customers are impressed. They say the site looks like a big company built it." },
  { name: "Grace Auma", biz: "Auma Fashions, Gulu", quote: "I can update my product photos myself. No developer needed anymore!" },
];

const TestimonialCard = ({ t }: { t: typeof testimonials[0] }) => (
  <div className="flex-shrink-0 w-[320px] bg-card rounded-2xl p-6 shadow-card border mx-3">
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
      ))}
    </div>
    <p className="text-sm text-foreground mb-4 italic">"{t.quote}"</p>
    <div>
      <p className="font-semibold text-sm">{t.name}</p>
      <p className="text-xs text-muted-foreground">{t.biz}</p>
    </div>
  </div>
);

const TestimonialsSection = () => (
  <section className="py-28 overflow-hidden" aria-label="Testimonials">
    <div className="container mb-14">
      <span className="text-sm font-semibold text-secondary uppercase tracking-widest">Testimonials</span>
      <h2 className="text-3xl md:text-5xl font-bold mt-3">
        Loved by Ugandan Businesses
      </h2>
    </div>

    {/* Marquee */}
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex animate-marquee">
        {[...testimonials, ...testimonials].map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
