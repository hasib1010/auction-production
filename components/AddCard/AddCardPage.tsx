"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Props = {
  customerId: string | null;
};

export default function AddCardPage({ customerId }: Props) {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || !user || !customerId) {
      toast.error("Stripe not initialized");
      return;
    }

    setIsProcessing(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/add-card",
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent && setupIntent.status === "succeeded") {
        // Attach the card
        await axios.post(`${API_BASE_URL}/api/stripe/attach-card`, {
          userId: user.id,
          customerId,
          paymentMethodId: setupIntent.payment_method as string,
        });

        toast.success("Card added successfully! You are now verified.");
        await refreshUser();
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error attaching card:", error);
      toast.error("Failed to add card");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white border border-[#D4D0C5] rounded-xl p-6 md:p-8 lg:p-10 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0E0E0E] mb-2">
            Add Your Card to Verify Account
          </h1>
          <p className="text-gray-600">
            Please add a payment method to complete your account verification.
          </p>
        </div>

        <form onSubmit={handleCardSubmit} className="space-y-6">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full text-white py-3 rounded-full bg-gradient-to-br from-[#E95AFF] to-[#9F13FB] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base transition-all hover:shadow-lg active:scale-95"
          >
            {isProcessing ? "Adding Card..." : "Add Card & Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
