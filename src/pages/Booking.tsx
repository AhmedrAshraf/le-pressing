import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Calendar, Users, Phone, Mail, User, Clock, CreditCard, Loader2 } from 'lucide-react';
import { checkAvailability } from '../lib/booking';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
import axios from "axios";

const bookingSchema = z.object({
  userName: z.string().min(2, 'Le nom est requis'),
  userEmail: z.string().email('Email invalide'),
  userPhone: z.string().regex(/^\+?[0-9]{10,}$/, 'Numéro de téléphone invalide'),
  seats: z.number().min(1).max(10),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface Event {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
  price: number;
}

const Booking = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [availability, setAvailability] = useState<{
    maxSeats?: number;
    remainingSeats?: number;
  }>({});
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      seats: 1,
    },
  });

  const seats = watch('seats');

  useEffect(() => {
    if (!eventId) {
      navigate('/programme');
      return;
    }

    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date, start_time, price')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        toast.error('Événement non trouvé');
        navigate('/programme');
        return;
      }

      setEvent(data);
    };

    fetchEvent();
  }, [eventId, navigate]);

  useEffect(() => {
    if (eventId) {
      checkAvailability(eventId, seats).then(setAvailability);
    }
  }, [eventId, seats]);

const totalPrice = ((event?.price * watch('seats')) / 100).toFixed(2);
console.log("event?.price", event?.price, totalPrice);


  const handlePaymentSuccess = () => {
    toast.success('Réservation confirmée !');
    navigate('/programme');
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    toast.error('Erreur lors du paiement');
  };

  const onSubmit = async (data: BookingForm) => {
    if (!eventId || !event) return;
    try {
      setLoading(true);
      const bookingDetail = {
        event_id: event.id,
        user_name: data.userName,
        user_email: data.userEmail,
        user_phone: data.userPhone,
        seats: data.seats,
        total_amount: parseFloat(totalPrice),
      }
      const response = await axios.post("https://le-pressing-server.vercel.app/api/create-payment-intent", { amount: totalPrice, bookingData:bookingDetail  });
      // const response = await axios.post("http://localhost:8000/api/create-payment-intent", { amount: totalPrice, bookingData:bookingDetail  });
      const { url } = response.data;

      if (!url) {
        throw new Error("No checkout URL received");
      }
      window.location.href = url;
  
      setShowPayment(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-comedy-orange"></div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(parseISO(date), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Réservation</h1>
            
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <div className="flex gap-4 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{event.start_time}</span>
                </div>
              </div>
            </div>

            {!showPayment ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      {...register('userName')}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-comedy-orange focus:border-comedy-orange pl-10"
                      placeholder="John Doe"
                    />
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.userName && (
                    <p className="mt-1 text-sm text-red-600">{errors.userName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="email"
                      {...register('userEmail')}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-comedy-orange focus:border-comedy-orange pl-10"
                      placeholder="john@example.com"
                    />
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.userEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.userEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="tel"
                      {...register('userPhone')}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-comedy-orange focus:border-comedy-orange pl-10"
                      placeholder="0612345678"
                    />
                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.userPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.userPhone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de places
                  </label>
                  <div className="mt-1 relative">
                    <select
                      {...register('seats', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-comedy-orange focus:border-comedy-orange pl-10"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'place' : 'places'}
                        </option>
                      ))}
                    </select>
                    <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  {availability.remainingSeats !== undefined && (
                    <p className="mt-1 text-sm text-gray-500">
                      {availability.remainingSeats} places restantes
                    </p>
                  )}
                  {errors.seats && (
                    <p className="mt-1 text-sm text-red-600">{errors.seats.message}</p>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Récapitulatif
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prix unitaire</span>
                      <span>{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Nombre de places</span>
                      <span>{watch('seats')}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span onClick={() => handlePayment({ totalPrice })}>{totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-comedy-orange text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Procéder au paiement
                    </>
                  )}
                </button>
              </form>
            ) : clientSecret ? (
              <StripeProvider options={{ clientSecret }}>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </StripeProvider>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;