import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { decrypt } from "../_shared/crypto.ts"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const { packet_id } = await req.json()
        if (!packet_id) {
            throw new Error('Missing packet_id')
        }

        // Fetch the packet. RLS ensures user owns this packet.
        const { data: packet, error: fetchError } = await supabaseClient
            .from('api_key_packets')
            .select('encrypted_payload')
            .eq('id', packet_id)
            .single()

        if (fetchError || !packet) {
            return new Response(JSON.stringify({ error: 'Packet not found or access denied' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const original_value = await decrypt(packet.encrypted_payload)

        return new Response(JSON.stringify({ original_value }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
