import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe not initialized');
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        onError(error);
        toast.error(error.message || 'Erreur lors du paiement');
      } else {
        onSuccess();
        toast.success('Paiement réussi');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error as Error);
      toast.error('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-comedy-orange text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          'Payer maintenant'
        )}
      </button>
    </form>
  );
};

export default PaymentForm;