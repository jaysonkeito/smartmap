import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, roomId } = await request.json();

    if (!userId || !roomId) {
      return NextResponse.json(
        { error: 'User ID and Room ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.appUser.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if room exists
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { building: true },
    });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user already has an active login in another room
    const activeLogin = await db.roomLogin.findFirst({
      where: {
        userId,
        logoutTime: null,
      },
    });

    if (activeLogin) {
      // Log out from the previous room first
      await db.roomLogin.update({
        where: { id: activeLogin.id },
        data: { logoutTime: new Date() },
      });
    }

    // Create new room login
    const roomLogin = await db.roomLogin.create({
      data: {
        roomId,
        userId,
        role: user.role,
        loginTime: new Date(),
      },
    });

    return NextResponse.json({
      message: `Logged into ${room.name}`,
      roomLogin: {
        id: roomLogin.id,
        roomId: room.id,
        roomName: room.name,
        buildingName: room.building.name,
        loginTime: roomLogin.loginTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Room login error:', error);
    return NextResponse.json(
      { error: 'Failed to login to room' },
      { status: 500 }
    );
  }
}
