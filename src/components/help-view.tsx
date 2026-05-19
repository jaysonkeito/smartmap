'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  Map as MapIcon,
  Building2,
  Search,
  MapPin,
  Shield,
  Info,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HelpView() {
  const features = [
    {
      icon: <MapIcon className="h-5 w-5" />,
      title: 'Interactive Campus Map',
      description: 'Explore the NORSU Bayawan—Santa Catalina Campus with an interactive map showing all buildings and their locations.',
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: 'Building & Room Directory',
      description: 'Click on any building to see all rooms inside. Click a room to see who\'s currently present.',
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: 'Live Search',
      description: 'Search for rooms or people in real-time. Find where your classmates or professors are currently located.',
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Room Login',
      description: 'Faculty, staff, and students can log into rooms to mark their presence on the campus map.',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure Authentication',
      description: 'Only verified NORSU Bayawan—Santa Catalina Campus members with registered IDs can access the system.',
    },
  ];

  const howTo = [
    'Sign in using your 9-digit NORSU ID number and password.',
    'If you don\'t have a password yet, click "Sign Up" to create one.',
    'Use the Map tab to view the interactive campus map.',
    'Click on any building polygon to see its rooms.',
    'Click a room to view faculty, staff, and students currently present.',
    'Use the search bar to quickly find rooms or people.',
    'In your Profile, you can log into a room to mark your presence.',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4"
    >
      {/* About Card */}
      <Card className="border-emerald-200 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap className="h-6 w-6" />
            <h2 className="font-bold text-lg">NORSU SmartMap</h2>
          </div>
        </div>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The NORSU SmartMap is a campus navigation system designed for Negros Oriental
            State University - Bayawan—Santa Catalina Campus. It helps students, faculty, and staff
            navigate the campus, find rooms, and locate people in real-time.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
            <Info className="h-4 w-4" />
            Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
            <Navigation className="h-4 w-4" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {howTo.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-muted-foreground leading-6">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </motion.div>
  );
}
