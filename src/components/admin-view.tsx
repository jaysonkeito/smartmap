'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  DoorOpen,
  Users,
  BookOpen,
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
  Mail,
  GraduationCap,
  UserCheck,
  UserX,
  RotateCcw,
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

// ─── NORSU Constants ───
const COLLEGES = [
  'College of Agriculture and Forestry (CAF)',
  'College of Arts and Sciences (CAS)',
  'College of Business Administration (CBA)',
  'College of Criminal Justice Education (CCJE)',
  'College of Industrial Technology (CIT)',
  'College of Teacher Education (CTED)',
];

const PROGRAMS_BY_COLLEGE: Record<string, string[]> = {
  'College of Agriculture and Forestry (CAF)': ['Bachelor of Agricultural Technology', 'Bachelor of Science in Forestry', 'Bachelor of Science in Agricultural Extension'],
  'College of Arts and Sciences (CAS)': ['Bachelor of Arts in English', 'Bachelor of Arts in Political Science', 'Bachelor of Science in Biology', 'Bachelor of Science in Mathematics', 'Bachelor of Science in Psychology'],
  'College of Business Administration (CBA)': ['Bachelor of Science in Business Administration', 'Bachelor of Science in Entrepreneurship'],
  'College of Criminal Justice Education (CCJE)': ['Bachelor of Science in Criminology'],
  'College of Industrial Technology (CIT)': ['Bachelor of Industrial Technology', 'Bachelor of Science in Information Technology', 'Bachelor of Science in Electronics Technology'],
  'College of Teacher Education (CTED)': ['Bachelor of Elementary Education', 'Bachelor of Secondary Education', 'Bachelor of Physical Education'],
};

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// ─── Interfaces ───
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
  email?: string | null;
  college?: string | null;
  program?: string | null;
  yearLevel?: string | null;
  department?: string | null;
  position?: string | null;
  isActive?: boolean;
  lastActivityAt?: string | null;
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

const defaultUserForm = {
  userId: '',
  name: '',
  password: '',
  role: 'Student',
  email: '',
  college: '',
  program: '',
  yearLevel: '',
  department: '',
  position: '',
};

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
  const [userForm, setUserForm] = useState({ ...defaultUserForm });

  // Edit user dialog
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ ...defaultUserForm });

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
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit
      ? { adminUserId, id: editingBuilding.id, ...buildingForm }
      : { adminUserId, ...buildingForm };

    try {
      const res = await fetch('/api/admin/buildings', {
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
        setUserForm({ ...defaultUserForm });
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to create user' });
    }
  };

  const handleEditUser = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          userId: editUserForm.userId,
          name: editUserForm.name,
          email: editUserForm.email || null,
          college: editUserForm.college || null,
          program: editUserForm.program || null,
          yearLevel: editUserForm.yearLevel || null,
          department: editUserForm.department || null,
          position: editUserForm.position || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'User updated' });
        setShowEditUserDialog(false);
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Deactivate this user? They will not be able to log in.')) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-user-id': adminUserId },
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'User deactivated' });
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to deactivate user' });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, userId, isActive: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'User reactivated' });
        fetchUsers();
      } else {
        setFlashMessage({ type: 'error', text: data.error });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Failed to reactivate user' });
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

  const openEditUser = (u: AdminUser) => {
    setEditUserForm({
      userId: u.userId,
      name: u.name,
      password: '',
      role: u.role,
      email: u.email || '',
      college: u.college || '',
      program: u.program || '',
      yearLevel: u.yearLevel || '',
      department: u.department || '',
      position: u.position || '',
    });
    setShowEditUserDialog(true);
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

        {/* ─── Users Tab (Enhanced) ─── */}
        <TabsContent value="users" className="px-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-800">Users ({users.length})</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1"
              onClick={() => {
                setUserForm({ ...defaultUserForm });
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
              {users.map((u) => {
                const isDeactivated = u.isActive === false;
                return (
                  <motion.div
                    key={u.userId}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
                      isDeactivated
                        ? 'border-gray-200 bg-gray-50/50 opacity-60'
                        : 'border-emerald-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                      isDeactivated ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold truncate">{u.name}</p>
                        {u.isAdmin && <Shield className="h-3 w-3 text-red-500 shrink-0" />}
                        {isDeactivated && (
                          <Badge className="bg-gray-200 text-gray-600 text-[9px] h-4 px-1">Deactivated</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground">{u.userId}</span>
                        <Badge className={`${roleColorMap[u.role] || 'bg-gray-100 text-gray-800'} text-[10px] h-4 px-1.5`}>
                          {u.role}
                        </Badge>
                      </div>
                      {/* Additional info badges */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {u.role === 'Student' && u.college && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-200 text-emerald-700">
                            <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                            {u.college.replace('College of ', '').replace(' (', ' (').split(' (')[0]}
                          </Badge>
                        )}
                        {u.role === 'Student' && u.yearLevel && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-teal-200 text-teal-700">
                            {u.yearLevel}
                          </Badge>
                        )}
                        {u.role === 'Staff' && u.department && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-200 text-amber-700">
                            {u.department}
                          </Badge>
                        )}
                        {u.role === 'Staff' && u.position && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-200 text-amber-700">
                            {u.position}
                          </Badge>
                        )}
                        {u.role === 'Faculty' && u.college && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-200 text-emerald-700">
                            <Building2 className="h-2.5 w-2.5 mr-0.5" />
                            {u.college.replace('College of ', '').split(' (')[0]}
                          </Badge>
                        )}
                        {u.email && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-gray-200 text-gray-600">
                            <Mail className="h-2.5 w-2.5 mr-0.5" />
                            {u.email}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600"
                        onClick={() => openEditUser(u)}
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!isDeactivated ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeactivateUser(u.userId)}
                          title="Deactivate user"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600"
                          onClick={() => handleReactivateUser(u.userId)}
                          title="Reactivate user"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-[10px] shrink-0 ${u.isAdmin ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                        onClick={() => handleToggleAdmin(u.userId, u.isAdmin)}
                      >
                        {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
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
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={handleAssignOffice}
                    disabled={!assignForm.userId}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                  >
                    Assign to Office
                  </Button>
                </div>
              )}

              {officeAssignments && selectedOfficeId && (
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700">
                    Current Assignments
                    {officeRoomInfo && (
                      <span className="text-muted-foreground font-normal"> — {officeRoomInfo.name}</span>
                    )}
                  </p>
                  {Object.entries(officeAssignments).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No members assigned</p>
                  ) : (
                    Object.entries(officeAssignments).map(([role, members]) => (
                      <div key={role}>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">{role}s</p>
                        {members.map((m) => (
                          <div key={m.assignmentId} className="flex items-center justify-between p-2 rounded-md bg-emerald-50/50 mb-1">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <div>
                                <p className="text-xs font-medium">{m.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{m.userId}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAssignment(m.assignmentId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isLoading && offices.length === 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Building Dialog ─── */}
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

      {/* ─── Add User Dialog (Enhanced) ─── */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account (Faculty, Staff, Student, or Admin)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-sm">Role *</Label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value, college: '', program: '', yearLevel: '', department: '', position: '' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Common fields */}
            <div className="space-y-1.5">
              <Label className="text-sm">User ID *</Label>
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
              <Label className="text-sm flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email (optional)
              </Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Email address"
              />
            </div>

            {/* Student-specific fields */}
            {userForm.role === 'Student' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-emerald-700">Student Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    College
                  </Label>
                  <select
                    value={userForm.college}
                    onChange={(e) => setUserForm({ ...userForm, college: e.target.value, program: '' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select college --</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {userForm.college && PROGRAMS_BY_COLLEGE[userForm.college] && (
                  <div className="space-y-1.5">
                    <Label className="text-sm flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Program
                    </Label>
                    <select
                      value={userForm.program}
                      onChange={(e) => setUserForm({ ...userForm, program: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Select program --</option>
                      {PROGRAMS_BY_COLLEGE[userForm.college].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm">Year Level</Label>
                  <select
                    value={userForm.yearLevel}
                    onChange={(e) => setUserForm({ ...userForm, yearLevel: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select year level --</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Staff-specific fields */}
            {userForm.role === 'Staff' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-amber-700">Staff Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">Department</Label>
                  <Input
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    placeholder="Department name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Position</Label>
                  <Input
                    value={userForm.position}
                    onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                    placeholder="Position / Job title"
                  />
                </div>
              </>
            )}

            {/* Faculty-specific fields */}
            {userForm.role === 'Faculty' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-emerald-700">Faculty Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    College
                  </Label>
                  <select
                    value={userForm.college}
                    onChange={(e) => setUserForm({ ...userForm, college: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select college --</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm">Password (optional)</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Leave empty for default"
              />
              <p className="text-[10px] text-muted-foreground">Leave empty to use last name as default password</p>
            </div>

            <Button
              onClick={handleCreateUser}
              disabled={userForm.userId.length === 0 || !userForm.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ─── */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information for {editUserForm.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">User ID</Label>
              <Input value={editUserForm.userId} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name *</Label>
              <Input
                value={editUserForm.name}
                onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                placeholder="Email address"
              />
            </div>

            {/* Student fields */}
            {editUserForm.role === 'Student' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-teal-700">Student Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    College
                  </Label>
                  <select
                    value={editUserForm.college}
                    onChange={(e) => setEditUserForm({ ...editUserForm, college: e.target.value, program: '' })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select college --</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {editUserForm.college && PROGRAMS_BY_COLLEGE[editUserForm.college] && (
                  <div className="space-y-1.5">
                    <Label className="text-sm flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Program
                    </Label>
                    <select
                      value={editUserForm.program}
                      onChange={(e) => setEditUserForm({ ...editUserForm, program: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">-- Select program --</option>
                      {PROGRAMS_BY_COLLEGE[editUserForm.college].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm">Year Level</Label>
                  <select
                    value={editUserForm.yearLevel}
                    onChange={(e) => setEditUserForm({ ...editUserForm, yearLevel: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select year level --</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Faculty fields */}
            {editUserForm.role === 'Faculty' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-emerald-700">Faculty Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    College
                  </Label>
                  <select
                    value={editUserForm.college}
                    onChange={(e) => setEditUserForm({ ...editUserForm, college: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Select college --</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Staff fields */}
            {editUserForm.role === 'Staff' && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-amber-700">Staff Details</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">Department</Label>
                  <Input
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    placeholder="Department name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Position</Label>
                  <Input
                    value={editUserForm.position}
                    onChange={(e) => setEditUserForm({ ...editUserForm, position: e.target.value })}
                    placeholder="Position / Job title"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleEditUser}
              disabled={!editUserForm.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
