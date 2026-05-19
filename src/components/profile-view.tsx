'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  LogOut,
  MapPin,
  Shield,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, type BuildingInfo } from '@/store/app-store';

export function ProfileView() {
  const { user, currentRoomLogin, setCurrentRoomLogin, setFlashMessage, logout } = useAppStore();
  const [buildings, setBuildings] = useState<BuildingInfo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load buildings for room selection
  useEffect(() => {
    const loadBuildings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/buildings');
        const data = await res.json();
        if (res.ok) {
          setBuildings(data.buildings);
        }
      } catch {
        console.error('Failed to load buildings');
      } finally {
        setIsLoading(false);
      }
    };
    loadBuildings();
  }, []);

  const handleRoomLogin = async () => {
    if (!user || !selectedRoom) return;
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/room-login/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, roomId: parseInt(selectedRoom) }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentRoomLogin({
          roomId: data.roomLogin.roomId,
          roomName: data.roomLogin.roomName,
        });
        setFlashMessage({ type: 'success', text: data.message });
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to login to room' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRoomLogout = async () => {
    if (!user) return;
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/room-login/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentRoomLogin(null);
        setFlashMessage({ type: 'success', text: data.message });
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to logout from room' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const roleColor = {
    Faculty: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Staff: 'bg-amber-100 text-amber-800 border-amber-200',
    Student: 'bg-teal-100 text-teal-800 border-teal-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4"
    >
      {/* User Info Card */}
      <Card className="border-emerald-200 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-emerald-600 to-green-600" />
        <CardContent className="pt-0 -mt-10">
          <div className="flex items-end gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-4 border-white shadow-md text-emerald-700">
              <User className="h-8 w-8" />
            </div>
            <div className="pb-1">
              <p className="font-bold text-lg">{user?.name}</p>
              <Badge
                className={
                  roleColor[user?.role as keyof typeof roleColor] || 'bg-gray-100 text-gray-800'
                }
              >
                {user?.role}
              </Badge>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono font-medium">{user?.userId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Login Card */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
            <MapPin className="h-4 w-4" />
            Room Login
          </CardTitle>
          <CardDescription>Log into a room to mark your presence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentRoomLogin && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Currently in: {currentRoomLogin.roomName}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRoomLogout}
                disabled={isLoggingIn}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isLoggingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Logout'}
              </Button>
            </div>
          )}

          {!currentRoomLogin && (
            <>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Select a Room</Label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Choose a room --</option>
                      {buildings.map((b) => (
                        <optgroup key={b.id} label={b.name}>
                          {b.rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleRoomLogin}
                    disabled={!selectedRoom || isLoggingIn}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Login to Room
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={logout}
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </motion.div>
  );
}
