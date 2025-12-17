import { NextRequest, NextResponse } from "next/server";

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://localhost:8800";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Email không hợp lệ" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Mật khẩu phải có ít nhất 8 ký tự" },
        { status: 400 }
      );
    }

    // Call custom headless-auth endpoint for registration
    const response = await fetch(`${WORDPRESS_URL}/wp-json/headless-auth/v1/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors
      if (data.code === "email_exists") {
        return NextResponse.json(
          { message: "Email này đã được sử dụng" },
          { status: 400 }
        );
      }
      if (data.code === "username_exists") {
        return NextResponse.json(
          { message: "Tên đăng nhập đã tồn tại" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: data.message || "Đăng ký thất bại" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đăng ký thành công! Vui lòng đăng nhập.",
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
