/**
 * API Route: /api/users
 * Handles user management (GET all, POST new user)
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { ApiResponse, User } from '@/lib/types';

// GET - Fetch users with optional filters
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { users, leads } = await getCollections();
    const { searchParams } = new URL(request.url);
    
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    const query: any = {};
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (region && region !== 'all') query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await users.find(query).sort({ createdAt: -1 }).toArray();

    // Remove passwords and add stats for each user
    const usersWithStats = await Promise.all(
      result.map(async (user) => {
        const { password, ...userWithoutPassword } = user;
        const assignedLeads = await leads.countDocuments({ assignedTo: user.id });
        const convertedLeads = await leads.countDocuments({ assignedTo: user.id, status: 'converted' });
        
        return {
          ...userWithoutPassword,
          stats: {
            assignedLeads,
            convertedLeads,
            conversionRate: assignedLeads > 0 ? Math.round((convertedLeads / assignedLeads) * 100) : 0
          }
        };
      })
    );

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: usersWithStats,
    });
  } catch (error: any) {
    console.error('GET /api/users error:', error);
    return NextResponse.json<ApiResponse>({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { users } = await getCollections();
    
    const body = await request.json();
    const { name, email, password, role, region, territory, phone } = body;

    // Validation
    if (!name || !email || !password || !role || !region) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Name, email, password, role, and region are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique ID
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const userId = `user_${timestamp}_${randomNum}`;

    const avatarEmojis: Record<string, string> = {
      sales: '👨‍💼',
      manager: '👩‍💼',
      admin: '🔐',
      org_admin: '🏢'
    };

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      region,
      territory: territory || region,
      phone: phone || '',
      avatar: avatarEmojis[role] || '👤',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await users.insertOne(newUser as any);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: userWithoutPassword,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/users error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

