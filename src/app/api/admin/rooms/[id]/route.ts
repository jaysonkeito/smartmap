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

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await db.room.delete({ where: { id } });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Admin room DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
