import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WiFiFormProps {
  onGenerate: (config: WiFiConfig) => void;
}

export interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export const WiFiForm = ({ onGenerate }: WiFiFormProps) => {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<WiFiConfig["encryption"]>("WPA");
  const [hidden, setHidden] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onGenerate({
        ssid: ssid.trim(),
        password: encryption === "nopass" ? "" : password,
        encryption,
        hidden,
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

          <div className="flex items-center space-x-2">
            <Checkbox id="hidden" checked={hidden} onCheckedChange={(checked) => setHidden(checked === true)} />
            <Label htmlFor="hidden" className="cursor-pointer text-sm font-normal">
              Hidden Network (SSID not broadcast)
            </Label>
          </div>

          <Button type="submit" size="touch" variant="hero" className="w-full">
            Generate QR Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
