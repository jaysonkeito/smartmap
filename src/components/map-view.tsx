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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  } = useAppStore();

  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Search Bar */}
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
                className="mr-2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

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
          <CampusMap buildings={buildings} onBuildingClick={handleBuildingClick} />
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
