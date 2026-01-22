"use client";

import { Suspense, useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import PaymentWrapper from "@/components/PaymentWrapper/paymentWrapper";
import AddCardPage from "@/components/AddCard/AddCardPage";
import axios from "axios";
import PremiumLoader from "@/components/shared/PremiumLoader";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function Page() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
      return;
    }
    if (!userLoading && user && user.isVerified) {
      router.push("/profile");
      return;
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchSetupIntent = async () => {
      if (!user || !user.stripeCustomerId) return;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/stripe/setup-intent`,
          {
            userId: user.id,
          },
        );
        setClientSecret(response.data.clientSecret);
        setCustomerId(response.data.customerId);
      } catch (error) {
        console.error("Error fetching setup intent:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !user.isVerified) {
      fetchSetupIntent();
    }
  }, [user]);

  if (userLoading || loading) {
    return <PremiumLoader text="Loading..." />;
  }

  if (!user || user.isVerified) {
    return null;
  }

  return (
    <Suspense fallback={<PremiumLoader text="Loading..." />}>
      <PaymentWrapper clientSecret={clientSecret}>
        <AddCardPage customerId={customerId} />
      </PaymentWrapper>
    </Suspense>
  );
}
