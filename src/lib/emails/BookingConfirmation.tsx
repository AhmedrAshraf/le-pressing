import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingConfirmationEmailProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  seats: number;
  bookingReference: string;
}

export const BookingConfirmationEmail = ({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  seats,
  bookingReference,
}: BookingConfirmationEmailProps) => {
  const formattedDate = format(new Date(eventDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <Html>
      <Head />
      <Preview>Confirmation de votre réservation au Pressing Comedy Club</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Confirmation de réservation</Heading>
          
          <Text style={text}>
            Bonjour {userName},
          </Text>
          
          <Text style={text}>
            Nous vous confirmons votre réservation pour le spectacle suivant :
          </Text>

          <Section style={details}>
            <Text style={detailText}>
              <strong>Spectacle :</strong> {eventTitle}
            </Text>
            <Text style={detailText}>
              <strong>Date :</strong> {formattedDate}
            </Text>
            <Text style={detailText}>
              <strong>Heure :</strong> {eventTime}
            </Text>
            <Text style={detailText}>
              <strong>Nombre de places :</strong> {seats}
            </Text>
            <Text style={detailText}>
              <strong>Référence :</strong> {bookingReference}
            </Text>
          </Section>

          <Text style={text}>
            Nous vous attendons avec impatience ! N'oubliez pas de vous présenter au moins 15 minutes avant le début du spectacle.
          </Text>

          <Text style={text}>
            En cas d'empêchement, merci de nous prévenir au plus tôt au 07 52 38 55 12.
          </Text>

          <Text style={footer}>
            À bientôt au Pressing Comedy Club !<br />
            Galerie commerciale "Les Héllènes"<br />
            Avenue Hélène Vidal<br />
            83300 DRAGUIGNAN
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#FF9F1C',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
};

const details = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
};

const detailText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '32px',
  borderTop: '1px solid #eaeaea',
  paddingTop: '24px',
};

export default BookingConfirmationEmail;