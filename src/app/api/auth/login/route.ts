import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'ID number and password are required' },
        { status: 400 }
      );
    }

    const user = await db.appUser.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Compare password: convert input to lowercase first
    const passwordMatch = await compare(password.toLowerCase(), user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check inactivity for Students: 3+ days since last activity
    if (user.role === 'Student') {
      const now = new Date();
      const lastActivity = user.lastActivityAt;
      const diffMs = now.getTime() - lastActivity.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= 3) {
        return NextResponse.json({
          needsActivation: true,
          user: {
            userId: user.userId,
            name: user.name,
            role: user.role,
            isAdmin: user.isAdmin,
          },
          message: 'Your account requires re-activation due to 3 days of inactivity.',
        });
      }
    }

    // On successful login, update lastActivityAt
    await db.appUser.update({
      where: { userId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
