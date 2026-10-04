import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  getCurrentUser,
} from "@/lib/auth";

// ─── GET: Get current logged-in user ───
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        upiId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: dbUser });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Login or Register ───
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    // ─── REGISTER ───
    if (action === "register") {
      const { name, email, phone, password } = body;

      // Validation
      if (!name || !email || !phone || !password) {
        return NextResponse.json(
          { success: false, error: "All fields are required" },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Check existing user
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: email.toLowerCase() }, { phone }],
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error:
              existing.email === email.toLowerCase()
                ? "Email already registered"
                : "Phone number already registered",
          },
          { status: 409 }
        );
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password: hashedPassword,
          role: "MEMBER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      // Create token & set cookie
      const token = await createToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      setAuthCookie(token);

      return NextResponse.json(
        {
          success: true,
          message: "Registration successful",
          data: { user, token },
        },
        { status: 201 }
      );
    }

    // ─── LOGIN ───
    if (action === "login") {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: "Email and password are required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: "Account has been deactivated" },
          { status: 403 }
        );
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      setAuthCookie(token);

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          token,
        },
      });
    }

    // ─── LOGOUT ───
    if (action === "logout") {
      const response = NextResponse.json({
        success: true,
        message: "Logged out",
      });
      response.cookies.delete("shopvault_token");
      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}