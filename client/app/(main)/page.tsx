import Navbar from "@/components/client/Navbar";
import Hero from "@/components/client/Hero";
import Stats from "@/components/client/Stats";
import FeaturedProjects from "@/components/client/FeaturedProjects";
import InvestmentProcess from "@/components/client/InvestmentProcess";
import WhyChooseUs from "@/components/client/WhyChooseUs";
import CTA from "@/components/client/CTA";
import Footer from "@/components/client/Footer";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <FeaturedProjects />
        <InvestmentProcess />
        <WhyChooseUs />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}