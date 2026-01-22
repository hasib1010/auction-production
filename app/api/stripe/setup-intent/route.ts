import stripe from "@/lib/stripe";
import { SetupIntentData, setupIntentSchema } from "@/validation/validator";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const customerCardAttach = {
  async setupIntent(data: SetupIntentData) {
    try {
      let customerId: string;

      if ("customerId" in data) {
        customerId = data.customerId;
      } else {
        // Get user and customerId
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: {
            stripeCustomerId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        } else {
          // Create customer
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          });

          // Update user with customerId
          await prisma.user.update({
            where: { id: data.userId },
            data: { stripeCustomerId: customer.id },
          });

          customerId = customer.id;
        }
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
      });

      if (!setupIntent.client_secret) {
        throw new Error("Failed to generate setup intent client secret");
      }

      return { clientSecret: setupIntent.client_secret, customerId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Stripe SetupIntent Error]:", message);
      throw new Error("Unable to create SetupIntent");
    }
  },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = setupIntentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 },
      );
    }
    const data: SetupIntentData = validation.data;

    const result = await customerCardAttach.setupIntent(data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Setup intent error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
