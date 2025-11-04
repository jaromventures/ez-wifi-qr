import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { EmbeddedCheckout } from "./EmbeddedCheckout";
import { Loader2 } from "lucide-react";

// Initialize Stripe with published key
const stripeKey = "pk_live_51SPP5cHL7SXDiOCTLGW87fLFcGODDnAruZad0jDS89S8oSZGbWkitDDtaKLRd2jqzvhUsnvV5mPjYZYbkhdgv03j00qXttKnd3";
const stripePromise = loadStripe(stripeKey);

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string;
  productName: string;
  price: number;
  qrThumbnail?: string;
}

export const CheckoutDialog = ({
  open,
  onOpenChange,
  clientSecret,
  productName,
  price,
  qrThumbnail,
}: CheckoutDialogProps) => {
  const [options, setOptions] = useState<StripeElementsOptions | null>(null);

  useEffect(() => {
    if (clientSecret) {
      setOptions({
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      });
    }
  }, [clientSecret]);

  const handleSuccess = () => {
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
          <DialogDescription>
            Enter your payment details to order your custom WiFi QR code print
          </DialogDescription>
        </DialogHeader>

        {!options ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <EmbeddedCheckout
              productName={productName}
              price={price}
              qrThumbnail={qrThumbnail}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
