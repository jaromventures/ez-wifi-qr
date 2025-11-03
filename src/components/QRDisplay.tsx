import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Copy, CheckCircle2, Printer } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { WiFiConfig } from "./WiFiForm";
import { toast } from "@/hooks/use-toast";
import { generatePrintableCanvas } from "./PrintableQRGenerator";

interface QRDisplayProps {
  config: WiFiConfig;
  onQRGenerated?: (dataUrl: string) => void;
}

export const QRDisplay = ({ config, onQRGenerated }: QRDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [pdfInstance, setPdfInstance] = useState<jsPDF | null>(null);
  
  const wifiString = `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};H:${config.hidden};;`;

  useEffect(() => {
    const generatePreview = async () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setIsGenerating(true);

      try {
        // Generate full print canvas (2550x3300px)
        const printCanvas = await generatePrintableCanvas(config);
        
        // Scale down to preview size (maintain 8.5:11 ratio)
        const previewWidth = 400;
        const previewHeight = Math.round(previewWidth * (3300 / 2550)); // ~517px
        
        canvas.width = previewWidth;
        canvas.height = previewHeight;
        
        // Draw scaled-down version
        ctx.drawImage(printCanvas, 0, 0, previewWidth, previewHeight);
        
        // Pass the full-size canvas data URL to parent
        if (onQRGenerated) {
          const dataUrl = printCanvas.toDataURL('image/png');
          onQRGenerated(dataUrl);
        }
        
        setIsGenerating(false);
      } catch (error) {
        console.error("Error generating preview:", error);
        setIsGenerating(false);
        toast({
          title: "Preview Generation Error",
          description: "Failed to generate preview. Please try again.",
          variant: "destructive",
        });
      }
    };

    generatePreview();
  }, [config, onQRGenerated]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `EZ-WI-FI_${config.ssid.replace(/[^a-zA-Z0-9]/g, "_")}_preview.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Preview Downloaded",
          description: "300×300px preview image saved",
        });
      }
    });
  };

  const handleDownloadPrintPNG = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generating Print PNG...",
        description: "Creating 8.5×11 inch image at 300 DPI",
      });

      // Generate high-quality print canvas (2550x3300px)
      const printCanvas = await generatePrintableCanvas(config);
      
      printCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `EZ-WI-FI_${config.ssid.replace(/[^a-zA-Z0-9]/g, "_")}_print-8.5x11.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Print PNG Downloaded",
            description: "8.5×11 inch @ 300 DPI image saved",
          });
        }
        setIsGenerating(false);
      }, "image/png");
    } catch (error) {
      console.error("Error generating print PNG:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate print-ready PNG",
        variant: "destructive",
      });
    }
  };

  const handlePrintPDF = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generating Print-Ready PDF...",
        description: "Creating 8.5×11 inch layout at 300 DPI",
      });

      // Generate high-quality print canvas (2550x3300px)
      const printCanvas = await generatePrintableCanvas(config);

      // Create PDF with US Letter dimensions at 300 DPI
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [2550, 3300], // 8.5" x 11" @ 300 DPI
      });

      // Add the full canvas as image
      const printDataUrl = printCanvas.toDataURL("image/png");
      pdf.addImage(printDataUrl, "PNG", 0, 0, 2550, 3300);

      // Create blob URL for preview
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(pdfUrl);
      setPdfInstance(pdf);
      setShowPdfPreview(true);
      
      setIsGenerating(false);

      toast({
        title: "PDF Ready",
        description: "8.5×11 inch print-ready PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate PDF preview",
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

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleDownloadPrintPNG} size="touch" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Print PNG (8.5×11)
              </Button>
              
              <Button onClick={handlePrintPDF} size="touch" className="w-full">
                <Printer className="mr-2 h-4 w-4" />
                Print PDF (8.5×11)
              </Button>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleDownloadPNG} size="touch" variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Preview PNG
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
