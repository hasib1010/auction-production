import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * PATCH: Update seller details by admin
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await context.params;
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      taxId,
      bankName,
      bankAccount,
      bankSortCode,
      phone,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: sellerId },
      data: {
        companyName,
        taxId,
        bankName,
        bankAccount,
        bankSortCode,
        phone,
      },
      select: {
        id: true,
        companyName: true,
        taxId: true,
        bankName: true,
        bankAccount: true,
        bankSortCode: true,
        phone: true,
      }
    });

    return NextResponse.json({
      message: "Seller updated successfully",
      seller: updatedUser,
    });
  } catch (error) {
    console.error("Admin seller update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
