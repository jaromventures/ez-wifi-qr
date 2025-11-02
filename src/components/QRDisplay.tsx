import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Copy, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { WiFiConfig } from "./WiFiForm";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface QRDisplayProps {
  config: WiFiConfig;
}

export const QRDisplay = ({ config }: QRDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const wifiString = `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};H:${config.hidden};;`;

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (config.backgroundImage && ctx) {
        setIsGenerating(true);
        
        // Load background image
        const img = new Image();
        img.onload = () => {
          // Create temporary canvas for QR generation
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 300;
          tempCanvas.height = 300;
          
          // Generate QR on temporary canvas first with lower error correction for backgrounds
          QRCode.toCanvas(
            tempCanvas,
            wifiString,
            {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF", // Solid white for better contrast
              },
              errorCorrectionLevel: "L", // Low error correction for backgrounds
            },
            (error) => {
              if (error) {
                console.error("QR generation with background failed:", error);
                
                // Fallback: Generate without background
                QRCode.toCanvas(
                  canvas,
                  wifiString,
                  {
                    width: 300,
                    margin: 2,
                    color: {
                      dark: "#000000",
                      light: "#ffffff",
                    },
                    errorCorrectionLevel: "M",
                  },
                  (fallbackError) => {
                    setIsGenerating(false);
                    if (fallbackError) {
                      toast({
                        title: "QR Generation Error",
                        description: "Wi-Fi information too complex. Try shortening your password.",
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Background Removed",
                        description: "Background too complex - QR code generated without background for better reliability.",
                      });
                    }
                  }
                );
                return;
              }
              
              // Success - composite background + QR on main canvas
              canvas.width = 300;
              canvas.height = 300;
              
              // Draw background
              ctx.drawImage(img, 0, 0, 300, 300);
              
              // Draw QR code on top
              ctx.drawImage(tempCanvas, 0, 0);
              
              setIsGenerating(false);
            }
          );
        };
        
        img.onerror = () => {
          setIsGenerating(false);
          toast({
            title: "Image Load Error",
            description: "Failed to load background image. Generating QR without background.",
            variant: "destructive",
          });
          
          // Fallback to no background
          QRCode.toCanvas(
            canvas,
            wifiString,
            {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
              errorCorrectionLevel: "M",
            }
          );
        };
        
        img.src = config.backgroundImage;
      } else {
        setIsGenerating(true);
        
        // No background - standard QR generation
        QRCode.toCanvas(
          canvas,
          wifiString,
          {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
            errorCorrectionLevel: "M",
          },
          (error) => {
            setIsGenerating(false);
            if (error) {
              toast({
                title: "QR Generation Error",
                description: "Wi-Fi information too complex. Try shortening your password.",
                variant: "destructive",
              });
              console.error(error);
            }
          }
        );
      }
    }
  }, [wifiString, config.backgroundImage]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `EZ-WI-FI_${config.ssid.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "QR Code Downloaded",
          description: "Your QR code has been saved as PNG",
        });
      }
    });
  };

  const handlePrintPDF = () => {
    if (!canvasRef.current) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add title
    pdf.setFontSize(24);
    pdf.text("Guest Wi-Fi", 105, 30, { align: "center" });

    // Add network name
    pdf.setFontSize(16);
    pdf.text(`Network: ${config.ssid}`, 105, 45, { align: "center" });

    // Add credentials if enabled
    if (config.showCredentialsOnPdf) {
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text(`Password: ${config.password || "Open Network"}`, 105, 55, { align: "center" });
      pdf.setFont(undefined, "normal");
    }

    // Add QR code
    const imgData = canvasRef.current.toDataURL("image/png");
    const imgSize = 100; // 100mm square
    const x = (210 - imgSize) / 2; // Center on A4 width (210mm)
    const yPos = config.showCredentialsOnPdf ? 65 : 60;
    pdf.addImage(imgData, "PNG", x, yPos, imgSize, imgSize);

    // Add instructions
    pdf.setFontSize(12);
    const instructY = config.showCredentialsOnPdf ? 180 : 175;
    pdf.text("Scan with your phone's camera to connect", 105, instructY, { align: "center" });
    
    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text("Generated by EZ-WI-FI", 105, 285, { align: "center" });

    pdf.save(`EZ-WI-FI_${config.ssid.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: "Your printable QR code has been downloaded",
    });
  };

  const handleCopyString = async () => {
    try {
      await navigator.clipboard.writeText(wifiString);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Wi-Fi string copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-medium">
      <CardHeader>
        <CardTitle>Your Wi-Fi QR Code</CardTitle>
        <CardDescription>Scan with any camera app to connect instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative rounded-lg bg-white p-6 shadow-soft">
            <canvas ref={canvasRef} className="mx-auto" />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{config.ssid}</p>
            <p className="text-sm text-muted-foreground">
              {config.encryption === "nopass" ? "Open Network" : "Secured Network"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button onClick={handleDownloadPNG} size="touch" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
          
          <Button onClick={handlePrintPDF} size="touch" variant="secondary" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Print PDF
          </Button>
          
          <Button onClick={handleCopyString} size="touch" variant="outline" className="w-full">
            {copied ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy String"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Save or print this QR code and place it where guests can easily scan it. 
            Works with any smartphone camera – no special apps needed!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
