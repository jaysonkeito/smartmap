'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  DoorOpen,
  Users,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  Shield,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Activity,
  BarChart3,
  UserPlus,
  LogIn,
  LogOut as LogoutIcon,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';

interface AdminBuilding {
  id: number;
  name: string;
  description: string | null;
  coordinates: string;
  color: string | null;
  roomCount: number;
  activeLogins: number;
  rooms: { id: number; name: string; buildingId: number }[];
}

interface AdminUser {
  id: number;
  userId: string;
  name: string;
  role: string;
  isAdmin: boolean;
  currentRoom: string;
  createdAt: string;
}

interface AdminLogin {
  id: number;
  userId: string;
  userName: string;
  userRole: string;
  roomId: number;
  roomName: string;
  buildingName: string;
  loginTime: string;
  logoutTime?: string | null;
  isActive?: boolean;
}

interface AdminStats {
  totalBuildings: number;
  totalRooms: number;
  totalUsers: number;
  faculty: number;
  staff: number;
  students: number;
  admins: number;
  activeLogins: number;
}

export function AdminView() {
  const { user, setFlashMessage } = useAppStore();
  const adminUserId = user?.userId || '';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminLogin[]>([]);
  const [buildings, setBuildings] = useState<AdminBuilding[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logins, setLogins] = useState<AdminLogin[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<AdminBuilding | null>(null);
  const [buildingForm, setBuildingForm] = useState({ name: '', description: '', coordinates: '', color: '#10b981' });

  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: number; name: string; buildingId: number } | null>(null);
  const [roomForm, setRoomForm] = useState({ name: '', buildingId: '' });

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ userId: '', name: '', password: '', role: 'Student' });

  // Expanded buildings for rooms view
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);

  // Fetch data based on tab
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch {
      console.error('Failed to fetch dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  const fetchBuildings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/buildings', {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) setBuildings(data.buildings);
    } catch {
      console.error('Failed to fetch buildings');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  const fetchLogins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logins', {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) setLogins(data.logins);
    } catch {
      console.error('Failed to fetch logins');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  // Office assignments state
  const [offices, setOffices] = useState<{ id: number; name: string; buildingName: string; assignments: { id: number; userId: string; userName: string; userRole: string; officeRole: string }[] }[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [officeAssignments, setOfficeAssignments] = useState<Record<string, { userId: string; name: string; userRole: string; assignmentId: number }[]> | null>(null);
  const [officeRoomInfo, setOfficeRoomInfo] = useState<{ id: number; name: string; building: { name: string } } | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', role: 'Faculty' });

  const fetchOffices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/office-assignments', {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) setOffices(data.offices);
    } catch {
      console.error('Failed to fetch offices');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  const fetchOfficeDetails = useCallback(async (roomId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/office-assignments?roomId=${roomId}`, {
        headers: { 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) {
        setOfficeAssignments(data.assignments);
        setOfficeRoomInfo(data.room);
      }
    } catch {
      console.error('Failed to fetch office details');
    } finally {
      setIsLoading(false);
    }
  }, [adminUserId]);

  const handleAssignOffice = async () => {
    if (!selectedOfficeId || !assignForm.userId) return;
    try {
      const res = await fetch('/api/admin/office-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-user-id': adminUserId },
        body: JSON.stringify({ roomId: parseInt(selectedOfficeId), userId: assignForm.userId, role: assignForm.role }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: data.message });
        setAssignForm({ userId: '', role: 'Faculty' });
        fetchOfficeDetails(selectedOfficeId);
        fetchOffices();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to assign office' });
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      const res = await fetch('/api/admin/office-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-user-id': adminUserId },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: data.message });
        if (selectedOfficeId) fetchOfficeDetails(selectedOfficeId);
        fetchOffices();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to remove assignment' });
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'buildings') fetchBuildings();
    else if (activeTab === 'rooms') fetchBuildings();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'activity') fetchLogins();
    else if (activeTab === 'offices') fetchOffices();
  }, [activeTab, fetchDashboard, fetchBuildings, fetchUsers, fetchLogins, fetchOffices]);

  // Building CRUD
  const handleSaveBuilding = async () => {
    const isEdit = !!editingBuilding;
    const url = isEdit ? '/api/admin/buildings' : '/api/admin/buildings';
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit
      ? { adminUserId, id: editingBuilding.id, ...buildingForm }
      : { adminUserId, ...buildingForm };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: isEdit ? 'Building updated' : 'Building created' });
        setShowBuildingDialog(false);
        setEditingBuilding(null);
        setBuildingForm({ name: '', description: '', coordinates: '', color: '#10b981' });
        fetchBuildings();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to save building' });
    }
  };

  const handleDeleteBuilding = async (id: number) => {
    if (!confirm('Delete this building and all its rooms?')) return;
    try {
      const res = await fetch(`/api/admin/buildings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'Building deleted' });
        fetchBuildings();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to delete building' });
    }
  };

  // Room CRUD
  const handleSaveRoom = async () => {
    const isEdit = !!editingRoom;
    try {
      const res = await fetch('/api/admin/rooms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { adminUserId, id: editingRoom!.id, name: roomForm.name }
            : { adminUserId, name: roomForm.name, buildingId: parseInt(roomForm.buildingId) }
        ),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: isEdit ? 'Room updated' : 'Room created' });
        setShowRoomDialog(false);
        setEditingRoom(null);
        setRoomForm({ name: '', buildingId: '' });
        fetchBuildings();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to save room' });
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Delete this room?')) return;
    try {
      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'Room deleted' });
        fetchBuildings();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to delete room' });
    }
  };

  // User CRUD
  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, ...userForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'User created' });
        setShowUserDialog(false);
        setUserForm({ userId: '', name: '', password: '', role: 'Student' });
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to create user' });
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, userId, isAdmin: !currentIsAdmin }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: `Admin status ${!currentIsAdmin ? 'granted' : 'revoked'}` });
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  // Force logout
  const handleForceLogout = async (userId: string) => {
    if (!confirm('Force logout this user?')) return;
    try {
      const res = await fetch('/api/admin/logins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'User logged out' });
        fetchLogins();
        fetchDashboard();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to force logout' });
    }
  };

  const roleColorMap: Record<string, string> = {
    Faculty: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Staff: 'bg-amber-100 text-amber-800 border-amber-200',
    Student: 'bg-teal-100 text-teal-800 border-teal-200',
    Admin: 'bg-red-100 text-red-800 border-red-200',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-4"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-10 bg-white px-2 pt-2 pb-1">
          <TabsList className="w-full h-10 bg-emerald-50">
            <TabsTrigger value="dashboard" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="buildings" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buildings</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <DoorOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rooms</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="offices" className="text-xs gap-1 flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Offices</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Dashboard Tab ─── */}
        <TabsContent value="dashboard" className="px-4 mt-2">
          {isLoading && !stats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <Building2 className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xl font-bold text-emerald-800">{stats.totalBuildings}</p>
                      <p className="text-[10px] text-muted-foreground">Buildings</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <DoorOpen className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xl font-bold text-emerald-800">{stats.totalRooms}</p>
                      <p className="text-[10px] text-muted-foreground">Rooms</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <Shield className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                      <p className="text-xl font-bold text-emerald-800">{stats.faculty}</p>
                      <p className="text-[10px] text-muted-foreground">Faculty</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <Users className="h-6 w-6 mx-auto text-amber-600 mb-1" />
                      <p className="text-xl font-bold text-amber-800">{stats.staff}</p>
                      <p className="text-[10px] text-muted-foreground">Staff</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <BookOpen className="h-6 w-6 mx-auto text-teal-600 mb-1" />
                      <p className="text-xl font-bold text-teal-800">{stats.students}</p>
                      <p className="text-[10px] text-muted-foreground">Students</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="border-emerald-100">
                    <CardContent className="p-3 text-center">
                      <LogIn className="h-6 w-6 mx-auto text-red-600 mb-1" />
                      <p className="text-xl font-bold text-red-800">{stats.activeLogins}</p>
                      <p className="text-[10px] text-muted-foreground">Active Logins</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <Card className="border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentActivity.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/50 text-xs">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${a.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <span className="font-medium truncate">{a.userName}</span>
                          <span className="text-muted-foreground">{a.isActive ? 'logged into' : 'logged out of'}</span>
                          <span className="font-medium truncate">{a.roomName}</span>
                          <span className="text-muted-foreground ml-auto shrink-0">{formatTime(a.loginTime)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        {/* ─── Buildings Tab ─── */}
        <TabsContent value="buildings" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Buildings ({buildings.length})</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
              onClick={() => {
                setEditingBuilding(null);
                setBuildingForm({ name: '', description: '', coordinates: '', color: '#10b981' });
                setShowBuildingDialog(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Building
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No buildings yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {buildings.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-emerald-100 overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: b.color || '#10b981' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-emerald-900 truncate">{b.name}</p>
                            <Badge variant="outline" className="text-[10px] h-5 shrink-0">{b.roomCount} rooms</Badge>
                            {b.activeLogins > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-5 shrink-0">{b.activeLogins} active</Badge>
                            )}
                          </div>
                          {b.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{b.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600"
                            onClick={() => {
                              setEditingBuilding(b);
                              setBuildingForm({
                                name: b.name,
                                description: b.description || '',
                                coordinates: b.coordinates,
                                color: b.color || '#10b981',
                              });
                              setShowBuildingDialog(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteBuilding(b.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Rooms Tab ─── */}
        <TabsContent value="rooms" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Rooms by Building</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
              onClick={() => {
                setEditingRoom(null);
                setRoomForm({ name: '', buildingId: '' });
                setShowRoomDialog(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Room
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-8">
              <DoorOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No buildings available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {buildings.map((b) => (
                <Card key={b.id} className="border-emerald-100 overflow-hidden">
                  <button
                    className="w-full p-3 flex items-center gap-2 text-left hover:bg-emerald-50/50 transition-colors"
                    onClick={() => setExpandedBuilding(expandedBuilding === b.id ? null : b.id)}
                  >
                    <div className="h-6 w-6 rounded shrink-0" style={{ backgroundColor: b.color || '#10b981' }} />
                    <span className="text-sm font-semibold text-emerald-900 flex-1">{b.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">{b.rooms.length} rooms</Badge>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expandedBuilding === b.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expandedBuilding === b.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="p-2 space-y-1">
                          {b.rooms.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">No rooms in this building</p>
                          ) : (
                            b.rooms.map((r) => (
                              <div key={r.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-emerald-50 transition-colors">
                                <DoorOpen className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="text-xs font-medium flex-1">{r.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600"
                                  onClick={() => {
                                    setEditingRoom(r);
                                    setRoomForm({ name: r.name, buildingId: String(r.buildingId) });
                                    setShowRoomDialog(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                  onClick={() => handleDeleteRoom(r.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Users ({users.length})</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
              onClick={() => {
                setUserForm({ userId: '', name: '', password: '', role: 'Student' });
                setShowUserDialog(true);
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-1.5 max-h-[calc(100vh-18rem)] overflow-y-auto">
              {users.map((u) => (
                <motion.div
                  key={u.userId}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{u.name}</p>
                      {u.isAdmin && <Shield className="h-3 w-3 text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{u.userId}</span>
                      <Badge className={`${roleColorMap[u.role] || 'bg-gray-100 text-gray-800'} text-[10px] h-4 px-1.5`}>
                        {u.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-[10px] shrink-0 ${u.isAdmin ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                    onClick={() => handleToggleAdmin(u.userId, u.isAdmin)}
                  >
                    {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Activity Tab ─── */}
        <TabsContent value="activity" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Active Logins ({logins.length})</h3>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={fetchLogins}
            >
              <Loader2 className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : logins.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No active room logins</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logins.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-emerald-100"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{l.userName}</p>
                      <Badge className={`${roleColorMap[l.userRole] || 'bg-gray-100 text-gray-800'} text-[10px] h-4 px-1.5`}>
                        {l.userRole}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {l.roomName} &middot; {l.buildingName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                      {formatTime(l.loginTime)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] shrink-0 border-red-200 text-red-600 hover:bg-red-50 gap-1"
                    onClick={() => handleForceLogout(l.userId)}
                  >
                    <LogoutIcon className="h-3 w-3" />
                    Force Logout
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Office Assignments Tab ─── */}
        <TabsContent value="offices" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Office Assignments</h3>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={fetchOffices}
            >
              <Loader2 className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Office selector */}
          <Card className="border-emerald-100 mb-3">
            <CardContent className="p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Select Office</Label>
                <select
                  value={selectedOfficeId}
                  onChange={(e) => {
                    setSelectedOfficeId(e.target.value);
                    if (e.target.value) {
                      fetchOfficeDetails(e.target.value);
                    } else {
                      setOfficeAssignments(null);
                      setOfficeRoomInfo(null);
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Choose an office --</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.buildingName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOfficeId && (
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700">Assign Member</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">User ID</Label>
                      <Input
                        value={assignForm.userId}
                        onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                        placeholder="Enter user ID"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Role</Label>
                      <select
                        value={assignForm.role}
                        onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {selectedOfficeId && offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('caf') ||
                         offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('cas') ||
                         offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('cba') ||
                         offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('cit') ||
                         offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('ccje') ||
                         offices.find(o => o.id === parseInt(selectedOfficeId))?.name.toLowerCase().includes('cted') ? (
                          <>
                            <option value="College Dean">College Dean</option>
                            <option value="Assistant Dean">Assistant Dean</option>
                            <option value="Faculty">Faculty Member</option>
                            <option value="Staff">Staff Member</option>
                          </>
                        ) : (
                          <>
                            <option value="Faculty">Faculty Member</option>
                            <option value="Staff">Staff Member</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
                    onClick={handleAssignOffice}
                    disabled={!assignForm.userId}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Assign to Office
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current assignments */}
          {selectedOfficeId && officeAssignments ? (
            <Card className="border-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                  <Briefcase className="h-4 w-4" />
                  {officeRoomInfo?.name || 'Office Details'}
                </CardTitle>
                {officeRoomInfo && (
                  <CardDescription className="text-[11px]">
                    {officeRoomInfo.building?.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* College Dean */}
                {officeAssignments['College Dean'] && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-800">College Dean</p>
                    </div>
                    {officeAssignments['College Dean'].length === 0 ? (
                      <p className="text-[11px] text-muted-foreground pl-6">No dean assigned</p>
                    ) : (
                      officeAssignments['College Dean'].map((a) => (
                        <div key={a.assignmentId} className="flex items-center justify-between pl-6 py-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-5">{a.name}</Badge>
                            <span className="text-[10px] text-muted-foreground">({a.userId})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveAssignment(a.assignmentId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Assistant Dean */}
                {officeAssignments['Assistant Dean'] && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                      <p className="text-xs font-semibold text-teal-800">Assistant Dean</p>
                    </div>
                    {officeAssignments['Assistant Dean'].length === 0 ? (
                      <p className="text-[11px] text-muted-foreground pl-6">No assistant dean assigned</p>
                    ) : (
                      officeAssignments['Assistant Dean'].map((a) => (
                        <div key={a.assignmentId} className="flex items-center justify-between pl-6 py-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-teal-100 text-teal-800 text-[10px] h-5">{a.name}</Badge>
                            <span className="text-[10px] text-muted-foreground">({a.userId})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveAssignment(a.assignmentId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Faculty Members */}
                {officeAssignments['Faculty'] && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-800">Faculty Members</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{officeAssignments['Faculty'].length}</Badge>
                    </div>
                    {officeAssignments['Faculty'].length === 0 ? (
                      <p className="text-[11px] text-muted-foreground pl-6">No faculty members assigned</p>
                    ) : (
                      <div className="space-y-1 pl-6">
                        {officeAssignments['Faculty'].map((a) => (
                          <div key={a.assignmentId} className="flex items-center justify-between py-0.5">
                            <span className="text-xs">{a.name} <span className="text-[10px] text-muted-foreground">({a.userId})</span></span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAssignment(a.assignmentId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Staff Members */}
                {officeAssignments['Staff'] && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-800">Staff Members</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{officeAssignments['Staff'].length}</Badge>
                    </div>
                    {officeAssignments['Staff'].length === 0 ? (
                      <p className="text-[11px] text-muted-foreground pl-6">No staff members assigned</p>
                    ) : (
                      <div className="space-y-1 pl-6">
                        {officeAssignments['Staff'].map((a) => (
                          <div key={a.assignmentId} className="flex items-center justify-between py-0.5">
                            <span className="text-xs">{a.name} <span className="text-[10px] text-muted-foreground">({a.userId})</span></span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAssignment(a.assignmentId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : !selectedOfficeId ? (
            /* Office overview list */
            isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : offices.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No office rooms found</p>
                <p className="text-xs text-muted-foreground">Add rooms with &quot;Office&quot; in the name to manage assignments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {offices.map((o) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-emerald-100 overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => { setSelectedOfficeId(String(o.id)); fetchOfficeDetails(String(o.id)); }}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-900 truncate">{o.name}</p>
                            <p className="text-[10px] text-muted-foreground">{o.buildingName}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {o.assignments.length > 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] h-5">
                                {o.assignments.length} assigned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                                Empty
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={showBuildingDialog} onOpenChange={setShowBuildingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingBuilding ? 'Edit Building' : 'Add Building'}
            </DialogTitle>
            <DialogDescription>
              {editingBuilding ? 'Update building information' : 'Create a new building on the campus map'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Name *</Label>
              <Input
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                placeholder="Building name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Input
                value={buildingForm.description}
                onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Coordinates (JSON)</Label>
              <Input
                value={buildingForm.coordinates}
                onChange={(e) => setBuildingForm({ ...buildingForm, coordinates: e.target.value })}
                placeholder='[[9.37, 122.78], [9.38, 122.79]]'
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Array of [lat, lng] pairs for the building polygon</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={buildingForm.color}
                  onChange={(e) => setBuildingForm({ ...buildingForm, color: e.target.value })}
                  className="h-8 w-8 rounded border cursor-pointer"
                />
                <Input
                  value={buildingForm.color}
                  onChange={(e) => setBuildingForm({ ...buildingForm, color: e.target.value })}
                  className="font-mono text-xs flex-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveBuilding}
              disabled={!buildingForm.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editingBuilding ? 'Update Building' : 'Create Building'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Room Dialog ─── */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              {editingRoom ? 'Edit Room' : 'Add Room'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom ? 'Update room name' : 'Create a new room in a building'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Room Name *</Label>
              <Input
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                placeholder="Room name"
              />
            </div>
            {!editingRoom && (
              <div className="space-y-1.5">
                <Label className="text-sm">Building *</Label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Select building --</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={handleSaveRoom}
              disabled={!roomForm.name || (!editingRoom && !roomForm.buildingId)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── User Dialog ─── */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account (Faculty, Staff, or Student)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">9-Digit ID *</Label>
              <Input
                value={userForm.userId}
                onChange={(e) => setUserForm({ ...userForm, userId: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                placeholder="Enter 9-digit ID"
                maxLength={9}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name *</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Password *</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Role *</Label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <Button
              onClick={handleCreateUser}
              disabled={userForm.userId.length !== 9 || !userForm.name || !userForm.password}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
