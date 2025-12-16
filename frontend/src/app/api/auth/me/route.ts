import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://localhost:8800";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    // Validate token with WordPress
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid, clear cookie
      cookieStore.delete("auth_token");
      return NextResponse.json(
        { message: "Phiên đăng nhập hết hạn" },
        { status: 401 }
      );
    }

    const user = await response.json();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar_urls?.["96"] || null,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { message: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
