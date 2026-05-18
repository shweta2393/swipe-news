import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('PROJECT_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  );
}

export async function createUserClient(req: Request): Promise<{
  supabase: SupabaseClient;
  userId: string;
} | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
    });
  }

  const supabase = createClient(
    Deno.env.get('PROJECT_URL') ?? '',
    Deno.env.get('ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  return { supabase, userId: user.id };
}

export function verifyCronOrService(req: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') === cronSecret) {
    return true;
  }
  const auth = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
  return auth === `Bearer ${serviceKey}`;
}
