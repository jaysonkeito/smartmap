import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// Campus Building Data: GPS coordinates (centroid of polygons)
// ============================================================
interface BuildingNode {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

const BUILDINGS: BuildingNode[] = [
  { id: 1, name: 'ACADEMIC BUILDING', lat: 9.35411, lng: 122.83787 },
  { id: 2, name: 'ADMINISTRATION OFFICE', lat: 9.35285, lng: 122.83848 },
  { id: 3, name: 'AVR ROOM', lat: 9.35367, lng: 122.83662 },
  { id: 4, name: 'CAF BUILDING', lat: 9.35300, lng: 122.83792 },
  { id: 5, name: 'CAS BUILDING-01', lat: 9.35308, lng: 122.83903 },
  { id: 6, name: 'CAS BUILDING-02', lat: 9.35316, lng: 122.83981 },
  { id: 7, name: 'CAS BUILDING-03', lat: 9.35308, lng: 122.83806 },
  { id: 8, name: 'CBA BUILDING', lat: 9.35390, lng: 122.83604 },
  { id: 9, name: 'CBA ROOM', lat: 9.35319, lng: 122.83787 },
  { id: 10, name: 'CCJE BUILDING', lat: 9.35372, lng: 122.83881 },
  { id: 11, name: 'CCJE OFFICE', lat: 9.35371, lng: 122.83804 },
  { id: 12, name: 'CIT BUILDING-01', lat: 9.35309, lng: 122.83930 },
  { id: 13, name: 'CIT BUILDING-02', lat: 9.35295, lng: 122.83952 },
  { id: 14, name: 'CTED BUILDING', lat: 9.35337, lng: 122.83758 },
  { id: 15, name: 'DAST OFFICE', lat: 9.35265, lng: 122.83880 },
  { id: 16, name: 'ECP OFFICE', lat: 9.35293, lng: 122.83658 },
  { id: 17, name: 'GYM', lat: 9.35353, lng: 122.83719 },
  { id: 18, name: 'LIBRARY BUILDING', lat: 9.35379, lng: 122.83634 },
  { id: 19, name: 'REGISTRAR BUILDING', lat: 9.35248, lng: 122.83781 },
  { id: 20, name: 'SAS OFFICE', lat: 9.35338, lng: 122.83813 },
  { id: 21, name: 'SECURITY OFFICE', lat: 9.35237, lng: 122.83847 },
  { id: 22, name: 'SUPPLY OFFICE', lat: 9.35345, lng: 122.83865 },
];

// Adjacency list: building id -> array of connected building ids
const ADJACENCY: Record<number, number[]> = {
  1: [8, 14, 9, 11],        // ACADEMIC BUILDING <-> CBA BUILDING, CTED BUILDING, CBA ROOM, CCJE OFFICE
  2: [4, 15, 7],             // ADMINISTRATION OFFICE <-> CAF BUILDING, DAST OFFICE, CAS BUILDING-03
  3: [17, 14],               // AVR ROOM <-> GYM, CTED BUILDING
  4: [7, 2, 9],              // CAF BUILDING <-> CAS BUILDING-03, ADMINISTRATION OFFICE, CBA ROOM
  5: [6, 12, 15],            // CAS BUILDING-01 <-> CAS BUILDING-02, CIT BUILDING-01, DAST OFFICE
  6: [13, 5],                // CAS BUILDING-02 <-> CIT BUILDING-02, CAS BUILDING-01
  7: [4, 2, 9],              // CAS BUILDING-03 <-> CAF BUILDING, ADMINISTRATION OFFICE, CBA ROOM
  8: [1, 18],                // CBA BUILDING <-> ACADEMIC BUILDING, LIBRARY BUILDING
  9: [1, 4, 7, 11],         // CBA ROOM <-> ACADEMIC BUILDING, CAF BUILDING, CAS BUILDING-03, CCJE OFFICE
  10: [22, 20, 11],          // CCJE BUILDING <-> SUPPLY OFFICE, SAS OFFICE, CCJE OFFICE
  11: [1, 9, 20, 10],       // CCJE OFFICE <-> ACADEMIC BUILDING, CBA ROOM, SAS OFFICE, CCJE BUILDING
  12: [5, 13],               // CIT BUILDING-01 <-> CAS BUILDING-01, CIT BUILDING-02
  13: [6, 12],               // CIT BUILDING-02 <-> CAS BUILDING-02, CIT BUILDING-01
  14: [1, 3, 17],            // CTED BUILDING <-> ACADEMIC BUILDING, AVR ROOM, GYM
  15: [5, 2],                // DAST OFFICE <-> CAS BUILDING-01, ADMINISTRATION OFFICE
  16: [17, 19],              // ECP OFFICE <-> GYM, REGISTRAR BUILDING
  17: [14, 3, 16, 18],      // GYM <-> CTED BUILDING, AVR ROOM, ECP OFFICE, LIBRARY BUILDING
  18: [8, 17],               // LIBRARY BUILDING <-> CBA BUILDING, GYM
  19: [16, 21],              // REGISTRAR BUILDING <-> ECP OFFICE, SECURITY OFFICE
  20: [10, 11, 22],          // SAS OFFICE <-> CCJE BUILDING, CCJE OFFICE, SUPPLY OFFICE
  21: [19],                  // SECURITY OFFICE <-> REGISTRAR BUILDING
  22: [10, 20],              // SUPPLY OFFICE <-> CCJE BUILDING, SAS OFFICE
};

// ============================================================
// Haversine formula: distance between two lat/lng points in meters
// ============================================================
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================
// Dijkstra's shortest path algorithm
// ============================================================
interface DijkstraResult {
  distance: number;
  path: number[];
}

function dijkstra(startId: number, endId: number): DijkstraResult | null {
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const visited = new Set<number>();

  // Initialize distances
  for (const b of BUILDINGS) {
    dist[b.id] = Infinity;
    prev[b.id] = null;
  }
  dist[startId] = 0;

  const buildingMap = new Map(BUILDINGS.map((b) => [b.id, b]));

  while (true) {
    // Find unvisited node with smallest distance
    let minDist = Infinity;
    let u: number | null = null;
    for (const b of BUILDINGS) {
      if (!visited.has(b.id) && dist[b.id] < minDist) {
        minDist = dist[b.id];
        u = b.id;
      }
    }

    if (u === null || u === endId) break;
    visited.add(u);

    const neighbors = ADJACENCY[u] || [];
    const uNode = buildingMap.get(u)!;

    for (const v of neighbors) {
      if (visited.has(v)) continue;
      const vNode = buildingMap.get(v);
      if (!vNode) continue;

      const edgeDist = haversine(uNode.lat, uNode.lng, vNode.lat, vNode.lng);
      const alt = dist[u] + edgeDist;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  // Reconstruct path
  const path: number[] = [];
  let current: number | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = prev[current];
  }

  return { distance: dist[endId], path };
}

// ============================================================
// Resolve building ID from query param (building name, id, or room)
// ============================================================
async function resolveBuildingId(
  fromParam: string | null,
  fromRoomParam: string | null
): Promise<number | null> {
  // Direct building ID or name
  if (fromParam) {
    // Try numeric ID
    const numId = parseInt(fromParam, 10);
    if (!isNaN(numId)) {
      const found = BUILDINGS.find((b) => b.id === numId);
      if (found) return found.id;
    }
    // Try building name (case-insensitive)
    const byName = BUILDINGS.find(
      (b) => b.name.toLowerCase() === fromParam.toLowerCase()
    );
    if (byName) return byName.id;
    // Partial match
    const byPartial = BUILDINGS.find(
      (b) => b.name.toLowerCase().includes(fromParam.toLowerCase())
    );
    if (byPartial) return byPartial.id;
  }

  // Resolve from room ID
  if (fromRoomParam) {
    const roomId = parseInt(fromRoomParam, 10);
    if (!isNaN(roomId)) {
      const room = await db.room.findUnique({ where: { id: roomId } });
      if (room) return room.buildingId;
    }
  }

  return null;
}

// ============================================================
// GET /api/route?from=BUILDING_ID&to=BUILDING_ID
//      /api/route?fromRoom=ROOM_ID&toRoom=ROOM_ID
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const fromRoomParam = searchParams.get('fromRoom');
    const toRoomParam = searchParams.get('toRoom');

    if (!fromParam && !fromRoomParam) {
      return NextResponse.json(
        { error: 'Provide "from" (building ID/name) or "fromRoom" (room ID) parameter' },
        { status: 400 }
      );
    }

    if (!toParam && !toRoomParam) {
      return NextResponse.json(
        { error: 'Provide "to" (building ID/name) or "toRoom" (room ID) parameter' },
        { status: 400 }
      );
    }

    const fromBuildingId = await resolveBuildingId(fromParam, fromRoomParam);
    const toBuildingId = await resolveBuildingId(toParam, toRoomParam);

    if (!fromBuildingId) {
      return NextResponse.json(
        { error: 'Could not resolve "from" building. Provide a valid building ID, name, or room ID.' },
        { status: 404 }
      );
    }

    if (!toBuildingId) {
      return NextResponse.json(
        { error: 'Could not resolve "to" building. Provide a valid building ID, name, or room ID.' },
        { status: 404 }
      );
    }

    if (fromBuildingId === toBuildingId) {
      const building = BUILDINGS.find((b) => b.id === fromBuildingId)!;
      return NextResponse.json({
        route: {
          from: { id: building.id, name: building.name, lat: building.lat, lng: building.lng },
          to: { id: building.id, name: building.name, lat: building.lat, lng: building.lng },
          waypoints: [
            { lat: building.lat, lng: building.lng, name: building.name },
          ],
          distanceMeters: 0,
          estimatedMinutes: 0,
          stepCount: 0,
        },
      });
    }

    const result = dijkstra(fromBuildingId, toBuildingId);

    if (!result) {
      return NextResponse.json(
        { error: 'No route found between the specified buildings' },
        { status: 404 }
      );
    }

    const buildingMap = new Map(BUILDINGS.map((b) => [b.id, b]));
    const fromBuilding = buildingMap.get(fromBuildingId)!;
    const toBuilding = buildingMap.get(toBuildingId)!;

    const waypoints = result.path.map((id) => {
      const b = buildingMap.get(id)!;
      return { lat: b.lat, lng: b.lng, name: b.name };
    });

    // Estimate walking time: ~1.4 m/s average walking speed
    const estimatedMinutes = Math.max(1, Math.round(result.distance / 1.4 / 60));
    // Steps = number of edges = number of waypoints - 1
    const stepCount = result.path.length - 1;

    return NextResponse.json({
      route: {
        from: {
          id: fromBuilding.id,
          name: fromBuilding.name,
          lat: fromBuilding.lat,
          lng: fromBuilding.lng,
        },
        to: {
          id: toBuilding.id,
          name: toBuilding.name,
          lat: toBuilding.lat,
          lng: toBuilding.lng,
        },
        waypoints,
        distanceMeters: Math.round(result.distance),
        estimatedMinutes,
        stepCount,
      },
    });
  } catch (error) {
    console.error('Route API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while finding the route' },
      { status: 500 }
    );
  }
}
