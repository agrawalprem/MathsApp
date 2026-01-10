// Netlify Function to save user scores
// Currently using a simple in-memory store (will be replaced with Supabase later)

// For now, we'll use a simple approach that can be easily replaced with Supabase
// In production, you'll want to replace this with Supabase calls

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { sessionData, variant, operation } = data;

    // TODO: Replace this with Supabase call
    // Example Supabase code (commented for now):
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data: savedData, error } = await supabase
      .from('user_scores')
      .upsert({
        user_id: user.sub,
        operation: operation,
        variant: variant,
        session_data: sessionData,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    */

    // Temporary: For now, just return success
    // In production, save to Supabase database
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Score saved successfully',
        userId: user.sub,
        // TODO: Return saved data from Supabase
        data: {
          operation,
          variant,
          timestamp: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Error saving score:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to save score', details: error.message })
    };
  }
};
