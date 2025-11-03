import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Copy, CheckCircle2, Printer } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { WiFiConfig } from "./WiFiForm";
import { toast } from "@/hooks/use-toast";

interface QRDisplayProps {
  config: WiFiConfig;
}

export const QRDisplay = ({ config }: QRDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfInstance, setPdfInstance] = useState<jsPDF | null>(null);
  
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
          
          // Generate QR on temporary canvas first with medium error correction for backgrounds
          QRCode.toCanvas(
            tempCanvas,
            wifiString,
            {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF00", // Transparent white so background shows through
              },
              errorCorrectionLevel: "M", // Medium error correction for backgrounds
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
              canvas.height = 400; // Extra space for text
              
              // Draw background
              ctx.drawImage(img, 0, 0, 300, 300);
              
              // Draw QR code on top
              ctx.drawImage(tempCanvas, 0, 0);
              
              // Add white background for text area
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 300, 300, 100);
              
              // Draw network name
              ctx.fillStyle = "#000000";
              ctx.font = "bold 18px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(config.ssid, 150, 330);
              
              // Draw password
              if (config.encryption !== "nopass" && config.password) {
                ctx.font = "14px sans-serif";
                ctx.fillText(`Password: ${config.password}`, 150, 355);
              } else {
                ctx.font = "14px sans-serif";
                ctx.fillText("Open Network", 150, 355);
              }
              
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
        
        // No background - standard QR generation with text
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        
        QRCode.toCanvas(
          tempCanvas,
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
            if (error) {
              setIsGenerating(false);
              toast({
                title: "QR Generation Error",
                description: "Wi-Fi information too complex. Try shortening your password.",
                variant: "destructive",
              });
              console.error(error);
              return;
            }
            
            // Draw QR and text on main canvas
            const ctx = canvas.getContext("2d");
            if (ctx) {
              canvas.width = 300;
              canvas.height = 400; // Extra space for text
              
              // White background
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, 300, 400);
              
              // Draw QR code
              ctx.drawImage(tempCanvas, 0, 0);
              
              // Draw network name
              ctx.fillStyle = "#000000";
              ctx.font = "bold 18px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(config.ssid, 150, 330);
              
              // Draw password
              if (config.encryption !== "nopass" && config.password) {
                ctx.font = "14px sans-serif";
                ctx.fillText(`Password: ${config.password}`, 150, 355);
              } else {
                ctx.font = "14px sans-serif";
                ctx.fillText("Open Network", 150, 355);
              }
            }
            
            setIsGenerating(false);
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

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Custom Title
      const title = (config.customTitle || "Guest Wi-Fi").substring(0, 50);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, pageWidth / 2, 30, { align: "center", maxWidth: 180 });
      pdf.setFont(undefined, 'normal');

      // Network Info (if showCredentialsOnPdf enabled)
      let currentY = 50;
      if (config.showCredentialsOnPdf) {
        // Network name
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Network: ${config.ssid}`, pageWidth / 2, currentY, { align: "center", maxWidth: 180 });
        currentY += 10;
        
        // Password in RED & BOLD
        if (config.encryption !== "nopass" && config.password) {
          pdf.setTextColor(220, 38, 38); // Red color
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          const truncatedPassword = config.password.length > 40 
            ? config.password.substring(0, 40) + "..." 
            : config.password;
          pdf.text(`Password: ${truncatedPassword}`, pageWidth / 2, currentY, { align: "center", maxWidth: 180 });
          pdf.setTextColor(0, 0, 0); // Reset to black
          pdf.setFont(undefined, 'normal');
          currentY += 15;
        } else {
          pdf.setFontSize(14);
          pdf.text("Open Network (No Password)", pageWidth / 2, currentY, { align: "center" });
          currentY += 15;
        }
      } else {
        currentY = 60;
      }

      // QR Code Image (directly from canvas - includes background + QR + text)
      const imgData = canvasRef.current.toDataURL("image/png");
      const imgWidth = 100; // 100mm width
      const imgHeight = imgWidth * (400 / 300); // Maintain 300:400 aspect ratio
      const xPos = (pageWidth - imgWidth) / 2;
      
      pdf.addImage(imgData, "PNG", xPos, currentY, imgWidth, imgHeight);

      // Scan Instructions
      const instructY = currentY + imgHeight + 10;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Scan with your phone's camera to connect", pageWidth / 2, instructY, { align: "center" });

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated by EZ-WI-FI • 100% Private & Secure", pageWidth / 2, 285, { align: "center" });

      // Create blob URL for preview
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(pdfUrl);
      setPdfInstance(pdf);
      setShowPdfPreview(true);
      
      setIsGenerating(false);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      setIsGenerating(false);
      toast({
        title: "PDF Generation Failed",
        description: "Please try again or download as PNG instead",
        variant: "destructive",
      });
    }
  };

  const handleClosePdfPreview = () => {
    setShowPdfPreview(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl("");
    }
    setPdfInstance(null);
  };

  const handleDownloadPdf = () => {
    if (pdfInstance) {
      pdfInstance.save(`EZ-WI-FI_${config.ssid.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Your printable QR code has been saved",
      });
      handleClosePdfPreview();
    }
  };

  const handlePrintPdf = () => {
    if (pdfPreviewUrl) {
      window.open(pdfPreviewUrl, '_blank');
    }
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
    <>
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

      {/* PDF Preview Modal */}
      <Dialog open={showPdfPreview} onOpenChange={handleClosePdfPreview}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>
              Review your printable QR code before downloading
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden rounded-lg border border-border">
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="h-full w-full"
                title="PDF Preview"
              />
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClosePdfPreview}
            >
              Close
            </Button>
            
            <Button
              variant="secondary"
              onClick={handlePrintPdf}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            <Button
              onClick={handleDownloadPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
