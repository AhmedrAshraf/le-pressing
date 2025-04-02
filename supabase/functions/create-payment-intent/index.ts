import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';
import Stripe from 'https://esm.sh/stripe@13.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // try {
  //   if (req.method !== 'POST') {
  //     throw new Error('Method not allowed');
  //   }

  //   const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  //   if (!stripeKey) {
  //     throw new Error('Missing Stripe secret key');
  //   }

  //   const stripe = new Stripe(stripeKey, {
  //     apiVersion: '2023-10-16',
  //   });

  //   const supabaseUrl = Deno.env.get('SUPABASE_URL');
  //   const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  //   if (!supabaseUrl || !supabaseServiceKey) {
  //     throw new Error('Missing Supabase configuration');
  //   }

  //   const supabase = createClient(supabaseUrl, supabaseServiceKey);

  //   const { eventId, seats, userEmail, userName, userPhone } = await req.json();

  //   if (!eventId || !seats || !userEmail || !userName || !userPhone) {
  //     throw new Error('Missing required fields');
  //   }

  //   const { data: event, error: eventError } = await supabase
  //     .from('events')
  //     .select('price')
  //     .eq('id', eventId)
  //     .single();

  //   if (eventError || !event) {
  //     throw new Error('Event not found');
  //   }

  //   const { data: availability, error: availabilityError } = await supabase
  //     .rpc('check_booking_availability', {
  //       p_event_id: eventId,
  //       p_seats: seats
  //     });

  //   if (availabilityError) {
  //     throw new Error('Error checking availability');
  //   }

  //   if (!availability) {
  //     throw new Error('No seats available');
  //   }

  //   const amount = event.price * seats;

  //   const paymentIntent = await stripe.paymentIntents.create({
  //     amount,
  //     currency: 'eur',
  //     automatic_payment_methods: {
  //       enabled: true,
  //     },
  //     metadata: {
  //       eventId,
  //       seats: seats.toString(),
  //       userEmail,
  //       userName,
  //       userPhone
  //     },
  //   });

  //   return new Response(
  //     JSON.stringify({
  //       clientSecret: paymentIntent.client_secret,
  //       amount
  //     }),
  //     {
  //       headers: {
  //         ...corsHeaders,
  //         'Content-Type': 'application/json',
  //       },
  //       status: 200,
  //     }
  //   );
  // } catch (error) {
  //   console.error('Error:', error);
    
  //   return new Response(
  //     JSON.stringify({
  //       error: error instanceof Error ? error.message : 'An unknown error occurred'
  //     }),
  //     {
  //       headers: {
  //         ...corsHeaders,
  //         'Content-Type': 'application/json',
  //       },
  //       status: 400,
  //     }
  //   );
  // }
});