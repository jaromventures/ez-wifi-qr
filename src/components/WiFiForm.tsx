import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { optimizeImage, getImageDimensions } from "./ImageOptimizer";
import { toast } from "@/hooks/use-toast";

interface WiFiFormProps {
  onGenerate: (config: WiFiConfig) => void;
}

export interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
  showCredentialsOnPdf?: boolean;
  customTitle?: string;
  backgroundImage?: string;
}

export const WiFiForm = ({ onGenerate }: WiFiFormProps) => {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<WiFiConfig["encryption"]>("WPA");
  const [hidden, setHidden] = useState(false);
  const [showCredentialsOnPdf, setShowCredentialsOnPdf] = useState(false);
  const [customTitle, setCustomTitle] = useState("Guest Wi-Fi");
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [backgroundImageInfo, setBackgroundImageInfo] = useState<{ name: string; size: string; optimized: boolean }>();
  const [errors, setErrors] = useState<{ ssid?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { ssid?: string; password?: string } = {};
    
    if (!ssid.trim()) {
      newErrors.ssid = "Network name is required";
    }
    
    if (encryption !== "nopass" && !password) {
      newErrors.password = "Password is required for secured networks";
    }
    
    if (password && password.length < 8 && encryption === "WPA") {
      newErrors.password = "WPA passwords must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Check file size
      const fileSizeKB = file.size / 1024;
      const fileSizeMB = fileSizeKB / 1024;
      
      // Get dimensions
      const dimensions = await getImageDimensions(file);
      
      // Show warning for very large images
      if (fileSizeMB > 5) {
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB for best results.",
          variant: "destructive",
        });
        return;
      }

      // Optimize if needed (>800KB or >1500px)
      let imageData: string;
      let wasOptimized = false;
      
      if (fileSizeKB > 800 || dimensions.width > 1500 || dimensions.height > 1500) {
        toast({
          title: "Optimizing Image",
          description: "Resizing image for better QR generation...",
        });
        
        imageData = await optimizeImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.85,
          maxSizeKB: 800,
        });
        wasOptimized = true;
      } else {
        // Use original
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      }

      setBackgroundImage(imageData);
      setBackgroundImageInfo({
        name: file.name,
        size: fileSizeMB > 1 ? `${fileSizeMB.toFixed(1)} MB` : `${fileSizeKB.toFixed(0)} KB`,
        optimized: wasOptimized,
      });

      if (wasOptimized) {
        toast({
          title: "Image Optimized",
          description: "Image resized for better compatibility with QR codes.",
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image Error",
        description: "Failed to process image. Please try a different file.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(undefined);
    setBackgroundImageInfo(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onGenerate({
        ssid: ssid.trim(),
        password: encryption === "nopass" ? "" : password,
        encryption,
        hidden,
        showCredentialsOnPdf,
        customTitle: customTitle.trim() || "Guest Wi-Fi",
        backgroundImage,
      });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-medium">
      <CardHeader>
        <CardTitle>Wi-Fi Network Details</CardTitle>
        <CardDescription>Enter your network information to generate a QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ssid">
              Network Name (SSID) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ssid"
              type="text"
              placeholder="My WiFi Network"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className={errors.ssid ? "border-destructive" : ""}
              aria-required="true"
              aria-invalid={!!errors.ssid}
              aria-describedby={errors.ssid ? "ssid-error" : undefined}
            />
            {errors.ssid && (
              <p id="ssid-error" className="text-sm text-destructive" role="alert">
                {errors.ssid}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="encryption">Security Type</Label>
            <Select value={encryption} onValueChange={(value) => setEncryption(value as WiFiConfig["encryption"])}>
              <SelectTrigger id="encryption">
                <SelectValue placeholder="Select encryption type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2/WPA3 (Recommended)</SelectItem>
                <SelectItem value="WEP">WEP (Legacy)</SelectItem>
                <SelectItem value="nopass">Open Network (No Password)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {encryption !== "nopass" && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Your network password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "border-destructive" : ""}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customTitle">
              Custom PDF Title
            </Label>
            <Input
              id="customTitle"
              type="text"
              placeholder="e.g., Welcome to My Home Wi-Fi!"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              💡 Appears at the top of your PDF (50 characters max)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="hidden" checked={hidden} onCheckedChange={(checked) => setHidden(checked === true)} />
              <Label htmlFor="hidden" className="cursor-pointer text-sm font-normal">
                Hidden Network (SSID not broadcast)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showCredentials" 
                checked={showCredentialsOnPdf} 
                onCheckedChange={(checked) => setShowCredentialsOnPdf(checked === true)} 
              />
              <Label htmlFor="showCredentials" className="cursor-pointer text-sm font-normal">
                Display password visibly on PDF (⚠️ use cautiously for security)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background Image (Optional)</Label>
            <Input
              id="background"
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="cursor-pointer"
            />
            {backgroundImage && backgroundImageInfo && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{backgroundImageInfo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {backgroundImageInfo.size}
                    {backgroundImageInfo.optimized && " • Optimized"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveBackground}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!backgroundImage && (
              <p className="text-xs text-muted-foreground">
                💡 Tip: Use images under 1MB and 1500x1500px for best results
              </p>
            )}
          </div>

          <Button type="submit" size="touch" variant="hero" className="w-full">
            Generate QR Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
