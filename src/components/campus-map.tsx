'use client';

import { MapContainer, TileLayer, Polygon, Tooltip, useMap, Polyline, CircleMarker } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { BuildingInfo } from '@/store/app-store';

interface CampusMapProps {
  buildings: BuildingInfo[];
  onBuildingClick: (building: BuildingInfo) => void;
  highlightedBuildingId?: number | null;
  routeWaypoints?: [number, number][] | null;
}

// Color coding by building type with HIGHLIGHTED versions
function getBuildingStyle(name: string, isHighlighted: boolean) {
  const upper = name.toUpperCase();

  // Academic buildings - Blue theme
  if (upper.includes('ACADEMIC') || upper.includes('COLLEGE OF')) {
    return isHighlighted ? {
      color: '#FFFFFF',
      fillColor: '#60A5FA',
      fillOpacity: 0.95,
      weight: 4,
      dashArray: '8, 4',
    } : {
      color: '#1D4ED8',
      fillColor: '#3B82F6',
      fillOpacity: 0.82,
      weight: 3,
    };
  }

  // Office buildings - Orange/Amber theme
  if (upper.includes('OFFICE') || upper.includes('ADMINISTRATION') || upper.includes('REGISTRAR')) {
    return isHighlighted ? {
      color: '#FFFFFF',
      fillColor: '#FCD34D',
      fillOpacity: 0.95,
      weight: 4,
      dashArray: '8, 4',
    } : {
      color: '#B45309',
      fillColor: '#F59E0B',
      fillOpacity: 0.82,
      weight: 3,
    };
  }

  // Facilities - Green theme (Gym, Library, AVR)
  if (upper.includes('GYM') || upper.includes('LIBRARY') || upper.includes('AVR')) {
    return isHighlighted ? {
      color: '#FFFFFF',
      fillColor: '#6EE7B7',
      fillOpacity: 0.95,
      weight: 4,
      dashArray: '8, 4',
    } : {
      color: '#047857',
      fillColor: '#10B981',
      fillOpacity: 0.82,
      weight: 3,
    };
  }

  // Security/Supply - Gray theme
  if (upper.includes('SECURITY') || upper.includes('SUPPLY') || upper.includes('ECP') || upper.includes('SAS')) {
    return isHighlighted ? {
      color: '#FFFFFF',
      fillColor: '#D1D5DB',
      fillOpacity: 0.95,
      weight: 4,
      dashArray: '8, 4',
    } : {
      color: '#374151',
      fillColor: '#6B7280',
      fillOpacity: 0.82,
      weight: 3,
    };
  }

  // Default - Blue
  return isHighlighted ? {
    color: '#FFFFFF',
    fillColor: '#60A5FA',
    fillOpacity: 0.95,
    weight: 4,
    dashArray: '8, 4',
  } : {
    color: '#1D4ED8',
    fillColor: '#3B82F6',
    fillOpacity: 0.82,
    weight: 3,
  };
}

// Get abbreviated name for map label
function getShortName(name: string): string {
  const abbreviations: Record<string, string> = {
    'ACADEMIC BUILDING': 'ACAD',
    'ADMINISTRATION OFFICE': 'ADMIN',
    'AVR ROOM': 'AVR',
    'COLLEGE OF AGRICULTURE AND FORESTRY BUILDING': 'CAF',
    'COLLEGE OF ARTS AND SCIENCES BUILDING-01': 'CAS-01',
    'COLLEGE OF ARTS AND SCIENCES BUILDING-02': 'CAS-02',
    'COLLEGE OF ARTS AND SCIENCES BUILDING-03': 'CAS-03',
    'COLLEGE OF BUSINESS ADMINISTRATION BUILDING': 'CBA',
    'COLLEGE OF BUSINESS ADMINISTRATION ROOM': 'CBA Room',
    'COLLEGE OF CRIMINAL JUSTICE EDUCATION BUILDING': 'CCJE',
    'COLLEGE OF CRIMINAL JUSTICE EDUCATION OFFICE': 'CCJE Office',
    'COLLEGE OF INDUSTRIAL TECHNOLOGY BUILDING-01': 'CIT-01',
    'COLLEGE OF INDUSTRIAL TECHNOLOGY BUILDING-02': 'CIT-02',
    'COLLEGE OF TEACHER EDUCATION BUILDING': 'CTED',
    'DEPARTMENT OF AIR SCIENCE TACTICS OFFICE': 'DAST',
    'ECP OFFICE': 'ECP',
    'GYM': 'GYM',
    'LIBRARY BUILDING': 'LIBRARY',
    'REGISTRAR BUILDING': 'REGISTRAR',
    'SAS OFFICE': 'SAS',
    'SECURITY OFFICE': 'SECURITY',
    'SUPPLY OFFICE': 'SUPPLY',
  };
  return abbreviations[name] || abbreviations[name.toUpperCase()] || name;
}

// Get building type label for the legend
function getBuildingType(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('ACADEMIC') || upper.includes('COLLEGE OF')) return 'Academic';
  if (upper.includes('OFFICE') || upper.includes('ADMINISTRATION') || upper.includes('REGISTRAR')) return 'Office';
  if (upper.includes('GYM') || upper.includes('LIBRARY') || upper.includes('AVR')) return 'Facility';
  if (upper.includes('SECURITY') || upper.includes('SUPPLY') || upper.includes('ECP') || upper.includes('SAS')) return 'Service';
  return 'Building';
}

// Get legend color
function getLegendColor(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('ACADEMIC') || upper.includes('COLLEGE OF')) return '#3B82F6';
  if (upper.includes('OFFICE') || upper.includes('ADMINISTRATION') || upper.includes('REGISTRAR')) return '#F59E0B';
  if (upper.includes('GYM') || upper.includes('LIBRARY') || upper.includes('AVR')) return '#10B981';
  if (upper.includes('SECURITY') || upper.includes('SUPPLY') || upper.includes('ECP') || upper.includes('SAS')) return '#6B7280';
  return '#3B82F6';
}

// Component to handle map invalidation on mount
function MapReadyHandler() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

export default function CampusMap({ buildings, onBuildingClick, highlightedBuildingId, routeWaypoints }: CampusMapProps) {
  const mapCenter: [number, number] = [9.35343, 122.83817];
  const mapZoom = 18;
  const mapBounds: [[number, number], [number, number]] = [
    [9.3523, 122.8350],
    [9.3545, 122.8410],
  ];

  const [hoveredBuilding, setHoveredBuilding] = useState<number | null>(null);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        minZoom={17}
        maxZoom={21}
        bounds={mapBounds}
        maxBounds={mapBounds}
        maxBoundsViscosity={1.0}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="rounded-lg"
      >
        <MapReadyHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {buildings.map((building) => {
          let positions: [number, number][] = [];
          try {
            positions = JSON.parse(building.coordinates) as [number, number][];
          } catch {
            console.error(`Failed to parse coordinates for ${building.name}`);
            return null;
          }

          if (positions.length < 3) return null;

          const isHighlighted = highlightedBuildingId === building.id || hoveredBuilding === building.id;
          const style = getBuildingStyle(building.name, isHighlighted);
          const shortName = getShortName(building.name);
          const buildingType = getBuildingType(building.name);

          return (
            <Polygon
              key={building.id}
              positions={positions}
              pathOptions={style}
              eventHandlers={{
                click: () => onBuildingClick(building),
                mouseover: (e) => {
                  setHoveredBuilding(building.id);
                  const target = e.target;
                  const hoverStyle = getBuildingStyle(building.name, true);
                  target.setStyle(hoverStyle);
                  target.bringToFront();
                },
                mouseout: (e) => {
                  setHoveredBuilding(null);
                  const target = e.target;
                  const normalStyle = getBuildingStyle(building.name, highlightedBuildingId === building.id);
                  target.setStyle(normalStyle);
                },
              }}
            >
              <Tooltip
                permanent={true}
                direction="center"
                className={`building-label ${isHighlighted ? 'building-label-highlighted' : ''}`}
              >
                <span className="font-bold text-xs">{shortName}</span>
                {isHighlighted && (
                  <span className="building-sublabel">{buildingType}</span>
                )}
              </Tooltip>
            </Polygon>
          );
        })}
        {/* Route polyline rendering */}
        {routeWaypoints && routeWaypoints.length >= 2 && (
          <>
            <Polyline
              positions={routeWaypoints}
              pathOptions={{
                color: '#059669',
                weight: 5,
                opacity: 0.9,
                dashArray: '10, 6',
              }}
            />
            {/* Start marker - green */}
            <CircleMarker
              center={routeWaypoints[0]}
              radius={8}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: '#10B981',
                fillOpacity: 1,
                weight: 3,
              }}
            />
            {/* End marker - red */}
            <CircleMarker
              center={routeWaypoints[routeWaypoints.length - 1]}
              radius={8}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: '#EF4444',
                fillOpacity: 1,
                weight: 3,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Campus Name Header */}
      <div className="campus-map-header">
        NORSU Bayawan—Santa Catalina Campus
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
        <p className="text-xs font-bold text-gray-700 mb-2">Building Types</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2 border-blue-700" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-[10px] text-gray-600">Academic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2 border-amber-600" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-[10px] text-gray-600">Office</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2 border-emerald-700" style={{ backgroundColor: '#10B981' }} />
            <span className="text-[10px] text-gray-600">Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2 border-gray-600" style={{ backgroundColor: '#6B7280' }} />
            <span className="text-[10px] text-gray-600">Service</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-[9px] text-gray-500">Click building for rooms</p>
        </div>
      </div>
    </div>
  );
}
