import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'ID number and password are required' },
        { status: 400 }
      );
    }

    if (userId.length < 1) {
      return NextResponse.json(
        { error: 'ID number is required' },
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

    // Check if the ID exists in faculty, staff, or student records
    let name = '';
    let role = '';

    const faculty = await db.faculty.findUnique({ where: { facultyId: userId } });
    if (faculty) {
      name = faculty.name;
      role = 'Faculty';
    }

    if (!name) {
      const staff = await db.staff.findUnique({ where: { staffId: userId } });
      if (staff) {
        name = staff.name;
        role = 'Staff';
      }
    }

    if (!name) {
      const student = await db.student.findUnique({ where: { studentId: userId } });
      if (student) {
        name = student.name;
        role = 'Student';
      }
    }

    if (!name) {
      return NextResponse.json(
        { error: 'ID number not found in university records. Please contact the registrar.' },
        { status: 404 }
      );
    }

    // Create the app user
    const hashedPassword = await hash(password, 10);
    const user = await db.appUser.create({
      data: {
        userId,
        name,
        role,
        password: hashedPassword,
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
