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

  const handleOrder = async (product: Product) => {
    setLoadingProduct(product.id);

    try {
      toast({
        title: "Processing order...",
        description: "Uploading your QR code design",
      });

      // Upload QR image to Printify and get variant details
      const { data: printifyData, error: printifyError } = await supabase.functions.invoke('printify-upload', {
        body: {
          qr_data_url: qrDataUrl,
          blueprint_id: product.blueprint_id,
        },
      });

      if (printifyError) {
        throw printifyError;
      }

      if (!printifyData?.image_id || !printifyData?.variant_id) {
        throw new Error('Failed to upload image or fetch product details');
      }

      console.log('Printify data:', printifyData);

      // Calculate retail price with markup using actual base cost
      const baseCost = printifyData.base_cost || product.base_price;
      const retailPrice = baseCost * MARKUP;

      // Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          product_name: product.name,
          price: retailPrice,
          printify_image_id: printifyData.image_id,
          printify_variant_id: printifyData.variant_id.toString(),
          printify_blueprint_id: product.blueprint_id.toString(),
          base_cost: baseCost,
        },
      });

      if (checkoutError) {
        throw checkoutError;
      }

      if (!checkoutData?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;
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
