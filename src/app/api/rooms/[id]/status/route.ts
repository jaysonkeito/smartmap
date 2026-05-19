import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { building: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Get active logins (not logged out)
    const activeLogins = await db.roomLogin.findMany({
      where: {
        roomId,
        logoutTime: null,
      },
      orderBy: { loginTime: 'desc' },
    });

    const faculty = activeLogins
      .filter((l) => l.role === 'Faculty')
      .map((l) => ({
        userId: l.userId,
        name: '', // Will be filled from AppUser
        role: l.role,
        loginTime: l.loginTime.toISOString(),
      }));

    const staff = activeLogins
      .filter((l) => l.role === 'Staff')
      .map((l) => ({
        userId: l.userId,
        name: '',
        role: l.role,
        loginTime: l.loginTime.toISOString(),
      }));

    const students = activeLogins
      .filter((l) => l.role === 'Student')
      .map((l) => ({
        userId: l.userId,
        name: '',
        role: l.role,
        loginTime: l.loginTime.toISOString(),
      }));

    // Fill in names from AppUser
    const allLogins = [...faculty, ...staff, ...students];
    for (const login of allLogins) {
      const appUser = await db.appUser.findUnique({
        where: { userId: login.userId },
      });
      if (appUser) {
        login.name = appUser.name;
      }
    }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        buildingName: room.building.name,
      },
      faculty,
      staff,
      students,
    });
  } catch (error) {
    console.error('Room status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room status' },
      { status: 500 }
    );
  }
}
