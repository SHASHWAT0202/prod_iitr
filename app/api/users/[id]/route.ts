/**
 * API Route: /api/users/[id]
 * Handles individual user operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollections, initializeDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';

// GET - Fetch single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const { users, leads } = await getCollections();
    const { id } = params;

    const user = await users.findOne({ id });
    
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get lead statistics for this user
    const assignedLeads = await leads.countDocuments({ assignedTo: id });
    const convertedLeads = await leads.countDocuments({ assignedTo: id, status: 'converted' });
    const inProgressLeads = await leads.countDocuments({ assignedTo: id, status: 'in_progress' });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        ...userWithoutPassword,
        stats: {
          assignedLeads,
          convertedLeads,
          inProgressLeads,
          conversionRate: assignedLeads > 0 ? Math.round((convertedLeads / assignedLeads) * 100) : 0
        }
      }
    });

  } catch (error: any) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const { users } = await getCollections();
    const { id } = params;
    
    const body = await request.json();
    const { name, email, password, role, region, territory, phone, status, avatar } = body;

    // Find user - support finding by id or by email for 'current' user
    let existingUser;
    if (id === 'current' && body.email) {
      existingUser = await users.findOne({ email: body.email.toLowerCase() });
    } else {
      existingUser = await users.findOne({ id });
    }
    
    if (!existingUser) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for email uniqueness if email is being changed
    if (email && email !== existingUser.email) {
      const emailExists = await users.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (region) updateData.region = region;
    if (territory) updateData.territory = territory;
    if (phone) updateData.phone = phone;
    if (status) updateData.status = status;
    if (avatar) updateData.avatar = avatar;
    
    // Handle password change with verification
    if (body.newPassword) {
      // Verify current password first
      if (!body.currentPassword) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'Current password is required' },
          { status: 400 }
        );
      }
      
      const isValidPassword = await bcrypt.compare(body.currentPassword, existingUser.password);
      if (!isValidPassword) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    } else if (password) {
      // Direct password update (for admin)
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Build query based on how we found the user
    const updateQuery = id === 'current' && body.email 
      ? { email: body.email.toLowerCase() }
      : { id };

    const result = await users.updateOne(
      updateQuery,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user
    const updatedUser = await users.findOne(updateQuery);
    if (!updatedUser) {
      return NextResponse.json<ApiResponse>({
        ok: true,
        message: 'Settings updated successfully'
      });
    }
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: userWithoutPassword,
      message: 'User updated successfully'
    });

  } catch (error: any) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const { users, leads } = await getCollections();
    const { id } = params;

    // Check if user exists
    const existingUser = await users.findOne({ id });
    if (!existingUser) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting org_admin users
    if (existingUser.role === 'org_admin') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Cannot delete organization admin' },
        { status: 403 }
      );
    }

    // Unassign leads from this user
    await leads.updateMany(
      { assignedTo: id },
      { $unset: { assignedTo: '' }, $set: { updatedAt: new Date() } }
    );

    // Delete the user
    const result = await users.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      ok: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
