import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
