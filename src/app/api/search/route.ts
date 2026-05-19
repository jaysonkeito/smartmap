import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ rooms: [], users: [] });
    }

    const searchTerm = query.trim();

    // Search rooms
    const rooms = await db.room.findMany({
      where: {
        name: {
          contains: searchTerm,
        },
      },
      include: {
        building: {
          select: { name: true },
        },
      },
      take: 10,
    });

    // Search users (AppUser)
    const users = await db.appUser.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { userId: { contains: searchTerm } },
        ],
      },
      take: 10,
    });

    // For each user, find their current room
    const usersWithRoom = await Promise.all(
      users.map(async (user) => {
        const activeLogin = await db.roomLogin.findFirst({
          where: {
            userId: user.userId,
            logoutTime: null,
          },
          include: {
            room: {
              include: { building: { select: { name: true } } },
            },
          },
          orderBy: { loginTime: 'desc' },
        });

        return {
          userId: user.userId,
          name: user.name,
          role: user.role,
          currentRoom: activeLogin
            ? `${activeLogin.room.name} (${activeLogin.room.building.name})`
            : null,
        };
      })
    );

    return NextResponse.json({
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        buildingName: r.building.name,
      })),
      users: usersWithRoom,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
