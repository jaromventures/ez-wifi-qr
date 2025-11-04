import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload } from "lucide-react";
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

const BACKGROUND_PRESETS = [
  { 
    id: 'space', 
    label: 'Space Scene', 
    src: '/presets/space.png',
    description: 'Milky Way galaxy view'
  },
  { 
    id: 'geometric', 
    label: 'Tech Geometric', 
    src: '/presets/geometric.png',
    description: 'Circuit board pattern'
  },
  { 
    id: 'paisley', 
    label: 'Paisley Floral', 
    src: '/presets/paisley.png',
    description: 'Elegant floral design'
  },
];

export const WiFiForm = ({ onGenerate }: WiFiFormProps) => {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<WiFiConfig["encryption"]>("WPA");
  const [hidden, setHidden] = useState(false);
  const [showCredentialsOnPdf, setShowCredentialsOnPdf] = useState(false);
  const [customTitle, setCustomTitle] = useState("Guest Wi-Fi");
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [backgroundImageInfo, setBackgroundImageInfo] = useState<{ name: string; size: string; optimized: boolean }>();
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
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
      
      // Optimize if needed (>800KB or >1500px or any file over 5MB gets extra aggressive optimization)
      let imageData: string;
      let wasOptimized = false;
      
      if (fileSizeKB > 800 || dimensions.width > 1500 || dimensions.height > 1500 || fileSizeMB > 5) {
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

  const handlePresetSelect = async (presetId: string) => {
    setSelectedPreset(presetId);
    setIsLoadingPreset(true);
    
    if (presetId === 'none') {
      setBackgroundImage(undefined);
      setBackgroundImageInfo(undefined);
      setIsLoadingPreset(false);
      return;
    }
    
    const preset = BACKGROUND_PRESETS.find(p => p.id === presetId);
    if (!preset?.src) {
      setIsLoadingPreset(false);
      return;
    }
    
    try {
      const response = await fetch(preset.src);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setBackgroundImage(dataUrl);
        
        setBackgroundImageInfo({
          name: preset.label,
          size: `${(blob.size / 1024).toFixed(0)} KB`,
          optimized: false,
        });
        
        setIsLoadingPreset(false);
        
        toast({
          title: "Preset Applied",
          description: `${preset.label} background loaded successfully`,
        });
      };
      
      reader.onerror = () => {
        setIsLoadingPreset(false);
        toast({
          title: "Failed to Load Preset",
          description: "Please try a different preset or upload custom image",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading preset:", error);
      setIsLoadingPreset(false);
      toast({
        title: "Failed to Load Preset",
        description: "Please try a different preset or upload custom image",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(undefined);
    setBackgroundImageInfo(undefined);
    setSelectedPreset('none');
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

          <div className="space-y-3">
            <Label>Background Style</Label>
            <p className="text-xs text-muted-foreground">
              Choose a preset background or upload your own custom image
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                  selectedPreset === 'none' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="background-preset"
                  value="none"
                  checked={selectedPreset === 'none'}
                  onChange={() => handlePresetSelect('none')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="bg-background border-2 border-dashed border-muted-foreground/30 rounded-lg w-full h-20 flex items-center justify-center mb-2">
                    <span className="text-muted-foreground text-sm">No Background</span>
                  </div>
                  <p className="text-sm font-medium">Plain White</p>
                </div>
              </label>
              
              {BACKGROUND_PRESETS.map(preset => (
                <label
                  key={preset.id}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                    selectedPreset === preset.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="background-preset"
                    value={preset.id}
                    checked={selectedPreset === preset.id}
                    onChange={() => handlePresetSelect(preset.id)}
                    className="sr-only"
                    disabled={isLoadingPreset}
                  />
                  <div className="text-center">
                    <div className="relative overflow-hidden rounded-lg w-full h-20 mb-2">
                      <img 
                        src={preset.src} 
                        alt={preset.label} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isLoadingPreset && selectedPreset === preset.id && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                </label>
              ))}
              
              <label
                className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                  selectedPreset === 'custom' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="background-preset"
                  value="custom"
                  checked={selectedPreset === 'custom'}
                  onChange={() => setSelectedPreset('custom')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="bg-background border-2 border-dashed border-primary/50 rounded-lg w-full h-20 flex flex-col items-center justify-center mb-2">
                    <Upload className="w-6 h-6 text-primary mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                  <p className="text-sm font-medium">Custom Image</p>
                  <p className="text-xs text-muted-foreground">Your own file</p>
                </div>
              </label>
            </div>
          </div>

          {selectedPreset === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="background">Upload Custom Background</Label>
              <Input
                id="background"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleBackgroundUpload(e);
                  if (e.target.files?.[0]) {
                    setSelectedPreset('custom');
                  }
                }}
                className="cursor-pointer"
              />
              {backgroundImage && backgroundImageInfo && selectedPreset === 'custom' && (
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
                    onClick={() => {
                      handleRemoveBackground();
                      setSelectedPreset('none');
                    }}
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
          )}

          <Button type="submit" size="touch" variant="hero" className="w-full">
            Generate QR Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
