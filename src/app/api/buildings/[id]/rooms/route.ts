import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buildingId = parseInt(id, 10);

    if (isNaN(buildingId)) {
      return NextResponse.json(
        { error: "Invalid building ID" },
        { status: 400 }
      );
    }

    const building = await db.building.findUnique({
      where: { id: buildingId },
      include: { rooms: true },
    });

    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 }
      );
    }

    const rooms = building.rooms.map((room) => ({
      id: room.id,
      name: room.name,
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Get building rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
