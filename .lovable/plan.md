

## Landing Page Redesign Plan

The current landing page is functional but generic -- plain text blocks, simple cards, no visual storytelling. Here's the plan to make it visually striking and memorable.

### Changes Overview

**1. HeroSection -- Complete Visual Overhaul**
- Add an animated mockup/illustration area on the right side (split layout instead of centered text)
- Add a floating browser mockup with animated gradient fill to show "website being built"
- Animated typing effect on the headline using rotating words ("In Minutes" / "With AI" / "Today")
- Add subtle animated grid/dot pattern background instead of plain blurred circles
- Larger, bolder CTA with a shimmer animation on the hero button
- Add social proof row below CTA: "Trusted by 500+ Ugandan businesses" with avatar stack

**2. FeaturesSection -- Interactive Cards**
- Redesign as a 2x2 bento grid layout with varied card sizes (one large featured card, three smaller)
- Add icon backgrounds with gradient fills
- Add hover animations that lift and glow
- Include subtle illustrations/patterns inside each card

**3. New Section: "How It Works" (3-step process)**
- Add between Features and Pricing
- Three numbered steps with connecting line/arrow animation
- Steps: "Describe Your Business" → "AI Builds Your Site" → "Go Live"
- Each step gets an icon and brief description

**4. New Section: Testimonials/Social Proof**
- Add before Pricing
- Auto-scrolling marquee of testimonial cards
- Each card has a quote, name, business type, and star rating

**5. PricingSection -- Visual Polish**
- Add subtle background pattern
- Popular plan gets an animated border glow
- Add toggle for monthly/annual pricing (visual only for now)
- Rounded pricing cards with more whitespace

**6. CTASection -- More Impactful**
- Full-width gradient with animated floating shapes in background
- Larger text, add a secondary line of social proof
- Add pulsing glow effect on CTA button

**7. Footer -- Richer Layout**
- Multi-column footer: Company, Product, Support columns
- Add social media icon links
- Add a subtle top gradient border

**8. CSS & Animation Additions**
- Add shimmer keyframe animation for buttons
- Add marquee animation for testimonials
- Add dot-grid background utility class
- Add animated gradient border utility

### Files to Create
- `src/components/landing/HowItWorksSection.tsx`
- `src/components/landing/TestimonialsSection.tsx`

### Files to Edit
- `src/components/landing/HeroSection.tsx` -- split layout, mockup, typing effect, social proof
- `src/components/landing/FeaturesSection.tsx` -- bento grid layout
- `src/components/landing/PricingSection.tsx` -- visual polish, glow border
- `src/components/landing/CTASection.tsx` -- floating shapes, bigger impact
- `src/components/layout/Footer.tsx` -- multi-column layout
- `src/pages/Index.tsx` -- add HowItWorks and Testimonials sections
- `src/index.css` -- new animations (shimmer, marquee, dot-grid)
- `tailwind.config.ts` -- new keyframes for shimmer and marquee

