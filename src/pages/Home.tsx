import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Calendar, MapPin, Clock, ImageIcon, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Event = {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  image_url?: string;
};

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [paymentDetail, setPaymentDetail] = useState<{ [key: string]: string } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams();
  
  const updatePaymentSatatus = async (status, session, bookingDataEncoded) => {
    try {
      console.log("session", session, status);
      
      const decoded = decodeURIComponent(bookingDataEncoded); 
      const bookingData = JSON.parse(decoded); 
      window.console.log("✅ Decoded Booking Data:", bookingData);
      
      const { data: bookingDetail, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            event_id: bookingData.event_id,
            user_name: bookingData.user_name,
            user_email: bookingData.user_email,
            user_phone: bookingData.user_phone,
            seats: bookingData.seats,
            total_amount: bookingData.total_amount,
            payment_status: status,
            payment_id: session
          },
        ])
        .select()
        .single();
  
      if (bookingError) {
        console.error("❌ Error inserting booking:", bookingError);
        return;
      }
  
      console.log("🥳 Booking inserted:", bookingDetail);
    } catch (err) {
      console.error("❌ Failed to decode or insert booking:", err);
    }
  }; 
  
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const bookingDataEncoded = params.bookingData;
  
    if (params.session && params.status && bookingDataEncoded) {
      setPaymentDetail(params);
      setShowModal(true);
      console.log("✅ Payment success detected");
      updatePaymentSatatus(params.status, params.session, bookingDataEncoded);
    }
  }, [searchParams]);
  

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    setUpcomingEvents(data);
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), 'dd MMMM yyyy', { locale: fr });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-comedy-orange"></div>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1200&h=600&q=80';

  return (
    <div className="min-h-screen">
      {/* Hero Section avec Slider */}
      <section className="relative h-[600px]">
        {upcomingEvents.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="h-full"
          >
            {upcomingEvents.map((event) => (
              <SwiperSlide key={event.id}>
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gray-900">
                    <img
                      src={event.image_url || defaultImage}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-75"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImage;
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <h2 className="text-4xl md:text-6xl font-bold mb-4">{event.title}</h2>
                      <div className="flex items-center justify-center space-x-6 mb-6">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          <span>{event.start_time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/reservation/${event.id}`)}
                        className="bg-comedy-orange text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors"
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Aucun événement à venir</p>
          </div>
        )}
      </section>

      {/* Section Prochains Spectacles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Prochains Spectacles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImage;
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.start_time}</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/reservation/${event.id}`)}
                    className="w-full bg-comedy-orange text-white py-2 rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Newsletter */}
      <section className="py-16 bg-comedy-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
            <p className="mb-8">Recevez notre programmation et nos offres spéciales</p>
            <form className="max-w-md mx-auto">
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-4 py-2 rounded-md text-black"
                />
                <button
                  type="submit"
                  className="bg-comedy-orange px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
                >
                  S'inscrire
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Section Infos Pratiques */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-comedy-orange" />
              <h3 className="text-xl font-semibold mb-2">Adresse</h3>
              <p>Galerie commerciale "Les Héllènes"<br />Avenue Hélène Vidal<br />83300 DRAGUIGNAN</p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-comedy-orange" />
              <h3 className="text-xl font-semibold mb-2">Horaires</h3>
              <p>Du mardi au samedi<br />19h00 - 23h00</p>
            </div>
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-comedy-orange" />
              <h3 className="text-xl font-semibold mb-2">Réservations</h3>
              <p>En ligne ou par téléphone<br />07 52 38 55 12</p>
            </div>
          </div>
        </div>
      </section>


      {showModal && (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
       <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl">
         {/* Top gradient accent */}
         <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
 
         <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
           {/* Success icon */}
           <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-200">
             <Check className="w-10 h-10 text-white" strokeWidth={3} />
           </div>
 
           <p className="mb-2 text-lg font-medium text-gray-500">Please be patient for a moment.</p>
           <h3 className="mb-4 text-2xl font-bold text-gray-900">Your payment has been successful</h3>
           <button
             onClick={() => {setShowModal(false); navigate("/", { replace: true });}}
             className="px-8 py-3 text-white text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
           >
             Close
           </button>
         </div>
       </div>
     </div>
    )}
    </div>
  );
};

export default Home;