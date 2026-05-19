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
        { error: 'User not found. Please contact the administrator to register.' },
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

    // Compare password: try original first, then lowercase for default password compatibility
    // Default password is last name in lowercase; if user types it with uppercase, we still match
    let passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      passwordMatch = await compare(password.toLowerCase(), user.password);
    }

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
        email: user.email,
        college: user.college,
        program: user.program,
        yearLevel: user.yearLevel,
        department: user.department,
        position: user.position,
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
