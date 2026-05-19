import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/office-assignments - Get all assignments or by room
export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id');
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID required' }, { status: 401 });
    }

    const admin = await db.appUser.findUnique({ where: { userId: adminUserId } });
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const roomId = request.nextUrl.searchParams.get('roomId');

    if (roomId) {
      // Get assignments for a specific room
      const assignments = await db.officeAssignment.findMany({
        where: { roomId: parseInt(roomId) },
        include: {
          user: { select: { userId: true, name: true, role: true } },
          room: { select: { id: true, name: true, building: { select: { name: true } } } },
        },
        orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
      });

      // Group by role
      const result: Record<string, { userId: string; name: string; userRole: string; assignmentId: number }[]> = {
        'College Dean': [],
        'Assistant Dean': [],
        'Faculty': [],
        'Staff': [],
      };

      assignments.forEach((a) => {
        const role = a.role;
        if (!result[role]) result[role] = [];
        result[role].push({
          userId: a.user.userId,
          name: a.user.name,
          userRole: a.user.role,
          assignmentId: a.id,
        });
      });

      return NextResponse.json({ assignments: result, room: assignments[0]?.room || null });
    }

    // Get all office rooms (rooms with "Office" in the name) with their assignments
    const officeRooms = await db.room.findMany({
      where: {
        OR: [
          { name: { contains: 'Office' } },
          { name: { contains: 'OFFICE' } },
          { name: { contains: 'office' } },
        ],
      },
      include: {
        building: { select: { name: true } },
        assignments: {
          include: {
            user: { select: { userId: true, name: true, role: true } },
          },
          orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = officeRooms.map((room) => ({
      id: room.id,
      name: room.name,
      buildingName: room.building.name,
      assignments: room.assignments.map((a) => ({
        id: a.id,
        userId: a.user.userId,
        userName: a.user.name,
        userRole: a.user.role,
        officeRole: a.role,
      })),
    }));

    return NextResponse.json({ offices: result });
  } catch (error) {
    console.error('Error fetching office assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch office assignments' }, { status: 500 });
  }
}

// POST /api/admin/office-assignments - Assign a user to an office
export async function POST(request: NextRequest) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id');
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID required' }, { status: 401 });
    }

    const admin = await db.appUser.findUnique({ where: { userId: adminUserId } });
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { roomId, userId, role } = body;

    if (!roomId || !userId || !role) {
      return NextResponse.json({ error: 'Room ID, User ID, and role are required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.appUser.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if room exists
    const room = await db.room.findUnique({ where: { id: parseInt(roomId) } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // For College Dean and Assistant Dean, check if one already exists
    if (role === 'College Dean' || role === 'Assistant Dean') {
      const existing = await db.officeAssignment.findFirst({
        where: { roomId: parseInt(roomId), role },
      });
      if (existing) {
        // Remove existing dean/assistant dean assignment
        await db.officeAssignment.delete({ where: { id: existing.id } });
      }
    }

    // Check for duplicate
    const existingAssignment = await db.officeAssignment.findUnique({
      where: { roomId_userId_role: { roomId: parseInt(roomId), userId, role } },
    });

    if (existingAssignment) {
      return NextResponse.json({ error: 'User is already assigned to this office with this role' }, { status: 400 });
    }

    const assignment = await db.officeAssignment.create({
      data: {
        roomId: parseInt(roomId),
        userId,
        role,
      },
      include: {
        user: { select: { userId: true, name: true, role: true } },
        room: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      message: `${user.name} assigned as ${role} in ${room.name}`,
      assignment: {
        id: assignment.id,
        userId: assignment.user.userId,
        userName: assignment.user.name,
        roomId: assignment.room.id,
        roomName: assignment.room.name,
        role: assignment.role,
      },
    });
  } catch (error) {
    console.error('Error creating office assignment:', error);
    return NextResponse.json({ error: 'Failed to create office assignment' }, { status: 500 });
  }
}

// DELETE /api/admin/office-assignments - Remove an assignment
export async function DELETE(request: NextRequest) {
  try {
    const adminUserId = request.headers.get('x-admin-user-id');
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID required' }, { status: 401 });
    }

    const admin = await db.appUser.findUnique({ where: { userId: adminUserId } });
    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const assignment = await db.officeAssignment.findUnique({
      where: { id: parseInt(assignmentId) },
      include: {
        user: { select: { name: true } },
        room: { select: { name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.officeAssignment.delete({ where: { id: parseInt(assignmentId) } });

    return NextResponse.json({
      message: `Removed ${assignment.user.name} from ${assignment.room.name}`,
    });
  } catch (error) {
    console.error('Error deleting office assignment:', error);
    return NextResponse.json({ error: 'Failed to delete office assignment' }, { status: 500 });
  }
}
