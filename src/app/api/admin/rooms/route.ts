import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function verifyAdmin(adminUserId: string | undefined) {
  if (!adminUserId) return false;
  const user = await db.appUser.findUnique({ where: { userId: adminUserId } });
  return user?.isAdmin === true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, name, buildingId } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!name || !buildingId) {
      return NextResponse.json(
        { error: 'Room name and building ID are required' },
        { status: 400 }
      );
    }

    const building = await db.building.findUnique({ where: { id: buildingId } });
    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    const room = await db.room.create({
      data: { name, buildingId },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Admin rooms POST error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, id, name } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Room ID and name are required' },
        { status: 400 }
      );
    }

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = await db.room.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Admin rooms PUT error:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
