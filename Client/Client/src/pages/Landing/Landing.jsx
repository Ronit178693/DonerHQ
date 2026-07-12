import useAuthStore from '../../stores/authStore';
import HeroSection from '../../components/landing/HeroSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import StatsSection from '../../components/landing/StatsSection';
import ContactSection from '../../components/landing/ContactSection';
import './Landing.css';

const FEATURED_CAUSES = [
  {
    id: '1',
    title: "Digital Literacy for Rural Odisha",
    description: "Equipping 20 village schools with computers and high-speed internet for technical training.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyzl2QcPJyoLIPdJWN1L1LUg0rQVrqkiDVqn42nmboS0ewejYOK2yJc5BIM2-5NCFoTi2Sc-ZH0XCxrV0pFMIGQ0XHnZ1QB2KJIrNUtE61wFqWQvqZX7L57HQuyo1VlVLfTLAHzK6XdEjM1vFIZHC1dQrLQ_km-r5brigJ3wcHDJ7e6J2PltZ7Y85tf8a9eUvhnTo_AR8Zcjz4TpT_1F3R8c9I-ElXfDY5mgvaIfcHystr6BAnv7rPWeYv2fBNLVF6dEpiNsGdGfWL",
    category: "EDUCATION",
    raised: 845000,
    total: 1120000,
    donors: 342,
    percent: 75
  },
  {
    id: '2',
    title: "Clean Water Access: Thar Desert",
    description: "Building sustainable rainwater harvesting pits for 500 households in Rajasthan.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmBX6nQs8y5CMnrl39SONdQh4LiMdNLQLqnSkzNlCK8sPNt3xdgZQWRqL8k-GYGfnAh-n7pdYr2_U5CMEtigP_bUGHaSI-XYb5OQpFB6u-DUUfepANydCbOYZn26THPhBO9xP67HXSx2rsk9l0VsPS3bG9kMxVnRmiY3Aay_7nghGbMlh8jYZQUo2cepuGnosFvFH8M0hEWk8EbageN03XvxFxl4nbUPygn2K7L--wiJtcNgRhy_QA9vMX9-lsqyUVeIDAJAcdfLOw",
    category: "SUSTAINABILITY",
    raised: 1220000,
    total: 2900000,
    donors: 892,
    percent: 42
  },
  {
    id: '3',
    title: "Mobile Health Clinics: Slum Outreach",
    description: "Providing basic medical screening and generic medicines to urban slums in Bangalore.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDk3PR6q2MmOAGpKt0B3sa7fRAM_Zv5VoIsgzSOFtEP7nH8lNYZaQGJKm_dl_J_R0gfLzw1EwZLpVneL-6HvtpyeC73-i9Nto9a3dGTJh73HkCz61PrnXv-Jtw3pMh2X-pTLv59cCnpHeouWd5VsMGML8HLtU5-0_QMNqHHCMldsSucLgNzb367l8ngalvHSnVEDTZ1EnrBPDgITGrHnrosXX7sb7laRaDSzqeMQh0dONIokevLq5CsDQ9yrmx0fG1eNj2U7uo0740p",
    category: "HEALTHCARE",
    raised: 412000,
    total: 457000,
    donors: 1204,
    percent: 90
  }
];

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="landing-page">
      <HeroSection isAuthenticated={isAuthenticated} />
      <HowItWorksSection causes={FEATURED_CAUSES} />
      <StatsSection />
      <ContactSection isAuthenticated={isAuthenticated} />
    </main>
  );
}
