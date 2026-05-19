'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  Building2,
  DoorOpen,
  BookOpen,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';

export function HomeView() {
  const { user, buildings, setCurrentView } = useAppStore();
  const totalRooms = buildings.reduce((acc, b) => acc + b.rooms.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4"
    >
      {/* Welcome Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-900">
                Welcome, {user?.name}!
              </CardTitle>
              <CardDescription className="text-emerald-600">
                {user?.role} &bull; ID: {user?.userId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Button
            onClick={() => setCurrentView('map')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
          >
            <MapPin className="h-4 w-4" />
            Open Campus Map
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-emerald-100">
            <CardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-emerald-800">{buildings.length}</p>
              <p className="text-xs text-muted-foreground">Buildings</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-emerald-100">
            <CardContent className="p-4 text-center">
              <DoorOpen className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-emerald-800">{totalRooms}</p>
              <p className="text-xs text-muted-foreground">Rooms</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* University Branding */}
      <Card className="border-emerald-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <BookOpen className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-900">
                NORSU Bayawan—Santa Catalina Campus
              </p>
              <p className="text-xs text-muted-foreground">
                Smart Campus Navigation System
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
