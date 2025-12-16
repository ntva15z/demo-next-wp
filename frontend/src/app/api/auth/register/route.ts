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

    // Call WordPress REST API to create user
    // Note: This requires the WordPress REST API to allow user registration
    // You may need to use a custom endpoint or WooCommerce customer endpoint
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use WooCommerce API keys for authentication
        Authorization: `Basic ${Buffer.from(
          `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        username: email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific WooCommerce errors
      if (data.code === "registration-error-email-exists") {
        return NextResponse.json(
          { message: "Email này đã được sử dụng" },
          { status: 400 }
        );
      }
      if (data.code === "registration-error-username-exists") {
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
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
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
