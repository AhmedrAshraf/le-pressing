import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';
import Stripe from 'https://esm.sh/stripe@13.6.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { eventId, seats, userEmail, userName, userPhone } = paymentIntent.metadata;

        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            stripe_payment_intent_id: paymentIntent.id,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        const { data, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            event_id: eventId,
            user_email: userEmail,
            user_name: userName,
            user_phone: userPhone,
            seats: parseInt(seats),
            status: 'confirmed',
            payment_id: payment.id,
          });
          
          console.log("🚀 ~ serve ~ data:", data)
        if (bookingError) throw bookingError;
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        await supabase
          .from('payments')
          .insert({
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
          });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});