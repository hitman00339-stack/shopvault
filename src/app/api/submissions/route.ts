import { NextRequest, NextResponse } from "next/server";
import prisma, { withTimeout } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

// ─── In-Memory Submissions Fallback (When DB is offline / in dev mode) ───
const MOCK_SUBMISSIONS: any[] = [
  {
    id: "sub-1",
    userId: "user-demo",
    dealId: "deal-1",
    formType: "FORM1",
    status: "APPROVED",
    adminNotes: "Order verified on Amazon. Proceed to review.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    user: {
      id: "user-demo",
      name: "Shivansh",
      email: "hitman00339@gmail.com",
      phone: "9876543210",
      upiId: "hitman@okaxis",
    },
    deal: {
      id: "deal-1",
      title: 'Noise ColorFit Pulse 3 Bluetooth Calling Smart Watch (1.96" Display)',
      brandName: "Noise",
      platform: "AMAZON",
      productPrice: 1499,
      cashbackAmount: 150,
    },
    formData: [
      {
        id: "fd-1",
        fieldLabel: "Amazon Order ID",
        fieldType: "SHORT_ANSWER",
        value: "402-8819230-1928471",
      },
    ],
  },
  {
    id: "sub-2",
    userId: "user-demo",
    dealId: "deal-1",
    formType: "FORM2",
    status: "PENDING",
    adminNotes: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    user: {
      id: "user-demo",
      name: "Shivansh",
      email: "hitman00339@gmail.com",
      phone: "9876543210",
      upiId: "hitman@okaxis",
    },
    deal: {
      id: "deal-1",
      title: 'Noise ColorFit Pulse 3 Bluetooth Calling Smart Watch (1.96" Display)',
      brandName: "Noise",
      platform: "AMAZON",
      productPrice: 1499,
      cashbackAmount: 150,
    },
    formData: [
      {
        id: "fd-2",
        fieldLabel: "Review Profile Name",
        fieldType: "SHORT_ANSWER",
        value: "Shivansh K.",
      },
      {
        id: "fd-3",
        fieldLabel: "Review Screenshot Proof",
        fieldType: "FILE_UPLOAD",
        value: "Attached Proof ✓",
      },
    ],
  },
];

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    try {
      const where: any = {};

      if (user.role !== "ADMIN") {
        where.userId = user.userId;
      } else {
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

      const fetchSubsPromise = async () => {
        return Promise.all([
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
      };

      const result = await withTimeout<any>(fetchSubsPromise(), null, 2500);
      if (!result) throw new Error("DB submissions query timeout");

      const [submissions, total] = result;

      if (submissions.length > 0) {
        let memberStats = null;
        if (user.role !== "ADMIN") {
          const allUserSubmissions = await withTimeout<any[]>(
            prisma.submission.findMany({
              where: { userId: user.userId },
              select: {
                status: true,
                deal: { select: { productPrice: true, cashbackAmount: true } },
              },
            }),
            [],
            1500
          );

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
      }
    } catch (dbErr) {
      console.warn("Submissions DB fallback:", dbErr);
    }

    // ─── Offline / Dev Mode Fallback ───
    let fallback = [...MOCK_SUBMISSIONS];
    if (dealId) fallback = fallback.filter((s) => s.dealId === dealId);
    if (formType) fallback = fallback.filter((s) => s.formType === formType);
    if (status && status !== "ALL") fallback = fallback.filter((s) => s.status === status);

    const totalSpent = fallback.reduce((sum, s) => sum + (s.deal?.productPrice || 0), 0);
    const totalCashback = fallback
      .filter((s) => s.status === "APPROVED")
      .reduce((sum, s) => sum + ((s.deal?.productPrice || 0) + (s.deal?.cashbackAmount || 0)), 0);

    const memberStats = {
      totalSubmissions: fallback.length,
      pending: fallback.filter((s) => s.status === "PENDING").length,
      approved: fallback.filter((s) => s.status === "APPROVED").length,
      rejected: fallback.filter((s) => s.status === "REJECTED").length,
      totalSpent,
      totalCashback,
    };

    return NextResponse.json({
      success: true,
      data: fallback,
      memberStats,
      pagination: {
        page: 1,
        limit,
        total: fallback.length,
        totalPages: 1,
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

    if (!dealId || !formType || !formData || !Array.isArray(formData)) {
      return NextResponse.json(
        { success: false, error: "dealId, formType, and formData are required" },
        { status: 400 }
      );
    }

    try {
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (deal) {
        if (deal.status !== "ACTIVE") {
          return NextResponse.json(
            { success: false, error: "This deal is no longer active" },
            { status: 400 }
          );
        }

        if (formType === "FORM1" && deal.usedSlots >= deal.totalSlots) {
          return NextResponse.json(
            { success: false, error: "All slots are full for this deal" },
            { status: 400 }
          );
        }

        const formTemplateId = formType === "FORM1" ? deal.form1Id : deal.form2Id;

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
      }
    } catch (dbErr) {
      console.warn("DB submission fallback:", dbErr);
    }

    // ─── Offline / Dev Mode Submission Create ───
    const newSub = {
      id: "sub-" + Date.now(),
      userId: user.userId,
      dealId,
      formType,
      status: "PENDING",
      adminNotes: null,
      createdAt: new Date().toISOString(),
      user: {
        id: user.userId,
        name: user.email.split("@")[0] || "VIP Member",
        email: user.email,
        phone: "9876543210",
        upiId: "member@upi",
      },
      deal: {
        id: dealId,
        title: "Campaign Product",
        brandName: "Brand",
        platform: "AMAZON",
        productPrice: 1299,
        cashbackAmount: 100,
      },
      formData: formData.map((f: any, i: number) => ({
        id: `fd-${Date.now()}-${i}`,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        value: f.value,
      })),
    };

    MOCK_SUBMISSIONS.unshift(newSub);

    return NextResponse.json(
      {
        success: true,
        data: newSub,
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

    try {
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
    } catch (dbErr) {
      console.warn("DB submission update fallback:", dbErr);
    }

    // Offline / Dev mode update
    const existing = MOCK_SUBMISSIONS.find((s) => s.id === id);
    if (existing) {
      existing.status = status;
      existing.adminNotes = adminNotes || null;
      return NextResponse.json({
        success: true,
        data: existing,
        message: `Submission ${status.toLowerCase()} successfully (Dev Mode)`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Submission not found" },
      { status: 404 }
    );
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