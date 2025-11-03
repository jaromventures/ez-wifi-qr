import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CompactProductCardProps {
  name: string;
  description: string;
  price: number;
  mockupUrl: string;
  onOrder: () => void;
  isLoading: boolean;
}

export const CompactProductCard = ({
  name,
  description,
  price,
  mockupUrl,
  onOrder,
  isLoading,
}: CompactProductCardProps) => {
  return (
    <Card className="flex-shrink-0 w-72 hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
          <img
            src={mockupUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <h4 className="text-sm font-semibold truncate">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
          <div className="text-lg font-bold mt-1">${price.toFixed(2)}</div>
          <Button 
            size="sm" 
            className="mt-2 w-full"
            onClick={onOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
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