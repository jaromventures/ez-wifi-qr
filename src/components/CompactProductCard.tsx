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
    <Card className="flex-shrink-0 w-full md:w-96 hover:shadow-lg transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="flex gap-3">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded overflow-hidden bg-muted flex-shrink-0">
            <img
              src={mockupUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          {qrThumbnailUrl && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded overflow-hidden bg-background border flex-shrink-0 flex items-center justify-center p-2">
              <img
                src={qrThumbnailUrl}
                alt="Your QR design"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <h4 className="text-base md:text-lg font-semibold truncate">{name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="text-xl md:text-2xl font-bold mt-2">${price.toFixed(2)}</div>
          <Button 
            size="default" 
            className="mt-auto w-full"
            onClick={onOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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