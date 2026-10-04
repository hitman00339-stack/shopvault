import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// ─── GET: Admin data (stats, users, export) ───
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // ─── DASHBOARD STATS ───
    if (action === "stats") {
      const [
        totalUsers,
        activeDeals,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        recentSubmissions,
      ] = await Promise.all([
        prisma.user.count({ where: { role: "MEMBER" } }),
        prisma.deal.count({ where: { status: "ACTIVE", isVisible: true } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "PENDING" } }),
        prisma.submission.count({ where: { status: "APPROVED" } }),
        prisma.submission.count({ where: { status: "REJECTED" } }),
        prisma.submission.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            deal: { select: { title: true, platform: true, productPrice: true } },
          },
        }),
      ]);

      // Calculate total reported spend from approved FORM1 submissions
      const spendSubmissions = await prisma.submission.findMany({
        where: { formType: "FORM1" },
        include: { deal: { select: { productPrice: true, cashbackAmount: true } } },
      });

      const totalReportedSpend = spendSubmissions.reduce(
        (sum, s) => sum + s.deal.productPrice, 0
      );

      const approvedSubs = spendSubmissions.filter((s) => s.status === "APPROVED");
      const totalCashbackDue = approvedSubs.reduce(
        (sum, s) => sum + s.deal.productPrice + s.deal.cashbackAmount, 0
      );

      return NextResponse.json({
        success: true,
        data: {
          totalUsers,
          activeDeals,
          totalSubmissions,
          pendingSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          totalReportedSpend,
          totalCashbackDue,
          recentSubmissions,
        },
      });
    }

    // ─── ALL USERS WITH STATS ───
    if (action === "users") {
      const search = searchParams.get("search");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");

      const where: any = { role: "MEMBER" };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, name: true, email: true, phone: true,
            upiId: true, isActive: true, createdAt: true,
            _count: { select: { submissions: true, supportTickets: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      // Get per-user spending
      const usersWithStats = await Promise.all(
        users.map(async (u) => {
          const subs = await prisma.submission.findMany({
            where: { userId: u.id, formType: "FORM1" },
            include: { deal: { select: { productPrice: true, cashbackAmount: true } } },
          });
          return {
            ...u,
            totalOrders: subs.length,
            totalSpent: subs.reduce((s, sub) => s + sub.deal.productPrice, 0),
            totalCashback: subs
              .filter((s) => s.status === "APPROVED")
              .reduce((s, sub) => s + sub.deal.productPrice + sub.deal.cashbackAmount, 0),
            pendingCount: subs.filter((s) => s.status === "PENDING").length,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: usersWithStats,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // ─── SINGLE USER DETAIL ───
    if (action === "user-detail") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "userId required" },
          { status: 400 }
        );
      }

      const [user, submissions, tickets] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true, name: true, email: true, phone: true,
            upiId: true, bankDetails: true, isActive: true, createdAt: true,
          },
        }),
        prisma.submission.findMany({
          where: { userId },
          include: {
            deal: { select: { id: true, title: true, platform: true, productPrice: true, cashbackAmount: true } },
            formData: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.supportTicket.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const totalSpent = submissions
        .filter((s) => s.formType === "FORM1")
        .reduce((sum, s) => sum + s.deal.productPrice, 0);

      return NextResponse.json({
        success: true,
        data: { user, submissions, tickets, totalSpent },
      });
    }

    // ─── EXPORT DATA ───
    if (action === "export") {
      const type = searchParams.get("type") || "FULL";
      const sellerPlatform = searchParams.get("platform");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");

      const where: any = { formType: "FORM1" };

      if (type === "SELLER_WISE" && sellerPlatform) {
        where.deal = { platform: sellerPlatform };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59");
      }

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, upiId: true } },
          deal: {
            select: {
              title: true, brandName: true, platform: true,
              productPrice: true, cashbackAmount: true,
            },
          },
          formData: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Flatten for CSV export
      const exportData = submissions.map((s) => {
        const flat: Record<string, any> = {
          "Submission ID": s.id,
          "Member Name": s.user.name,
          "Member Email": s.user.email,
          "Member Phone": s.user.phone,
          "UPI ID": s.user.upiId || "N/A",
          "Deal Title": s.deal.title,
          "Brand": s.deal.brandName,
          "Platform": s.deal.platform,
          "Product Price (₹)": s.deal.productPrice,
          "Cashback (₹)": s.deal.cashbackAmount,
          "Status": s.status,
          "Form Type": s.formType,
          "Submitted At": s.createdAt.toISOString(),
        };

        // Add dynamic form fields as columns
        s.formData.forEach((fd) => {
          flat[fd.fieldLabel] = fd.fieldType === "FILE_UPLOAD" ? `[File: ${fd.value}]` : fd.value;
        });

        return flat;
      });

      return NextResponse.json({
        success: true,
        data: exportData,
        message: `${exportData.length} records exported`,
      });
    }

    // ─── FORM TEMPLATES LIST ───
    if (action === "forms") {
      const forms = await prisma.formTemplate.findMany({
        include: { fields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: forms });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("Admin GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Create form template or toggle user status ───
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    // ─── CREATE/UPDATE FORM TEMPLATE ───
    if (action === "form") {
      const { id, name, description, fields } = body;

      if (!name || !fields || !Array.isArray(fields)) {
        return NextResponse.json(
          { success: false, error: "Form name and fields required" },
          { status: 400 }
        );
      }

      if (id) {
        // UPDATE existing form
        await prisma.formField.deleteMany({ where: { formId: id } });

        const form = await prisma.formTemplate.update({
          where: { id },
          data: {
            name: name.trim(),
            description: description?.trim(),
            fields: {
              create: fields.map((f: any, index: number) => ({
                label: f.label,
                fieldType: f.fieldType,
                placeholder: f.placeholder || null,
                helpText: f.helpText || null,
                isRequired: f.isRequired ?? true,
                options: f.options ? JSON.stringify(f.options) : null,
                sortOrder: f.sortOrder ?? index,
              })),
            },
          },
          include: { fields: { orderBy: { sortOrder: "asc" } } },
        });

        return NextResponse.json({
          success: true,
          data: form,
          message: "Form updated successfully",
        });
      } else {
        // CREATE new form
        const form = await prisma.formTemplate.create({
          data: {
            name: name.trim(),
            description: description?.trim(),
            fields: {
              create: fields.map((f: any, index: number) => ({
                label: f.label,
                fieldType: f.fieldType,
                placeholder: f.placeholder || null,
                helpText: f.helpText || null,
                isRequired: f.isRequired ?? true,
                options: f.options ? JSON.stringify(f.options) : null,
                sortOrder: f.sortOrder ?? index,
              })),
            },
          },
          include: { fields: { orderBy: { sortOrder: "asc" } } },
        });

        return NextResponse.json(
          { success: true, data: form, message: "Form created" },
          { status: 201 }
        );
      }
    }

    // ─── TOGGLE USER ACTIVE/INACTIVE ───
    if (action === "toggle-user") {
      const { userId, isActive } = body;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "userId required" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });

      return NextResponse.json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
