/**
 * API Route: /api/auth/forgot-password
 * Generates a password reset token, stores it, and sends a reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';
import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function generateResetEmail(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">🔑 Password Reset</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">LeadSense AI - HPCL Direct Sales</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#334155;font-size:16px;margin:0 0 16px;">Hi ${userName},</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
            We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>1 hour</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:16px;">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 16px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color:#2563eb;font-size:12px;word-break:break-all;background:#f1f5f9;padding:12px;border-radius:8px;margin:0 0 24px;">
            ${resetUrl}
          </p>
          <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
            <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
              ⚠️ If you didn't request this, you can safely ignore this email. Your password won't be changed.
            </p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0f172a;padding:24px;text-align:center;">
          <p style="color:#f97316;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:0 0 4px;">HPCL Direct Sales</p>
          <p style="color:#64748b;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Hindustan Petroleum Corporation Limited</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { users } = await getCollections();
    const { db } = await (await import('@/lib/mongodb')).connectToDatabase();
    const resetTokens = db.collection('reset_tokens');

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json<ApiResponse>({
      ok: true,
      data: { message: 'If an account with that email exists, a reset link has been sent.' }
    });

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return successResponse;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Remove any existing tokens for this user
    await resetTokens.deleteMany({ userId: user.id });

    // Store the token
    await resetTokens.insertOne({
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Send email
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const html = generateResetEmail(resetUrl, user.name || 'User');

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await transporter.sendMail({
          from: process.env.NOTIFICATION_EMAIL_FROM || process.env.EMAIL_USER,
          to: user.email,
          subject: 'Reset Your Password - LeadSense AI',
          html,
        });
        console.log(`📧 Password reset email sent to ${user.email}`);
      } else {
        console.log(`📧 [MOCK] Password reset email for ${user.email} | Token: ${token}`);
        console.log(`📧 [MOCK] Reset URL: ${resetUrl}`);
      }
    } catch (emailErr: any) {
      console.error('❌ Failed to send reset email:', emailErr.message);
    }

    return successResponse;
  } catch (error: any) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
