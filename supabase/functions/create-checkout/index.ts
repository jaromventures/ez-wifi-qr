import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const {
      product_name,
      price,
      printify_image_id,
      printify_variant_id,
      printify_blueprint_id,
      print_provider_id,
      base_cost,
      shipping_address,
    } = await req.json();

    console.log('Creating payment intent for:', { product_name, price });

    // Create a PaymentIntent for embedded checkout
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        printify_image_id,
        printify_variant_id,
        printify_blueprint_id,
        print_provider_id: print_provider_id || '99',
        product_name,
        base_cost: base_cost.toString(),
        // Store shipping address if provided, otherwise collect later
        ...(shipping_address ? { shipping_address: JSON.stringify(shipping_address) } : {}),
      },
      description: `${product_name} - Custom WiFi QR Code Print`,
    });

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
