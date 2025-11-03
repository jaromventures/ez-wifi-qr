import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { WiFiForm, WiFiConfig } from "@/components/WiFiForm";
import { QRDisplay } from "@/components/QRDisplay";
import { PrintifyProducts } from "@/components/PrintifyProducts";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

const Index = () => {
  const [wifiConfig, setWifiConfig] = useState<WiFiConfig | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGenerate = (config: WiFiConfig) => {
    setWifiConfig(config);
    setQrDataUrl(""); // Reset QR data URL
    // Smooth scroll to QR display
    setTimeout(() => {
      const qrSection = document.getElementById("qr-section");
      qrSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleQRGenerated = (dataUrl: string) => {
    setQrDataUrl(dataUrl);
  };

  const handleReset = () => {
    setWifiConfig(null);
    setQrDataUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <main className="container mx-auto px-4 py-12">
        <WiFiForm onGenerate={handleGenerate} />

        {wifiConfig && (
          <>
            <div id="qr-section" className="mt-12 scroll-mt-8">
              <QRDisplay config={wifiConfig} onQRGenerated={handleQRGenerated} />
              
              <div className="mt-6 text-center">
                <Button onClick={handleReset} variant="outline" size="lg">
                  Generate Another QR Code
                </Button>
              </div>
            </div>

            {qrDataUrl && <PrintifyProducts config={wifiConfig} qrDataUrl={qrDataUrl} />}
          </>
        )}
      </main>

      <footer className="mt-16 border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            <strong>Free for personal use</strong> • 100% client-side • No data stored
          </p>
          <p className="text-xs text-muted-foreground">
            Privacy Policy: We don't collect or store any Wi-Fi credentials. All QR generation happens in your browser.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} EZ-WI-FI. Made with ❤️ for easy Wi-Fi sharing.
          </p>
        </div>
      </footer>

      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          size="icon"
          variant="default"
          className="fixed bottom-6 right-6 rounded-full shadow-large"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default Index;
