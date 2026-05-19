import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// GET /api/profile?userId=xxx - Returns user profile data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.appUser.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        name: true,
        role: true,
        isAdmin: true,
        email: true,
        college: true,
        program: true,
        yearLevel: true,
        department: true,
        position: true,
        isActive: true,
        lastActivityAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Students can ONLY update email and password
export async function PUT(request: NextRequest) {
  try {
    const { userId, email, password } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.appUser.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Build update data - only email and password are allowed
    const updateData: Record<string, unknown> = {};

    if (email !== undefined) {
      updateData.email = email;
    }

    if (password !== undefined && password.length > 0) {
      updateData.password = await hash(password, 10);
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No updatable fields provided. Students can only update email and password.' },
        { status: 400 }
      );
    }

    const updatedUser = await db.appUser.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        role: updatedUser.role,
        email: updatedUser.email,
        college: updatedUser.college,
        program: updatedUser.program,
        yearLevel: updatedUser.yearLevel,
        department: updatedUser.department,
        position: updatedUser.position,
      },
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
