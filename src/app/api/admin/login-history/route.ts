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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const userIdFilter = searchParams.get('userId') || undefined;

    const where = userIdFilter ? { userId: userIdFilter } : {};

    const [total, logins] = await Promise.all([
      db.roomLogin.count({ where }),
      db.roomLogin.findMany({
        where,
        include: {
          user: { select: { userId: true, name: true, role: true } },
          room: {
            select: { name: true, building: { select: { name: true } } },
          },
        },
        orderBy: { loginTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formatted = logins.map((l) => ({
      id: l.id,
      userId: l.user.userId,
      userName: l.user.name,
      userRole: l.user.role,
      roomId: l.roomId,
      roomName: l.room.name,
      buildingName: l.room.building.name,
      loginTime: l.loginTime.toISOString(),
      logoutTime: l.logoutTime?.toISOString() || null,
      isActive: l.logoutTime === null,
    }));

    return NextResponse.json({
      logins: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin login-history GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch login history' }, { status: 500 });
  }
}
