import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BUILDINGS } from '../data/seedData';
import { useLiveRoom } from '../services/liveRoomStore';
import type { DeskSection, RoomCategory } from '../types';
import { formatMinutesTo12h } from '../utils/availabilityEngine';
import { RoomStatusText } from './StatusIndicator';

interface AdminPanelViewProps {
  onExitToStudent: () => void;
}

export function AdminPanelView({ onExitToStudent }: AdminPanelViewProps) {
  const {
    adminSession,
    signInAdmin,
    signOutAdmin,
    rooms,
    availabilityMap,
    reservations,
    addRoom,
    updateRoomConfig,
  } = useLiveRoom();

  const [adminPin, setAdminPin] = useState('ADMIN2026');
  const [authError, setAuthError] = useState<string | null>(null);

  // Add new classroom form
  const [roomNumber, setRoomNumber] = useState('');
  const [buildingName, setBuildingName] = useState(BUILDINGS[0].name.replace(' (Demo)', ''));
  const [floor, setFloor] = useState('2nd Floor');
  const [category, setCategory] = useState<RoomCategory>('classroom');
  const [sectionCount, setSectionCount] = useState(4);
  const [desksPerSection, setDesksPerSection] = useState(5);
  const [facilitiesText, setFacilitiesText] = useState('Whiteboard, Wi-Fi, Power Outlets');
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  const utilizationChartData = useMemo(() => {
    return rooms.map((room) => {
      const avail = availabilityMap[room.roomId];
      const availableDesks = avail?.availableDesksCount ?? 0;
      const inUseDesks = Math.max(0, room.capacity - availableDesks);
      return {
        name: room.roomNumber.replace('Computer ', ''),
        Available: availableDesks,
        OccupiedOrReserved: inUseDesks,
      };
    });
  }, [rooms, availabilityMap]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim().length < 4) {
      setAuthError('Enter demo admin passkey (default: ADMIN2026).');
      return;
    }
    setAuthError(null);
    signInAdmin({
      adminId: 'ADM-DYP-01',
      name: 'Campus Timetable Coordinator (Demo)',
      roleTitle: 'Academic Space Administrator',
    });
  };

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onExitToStudent}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#14213D]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to Student App</span>
            </button>
            <div className="flex items-center gap-2 pt-2">
              <Settings className="h-5 w-5 text-[#14213D]" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-[#14213D]">
                Administrator Console Sign In
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Restricted demo portal for managing classroom inventory, 4–5 desk sections, and utilization metrics.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="adm-pin" className="block text-xs font-medium text-slate-600 mb-1">
                Demo Admin Passkey (pre-filled: ADMIN2026)
              </label>
              <input
                id="adm-pin"
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 font-mono text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                required
              />
            </div>

            {authError && (
              <p role="alert" className="text-xs font-medium text-[#DC2626]">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#14213D] hover:bg-[#1E2F54] text-white text-sm font-semibold transition-colors"
            >
              Open Administrator Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;
    const zones: DeskSection['zone'][] = [
      'front-left',
      'front-right',
      'center-left',
      'center-right',
      'rear-left',
      'rear-right',
    ];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const sections: DeskSection[] = Array.from({ length: sectionCount }).map((_, i) => ({
      sectionId: `sec-${Date.now()}-${i}`,
      label: `Section ${letters[i] ?? i + 1}`,
      shortCode: letters[i] ?? String(i + 1),
      deskCount: desksPerSection,
      status: 'available',
      zone: zones[i % zones.length],
      hasPowerOutlets: i % 2 === 0,
    }));

    addRoom({
      roomNumber: roomNumber.trim(),
      buildingId: 'bldg-custom',
      buildingName: buildingName.trim() || 'Main Academic Block A',
      floor: floor.trim() || '1st Floor',
      category,
      capacity: sectionCount * desksPerSection,
      facilities: facilitiesText
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      status: 'verified_available',
      verifiedBy: adminSession.name,
      verifiedAtIso: new Date().toISOString(),
      statusSource: 'admin_panel',
      scheduleVerified: true,
      sections,
      timetable: [],
    });

    setCreatedBanner(`Added ${roomNumber.trim()} (${sectionCount} sections × ${desksPerSection} desks).`);
    setRoomNumber('');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="bg-[#14213D] text-white px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitToStudent}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Student View</span>
          </button>
          <span className="font-display text-base font-bold truncate">
            DY Patil Live Room · Admin Console
          </span>
        </div>

        <button
          type="button"
          onClick={signOutAdmin}
          className="inline-flex items-center gap-1 text-xs text-blue-200 hover:text-white whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Room Utilization Analytics (Recharts) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold text-[#14213D] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
                <span>Live Desk Utilization by Classroom (Demo)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Compares currently open student desks against occupied/reserved capacity.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="Available" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar
                  dataKey="OccupiedOrReserved"
                  name="Occupied / Reserved"
                  stackId="a"
                  fill="#14213D"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Add Classroom & Configure Desk Sections */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#14213D]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              Add Classroom &amp; Desk Sections
            </h2>
          </div>

          {createdBanner && (
            <p role="status" className="text-xs font-semibold text-[#15803D] bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {createdBanner}
            </p>
          )}

          <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="adm-room-no" className="block text-xs font-medium text-slate-600 mb-1">
                Room Number
              </label>
              <input
                id="adm-room-no"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 304"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="adm-bldg" className="block text-xs font-medium text-slate-600 mb-1">
                Building
              </label>
              <input
                id="adm-bldg"
                type="text"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label htmlFor="adm-floor" className="block text-xs font-medium text-slate-600 mb-1">
                Floor
              </label>
              <input
                id="adm-floor"
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label htmlFor="adm-cat" className="block text-xs font-medium text-slate-600 mb-1">
                Room Type
              </label>
              <select
                id="adm-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as RoomCategory)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
              >
                <option value="classroom">Regular Classroom</option>
                <option value="computer_lab">Computer Lab</option>
                <option value="group_study">Group Study Space</option>
              </select>
            </div>

            <div>
              <label htmlFor="adm-sec" className="block text-xs font-medium text-slate-600 mb-1">
                Sections (× {desksPerSection} desks)
              </label>
              <div className="flex gap-1.5">
                <select
                  id="adm-sec"
                  value={sectionCount}
                  onChange={(e) => setSectionCount(Number(e.target.value))}
                  className="w-1/2 h-10 px-2 rounded-lg border border-slate-300 bg-white text-sm"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} sec</option>
                  ))}
                </select>
                <select
                  aria-label="Desks per section"
                  value={desksPerSection}
                  onChange={(e) => setDesksPerSection(Number(e.target.value))}
                  className="w-1/2 h-10 px-2 rounded-lg border border-slate-300 bg-white text-sm"
                >
                  <option value={4}>4 desks</option>
                  <option value={5}>5 desks</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-10 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Room</span>
              </button>
            </div>

            <div className="sm:col-span-2 lg:col-span-6">
              <label htmlFor="adm-fac" className="block text-xs font-medium text-slate-600 mb-1">
                Facilities (comma-separated)
              </label>
              <input
                id="adm-fac"
                type="text"
                value={facilitiesText}
                onChange={(e) => setFacilitiesText(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </form>
        </section>

        {/* Classroom Inventory Table */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#14213D]">
            Configured Campus Inventory ({rooms.length} demo spaces)
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Room</th>
                  <th className="py-3 px-4 font-medium">Building &amp; Floor</th>
                  <th className="py-3 px-4 font-medium">Sections / Capacity</th>
                  <th className="py-3 px-4 font-medium">Schedule Verified</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => {
                  const avail = availabilityMap[room.roomId];
                  return (
                    <tr key={room.roomId}>
                      <td className="py-3 px-4 font-semibold text-[#14213D] whitespace-nowrap">
                        {room.roomNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {room.buildingName} · {room.floor}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                        {room.sections.length} sections · {room.capacity} desks
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            updateRoomConfig(room.roomId, {
                              scheduleVerified: !room.scheduleVerified,
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          {room.scheduleVerified ? 'Verified (Toggle off)' : 'Unverified (Verify)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {avail && <RoomStatusText status={avail.effectiveStatus} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reservation Records Table */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#14213D]">
            Student Reservation Records ({reservations.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Booking ID</th>
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Space</th>
                  <th className="py-3 px-4 font-medium">Window</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => (
                  <tr key={res.bookingId}>
                    <td className="py-3 px-4 font-mono text-xs text-[#14213D] whitespace-nowrap">
                      {res.bookingId}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {res.studentName} ({res.department})
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {res.roomNumber} · {res.sectionLabel}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums whitespace-nowrap">
                      {res.day} {formatMinutesTo12h(res.startMinutes)}–{formatMinutesTo12h(res.endMinutes)}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-xs whitespace-nowrap">
                      {res.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
