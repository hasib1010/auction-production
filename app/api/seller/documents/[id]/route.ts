
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the user and document
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: { infoDocuments: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check business rule: Cannot delete if Approved
    if (user.sellerStatus === "Approved") {
        return NextResponse.json(
            { error: "Cannot delete documents after account is approved." },
            { status: 403 }
        );
    }

    // Find the document
    const doc = await prisma.sellerDocument.findUnique({
        where: { id },
    });

    if (!doc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify ownership
    if (doc.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from database
    // Note: We might want to delete from Cloudinary too, but usually keeping it orphaned is safer/easier or handled by a cron.
    // Ideally delete from Cloudinary.
    await prisma.sellerDocument.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
