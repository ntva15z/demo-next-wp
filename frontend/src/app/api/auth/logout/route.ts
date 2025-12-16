import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the auth token cookie
    cookieStore.delete("auth_token");

    return NextResponse.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
