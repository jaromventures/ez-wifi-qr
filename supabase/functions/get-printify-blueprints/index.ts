import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PRINTIFY_API_KEY = Deno.env.get('PRINTIFY_API_KEY');
    
    if (!PRINTIFY_API_KEY) {
      throw new Error('PRINTIFY_API_KEY is not set');
    }

    console.log('Fetching all available Printify blueprints...');

    // Fetch ALL blueprints from Printify catalog
    const response = await fetch(
      'https://api.printify.com/v1/catalog/blueprints.json',
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch blueprints: ${response.status}`);
    }

    const allBlueprints = await response.json();
    
    console.log(`Found ${allBlueprints.length} total blueprints`);

    // Filter for products we want
    const posters = allBlueprints.filter((bp: any) => 
      bp.title.toLowerCase().includes('poster') || 
      bp.title.toLowerCase().includes('print') ||
      bp.title.toLowerCase().includes('framed')
    );

    const magnets = allBlueprints.filter((bp: any) => 
      bp.title.toLowerCase().includes('magnet')
    );

    const stickers = allBlueprints.filter((bp: any) => 
      bp.title.toLowerCase().includes('sticker')
    );

    // Log what we found
    console.log('Available Posters/Prints:', posters.map((p: any) => ({ 
      id: p.id, 
      title: p.title,
      brand: p.brand 
    })));
    console.log('Available Magnets:', magnets.map((p: any) => ({ 
      id: p.id, 
      title: p.title,
      brand: p.brand 
    })));
    console.log('Available Stickers:', stickers.map((p: any) => ({ 
      id: p.id, 
      title: p.title,
      brand: p.brand 
    })));

    // Select the first available product from each category
    const selectedProducts = [];

    if (posters.length > 0) {
      const poster = posters[0];
      selectedProducts.push({
        blueprintId: poster.id,
        title: poster.title,
        brand: poster.brand,
        mockupUrl: poster.images?.[0]?.src || null,
        category: 'poster'
      });
    }

    if (magnets.length > 0) {
      const magnet = magnets[0];
      selectedProducts.push({
        blueprintId: magnet.id,
        title: magnet.title,
        brand: magnet.brand,
        mockupUrl: magnet.images?.[0]?.src || null,
        category: 'magnet'
      });
    }

    if (stickers.length > 0) {
      const sticker = stickers[0];
      selectedProducts.push({
        blueprintId: sticker.id,
        title: sticker.title,
        brand: sticker.brand,
        mockupUrl: sticker.images?.[0]?.src || null,
        category: 'sticker'
      });
    }

    console.log('Selected products:', selectedProducts);

    return new Response(JSON.stringify({ 
      allProducts: {
        posters: posters.map((p: any) => ({ id: p.id, title: p.title, brand: p.brand })),
        magnets: magnets.map((p: any) => ({ id: p.id, title: p.title, brand: p.brand })),
        stickers: stickers.map((p: any) => ({ id: p.id, title: p.title, brand: p.brand })),
      },
      selectedProducts,
      total: allBlueprints.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});