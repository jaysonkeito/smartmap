import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find active login
    const activeLogin = await db.roomLogin.findFirst({
      where: {
        userId,
        logoutTime: null,
      },
    });

    if (!activeLogin) {
      return NextResponse.json(
        { error: 'No active room login found' },
        { status: 404 }
      );
    }

    // Log out
    await db.roomLogin.update({
      where: { id: activeLogin.id },
      data: { logoutTime: new Date() },
    });

    return NextResponse.json({
      message: 'Logged out from room successfully',
    });
  } catch (error) {
    console.error('Room logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout from room' },
      { status: 500 }
    );
  }
}
