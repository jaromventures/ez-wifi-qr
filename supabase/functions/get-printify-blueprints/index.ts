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

    const { blueprintIds } = await req.json();

    if (!blueprintIds || !Array.isArray(blueprintIds)) {
      throw new Error('blueprintIds array is required');
    }

    console.log('Fetching mockups for blueprints:', blueprintIds);

    // Fetch each blueprint's details to get mockup images
    const blueprintPromises = blueprintIds.map(async (blueprintId: number) => {
      const response = await fetch(
        `https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`,
        {
          headers: {
            'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch blueprint ${blueprintId}: ${response.status}`);
        return { blueprintId, mockupUrl: null };
      }

      const data = await response.json();
      
      // Get the first available mockup image
      const mockupUrl = data.images?.[0]?.src || null;
      
      console.log(`Blueprint ${blueprintId} - ${data.title}: ${mockupUrl}`);

      return {
        blueprintId,
        mockupUrl,
      };
    });

    const results = await Promise.all(blueprintPromises);
    
    console.log('Successfully fetched mockups:', results);

    return new Response(JSON.stringify({ 
      blueprints: results
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