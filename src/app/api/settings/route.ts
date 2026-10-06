import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth";

// ─── GET: Publicly accessible to fetch Telegram support link and details ───
export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

// ─── POST: Admin-only to update Telegram Support ID and other settings ───
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { telegramSupportId, supportNotice } = body;

    if (telegramSupportId === undefined) {
      return NextResponse.json(
        { success: false, error: "telegramSupportId is required" },
        { status: 400 }
      );
    }

    const updated = saveSettings({
      telegramSupportId: String(telegramSupportId).trim(),
      supportNotice: supportNotice ? String(supportNotice).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Customer support settings updated successfully",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
