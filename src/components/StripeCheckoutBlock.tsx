'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Props = {
  clientSecret: string;
  totalAmount: number;
  currencySymbol: string;
  onSuccess: (paymentIntentId: string) => void | Promise<void>;
  onError: (message: string) => void;
};

export default function StripeCheckoutBlock({
  clientSecret,
  totalAmount,
  currencySymbol,
  onSuccess,
  onError,
}: Props) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm
        totalAmount={totalAmount}
        currencySymbol={currencySymbol}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
