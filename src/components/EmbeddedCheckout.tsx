import { useState } from "react";
import { PaymentElement, useStripe, useElements, AddressElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmbeddedCheckoutProps {
  productName: string;
  price: number;
  qrThumbnail?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmbeddedCheckout = ({ 
  productName, 
  price, 
  qrThumbnail,
  onSuccess,
  onCancel 
}: EmbeddedCheckoutProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment successful!",
          description: "Your order is being processed and will ship in 7-10 days",
        });
        
        // Submit order to backend with shipping details
        try {
          const response = await fetch(
            'https://yolcjslhswziywcyummx.supabase.co/functions/v1/submit-order',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbGNqc2xoc3d6aXl3Y3l1bW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODUzNzIsImV4cCI6MjA3Nzc2MTM3Mn0.wFz39HjtHnaZhgX6cZypWMEHjXM6UAVHesm50o4LG98`,
              },
              body: JSON.stringify({ payment_intent_id: paymentIntent.id }),
            }
          );
          
          if (!response.ok) {
            console.error('Order submission failed');
          }
        } catch (err) {
          console.error('Failed to submit order:', err);
        }
        
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        <div className="flex items-center gap-3">
          {qrThumbnail && (
            <img 
              src={qrThumbnail} 
              alt="QR Code" 
              className="w-16 h-16 rounded border border-border"
            />
          )}
          <div className="flex-1">
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-muted-foreground">Custom WiFi QR Code Print</p>
          </div>
          <p className="text-lg font-bold">${price.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
            <AddressElement options={{ mode: 'shipping', allowedCountries: ['US', 'CA'] }} />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Payment Details</h4>
            <PaymentElement />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${price.toFixed(2)}`
            )}
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Stripe • Ships to US & Canada in 7-10 days
      </p>
    </div>
  );
};
