import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: string;
  hidden: boolean;
  backgroundImage?: string;
  customTitle?: string;
}

interface PrintifyProductsProps {
  config: WiFiConfig;
  qrDataUrl: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  blueprint_id: number;
  mockup_url: string;
  base_price: number;
}

const PRODUCTS: Product[] = [
  {
    id: "framed-print",
    name: 'Framed Print (18x24")',
    description: "Premium quality framed poster. Ships in 7-10 days.",
    blueprint_id: 3,
    mockup_url: "/presets/geometric.png",
    base_price: 20.00,
  },
  {
    id: "fridge-magnet",
    name: 'Fridge Magnet (4x4")',
    description: "Kiss cut magnet, perfect for any metal surface.",
    blueprint_id: 27,
    mockup_url: "/presets/paisley.png",
    base_price: 5.50,
  },
  {
    id: "vinyl-sticker",
    name: 'Vinyl Sticker (4x4")',
    description: "Waterproof die-cut sticker with matte finish.",
    blueprint_id: 13,
    mockup_url: "/presets/space.png",
    base_price: 4.13,
  },
];

const MARKUP = 1.45; // 45% markup

export const PrintifyProducts = ({ qrDataUrl }: PrintifyProductsProps) => {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const uploadImageToPrintify = async (dataUrl: string): Promise<string> => {
    const printifyApiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjA4NGRkMWUzMDZkZmE3YjBiYzA5ZmExZDRmZDMxMjA3ZGE4Zjk4ZGU0NzE5ZGQxMGFkYmJmOTQ4MjEwMzVhM2UzYTk5Njc2MGQ3YzFkMmE2IiwiaWF0IjoxNzYyMTIwOTkxLjgwMzgyMiwibmJmIjoxNzYyMTIwOTkxLjgwMzgyMywiZXhwIjoxNzkzNjU2OTkxLjc5OTI1NSwic3ViIjoiODc4NjgwOSIsInNjb3BlcyI6WyJzaG9wcy5tYW5hZ2UiLCJzaG9wcy5yZWFkIiwiY2F0YWxvZy5yZWFkIiwib3JkZXJzLnJlYWQiLCJvcmRlcnMud3JpdGUiLCJwcm9kdWN0cy5yZWFkIiwicHJvZHVjdHMud3JpdGUiLCJ3ZWJob29rcy5yZWFkIiwid2ViaG9va3Mud3JpdGUiLCJ1cGxvYWRzLnJlYWQiLCJ1cGxvYWRzLndyaXRlIiwicHJpbnRfcHJvdmlkZXJzLnJlYWQiLCJ1c2VyLmluZm8iXX0.AX4RwG9lVEIUgNLPxltI4bPK5YA1GHPKSaeYdwDZm-ANk1XwKkP4nR0Rjs_o_K0Hk9xyVn4F1U8NgcE05SYErnrMLWh22QENQ5SNlNnBjye3LTRIsijOFdNB2_-TxEk5M-tgYTebqr8FLNwS_nwS64zxBRDs4WZKX3hQMif93r_tchhKWuDG2qk4H-7L9aZAP26067CVk_t50BkOgql3XzkawenXWRpo3OxJ5POc6Gt0KH2H6pTYaA_VbbFwav2eVnluU23GVWwuzHIBsTxXBlV3LxuSQs0NpUXnogAdRiKwKqYOIPaODUv5QRPJu-CZySWckcPHldZ2cVLAuyuMwjR89MYN2JDMNDp8_3cqXZPd3t3865cAley5PkqZuFx2JN3Z2snLkC3xjs4Eq9CkUtLZN1X0D0WPxu8gjNKUO3eenAraMWj7_E6VoOXF1ytaj79cYpE9B2kQ1Q_0Tua0-7C8XLx9belXe-Rb011l8G-rlnZt67wxVFnckUr12PlZguFa3YUL_fL1WcbMTX2aZrjAHHapKwB-CM6q1bGTm2Aov30PrzV7BFfgNc4Qf1wymGPFK_hc1mALdRjev26pqoyzxQDxu-MPId4jv23wLNWh9hNPMXWx0n55FHjRzJixNdzwlZyjuR-cpxVYZkiD230tJUZN8lgVB4oFlQxB7cw";
    
    // Convert data URL to base64 string without prefix
    const base64String = dataUrl.split(',')[1];
    
    const response = await fetch('https://api.printify.com/v1/uploads/images.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${printifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: 'wifi-qr-code.png',
        contents: base64String,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload image to Printify: ${error}`);
    }

    const data = await response.json();
    return data.id;
  };

  const handleOrder = async (product: Product) => {
    setLoadingProduct(product.id);

    try {
      toast({
        title: "Processing order...",
        description: "Uploading your QR code design",
      });

      // Upload QR image to Printify
      const imageId = await uploadImageToPrintify(qrDataUrl);
      console.log('Printify image ID:', imageId);

      // Calculate retail price with markup
      const retailPrice = product.base_price * MARKUP;

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          product_name: product.name,
          price: retailPrice,
          printify_image_id: imageId,
          printify_variant_id: '12345', // This should be fetched from Printify API in production
          printify_blueprint_id: product.blueprint_id.toString(),
          base_cost: product.base_price,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setLoadingProduct(null);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Get Your WiFi QR Code Printed</h2>
          <p className="text-xl text-muted-foreground">
            Professional prints delivered to your door in 7-10 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRODUCTS.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                  <img
                    src={product.mockup_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-3xl font-bold mb-2">
                  ${(product.base_price * MARKUP).toFixed(2)}
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ High quality print</li>
                  <li>✓ Custom QR code design</li>
                  <li>✓ Ships to US & Canada</li>
                  <li>✓ 7-10 day delivery</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleOrder(product)}
                  disabled={loadingProduct !== null}
                  className="w-full"
                  size="lg"
                >
                  {loadingProduct === product.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Order Now"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Secure checkout powered by Stripe • Prints by Monster Digital</p>
        </div>
      </div>
    </section>
  );
};
