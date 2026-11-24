import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  Bell,
  CalendarDays,
  Clock,
  Compass,
  Home,
  QrCode,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import type { StudentTab } from '../types';
import { formatMinutesTo12h } from '../utils/availabilityEngine';
import { formatRelativeVerifiedTime } from './StatusIndicator';

interface LayoutShellProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  onOpenQr: () => void;
  onOpenFaculty: () => void;
  onOpenAdmin: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: StudentTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'booking', label: 'My Booking', icon: Clock },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'profile', label: 'Profile', icon: User },
];

const TAB_TITLES: Record<StudentTab, string> = {
  home: 'Student Dashboard',
  explore: 'Find Available Rooms',
  booking: 'My Active Study Session',
  timetable: 'Weekly Timetable',
  profile: 'Student Profile',
};

export function LayoutShell({
  activeTab,
  onSelectTab,
  onOpenQr,
  onOpenFaculty,
  onOpenAdmin,
  children,
}: LayoutShellProps) {
  const {
    student,
    currentDay,
    currentMinutes,
    clockConfig,
    activeReservation,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    dismissNotification,
  } = useLiveRoom();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const formattedDate = dayjs().format('D MMM YYYY');
  const formattedTime = formatMinutesTo12h(currentMinutes);

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next && unreadNotificationsCount > 0) {
        markAllNotificationsRead();
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#14213D] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="px-6 py-5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] rounded-sm"
          >
            <span className="font-display text-lg font-bold tracking-tight text-[#14213D] whitespace-nowrap block">
              DY Patil Live Room
            </span>
          </button>
          <p className="mt-1 text-xs text-slate-500 leading-snug">
            Pimpri, Akurdi, Pune
          </p>
        </div>

        <nav aria-label="Student primary navigation" className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[#14213D] text-white'
                    : 'text-slate-600 hover:text-[#14213D] hover:bg-slate-100/80'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'booking' && activeReservation && (
                  <span
                    className={`text-[11px] font-mono tabular-nums font-semibold ${
                      isActive ? 'text-emerald-300' : 'text-[#15803D]'
                    }`}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={onOpenQr}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-[#14213D] hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <QrCode className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden="true" />
            <span>Room QR Check-In</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={onOpenFaculty}
              className="hover:text-[#14213D] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Faculty</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-[#14213D] transition-colors whitespace-nowrap"
            >
              Admin Console
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 h-14 lg:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile wordmark OR Desktop contextual title */}
          <div className="min-w-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="lg:hidden font-display text-base font-bold tracking-tight text-[#14213D] whitespace-nowrap shrink-0"
            >
              DY Patil Live Room
            </button>
            <h2 className="hidden lg:block font-display text-base font-semibold text-[#14213D] truncate">
              {TAB_TITLES[activeTab]}
            </h2>
          </div>

          {/* Right: Current date/time, notifications, student profile */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div
              className="hidden sm:flex items-center gap-2 text-xs text-slate-600 tabular-nums whitespace-nowrap"
              aria-label="Current campus date and time"
            >
              <span className="font-medium text-[#14213D]">{currentDay}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{formattedDate}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-mono font-semibold text-[#14213D]">{formattedTime}</span>
              {clockConfig.mode === 'demo' && (
                <span className="text-slate-400">(Demo)</span>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenQr}
              aria-label="Open Room QR Check-In"
              className="lg:hidden min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-[#14213D] hover:bg-slate-100 transition-colors"
            >
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Notifications popover trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label={`Notifications (${unreadNotificationsCount} unread)`}
                aria-expanded={notificationsOpen}
                className="relative min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-[#14213D] hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  role="region"
                  aria-label="In-app notifications"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg z-40 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-[#14213D]">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500 text-center">
                        No notifications right now.
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.notificationId} className="px-4 py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#14213D] leading-snug">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                              {item.message}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
                              {formatRelativeVerifiedTime(item.createdAtIso)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => dismissNotification(item.notificationId)}
                            aria-label={`Dismiss ${item.title}`}
                            className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student profile trigger */}
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              aria-label={`Open student profile for ${student.name}`}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100/80 transition-colors shrink-0"
            >
              <span className="h-8 w-8 rounded-lg bg-[#14213D] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {initials || 'ST'}
              </span>
              <span className="hidden md:block text-left min-w-0">
                <span className="block text-sm font-medium text-[#14213D] leading-tight truncate max-w-[130px]">
                  {student.name}
                </span>
                <span className="block text-[11px] text-slate-500 leading-tight truncate max-w-[130px]">
                  {student.department}
                </span>
              </span>
            </button>
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (5 tabs, compact 60px height) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 h-[60px]"
      >
        <div className="grid grid-cols-5 h-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                  isActive ? 'text-[#2563EB]' : 'text-slate-500 hover:text-[#14213D]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
