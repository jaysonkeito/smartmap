'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { LoginView } from '@/components/login-view';
import { HomeView } from '@/components/home-view';
import { MapView } from '@/components/map-view';
import { ProfileView } from '@/components/profile-view';
import { HelpView } from '@/components/help-view';
import { AdminView } from '@/components/admin-view';
import { BottomNav } from '@/components/bottom-nav';
import { FlashMessage } from '@/components/flash-message';

export default function Home() {
  const { isLoggedIn, currentView, user } = useAppStore();

  if (!isLoggedIn) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <FlashMessage />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-emerald-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            <h1 className="font-bold text-emerald-800">NORSU SmartMap</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.isAdmin && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 text-xs">
              Bayawan—Sta. Catalina
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full relative" style={{ minHeight: 'calc(100vh - 7.5rem)' }}>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <HomeView />
            </motion.div>
          )}
          {currentView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-7.5rem)]"
            >
              <MapView />
            </motion.div>
          )}
          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView />
            </motion.div>
          )}
          {currentView === 'admin' && user?.isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto pb-20"
              style={{ maxHeight: 'calc(100vh - 7.5rem)' }}
            >
              <AdminView />
            </motion.div>
          )}
          {currentView === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <HelpView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
