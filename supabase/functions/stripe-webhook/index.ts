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
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
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

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', errorMessage);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Processing checkout session:', session.id);

      const metadata = session.metadata;
      const shipping = session.shipping_details;
      const customerEmail = session.customer_details.email;
      const customerPhone = session.customer_details.phone;

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
        external_id: session.id,
        line_items: [{
          blueprint_id: parseInt(metadata.printify_blueprint_id),
          print_provider_id: 99, // Monster Digital
          variant_id: parseInt(metadata.printify_variant_id),
          quantity: 1,
          print_areas: {
            front: metadata.printify_image_id,
          },
        }],
        shipping_method: 1,
        send_shipping_notification: true,
        address_to: {
          first_name: shipping.name.split(' ')[0] || 'Customer',
          last_name: shipping.name.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          phone: customerPhone || '',
          country: shipping.address.country,
          region: shipping.address.state || '',
          address1: shipping.address.line1,
          address2: shipping.address.line2 || '',
          city: shipping.address.city,
          zip: shipping.address.postal_code,
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
        stripe_session_id: session.id,
        printify_order_id: printifyData.id,
        customer_email: customerEmail,
        customer_name: shipping.name,
        product_name: metadata.product_name,
        product_variant_id: metadata.printify_variant_id,
        printify_image_id: metadata.printify_image_id,
        shipping_address: shipping.address,
        status: 'submitted',
        total_price: session.amount_total / 100,
        printify_cost: parseFloat(metadata.base_cost),
        profit: (session.amount_total / 100) - parseFloat(metadata.base_cost),
      });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the webhook if DB insert fails
      } else {
        console.log('Order logged to database');
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
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
