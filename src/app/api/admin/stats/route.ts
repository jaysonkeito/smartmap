import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin verification helper
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

    const [totalBuildings, totalRooms, totalUsers, usersByRole, activeLogins, recentActivity] =
      await Promise.all([
        db.building.count(),
        db.room.count(),
        db.appUser.count(),
        db.appUser.groupBy({ by: ['role'], _count: { role: true } }),
        db.roomLogin.count({ where: { logoutTime: null } }),
        db.roomLogin.findMany({
          take: 10,
          orderBy: { loginTime: 'desc' },
          include: {
            user: { select: { userId: true, name: true, role: true } },
            room: {
              select: { name: true, building: { select: { name: true } } },
            },
          },
        }),
      ]);

    const roleStats = usersByRole.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      },
      {} as Record<string, number>
    );

    const recentActivityFormatted = recentActivity.map((a) => ({
      id: a.id,
      userId: a.user.userId,
      userName: a.user.name,
      userRole: a.user.role,
      roomName: a.room.name,
      buildingName: a.room.building.name,
      loginTime: a.loginTime.toISOString(),
      logoutTime: a.logoutTime?.toISOString() || null,
      isActive: a.logoutTime === null,
    }));

    return NextResponse.json({
      stats: {
        totalBuildings,
        totalRooms,
        totalUsers,
        faculty: roleStats['Faculty'] || 0,
        staff: roleStats['Staff'] || 0,
        students: roleStats['Student'] || 0,
        admins: roleStats['Admin'] || 0,
        activeLogins,
      },
      recentActivity: recentActivityFormatted,
    });
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
