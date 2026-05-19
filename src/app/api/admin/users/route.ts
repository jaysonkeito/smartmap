import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

async function verifyAdmin(adminUserId: string | undefined) {
  if (!adminUserId) return false;
  const user = await db.appUser.findUnique({ where: { userId: adminUserId } });
  return user?.isAdmin === true && user?.isActive === true;
}

// Helper: derive default password from last name
function deriveDefaultPassword(name: string): string {
  const nameWords = name.trim().split(/\s+/);
  const lastName = nameWords.length > 0 ? nameWords[nameWords.length - 1] : name;
  return lastName.toLowerCase();
}

// GET /api/admin/users - List all users with enhanced fields
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
      email: u.email,
      college: u.college,
      program: u.program,
      yearLevel: u.yearLevel,
      department: u.department,
      position: u.position,
      isActive: u.isActive,
      lastActivityAt: u.lastActivityAt,
      currentRoom: u.logins.length > 0 ? 'In a room' : 'Not in a room',
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create user with enhanced fields + role-specific records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      adminUserId,
      userId,
      name,
      password,
      role,
      email,
      college,
      program,
      yearLevel,
      department,
      position,
    } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!userId || !name || !role) {
      return NextResponse.json(
        { error: 'User ID, name, and role are required' },
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

    // Derive default password from last name if not provided
    const effectivePassword = password && password.length > 0
      ? password
      : deriveDefaultPassword(name);

    const hashedPassword = await hash(effectivePassword, 10);
    const isAdmin = role === 'Admin';

    // Create the AppUser with all fields
    const user = await db.appUser.create({
      data: {
        userId,
        name,
        password: hashedPassword,
        role,
        isAdmin,
        email: email || null,
        college: college || null,
        program: program || null,
        yearLevel: yearLevel || null,
        department: department || null,
        position: position || null,
        isActive: true,
        lastActivityAt: new Date(),
      },
    });

    // Also create a corresponding record in the role-specific table
    if (role === 'Student') {
      await db.student.upsert({
        where: { studentId: userId },
        update: {
          name,
          email: email || null,
          college: college || null,
          program: program || null,
          yearLevel: yearLevel || null,
        },
        create: {
          studentId: userId,
          name,
          email: email || null,
          college: college || null,
          program: program || null,
          yearLevel: yearLevel || null,
        },
      });
    } else if (role === 'Faculty') {
      await db.faculty.upsert({
        where: { facultyId: userId },
        update: {
          name,
          email: email || null,
          college: college || null,
        },
        create: {
          facultyId: userId,
          name,
          email: email || null,
          college: college || null,
        },
      });
    } else if (role === 'Staff') {
      await db.staff.upsert({
        where: { staffId: userId },
        update: {
          name,
          email: email || null,
          department: department || null,
          position: position || null,
        },
        create: {
          staffId: userId,
          name,
          email: email || null,
          department: department || null,
          position: position || null,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
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
        isActive: user.isActive,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      adminUserId,
      userId,
      name,
      role,
      isAdmin: newIsAdmin,
      email,
      college,
      program,
      yearLevel,
      department,
      position,
      isActive: newIsActive,
    } = body;

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
        ...(email !== undefined && { email }),
        ...(college !== undefined && { college }),
        ...(program !== undefined && { program }),
        ...(yearLevel !== undefined && { yearLevel }),
        ...(department !== undefined && { department }),
        ...(position !== undefined && { position }),
        ...(newIsActive !== undefined && { isActive: newIsActive }),
      },
    });

    // Sync updates to role-specific table
    if (user.role === 'Student') {
      await db.student.updateMany({
        where: { studentId: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(college !== undefined && { college }),
          ...(program !== undefined && { program }),
          ...(yearLevel !== undefined && { yearLevel }),
        },
      });
    } else if (user.role === 'Faculty') {
      await db.faculty.updateMany({
        where: { facultyId: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(college !== undefined && { college }),
        },
      });
    } else if (user.role === 'Staff') {
      await db.staff.updateMany({
        where: { staffId: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(department !== undefined && { department }),
          ...(position !== undefined && { position }),
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
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
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Deactivate a user (set isActive=false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = request.headers.get('x-admin-user-id') || undefined;
    const userId = searchParams.get('userId');

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
      data: { isActive: false },
    });

    return NextResponse.json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
