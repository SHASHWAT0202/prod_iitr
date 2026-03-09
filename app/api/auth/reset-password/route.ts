/**
 * API Route: /api/auth/reset-password
 * Validates reset token and updates the user's password
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollections, initializeDatabase, connectToDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { users } = await getCollections();
    const { db } = await connectToDatabase();
    const resetTokens = db.collection('reset_tokens');

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find the token
    const resetRecord = await resetTokens.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    const result = await users.updateOne(
      { id: resetRecord.userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark token as used
    await resetTokens.updateOne(
      { token },
      { $set: { used: true, usedAt: new Date() } }
    );

    // Clean up all tokens for this user
    await resetTokens.deleteMany({
      userId: resetRecord.userId,
      token: { $ne: token },
    });

    console.log(`✅ Password reset successful for user ${resetRecord.userId}`);

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { message: 'Password has been reset successfully' },
    });
  } catch (error: any) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
