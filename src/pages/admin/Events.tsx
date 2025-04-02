import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, Save, History, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadEventImage, deleteEventImage } from '../../lib/storage';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide"),
  image: z
    .instanceof(FileList)
    .optional()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, 
      'L\'image ne doit pas dépasser 2MB')
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      'Format d\'image accepté : JPG, PNG, WebP'
    ),
});

type Event = {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  image_url?: string;
};

type EventHistory = {
  id: string;
  event_id: string;
  field: string;
  old_value: string;
  new_value: string;
  modified_at: string;
  modified_by: string;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<EventHistory[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    resolver: zodResolver(eventSchema)
  });

  const imageFile = watch('image');

  useEffect(() => {
    if (imageFile?.[0]) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [imageFile]);

  useEffect(() => {
    fetchEvents();
    fetchHistory();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      toast.error('Erreur lors du chargement des événements');
      return;
    }

    setEvents(data);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('events_history')
      .select('*')
      .order('modified_at', { ascending: false })
      .limit(10);

    if (error) {
      toast.error('Erreur lors du chargement de l\'historique');
      return;
    }

    setHistory(data);
  };

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = selectedEvent?.image_url;

      // Gestion de l'upload d'image
      if (data.image?.[0]) {
        // Si une nouvelle image est sélectionnée, supprimer l'ancienne
        if (imageUrl) {
          await deleteEventImage(imageUrl);
        }
        imageUrl = await uploadEventImage(data.image[0]);
      }

      const eventData = {
        title: data.title,
        start_date: data.start_date,
        start_time: data.start_time,
        end_date: data.end_date,
        end_time: data.end_time,
        image_url: imageUrl,
      };

      if (isCreating) {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
        toast.success('Événement créé avec succès');
      } else if (selectedEvent) {
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedEvent.id);

        if (error) throw error;
        toast.success('Événement mis à jour avec succès');
      }

      fetchEvents();
      fetchHistory();
      setSelectedEvent(null);
      setIsCreating(false);
      setImagePreview(null);
      reset();
    } catch (error) {
      toast.error('Une erreur est survenue');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    const event = events.find(e => e.id === id);
    if (event?.image_url) {
      await deleteEventImage(event.image_url);
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }

    toast.success('Événement supprimé avec succès');
    fetchEvents();
    fetchHistory();
  };

  const handleDeleteImage = async () => {
    if (!selectedEvent?.image_url) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer l\'image ?')) return;

    try {
      await deleteEventImage(selectedEvent.image_url);
      
      const { error } = await supabase
        .from('events')
        .update({ image_url: null })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast.success('Image supprimée avec succès');
      setSelectedEvent({ ...selectedEvent, image_url: undefined });
      setImagePreview(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'image');
      console.error(error);
    }
  };

  const formatDate = (date: string) => {
    return format(parse(date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-comedy-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des événements</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedEvent(null);
              setImagePreview(null);
              reset();
            }}
            className="bg-comedy-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvel événement
          </button>
        </div>

        {/* Liste des événements */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure de début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 flex items-center justify-center rounded">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.start_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.end_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsCreating(false);
                          setImagePreview(null);
                          reset(event);
                        }}
                        className="text-comedy-orange hover:text-comedy-orange-dark"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulaire de création/modification */}
        {(isCreating || selectedEvent) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isCreating ? 'Nouvel événement' : 'Modifier l\'événement'}
              </h2>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setIsCreating(false);
                  setImagePreview(null);
                  reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-comedy-orange focus:border-comedy-orange"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="date"
                      {...register('start_date')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-comedy-orange focus:border-comedy-orange"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de début
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="time"
                      {...register('start_time')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-comedy-orange focus:border-comedy-orange"
                    />
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de fin
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="date"
                      {...register('end_date')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-comedy-orange focus:border-comedy-orange"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de fin
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="time"
                      {...register('end_time')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-comedy-orange focus:border-comedy-orange"
                    />
                    <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
                  )}
                </div>
              </div>

              {/* Section Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <div className="space-y-2">
                  {(imagePreview || selectedEvent?.image_url) && (
                    <div className="relative w-48">
                      <img
                        src={imagePreview || selectedEvent?.image_url}
                        alt="Prévisualisation"
                        className="rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    {...register('image')}
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-comedy-orange file:text-white
                      hover:file:bg-opacity-90"
                  />
                  <p className="text-xs text-gray-500">
                    Formats acceptés : JPG, PNG, WebP. Taille maximale : 2MB.
                    Dimensions recommandées : 1200x800px
                  </p>
                  {errors.image && (
                    <p className="text-sm text-red-600">{errors.image.message as string}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null);
                    setIsCreating(false);
                    setImagePreview(null);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-comedy-orange text-white rounded-md hover:bg-opacity-90 flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isCreating ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Historique des modifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <History className="w-6 h-6 mr-2" />
            Historique des modifications
          </h2>
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="border-l-4 border-comedy-orange pl-4 py-2">
                <p className="text-sm text-gray-600">
                  {format(new Date(entry.modified_at), 'dd/MM/yyyy HH:mm')} - {entry.modified_by}
                </p>
                <p className="text-sm">
                  Modification de <span className="font-medium">{entry.field}</span> :
                  {' '}<span className="line-through text-red-500">{entry.old_value}</span>
                  {' '}<span className="text-green-500">{entry.new_value}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;