import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Palette, BarChart3, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const PremiumBanner = () => {
  return (
    <div className="mx-auto my-8 w-full max-w-2xl rounded-lg border border-premium/30 bg-gradient-premium p-6 shadow-medium">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
        <div className="flex-shrink-0">
          <Crown className="h-12 w-12 text-premium-foreground" />
        </div>
        
        <div className="flex-1">
          <h3 className="mb-1 text-xl font-bold text-premium-foreground">Unlock Pro Features</h3>
          <p className="text-sm text-premium-foreground/80">
            Custom designs, analytics, bulk generation & more
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="premium" size="touch" className="whitespace-nowrap">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">EZ-WI-FI Pro</DialogTitle>
              <DialogDescription>
                Unlock powerful features for your Wi-Fi sharing needs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ProFeature
                  icon={<Palette className="h-5 w-5" />}
                  title="Custom QR Designs"
                  description="Change colors, add logos, customize shapes"
                />
                <ProFeature
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Scan Analytics"
                  description="Track QR scans with location data"
                />
                <ProFeature
                  icon={<Zap className="h-5 w-5" />}
                  title="Bulk Generation"
                  description="Upload CSV, generate multiple QRs"
                />
                <ProFeature
                  icon={<Crown className="h-5 w-5" />}
                  title="Premium Templates"
                  description="Professional print layouts"
                />
              </div>

              <div className="rounded-lg border border-border bg-muted p-6 text-center">
                <p className="mb-2 text-2xl font-bold text-foreground">$2.99 one-time</p>
                <p className="mb-1 text-sm text-muted-foreground">or $1.99/month</p>
                <p className="text-xs text-muted-foreground">7-day money-back guarantee</p>
              </div>

              <Button variant="premium" size="xl" className="w-full">
                <Crown className="mr-2 h-5 w-5" />
                Get Pro Access
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Coming soon! Enter your email to be notified when Pro launches.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const ProFeature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
    <div className="flex-shrink-0 text-primary">{icon}</div>
    <div>
      <h4 className="mb-1 font-semibold text-card-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);
