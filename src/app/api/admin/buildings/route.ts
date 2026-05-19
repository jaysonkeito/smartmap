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

    const buildings = await db.building.findMany({
      include: {
        rooms: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { rooms: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get active login counts per building
    const buildingsWithLogins = await Promise.all(
      buildings.map(async (b) => {
        const activeLogins = await db.roomLogin.count({
          where: {
            room: { buildingId: b.id },
            logoutTime: null,
          },
        });
        return {
          id: b.id,
          name: b.name,
          description: b.description,
          coordinates: b.coordinates,
          color: b.color,
          roomCount: b._count.rooms,
          activeLogins,
          rooms: b.rooms,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      })
    );

    return NextResponse.json({ buildings: buildingsWithLogins });
  } catch (error) {
    console.error('Admin buildings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, name, description, coordinates, color } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Building name is required' }, { status: 400 });
    }

    // Validate coordinates is valid JSON
    if (coordinates) {
      try {
        JSON.parse(coordinates);
      } catch {
        return NextResponse.json({ error: 'Coordinates must be valid JSON' }, { status: 400 });
      }
    }

    const building = await db.building.create({
      data: {
        name,
        description: description || null,
        coordinates: coordinates || '[]',
        color: color || null,
      },
    });

    return NextResponse.json({ building }, { status: 201 });
  } catch (error) {
    console.error('Admin buildings POST error:', error);
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, id, name, description, coordinates, color } = body;

    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
    }

    const existing = await db.building.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Validate coordinates if provided
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
    console.error('Admin buildings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 });
  }
}
