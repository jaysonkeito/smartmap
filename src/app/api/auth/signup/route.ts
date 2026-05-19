import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, password, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID number is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in AppUser
    const existingUser = await db.appUser.findUnique({
      where: { userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'You already have an account. Please sign in.' },
        { status: 400 }
      );
    }

    // Derive default password from last name if no password provided
    const nameWords = name.trim().split(/\s+/);
    const lastName = nameWords.length > 0 ? nameWords[nameWords.length - 1] : name;
    const effectivePassword = password && password.length > 0 ? password : lastName.toLowerCase();

    // Determine role (default to Student if not specified)
    const effectiveRole = role || 'Student';
    if (!['Faculty', 'Staff', 'Student', 'Admin'].includes(effectiveRole)) {
      return NextResponse.json(
        { error: 'Role must be Faculty, Staff, Student, or Admin' },
        { status: 400 }
      );
    }

    // Create the app user
    const hashedPassword = await hash(effectivePassword, 10);
    const user = await db.appUser.create({
      data: {
        userId,
        name,
        role: effectiveRole,
        password: hashedPassword,
        isAdmin: effectiveRole === 'Admin',
        isActive: true,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Account created successfully! You can now sign in.',
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
