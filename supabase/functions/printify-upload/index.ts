import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const printifyApiKey = Deno.env.get('PRINTIFY_API_KEY');
    if (!printifyApiKey) {
      throw new Error('PRINTIFY_API_KEY not configured');
    }

    const { qr_data_url, blueprint_id, product_type } = await req.json();

    console.log('Uploading image to Printify for blueprint:', blueprint_id);
    console.log('Product type:', product_type);

    // Convert data URL to base64 string without prefix
    const base64String = qr_data_url.split(',')[1];
    
    // Upload image to Printify
    const uploadResponse = await fetch('https://api.printify.com/v1/uploads/images.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${printifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: 'wifi-qr-code.png',
        contents: base64String,
      }),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload image: ${error}`);
    }

    const uploadData = await uploadResponse.json();
    const imageId = uploadData.id;

    console.log('Image uploaded successfully:', imageId);

    // First, fetch available print providers for this blueprint
    const providersResponse = await fetch(
      `https://api.printify.com/v1/catalog/blueprints/${blueprint_id}/print_providers.json`,
      {
        headers: {
          'Authorization': `Bearer ${printifyApiKey}`,
        },
      }
    );

    if (!providersResponse.ok) {
      const error = await providersResponse.text();
      throw new Error(`Failed to fetch print providers: ${error}`);
    }

    const providersData = await providersResponse.json();
    
    if (!providersData || providersData.length === 0) {
      throw new Error('No print providers available for this blueprint');
    }

    // Try to find Monster Digital (99) first, otherwise use the first available provider
    let printProviderId = providersData.find((p: any) => p.id === 99)?.id || providersData[0].id;
    
    console.log('Using print provider:', printProviderId);

    // Fetch product variants and pricing
    const variantsResponse = await fetch(
      `https://api.printify.com/v1/catalog/blueprints/${blueprint_id}/print_providers/${printProviderId}/variants.json`,
      {
        headers: {
          'Authorization': `Bearer ${printifyApiKey}`,
        },
      }
    );

    if (!variantsResponse.ok) {
      const error = await variantsResponse.text();
      throw new Error(`Failed to fetch variants: ${error}`);
    }

    const variantsData = await variantsResponse.json();
    
    // Get the first available variant
    const variant = variantsData.variants?.[0];
    
    if (!variant) {
      throw new Error('No variants available for this product');
    }

    console.log('Variant found:', variant.id, 'Cost:', variant.cost);

    return new Response(
      JSON.stringify({
        image_id: imageId,
        variant_id: variant.id,
        base_cost: variant.cost / 100, // Convert cents to dollars
        print_provider_id: printProviderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in printify-upload:', error);
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
