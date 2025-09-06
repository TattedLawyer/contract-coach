import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ADMIN_EMAIL = 'tatted@mnnt.io';

    console.log('Starting admin role assignment for:', ADMIN_EMAIL);

    // First, get the user by email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: userError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find the admin user by email
    const adminUser = userData.users.find(user => user.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      console.log('Admin user not found. User must sign up first.');
      return new Response(
        JSON.stringify({ 
          error: 'Admin user not found', 
          message: 'The admin user must sign up first before role assignment' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found admin user:', adminUser.id);

    // Check if admin role already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing role:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing role', details: checkError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (existingRole) {
      console.log('Admin role already exists for user');
      return new Response(
        JSON.stringify({ 
          message: 'Admin role already assigned',
          user_id: adminUser.id,
          email: ADMIN_EMAIL
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Assign admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: adminUser.id,
        role: 'admin'
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role', details: roleError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully assigned admin role:', roleData);

    return new Response(
      JSON.stringify({ 
        message: 'Admin role successfully assigned',
        user_id: adminUser.id,
        email: ADMIN_EMAIL,
        role_id: roleData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});