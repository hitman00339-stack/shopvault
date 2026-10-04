import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

// ─── GET: List deals (public for members, full for admin) ───
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Members only see visible + active deals
    if (!user || user.role !== "ADMIN") {
      where.isVisible = true;
      where.status = "ACTIVE";
    } else {
      // Admin can filter by status
      if (status) where.status = status;
    }

    if (platform) where.platform = platform;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { brandName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          form1: {
            include: { fields: { orderBy: { sortOrder: "asc" } } },
          },
          form2: {
            include: { fields: { orderBy: { sortOrder: "asc" } } },
          },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Deals GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// ─── POST: Create new deal (Admin only) ───
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const {
      title,
      description,
      brandName,
      platform,
      productUrl,
      imageUrl,
      productPrice,
      cashbackAmount,
      searchKeyword,
      sellerName,
      totalSlots,
      instructions,
      form1Id,
      form2Id,
    } = body;

    // Validation
    if (!title || !brandName || !platform || !productUrl || !productPrice) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title, brand, platform, product URL, and price are required",
        },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        brandName: brandName.trim(),
        platform,
        productUrl: productUrl.trim(),
        imageUrl,
        productPrice: parseFloat(productPrice),
        cashbackAmount: parseFloat(cashbackAmount || "0"),
        searchKeyword: searchKeyword?.trim(),
        sellerName: sellerName?.trim(),
        totalSlots: parseInt(totalSlots || "50"),
        instructions: instructions?.trim(),
        form1Id: form1Id || null,
        form2Id: form2Id || null,
      },
      include: {
        form1: { include: { fields: true } },
        form2: { include: { fields: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: deal, message: "Deal created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("Deal create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create deal" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update deal (Admin only) ───
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Deal ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Clean up data — only allow updating specific fields
    const allowedFields = [
      "title", "description", "brandName", "platform", "productUrl",
      "imageUrl", "productPrice", "cashbackAmount", "searchKeyword",
      "sellerName", "totalSlots", "instructions", "status", "isVisible",
      "form1Id", "form2Id",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Parse numbers
    if (updateData.productPrice) updateData.productPrice = parseFloat(updateData.productPrice);
    if (updateData.cashbackAmount) updateData.cashbackAmount = parseFloat(updateData.cashbackAmount);
    if (updateData.totalSlots) updateData.totalSlots = parseInt(updateData.totalSlots);

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        form1: { include: { fields: true } },
        form2: { include: { fields: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: deal,
      message: "Deal updated successfully",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("Deal update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete (hide) deal (Admin only) ───
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Deal ID required" },
        { status: 400 }
      );
    }

    // Soft delete — just hide it, preserve all history
    await prisma.deal.update({
      where: { id },
      data: { isVisible: false, status: "EXPIRED" },
    });

    return NextResponse.json({
      success: true,
      message: "Deal hidden successfully (history preserved)",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
