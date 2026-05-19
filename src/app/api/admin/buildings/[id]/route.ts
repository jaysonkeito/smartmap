import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function verifyAdmin(adminUserId: string | undefined) {
  if (!adminUserId) return false;
  const user = await db.appUser.findUnique({ where: { userId: adminUserId } });
  return user?.isAdmin === true;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { adminUserId } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await db.building.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Cascade delete will handle rooms and their logins
    await db.building.delete({ where: { id } });

    return NextResponse.json({ message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Admin building DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { adminUserId, name, description, coordinates, color } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await db.building.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    if (coordinates !== undefined) {
      try {
        JSON.parse(coordinates);
      } catch {
        return NextResponse.json({ error: 'Coordinates must be valid JSON' }, { status: 400 });
      }
    }

    const building = await db.building.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(coordinates !== undefined && { coordinates }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ building });
  } catch (error) {
    console.error('Admin building PUT error:', error);
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 });
  }
}
