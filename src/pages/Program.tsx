import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Event = {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  image_url?: string;
};

const Program = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    setEvents(data);
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

  const defaultImage = 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=600&h=400&q=80';

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Programme</h1>
        
        {events.length > 0 ? (
          <div className="grid gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row"
              >
                <div className="md:w-1/3 relative">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-48 md:h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImage;
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 md:h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-6 md:w-2/3">
                  <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{event.start_time}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/reservation/${event.id}`)}
                    className="bg-comedy-orange text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Aucun événement à venir</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Program;