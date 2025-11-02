import { Wifi, Smartphone, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-16 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          <Zap className="h-4 w-4" />
          <span>Free • Secure • No Apps Needed</span>
        </div>
        
        <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
          Share Your Wi-Fi in Seconds
        </h1>
        
        <p className="mb-8 text-lg text-white/90 md:text-xl">
          Guests scan your QR code and connect instantly – works on any phone
        </p>

        <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
          <FeatureCard 
            icon={<Wifi className="h-6 w-6" />}
            title="Instant Connect"
            description="Generate QR codes for any Wi-Fi network"
          />
          <FeatureCard 
            icon={<Smartphone className="h-6 w-6" />}
            title="Works Everywhere"
            description="iOS, Android, any camera app"
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6" />}
            title="Privacy First"
            description="No data stored, 100% client-side"
          />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="rounded-lg bg-white/10 p-6 text-white backdrop-blur-sm transition-all hover:bg-white/20">
    <div className="mb-3 flex justify-center text-white">{icon}</div>
    <h3 className="mb-2 font-semibold">{title}</h3>
    <p className="text-sm text-white/80">{description}</p>
  </div>
);
