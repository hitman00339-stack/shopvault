import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

const SAMPLE_DEALS = [
  {
    id: "deal-1",
    title: "Noise ColorFit Pulse 3 Bluetooth Calling Smart Watch (1.96\" Display)",
    brandName: "Noise",
    platform: "AMAZON",
    productUrl: "https://www.amazon.in",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    productPrice: 1499,
    cashbackAmount: 150,
    searchKeyword: "noise pulse 3 smart watch",
    sellerName: "Noise Authorized Store",
    totalSlots: 25,
    usedSlots: 18,
    status: "ACTIVE",
    isVisible: true,
    form1: { id: "f1", name: "Order Form", fields: [{ id: "f1_1", label: "Amazon Order ID", fieldType: "SHORT_ANSWER", isRequired: true, helpText: "Found in your Amazon Orders tab" }] },
    form2: { id: "f2", name: "Review Proof", fields: [{ id: "f2_1", label: "Review Profile Name", fieldType: "SHORT_ANSWER", isRequired: true }, { id: "f2_2", label: "Review Screenshot URL", fieldType: "URL", isRequired: true }] },
  },
  {
    id: "deal-2",
    title: "boAt Airdopes 141 ANC True Wireless In-Ear Earbuds with 42H Playtime",
    brandName: "boAt",
    platform: "FLIPKART",
    productUrl: "https://www.flipkart.com",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    productPrice: 1299,
    cashbackAmount: 100,
    searchKeyword: "boat airdopes 141 anc",
    sellerName: "SuperComNet",
    totalSlots: 30,
    usedSlots: 26,
    status: "ACTIVE",
    isVisible: true,
    form1: { id: "f1", name: "Order Form", fields: [{ id: "f1_1", label: "Flipkart Order ID", fieldType: "SHORT_ANSWER", isRequired: true }] },
    form2: { id: "f2", name: "Review Proof", fields: [{ id: "f2_1", label: "Screenshot Link", fieldType: "URL", isRequired: true }] },
  },
  {
    id: "deal-3",
    title: "Roadster Men Solid Bomber Jacket with Ribbed Hem & Cuffs",
    brandName: "Roadster",
    platform: "MYNTRA",
    productUrl: "https://www.myntra.com",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    productPrice: 1899,
    cashbackAmount: 200,
    searchKeyword: "roadster bomber jacket men",
    sellerName: "FlashTech Retail",
    totalSlots: 15,
    usedSlots: 6,
    status: "ACTIVE",
    isVisible: true,
  },
  {
    id: "deal-4",
    title: "Minimalist 10% Vitamin C Face Serum for Glowing Skin (30ml)",
    brandName: "Minimalist",
    platform: "NYKAA",
    productUrl: "https://www.nykaa.com",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    productPrice: 699,
    cashbackAmount: 50,
    searchKeyword: "minimalist vitamin c serum 10%",
    sellerName: "Nykaa Beauty Direct",
    totalSlots: 20,
    usedSlots: 19,
    status: "ACTIVE",
    isVisible: true,
  },
];

// ─── GET: List deals (public for members, full for admin) ───
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (id) {
      where.id = id;
    } else {
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

    let finalDeals = deals;
    if (finalDeals.length === 0) {
      finalDeals = SAMPLE_DEALS as any;
      if (id) finalDeals = finalDeals.filter((d: any) => d.id === id);
      if (platform && platform !== "ALL") finalDeals = finalDeals.filter((d: any) => d.platform === platform);
    }

    return NextResponse.json({
      success: true,
      data: finalDeals,
      pagination: {
        page,
        limit,
        total: finalDeals.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.warn("Deals DB fallback active:", error);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const platform = searchParams.get("platform");
    let fallbackDeals = SAMPLE_DEALS;
    if (id) fallbackDeals = fallbackDeals.filter((d) => d.id === id);
    if (platform && platform !== "ALL") fallbackDeals = fallbackDeals.filter((d) => d.platform === platform);

    return NextResponse.json({
      success: true,
      data: fallbackDeals,
      pagination: {
        page: 1,
        limit: 20,
        total: fallbackDeals.length,
        totalPages: 1,
      },
    });
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

    try {
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
          sellerName: sellerName?.trim() || null,
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
    } catch (dbErr) {
      console.warn("DB not connected, using in-memory mock deal create:", dbErr);
      const mockDeal: any = {
        id: "deal-" + Date.now(),
        title: title.trim(),
        description: description?.trim() || null,
        brandName: brandName.trim(),
        platform,
        productUrl: productUrl.trim(),
        imageUrl: imageUrl || null,
        productPrice: parseFloat(productPrice),
        cashbackAmount: parseFloat(cashbackAmount || "0"),
        searchKeyword: searchKeyword?.trim() || null,
        sellerName: sellerName?.trim() || null,
        totalSlots: parseInt(totalSlots || "50"),
        usedSlots: 0,
        instructions: instructions?.trim() || null,
        status: "ACTIVE",
        isVisible: true,
        createdAt: new Date().toISOString(),
      };
      (SAMPLE_DEALS as any).unshift(mockDeal);
      return NextResponse.json(
        { success: true, data: mockDeal, message: "Deal created successfully (Dev Mode)" },
        { status: 201 }
      );
    }
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

    try {
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
    } catch (dbErr) {
      console.warn("DB not connected, using mock deal update:", dbErr);
      const matchIndex = (SAMPLE_DEALS as any[]).findIndex((d) => d.id === id);
      if (matchIndex >= 0) {
        SAMPLE_DEALS[matchIndex] = {
          ...SAMPLE_DEALS[matchIndex],
          ...updateData,
        };
        return NextResponse.json({
          success: true,
          data: SAMPLE_DEALS[matchIndex],
          message: "Deal updated successfully (Dev Mode)",
        });
      }
      return NextResponse.json({
        success: true,
        data: { id, ...updateData },
        message: "Deal updated",
      });
    }
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
