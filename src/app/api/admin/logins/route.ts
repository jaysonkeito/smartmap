import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Active logins
    const activeLogins = await db.roomLogin.findMany({
      where: { logoutTime: null },
      include: {
        user: { select: { userId: true, name: true, role: true } },
        room: {
          select: { name: true, building: { select: { name: true } } },
        },
      },
      orderBy: { loginTime: 'desc' },
    });

    const formatted = activeLogins.map((l) => ({
      id: l.id,
      userId: l.user.userId,
      userName: l.user.name,
      userRole: l.user.role,
      roomId: l.roomId,
      roomName: l.room.name,
      buildingName: l.room.building.name,
      loginTime: l.loginTime.toISOString(),
    }));

    return NextResponse.json({ logins: formatted });
  } catch (error) {
    console.error('Admin logins GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch logins' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, userId } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const activeLogin = await db.roomLogin.findFirst({
      where: { userId, logoutTime: null },
    });

    if (!activeLogin) {
      return NextResponse.json({ error: 'No active login found for this user' }, { status: 404 });
    }

    await db.roomLogin.update({
      where: { id: activeLogin.id },
      data: { logoutTime: new Date() },
    });

    return NextResponse.json({ message: 'User forcefully logged out' });
  } catch (error) {
    console.error('Admin logins DELETE error:', error);
    return NextResponse.json({ error: 'Failed to force logout' }, { status: 500 });
  }
}
