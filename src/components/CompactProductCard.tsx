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
    <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex flex-col gap-4 p-4 h-full">
        <div className="flex flex-col gap-3">
          <div className="w-full h-48 md:h-56 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={mockupUrl}
              alt={name}
              className="w-full h-full object-contain p-4"
            />
          </div>
          {qrThumbnailUrl && (
            <div className="w-full h-32 md:h-36 rounded-lg overflow-hidden bg-background border-2 border-muted flex items-center justify-center p-3 flex-shrink-0">
              <img
                src={qrThumbnailUrl}
                alt="Your QR design"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <h4 className="text-lg font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <div className="text-2xl font-bold mt-auto">${price.toFixed(2)}</div>
          <Button 
            size="default" 
            className="mt-3 w-full"
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