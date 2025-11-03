import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CompactProductCardProps {
  name: string;
  description: string;
  price: number;
  mockupUrl: string;
  qrThumbnailUrl?: string;
  onOrder: () => void;
  isLoading: boolean;
}

export const CompactProductCard = ({
  name,
  description,
  price,
  mockupUrl,
  qrThumbnailUrl,
  onOrder,
  isLoading,
}: CompactProductCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 h-full">
      <div className="flex flex-col gap-6 p-6 h-full">
        <div className="flex flex-col gap-4">
          <div className="w-full h-56 sm:h-64 md:h-72 rounded-lg overflow-hidden bg-muted">
            <img
              src={mockupUrl}
              alt={name}
              className="w-full h-full object-contain p-4"
            />
          </div>
          {qrThumbnailUrl && (
            <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-background border-2 border-muted flex items-center justify-center p-4">
              <img
                src={qrThumbnailUrl}
                alt="Your QR design"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-3">
          <h4 className="text-xl font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{description}</p>
          <div className="text-3xl font-bold mt-auto">${price.toFixed(2)}</div>
          <Button 
            size="lg" 
            className="mt-4 w-full"
            onClick={onOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Order Now"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};