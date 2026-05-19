'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Building2,
  DoorOpen,
  Users,
  BookOpen,
  ChevronRight,
  Loader2,
  X,
  Shield,
  Navigation,
  MapPin,
  Route,
  Footprints,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  useAppStore,
  type BuildingInfo,
  type RoomStatus,
  type SearchResult,
} from '@/store/app-store';

// Dynamic import for the campus map (SSR disabled since Leaflet needs browser APIs)
const CampusMap = dynamic(() => import('@/components/campus-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-emerald-50 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-emerald-700 font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

export function MapView() {
  const {
    buildings,
    setBuildings,
    selectedBuilding,
    setSelectedBuilding,
    selectedRoomStatus,
    setSelectedRoomStatus,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    showNavigation,
    setShowNavigation,
    navStart,
    setNavStart,
    navEnd,
    setNavEnd,
    routeWaypoints,
    setRouteWaypoints,
    routeInfo,
    setRouteInfo,
  } = useAppStore();

  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isFindingRoute, setIsFindingRoute] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load buildings
  useEffect(() => {
    const loadBuildings = async () => {
      if (buildings.length > 0) return;
      setIsLoadingBuildings(true);
      try {
        const res = await fetch('/api/buildings');
        const data = await res.json();
        if (res.ok) {
          setBuildings(data.buildings);
        }
      } catch (error) {
        console.error('Failed to load buildings:', error);
      } finally {
        setIsLoadingBuildings(false);
      }
    };
    loadBuildings();
  }, [buildings.length, setBuildings]);

  // Live search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      if (query.trim().length < 2) {
        setSearchResults(null);
        return;
      }

      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          if (res.ok) {
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300);
    },
    [setSearchQuery, setSearchResults]
  );

  // Handle building click
  const handleBuildingClick = (building: BuildingInfo) => {
    setSelectedBuilding(building);
  };

  // Handle room click - show room status
  const handleRoomClick = async (roomId: number) => {
    setIsLoadingRoom(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`);
      const data = await res.json();
      if (res.ok) {
        setSelectedRoomStatus(data);
      }
    } catch (error) {
      console.error('Room status error:', error);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  // Handle search result room click
  const handleSearchRoomClick = async (roomId: number) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults(null);
    await handleRoomClick(roomId);
  };

  // Handle find route
  const handleFindRoute = async () => {
    if (!navStart || !navEnd) return;

    setIsFindingRoute(true);
    try {
      const params = new URLSearchParams();
      if (navStart.type === 'building') {
        params.set('from', String(navStart.id));
      } else {
        params.set('fromRoom', String(navStart.id));
      }
      if (navEnd.type === 'building') {
        params.set('to', String(navEnd.id));
      } else {
        params.set('toRoom', String(navEnd.id));
      }

      const res = await fetch(`/api/route?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.route) {
        const waypoints: [number, number][] = data.route.waypoints.map(
          (wp: { lat: number; lng: number }) => [wp.lat, wp.lng] as [number, number]
        );
        setRouteWaypoints(waypoints);
        setRouteInfo({
          distanceMeters: data.route.distanceMeters,
          estimatedMinutes: data.route.estimatedMinutes,
          stepCount: data.route.stepCount,
        });
      } else {
        setRouteWaypoints(null);
        setRouteInfo(null);
      }
    } catch (error) {
      console.error('Route finding error:', error);
      setRouteWaypoints(null);
      setRouteInfo(null);
    } finally {
      setIsFindingRoute(false);
    }
  };

  // Handle clear route
  const handleClearRoute = () => {
    setNavStart(null);
    setNavEnd(null);
    setRouteWaypoints(null);
    setRouteInfo(null);
  };

  // Handle navigation select change for start
  const handleNavStartChange = (value: string) => {
    const [type, idStr, ...nameParts] = value.split('|');
    const id = parseInt(idStr, 10);
    const name = nameParts.join('|');
    setNavStart({ type: type as 'building' | 'room', id, name });
  };

  // Handle navigation select change for end
  const handleNavEndChange = (value: string) => {
    const [type, idStr, ...nameParts] = value.split('|');
    const id = parseInt(idStr, 10);
    const name = nameParts.join('|');
    setNavEnd({ type: type as 'building' | 'room', id, name });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Search Bar & Navigation Toggle */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg shadow-lg border border-emerald-100 overflow-hidden">
            <Search className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search rooms or people..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="border-0 shadow-none focus-visible:ring-0 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearch(false);
                }}
                className="mr-1 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              className={`mr-1 gap-1.5 h-8 px-2 rounded-md transition-colors ${
                showNavigation || routeWaypoints
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span className="text-xs font-medium">Navigate</span>
            </Button>
          </div>

          {/* Navigation Panel */}
          <AnimatePresence>
            {showNavigation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-emerald-100 p-3 space-y-3">
                  {/* Start Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      Start Location
                    </label>
                    <Select
                      value={navStart ? `${navStart.type}|${navStart.id}|${navStart.name}` : ''}
                      onValueChange={handleNavStartChange}
                    >
                      <SelectTrigger className="w-full h-9 text-sm border-emerald-200 focus:border-emerald-400">
                        <SelectValue placeholder="Select starting point..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700 font-semibold text-xs">
                            Buildings
                          </SelectLabel>
                          {buildings.map((b) => (
                            <SelectItem
                              key={`b-${b.id}`}
                              value={`building|${b.id}|${b.name}`}
                              className="text-sm"
                            >
                              <Building2 className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700 font-semibold text-xs">
                            Rooms by Building
                          </SelectLabel>
                          {buildings.filter((b) => b.rooms.length > 0).map((b) => (
                            <SelectGroup key={`rooms-${b.id}`}>
                              <SelectLabel className="text-xs text-muted-foreground pl-4">
                                {b.name}
                              </SelectLabel>
                              {b.rooms.map((r) => (
                                <SelectItem
                                  key={`r-${r.id}`}
                                  value={`room|${r.id}|${r.name}`}
                                  className="text-sm pl-6"
                                >
                                  <DoorOpen className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* End Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      Destination
                    </label>
                    <Select
                      value={navEnd ? `${navEnd.type}|${navEnd.id}|${navEnd.name}` : ''}
                      onValueChange={handleNavEndChange}
                    >
                      <SelectTrigger className="w-full h-9 text-sm border-emerald-200 focus:border-emerald-400">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700 font-semibold text-xs">
                            Buildings
                          </SelectLabel>
                          {buildings.map((b) => (
                            <SelectItem
                              key={`b-${b.id}`}
                              value={`building|${b.id}|${b.name}`}
                              className="text-sm"
                            >
                              <Building2 className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700 font-semibold text-xs">
                            Rooms by Building
                          </SelectLabel>
                          {buildings.filter((b) => b.rooms.length > 0).map((b) => (
                            <SelectGroup key={`rooms-${b.id}`}>
                              <SelectLabel className="text-xs text-muted-foreground pl-4">
                                {b.name}
                              </SelectLabel>
                              {b.rooms.map((r) => (
                                <SelectItem
                                  key={`r-${r.id}`}
                                  value={`room|${r.id}|${r.name}`}
                                  className="text-sm pl-6"
                                >
                                  <DoorOpen className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFindRoute}
                      disabled={!navStart || !navEnd || isFindingRoute}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9"
                    >
                      {isFindingRoute ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Route className="h-4 w-4" />
                      )}
                      {isFindingRoute ? 'Finding Route...' : 'Find Route'}
                    </Button>
                    {routeWaypoints && (
                      <Button
                        onClick={handleClearRoute}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 h-9"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Route Info */}
                  <AnimatePresence>
                    {routeInfo && routeWaypoints && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Footprints className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-800">Route Found</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-700">
                              {routeInfo.distanceMeters >= 1000
                                ? `${(routeInfo.distanceMeters / 1000).toFixed(1)}`
                                : routeInfo.distanceMeters}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">
                              {routeInfo.distanceMeters >= 1000 ? 'km' : 'meters'}
                            </p>
                          </div>
                          <div className="text-center border-x border-emerald-200">
                            <p className="text-lg font-bold text-emerald-700">
                              ~{routeInfo.estimatedMinutes}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">min walk</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-700">
                              {routeInfo.stepCount}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">steps</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-emerald-200">
                          <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                            {navStart?.name}
                            <ChevronRight className="h-3 w-3 text-emerald-400" />
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                            {navEnd?.name}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearch && searchResults && (searchResults.rooms.length > 0 || searchResults.users.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-emerald-100 max-h-72 overflow-y-auto custom-scrollbar z-20"
              >
                {searchResults.rooms.length > 0 && (
                  <div>
                    <p className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 sticky top-0">
                      Rooms
                    </p>
                    {searchResults.rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleSearchRoomClick(room.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                      >
                        <DoorOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.buildingName}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.users.length > 0 && (
                  <div>
                    <p className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 sticky top-0">
                      People
                    </p>
                    {searchResults.users.map((user) => (
                      <button
                        key={user.userId}
                        onClick={async () => {
                          setShowSearch(false);
                          setSearchQuery('');
                          setSearchResults(null);
                          if (user.currentRoom) {
                            const room = buildings
                              .flatMap((b) => b.rooms)
                              .find((r) => user.currentRoom?.startsWith(r.name));
                            if (room) {
                              await handleRoomClick(room.id);
                            }
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                      >
                        <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.role}
                            {user.currentRoom ? ` · ${user.currentRoom}` : ' · Not in a room'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoadingBuildings ? (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">Loading campus map...</p>
            </div>
          </div>
        ) : (
          <CampusMap
            buildings={buildings}
            onBuildingClick={handleBuildingClick}
            routeWaypoints={routeWaypoints}
          />
        )}
      </div>

      {/* Building Sheet (shows rooms) */}
      <Sheet
        open={!!selectedBuilding}
        onOpenChange={(open) => {
          if (!open) setSelectedBuilding(null);
        }}
      >
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-emerald-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedBuilding?.name}
            </SheetTitle>
            <SheetDescription>{selectedBuilding?.description}</SheetDescription>
          </SheetHeader>
          <Separator className="my-2" />
          <ScrollArea className="h-[calc(60vh-8rem)]">
            <div className="space-y-2 pb-4">
              {selectedBuilding?.rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No rooms available in this building
                </p>
              ) : (
                selectedBuilding?.rooms.map((room) => (
                  <motion.button
                    key={room.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleRoomClick(room.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium flex-1">{room.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                  </motion.button>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Room Status Dialog */}
      <Dialog
        open={!!selectedRoomStatus}
        onOpenChange={(open) => {
          if (!open) setSelectedRoomStatus(null);
        }}
      >
        <DialogContent className="max-w-md">
          {isLoadingRoom ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Loading room status...</p>
            </div>
          ) : selectedRoomStatus ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-emerald-800 flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  {selectedRoomStatus.room.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedRoomStatus.room.buildingName}
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <ScrollArea className="max-h-72">
                <div className="space-y-4">
                  {/* Faculty */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">Faculty</p>
                    </div>
                    {selectedRoomStatus.faculty.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-6">
                        No faculty present
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {selectedRoomStatus.faculty.map((f) => (
                          <Badge
                            key={f.userId}
                            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                          >
                            {f.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Staff */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">Staff</p>
                    </div>
                    {selectedRoomStatus.staff.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-6">
                        No staff present
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {selectedRoomStatus.staff.map((s) => (
                          <Badge
                            key={s.userId}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Students */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      <p className="text-sm font-semibold text-teal-800">Students</p>
                    </div>
                    {selectedRoomStatus.students.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-6">
                        No students present
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {selectedRoomStatus.students.map((s) => (
                          <Badge
                            key={s.userId}
                            className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200"
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
