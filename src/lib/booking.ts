import { supabase } from './supabase';
import { render } from '@react-email/render';
import BookingConfirmationEmail from './emails/BookingConfirmation';
import BookingReminderEmail from './emails/BookingReminder';

interface BookingData {
  eventId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  seats: number;
}

interface BookingAvailability {
  available: boolean;
  maxSeats?: number;
  remainingSeats?: number;
  error?: string;
}

export async function checkAvailability(
  eventId: string,
  seats: number
): Promise<BookingAvailability> {
  try {
    // First check if booking settings exist
    const { data: settings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('max_seats, seats_per_booking')
      .eq('event_id', eventId);

    if (settingsError) throw settingsError;

    // If no settings exist, create default settings
    if (!settings || settings.length === 0) {
      const { data: newSettings, error: createError } = await supabase
        .from('booking_settings')
        .insert({
          event_id: eventId,
          max_seats: 50,
          seats_per_booking: 10,
          booking_deadline: '1 hour'
        })
        .select()
        .single();

      if (createError) throw createError;
      
      return {
        available: true,
        maxSeats: newSettings.max_seats,
        remainingSeats: newSettings.max_seats
      };
    }

    const currentSettings = settings[0];

    // Get current bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('seats')
      .eq('event_id', eventId)
      .in('status', ['pending', 'confirmed']);
      
    const bookedSeats = bookings?.reduce((sum, booking) => sum + booking.seats, 0) || 0;
    const remainingSeats = currentSettings.max_seats - bookedSeats;

    return {
      available: seats <= remainingSeats && seats <= currentSettings.seats_per_booking,
      maxSeats: currentSettings.max_seats,
      remainingSeats,
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      available: false,
      error: 'Erreur lors de la vérification de la disponibilité'
    };
  }
}

export async function createBooking(bookingData: BookingData) {
  try {
    // Check availability
    const availability = await checkAvailability(
      bookingData.eventId,
      bookingData.seats
    );

    if (!availability.available) {
      throw new Error('Places non disponibles');
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, start_date, start_time')
      .eq('id', bookingData.eventId)
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Événement non trouvé');

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        event_id: bookingData.eventId,
        user_name: bookingData.userName,
        user_email: bookingData.userEmail,
        user_phone: bookingData.userPhone,
        seats: bookingData.seats,
        status: 'confirmed'
      })
      .select()
      .single();
      console.log("🚀 ~ createBooking ~ booking:", booking)

    if (bookingError) throw bookingError;

    // Send confirmation email
    const emailHtml = render(
      BookingConfirmationEmail({
        userName: bookingData.userName,
        eventTitle: event.title,
        eventDate: event.start_date,
        eventTime: event.start_time,
        seats: bookingData.seats,
        bookingReference: booking.id
      })
    );

    // TODO: Implement email sending with a service
    console.log('Email confirmation:', emailHtml);

    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

export async function updateBooking(
  bookingId: string,
  updates: Partial<BookingData>
) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

export async function getBooking(bookingId: string) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        event:events (
          title,
          start_date,
          start_time
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

export async function getUserBookings(userEmail: string) {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        event:events (
          title,
          start_date,
          start_time
        )
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return bookings;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}