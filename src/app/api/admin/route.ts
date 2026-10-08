import { NextRequest, NextResponse } from "next/server";
import prisma, { withTimeout } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSellers, saveSeller, deleteSeller } from "@/lib/sellers";

// ─── Fast In-Memory Cache for Admin Stats (20s TTL) ───
let cachedAdminStats: { data: any; expiresAt: number } | null = null;

function invalidateAdminCache() {
  cachedAdminStats = null;
}

// ─── GET: Admin data (stats, users, export) ───
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // ─── DASHBOARD STATS ───
    if (action === "stats") {
      if (cachedAdminStats && Date.now() < cachedAdminStats.expiresAt) {
        return NextResponse.json({
          success: true,
          data: cachedAdminStats.data,
        });
      }

      const emptyStats = {
        totalUsers: 0,
        activeDeals: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        approvedSubmissions: 0,
        rejectedSubmissions: 0,
        totalReportedSpend: 0,
        totalCashbackDue: 0,
        recentSubmissions: [],
      };

      const fetchStatsPromise = async () => {
        const [
          totalUsers,
          activeDeals,
          subCounts,
          recentSubmissions,
          spendSubmissions,
        ] = await Promise.all([
          prisma.user.count({ where: { role: "MEMBER" } }),
          prisma.deal.count({ where: { status: "ACTIVE", isVisible: true } }),
          prisma.submission.groupBy({
            by: ["status"],
            _count: { _all: true },
          }),
          prisma.submission.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, email: true } },
              deal: { select: { title: true, platform: true, productPrice: true } },
            },
          }),
          prisma.submission.findMany({
            where: { formType: "FORM1" },
            take: 100,
            select: {
              status: true,
              deal: { select: { productPrice: true, cashbackAmount: true } },
            },
          }),
        ]);

        const pendingSubmissions = subCounts.find((s) => s.status === "PENDING")?._count._all || 0;
        const approvedSubmissions = subCounts.find((s) => s.status === "APPROVED")?._count._all || 0;
        const rejectedSubmissions = subCounts.find((s) => s.status === "REJECTED")?._count._all || 0;
        const totalSubmissions = subCounts.reduce((sum, s) => sum + s._count._all, 0);

        const totalReportedSpend = spendSubmissions.reduce(
          (sum, s) => sum + (s.deal?.productPrice || 0), 0
        );

        const approvedSubs = spendSubmissions.filter((s) => s.status === "APPROVED");
        const totalCashbackDue = approvedSubs.reduce(
          (sum, s) => sum + (s.deal?.productPrice || 0) + (s.deal?.cashbackAmount || 0), 0
        );

        return {
          totalUsers,
          activeDeals,
          totalSubmissions,
          pendingSubmissions,
          approvedSubmissions,
          rejectedSubmissions,
          totalReportedSpend,
          totalCashbackDue,
          recentSubmissions,
        };
      };

      const data = await withTimeout<any>(fetchStatsPromise(), emptyStats, 8000);

      cachedAdminStats = {
        data,
        expiresAt: Date.now() + 20 * 1000,
      };

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // ─── ALL USERS WITH STATS ───
    if (action === "users") {
      try {
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

        const fetchUsersPromise = async () => {
          const [users, total] = await Promise.all([
            prisma.user.findMany({
              where,
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                upiId: true,
                isActive: true,
                createdAt: true,
                submissions: {
                  where: { formType: "FORM1" },
                  select: {
                    status: true,
                    deal: { select: { productPrice: true, cashbackAmount: true } },
                  },
                },
                _count: { select: { submissions: true, supportTickets: true } },
              },
              orderBy: { createdAt: "desc" },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.user.count({ where }),
          ]);

          const usersWithStats = users.map((u: any) => {
            const subs = u.submissions || [];
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              upiId: u.upiId,
              isActive: u.isActive,
              createdAt: u.createdAt,
              totalOrders: subs.length,
              totalSpent: subs.reduce((s: number, sub: any) => s + (sub.deal?.productPrice || 0), 0),
              totalCashback: subs
                .filter((s: any) => s.status === "APPROVED")
                .reduce((s: number, sub: any) => s + (sub.deal?.productPrice || 0) + (sub.deal?.cashbackAmount || 0), 0),
              pendingCount: subs.filter((s: any) => s.status === "PENDING").length,
              _count: u._count,
            };
          });

          return { usersWithStats, total };
        };

        const result = await withTimeout<any>(fetchUsersPromise(), null, 8000);
        if (!result) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, totalPages: 1 },
          });
        }

        return NextResponse.json({
          success: true,
          data: result.usersWithStats,
          pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
        });
      } catch (err) {
        console.warn("DB error fetching users:", err);
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        });
      }
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

    // ─── SELLERS LIST ───
    if (action === "sellers") {
      const sellers = getSellers();
      return NextResponse.json({ success: true, data: sellers });
    }

    // ─── EXPORT DATA (With Seller-wise Filter & Seller Name in CSV) ───
    if (action === "export") {
      const type = searchParams.get("type") || "FULL";
      const sellerPlatform = searchParams.get("platform");
      const sellerName = searchParams.get("sellerName");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");

      const where: any = { formType: "FORM1" };

      if (sellerPlatform && sellerPlatform !== "ALL") {
        where.deal = { ...where.deal, platform: sellerPlatform };
      }

      if (sellerName && sellerName !== "ALL") {
        where.deal = {
          ...where.deal,
          sellerName: { equals: sellerName, mode: "insensitive" },
        };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59");
      }

      try {
        const submissions = await prisma.submission.findMany({
          where,
          include: {
            user: { select: { name: true, email: true, phone: true, upiId: true } },
            deal: {
              select: {
                title: true, brandName: true, platform: true, sellerName: true,
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
            "Seller Name": s.deal.sellerName || "N/A",
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
      } catch (dbError) {
        console.warn("DB export error:", dbError);
        return NextResponse.json({
          success: true,
          data: [],
          message: "0 records exported",
        });
      }
    }

    // ─── FORM TEMPLATES LIST ───
    if (action === "forms") {
      try {
        const forms = await prisma.formTemplate.findMany({
          include: { fields: { orderBy: { sortOrder: "asc" } } },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ success: true, data: forms });
      } catch (err) {
        console.warn("DB not connected, using fallback forms:", err);
        const sampleForms = [
          {
            id: "f1",
            name: "Standard Order Proof Blueprint",
            description: "Default Form 1 for capturing marketplace order IDs and invoices",
            fields: [
              { id: "f1_1", label: "Marketplace Order ID", fieldType: "SHORT_ANSWER", isRequired: true, sortOrder: 0 },
              { id: "f1_2", label: "Order Date", fieldType: "DATE", isRequired: true, sortOrder: 1 },
              { id: "f1_3", label: "Invoice / Order Confirmation Screenshot", fieldType: "FILE_UPLOAD", isRequired: true, sortOrder: 2 },
            ],
            createdAt: new Date().toISOString(),
          },
          {
            id: "f2",
            name: "5-Star Review Verification Blueprint",
            description: "Form 2 for verifying delivered product review and rating proof",
            fields: [
              { id: "f2_1", label: "Reviewer Profile Name", fieldType: "SHORT_ANSWER", isRequired: true, sortOrder: 0 },
              { id: "f2_2", label: "Live Review Link", fieldType: "URL", isRequired: false, sortOrder: 1 },
              { id: "f2_3", label: "Review Screenshot Proof", fieldType: "FILE_UPLOAD", isRequired: true, sortOrder: 2 },
            ],
            createdAt: new Date().toISOString(),
          },
        ];
        return NextResponse.json({ success: true, data: sampleForms });
      }
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

    // ─── ADD / UPDATE SELLER ───
    if (action === "seller" || action === "create-seller") {
      const { id, name, platform, contact, notes } = body;
      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Seller name is required" },
          { status: 400 }
        );
      }

      const seller = saveSeller({
        id,
        name: name.trim(),
        platform: platform || "AMAZON",
        contact: contact?.trim() || "",
        notes: notes?.trim() || "",
      });

      return NextResponse.json({
        success: true,
        data: seller,
        message: id ? "Seller updated successfully" : "Seller registered successfully",
      });
    }

    // ─── DELETE SELLER ───
    if (action === "delete-seller") {
      const id = body?.id || searchParams.get("id");
      if (!id) {
        return NextResponse.json(
          { success: false, error: "Seller ID is required" },
          { status: 400 }
        );
      }

      deleteSeller(id);
      return NextResponse.json({
        success: true,
        message: "Seller removed successfully",
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
