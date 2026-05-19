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

    const user = await db.appUser.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await db.appUser.update({
      where: { userId },
      data: {
        isActive: true,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Account activated successfully',
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during activation' },
      { status: 500 }
    );
  }
}
