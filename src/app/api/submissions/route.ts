import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

// ─── GET: List submissions ───
// Members see only their own. Admin sees all with filters.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const formType = searchParams.get("formType");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    // Members can ONLY see their own submissions
    if (user.role !== "ADMIN") {
      where.userId = user.userId;
    } else {
      // Admin filters
      if (userId) where.userId = userId;
      if (dealId) where.dealId = dealId;
      if (status) where.status = status;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59");
      }
    }

    if (formType) where.formType = formType;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, upiId: true },
          },
          deal: {
            select: {
              id: true, title: true, brandName: true,
              platform: true, productPrice: true, cashbackAmount: true,
            },
          },
          formData: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    // ─── Calculate member stats if member is viewing ───
    let memberStats = null;
    if (user.role !== "ADMIN") {
      const allUserSubmissions = await prisma.submission.findMany({
        where: { userId: user.userId },
        include: {
          deal: { select: { productPrice: true, cashbackAmount: true } },
        },
      });

      const totalSpent = allUserSubmissions
        .filter((s) => s.status === "APPROVED" || s.status === "PENDING" || s.status === "UNDER_REVIEW")
        .reduce((sum, s) => sum + s.deal.productPrice, 0);

      const totalCashback = allUserSubmissions
        .filter((s) => s.status === "APPROVED")
        .reduce((sum, s) => sum + s.deal.productPrice + s.deal.cashbackAmount, 0);

      memberStats = {
        totalSubmissions: allUserSubmissions.length,
        pending: allUserSubmissions.filter((s) => s.status === "PENDING").length,
        approved: allUserSubmissions.filter((s) => s.status === "APPROVED").length,
        rejected: allUserSubmissions.filter((s) => s.status === "REJECTED").length,
        totalSpent,
        totalCashback,
      };
    }

    return NextResponse.json({
      success: true,
      data: submissions,
      memberStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Submissions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// ─── POST: Submit a form (Member) ───
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dealId, formType, formData } = body;

    // Validation
    if (!dealId || !formType || !formData || !Array.isArray(formData)) {
      return NextResponse.json(
        { success: false, error: "dealId, formType, and formData are required" },
        { status: 400 }
      );
    }

    // Check deal exists and is active
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    if (deal.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This deal is no longer active" },
        { status: 400 }
      );
    }

    // Check slots for FORM1 (order submission)
    if (formType === "FORM1" && deal.usedSlots >= deal.totalSlots) {
      return NextResponse.json(
        { success: false, error: "All slots are full for this deal" },
        { status: 400 }
      );
    }

    // Check if user already submitted this form type for this deal
    const existing = await prisma.submission.findFirst({
      where: {
        userId: user.userId,
        dealId,
        formType,
        status: { not: "REJECTED" },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `You have already submitted ${formType === "FORM1" ? "order details" : "review proof"} for this deal`,
        },
        { status: 409 }
      );
    }

    // Get the form template to validate required fields
    const formTemplateId = formType === "FORM1" ? deal.form1Id : deal.form2Id;

    // Create submission with form data
    const submission = await prisma.submission.create({
      data: {
        userId: user.userId,
        dealId,
        formType,
        status: "PENDING",
        formData: {
          create: formData.map((field: any) => ({
            formTemplateId: formTemplateId || "",
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            value: field.value,
          })),
        },
      },
      include: {
        formData: true,
        deal: { select: { id: true, title: true, platform: true } },
      },
    });

    // Increment used slots if FORM1
    if (formType === "FORM1") {
      await prisma.deal.update({
        where: { id: dealId },
        data: { usedSlots: { increment: 1 } },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: `${formType === "FORM1" ? "Order details" : "Review proof"} submitted successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit form" },
      { status: 500 }
    );
  }
}

// ─── PUT: Admin approve/reject submission ───
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Submission ID and status required" },
        { status: 400 }
      );
    }

    if (!["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
        formData: true,
      },
    });

    // If rejected a FORM1, decrement slot count
    if (status === "REJECTED" && submission.formType === "FORM1") {
      await prisma.deal.update({
        where: { id: submission.dealId },
        data: { usedSlots: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: submission,
      message: `Submission ${status.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update submission" },
      { status: 500 }
    );
  }
}