'use client';

import React, { useState } from 'react';
import { HeartHandshake, MapPin, Bell, ShieldCheck, UserCheck, CheckCircle2, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeView: 'donor' | 'admin';
  onToggleView: (view: 'donor' | 'admin') => void;
  notificationCount?: number;
}

export default function Navbar({ activeView, onToggleView, notificationCount = 3 }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    {
      id: 1,
      title: "New Match Notification",
      message: "Suame Youth & Children Shelter updated their urgent funding gap indicator (+GHS 8,000).",
      time: "10 mins ago",
      type: "match"
    },
    {
      id: 2,
      title: "High Urgency Alert",
      message: "Bantama Grace Orphan Care hasn't received a donation in over 95 days.",
      time: "2 hours ago",
      type: "urgency"
    },
    {
      id: 3,
      title: "New Institution Registered",
      message: "Kronum New Life Orphanage joined the platform in Kronum district.",
      time: "1 day ago",
      type: "system"
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                GoFundUs
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                AI Semantic Match
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Kumasi Metropolitan Area Orphanage Discovery Platform
            </p>
          </div>
        </div>

        {/* Location Badge & Mode Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Kumasi Location Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Kumasi, Ghana</span>
          </div>

          {/* Notifications Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[100] text-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Match & Urgency Alerts
                  </h4>
                  <span className="text-[10px] text-slate-500">Live Feedback</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {mockNotifications.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Mode Switcher (Donor vs Admin) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => onToggleView('donor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'donor'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Donor View</span>
            </button>
            <button
              onClick={() => onToggleView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institution Admin</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
