/**
 * API Route: /api/auth/login
 * Handles user authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { users } = await getCollections();
    
    const body = await request.json();
    const { email, password, orgCode, loginType } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Your account has been deactivated. Please contact admin.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // For organization login, verify orgCode and role
    if (loginType === 'organization') {
      if (user.role !== 'org_admin' && user.role !== 'admin') {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'You do not have organization admin access' },
          { status: 403 }
        );
      }
      
      if (user.orgCode && user.orgCode !== orgCode) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'Invalid organization code' },
          { status: 401 }
        );
      }
    }

    // Update last login
    await users.updateOne(
      { id: user.id },
      { $set: { lastLogin: new Date() } }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        user: userWithoutPassword,
        message: 'Login successful'
      }
    });

  } catch (error: any) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
