import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://localhost:8800";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập email và mật khẩu" },
        { status: 400 }
      );
    }

    // Call WordPress JWT authentication endpoint
    const response = await fetch(`${WORDPRESS_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Set JWT token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Return user info (without token for security)
    return NextResponse.json({
      success: true,
      user: {
        email: data.user_email,
        displayName: data.user_display_name,
        nicename: data.user_nicename,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
