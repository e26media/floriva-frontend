"use client";

import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  totalAmount: number;
  currencySymbol: string;
}

export default function StripePaymentForm({
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Important: handles 3D Secure in-place without redirecting
    });

    if (error) {
      onError(error.message ?? "An unknown error occurred during payment.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      onError("Payment failed or is still processing. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div id="payment-form" className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isProcessing || !stripe || !elements}
        className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
      >
        {isProcessing ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing Payment...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.603 2.152a3.323 3.323 0 00-5.182 4.016 3.323 3.323 0 00-1.018 4.318 3.323 3.323 0 004.016 5.182 3.323 3.323 0 004.318 1.018 3.323 3.323 0 005.182-4.016 3.323 3.323 0 001.018-4.318z" />
            </svg>
            Pay & Complete Order
          </>
        )}
      </button>
      
      <p className="text-center text-[10px] text-neutral-400 dark:text-neutral-500">
        Your payment information is encrypted and secure.
      </p>
    </div>
  );
}
