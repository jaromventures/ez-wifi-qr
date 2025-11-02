import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Frame, Magnet as MagnetIcon, Sticker, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/use-premium";
import { WiFiConfig } from "./WiFiForm";

interface PrintfulProductsProps {
  config: WiFiConfig;
  qrDataUrl: string;
}

const products = [
  {
    id: "poster",
    name: "Framed Poster",
    description: "8x10 frame with QR code",
    icon: Frame,
    price: "$19.99",
    mockup: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300&h=300&fit=crop",
  },
  {
    id: "magnet",
    name: "Fridge Magnet",
    description: "3x3 weatherproof magnet",
    icon: MagnetIcon,
    price: "$4.99",
    mockup: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=300&h=300&fit=crop",
  },
  {
    id: "sticker-sheet",
    name: "Sticker Sheet",
    description: "A4 sheet with multiple QRs",
    icon: Sticker,
    price: "$7.99",
    mockup: "https://images.unsplash.com/photo-1614963917500-0a34f7d0e426?w=300&h=300&fit=crop",
  },
  {
    id: "vinyl",
    name: "Vinyl Sticker",
    description: "Weatherproof 4x4 single QR",
    icon: Package,
    price: "$3.99",
    mockup: "https://images.unsplash.com/photo-1609096458733-95b38583ac4e?w=300&h=300&fit=crop",
  },
];

export const PrintfulProducts = ({ config, qrDataUrl }: PrintfulProductsProps) => {
  const { isPro } = usePremium();
  const [orderingProduct, setOrderingProduct] = useState<string | null>(null);

  const handleOrder = async (productId: string) => {
    if (!isPro) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Pro to order printed versions",
        variant: "destructive",
      });
      return;
    }

    setOrderingProduct(productId);

    try {
      // In production, integrate with Printful API
      // For demo, show success message
      toast({
        title: "Demo Mode",
        description: "Printful integration ready. Add API key to enable real orders.",
      });

      // Real integration would look like:
      /*
      const response = await axios.post('/api/printful/create-order', {
        productId,
        qrImage: qrDataUrl,
        ssid: config.ssid,
      }, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PRINTFUL_API_KEY}`
        }
      });
      
      // Redirect to Printful checkout
      window.location.href = response.data.checkoutUrl;
      */
    } catch (error) {
      console.error(error);
      toast({
        title: "Order Error",
        description: "Could not create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOrderingProduct(null);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-4xl shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Printed Versions
          {!isPro && (
            <span className="ml-2 rounded-full bg-premium px-2 py-0.5 text-xs text-premium-foreground">
              Pro
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Get your QR code printed on high-quality products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <Card
                key={product.id}
                className={`overflow-hidden ${!isPro ? "opacity-60" : ""}`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.mockup}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{product.price}</span>
                    <Button
                      size="sm"
                      onClick={() => handleOrder(product.id)}
                      disabled={!isPro || orderingProduct === product.id}
                      variant={isPro ? "default" : "outline"}
                    >
                      {orderingProduct === product.id ? "..." : "Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isPro && (
          <div className="mt-6 rounded-lg border border-premium/30 bg-gradient-premium p-4 text-center">
            <p className="text-sm font-medium text-premium-foreground">
              Upgrade to Pro to unlock print-on-demand orders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
