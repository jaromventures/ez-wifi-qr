import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const printifyApiKey = Deno.env.get('PRINTIFY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !printifyApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { payment_intent_id } = await req.json();

    console.log('Submitting order for payment intent:', payment_intent_id);

    // Retrieve payment intent with full details including shipping
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
      expand: ['payment_method', 'shipping'],
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    const metadata = paymentIntent.metadata;
    const shipping = paymentIntent.shipping;
    
    if (!shipping || !shipping.address) {
      throw new Error('Shipping address not found');
    }

    // Get customer email from payment method
    const customerEmail = paymentIntent.receipt_email || 
                         (paymentIntent.payment_method as any)?.billing_details?.email ||
                         'customer@example.com';

    // Fetch shop ID from Printify
    const shopsResponse = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': `Bearer ${printifyApiKey}`,
      },
    });

    if (!shopsResponse.ok) {
      throw new Error(`Failed to fetch Printify shops: ${shopsResponse.statusText}`);
    }

    const shops = await shopsResponse.json();
    const shopId = shops[0]?.id;

    if (!shopId) {
      throw new Error('No Printify shop found');
    }

    console.log('Using Printify shop:', shopId);

    // Submit order to Printify
    const printifyOrder = {
      external_id: payment_intent_id,
      line_items: [{
        blueprint_id: parseInt(metadata.printify_blueprint_id),
        print_provider_id: parseInt(metadata.print_provider_id || '99'),
        variant_id: parseInt(metadata.printify_variant_id),
        quantity: 1,
        print_areas: {
          front: metadata.printify_image_id,
        },
      }],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: shipping.name?.split(' ')[0] || 'Customer',
        last_name: shipping.name?.split(' ').slice(1).join(' ') || '',
        email: customerEmail,
        phone: shipping.phone || '',
        country: shipping.address.country || 'US',
        region: shipping.address.state || '',
        address1: shipping.address.line1 || '',
        address2: shipping.address.line2 || '',
        city: shipping.address.city || '',
        zip: shipping.address.postal_code || '',
      },
    };

    console.log('Submitting order to Printify:', JSON.stringify(printifyOrder, null, 2));

    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${printifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printifyOrder),
      }
    );

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      throw new Error(`Printify API error: ${printifyResponse.status} - ${errorText}`);
    }

    const printifyData = await printifyResponse.json();
    console.log('Printify order created:', printifyData.id);

    // Log order to database
    const { error: dbError } = await supabase.from('orders').insert({
      stripe_session_id: payment_intent_id,
      printify_order_id: printifyData.id,
      customer_email: customerEmail,
      customer_name: shipping.name,
      product_name: metadata.product_name,
      product_variant_id: metadata.printify_variant_id,
      printify_image_id: metadata.printify_image_id,
      shipping_address: shipping.address,
      status: 'submitted',
      total_price: paymentIntent.amount / 100,
      printify_cost: parseFloat(metadata.base_cost),
      profit: (paymentIntent.amount / 100) - parseFloat(metadata.base_cost),
    });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        printify_order_id: printifyData.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Order submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
