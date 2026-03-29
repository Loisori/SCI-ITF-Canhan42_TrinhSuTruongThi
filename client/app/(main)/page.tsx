import Navbar from "@/components/client/Navbar";
import Hero from "@/components/client/Hero";
import FeaturedProjects from "@/components/client/FeaturedProjects";
import Footer from "@/components/client/Footer";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        <Hero />
        <FeaturedProjects />
      </main>
      <Footer />
    </div>
  );
}