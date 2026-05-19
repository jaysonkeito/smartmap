'use client';

import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  Map as MapIcon,
  User,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { useAppStore, type ViewType } from '@/store/app-store';

export function BottomNav() {
  const { currentView, setCurrentView, user } = useAppStore();

  const tabs: { view: ViewType; icon: React.ReactNode; label: string; adminOnly?: boolean }[] = [
    { view: 'home', icon: <HomeIcon className="h-5 w-5" />, label: 'Home' },
    { view: 'map', icon: <MapIcon className="h-5 w-5" />, label: 'Map' },
    { view: 'profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
    { view: 'admin', icon: <Shield className="h-5 w-5" />, label: 'Admin', adminOnly: true },
    { view: 'help', icon: <HelpCircle className="h-5 w-5" />, label: 'Help' },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || user?.isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {visibleTabs.map((tab) => {
          const isActive = currentView === tab.view;
          return (
            <button
              key={tab.view}
              onClick={() => setCurrentView(tab.view)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-muted-foreground hover:text-emerald-500'
              }`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 w-12 h-0.5 bg-emerald-600 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
