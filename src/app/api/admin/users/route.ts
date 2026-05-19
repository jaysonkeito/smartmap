import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

async function verifyAdmin(adminUserId: string | undefined) {
  if (!adminUserId) return false;
  const user = await db.appUser.findUnique({ where: { userId: adminUserId } });
  return user?.isAdmin === true;
}

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id') || undefined;
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await db.appUser.findMany({
      orderBy: { name: 'asc' },
      include: {
        logins: {
          where: { logoutTime: null },
          take: 1,
        },
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      userId: u.userId,
      name: u.name,
      role: u.role,
      isAdmin: u.isAdmin,
      currentRoom: u.logins.length > 0 ? 'In a room' : 'Not in a room',
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, userId, name, password, role } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!userId || !name || !password || !role) {
      return NextResponse.json(
        { error: 'User ID, name, password, and role are required' },
        { status: 400 }
      );
    }

    if (!['Faculty', 'Staff', 'Student', 'Admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be Faculty, Staff, Student, or Admin' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.appUser.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);
    const isAdmin = role === 'Admin';

    const user = await db.appUser.create({
      data: {
        userId,
        name,
        password: hashedPassword,
        role,
        isAdmin,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, userId, name, role, isAdmin: newIsAdmin } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await db.appUser.findUnique({ where: { userId } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await db.appUser.update({
      where: { userId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(newIsAdmin !== undefined && { isAdmin: newIsAdmin }),
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
