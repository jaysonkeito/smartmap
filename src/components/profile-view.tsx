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
  Mail,
  Lock,
  Save,
  GraduationCap,
  Building2,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

  // Editable fields
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load user profile data
  useEffect(() => {
    if (user?.userId) {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/profile?userId=${user.userId}`);
          const data = await res.json();
          if (res.ok && data.user) {
            setEmail(data.user.email || '');
          }
        } catch {
          // Silently fail
        }
      };
      fetchProfile();
    }
  }, [user?.userId]);

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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const body: Record<string, string> = { userId: user.userId };
      if (email) body.email = email;
      if (newPassword) body.password = newPassword;

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'Profile updated successfully!' });
        setNewPassword('');
      } else {
        setFlashMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

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
    Admin: 'bg-red-100 text-red-800 border-red-200',
  };

  const isStudent = user?.role === 'Student';
  const isFaculty = user?.role === 'Faculty';
  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff';
  const showEditableFields = isStudent || isFaculty || isStaff;

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

            {/* Student-specific read-only info */}
            {isStudent && (
              <>
                {user?.college && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">College:</span>
                    <span className="font-medium text-xs">{user.college}</span>
                  </div>
                )}
                {user?.program && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Program:</span>
                    <span className="font-medium text-xs">{user.program}</span>
                  </div>
                )}
                {user?.yearLevel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Year Level:</span>
                    <span className="font-medium">{user.yearLevel}</span>
                  </div>
                )}
              </>
            )}

            {/* Staff-specific read-only info */}
            {user?.role === 'Staff' && (
              <>
                {user?.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{user.department}</span>
                  </div>
                )}
                {user?.position && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-medium">{user.position}</span>
                  </div>
                )}
              </>
            )}

            {/* Faculty-specific read-only info */}
            {isFaculty && user?.college && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">College:</span>
                <span className="font-medium text-xs">{user.college}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile Card - Students & Faculty */}
      {showEditableFields && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <Mail className="h-4 w-4" />
              Edit Profile
            </CardTitle>
            <CardDescription>Update your email and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                New Password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave empty to keep current password"
                className="h-10"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || (!email && !newPassword)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin profile - no editable fields, just info */}
      {isAdmin && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <Shield className="h-4 w-4" />
              Admin Account
            </CardTitle>
            <CardDescription>Administrator privileges are active</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This account has full administrative access to manage buildings, rooms, users, and all system settings.
            </p>
          </CardContent>
        </Card>
      )}

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
