import useAuthStore from '../../stores/authStore';
import HeroSection from '../../components/landing/HeroSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import StatsSection from '../../components/landing/StatsSection';
import ContactSection from '../../components/landing/ContactSection';
import './Landing.css';



export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="landing-page">
      <HeroSection isAuthenticated={isAuthenticated} />
      <HowItWorksSection/>
      <StatsSection />
      <ContactSection isAuthenticated={isAuthenticated} />
    </main>
  );
}
