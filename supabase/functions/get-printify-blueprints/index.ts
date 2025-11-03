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

    console.log('Fetching Printify catalog blueprints...');

    // Fetch all available blueprints
    const blueprintsResponse = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!blueprintsResponse.ok) {
      const errorText = await blueprintsResponse.text();
      console.error('Printify blueprints error:', errorText);
      throw new Error(`Failed to fetch blueprints: ${blueprintsResponse.statusText}`);
    }

    const blueprints = await blueprintsResponse.json();
    
    console.log(`Found ${blueprints.length} blueprints`);
    
    // Filter for common product types we're interested in
    const relevantBlueprints = blueprints.filter((bp: any) => {
      const title = bp.title?.toLowerCase() || '';
      return title.includes('poster') || 
             title.includes('print') || 
             title.includes('magnet') || 
             title.includes('sticker');
    });

    console.log(`Found ${relevantBlueprints.length} relevant blueprints:`, 
      relevantBlueprints.map((bp: any) => ({ id: bp.id, title: bp.title }))
    );

    return new Response(JSON.stringify({ 
      blueprints: relevantBlueprints,
      total: blueprints.length 
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