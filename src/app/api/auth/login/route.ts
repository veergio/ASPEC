import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken, COOKIE_NAME, TOKEN_MAX_AGE } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface UserRow {
  user_id: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    // ── Validation ──────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // ── Lookup user ─────────────────────────────────────────────
    const users = await query<UserRow>(
      "SELECT user_id, name, email, password, role FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // ── Verify password ─────────────────────────────────────────

    // ── Verify password ─────────────────────────────────────────
    console.log("Password dari Input:", password);
    console.log("Password dari DB:", user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Apakah Cocok?:", passwordMatch); // Ini harusnya TRUE jika benar

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Create JWT ──────────────────────────────────────────────
    const token = await signToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    });



    // ── Set cookie and respond ──────────────────────────────────
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Pasang token ke dalam cookie HTTP-Only agar aman dari serangan XSS
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

