import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key || key === "") {
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

interface StripeCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StripeCheckout = ({ open, onOpenChange }: StripeCheckoutProps) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string, mode: "payment" | "subscription") => {
    setLoading(true);
    
    try {
      const stripe = getStripe();
      
      if (!stripe) {
        toast({
          title: "Stripe Not Configured",
          description: "Payment processing is not set up yet. Please check the README for setup instructions.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // In production, you would call your backend to create a checkout session
      // For demo purposes, we'll show a success message
      toast({
        title: "Demo Mode",
        description: "Stripe integration ready. Add your price IDs and backend to enable payments.",
      });
      
      // Simulate success for demo
      // Uncomment below for real integration:
      /*
      const stripeInstance = await stripe;
      if (!stripeInstance) {
        throw new Error("Stripe not loaded");
      }
      
      const { error } = await stripeInstance.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: mode,
        successUrl: `${window.location.origin}?payment_success=true`,
        cancelUrl: window.location.origin,
      });
      
      if (error) {
        throw error;
      }
      */
    } catch (error) {
      console.error(error);
      toast({
        title: "Payment Error",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-premium" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment option
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="onetime" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="onetime">One-Time</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="onetime" className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
              <p className="text-3xl font-bold text-foreground">$2.99</p>
              <p className="text-sm text-muted-foreground">One-time payment</p>
              <p className="mt-2 text-xs text-muted-foreground">Lifetime access to all Pro features</p>
            </div>
            
            <Button 
              onClick={() => handleCheckout("price_onetime_id", "payment")} 
              disabled={loading}
              variant="premium"
              size="xl"
              className="w-full"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {loading ? "Processing..." : "Pay $2.99 Now"}
            </Button>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
              <p className="text-3xl font-bold text-foreground">$1.99</p>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="mt-2 text-xs text-muted-foreground">Cancel anytime • 7-day money-back guarantee</p>
            </div>
            
            <Button 
              onClick={() => handleCheckout("price_subscription_id", "subscription")} 
              disabled={loading}
              variant="premium"
              size="xl"
              className="w-full"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {loading ? "Processing..." : "Subscribe for $1.99/mo"}
            </Button>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          Secure payment powered by Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
};
