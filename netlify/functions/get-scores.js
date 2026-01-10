// Netlify Function to retrieve user scores
// Currently using a simple approach (will be replaced with Supabase later)

exports.handler = async (event, context) => {
  // Only allow authenticated users
  if (!context.clientContext || !context.clientContext.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - Please log in' })
    };
  }

  const user = context.clientContext.user;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters for filtering
    const { operation, variant } = event.queryStringParameters || {};

    // TODO: Replace this with Supabase call
    // Example Supabase code (commented for now):
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    let query = supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', user.sub)
      .order('updated_at', { ascending: false });
    
    if (operation) query = query.eq('operation', operation);
    if (variant) query = query.eq('variant', variant);
    
    const { data, error } = await query;
    if (error) throw error;
    */

    // Temporary: Return empty array for now
    // In production, fetch from Supabase database
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        userId: user.sub,
        scores: [], // TODO: Replace with data from Supabase
        message: 'Scores retrieved (placeholder - Supabase integration pending)'
      })
    };
  } catch (error) {
    console.error('Error retrieving scores:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve scores', details: error.message })
    };
  }
};
