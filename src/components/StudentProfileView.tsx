import React, { useState } from 'react';
import {
  Check,
  Clock,
  LogOut,
  MapPin,
  QrCode,
  RotateCcw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  DIVISIONS,
  INSTITUTION_NAME,
} from '../data/seedData';
import { useLiveRoom } from '../services/liveRoomStore';
import { formatMinutesTo12h } from '../utils/availabilityEngine';
import { RoomStatusText } from './StatusIndicator';

interface StudentProfileViewProps {
  onSelectRoom: (roomId: string) => void;
  onOpenBooking: () => void;
  onOpenQr: () => void;
  onOpenFaculty: () => void;
  onOpenAdmin: () => void;
  onSwitchAccount: () => void;
}

export function StudentProfileView({
  onSelectRoom,
  onOpenBooking,
  onOpenQr,
  onOpenFaculty,
  onOpenAdmin,
  onSwitchAccount,
}: StudentProfileViewProps) {
  const {
    student,
    updateStudentProfile,
    activeReservation,
    reservations,
    rooms,
    recentRoomIds,
    availabilityMap,
    resetDemoData,
  } = useLiveRoom();

  const [name, setName] = useState(student.name);
  const [studentId, setStudentId] = useState(student.studentId);
  const [email, setEmail] = useState(student.email);
  const [department, setDepartment] = useState(student.department);
  const [year, setYear] = useState(student.year);
  const [division, setDivision] = useState(student.division);
  const [savedNotice, setSavedNotice] = useState(false);

  const recentRooms = recentRoomIds
    .map((id) => rooms.find((r) => r.roomId === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const studentBookings = reservations.filter((r) => r.studentId === student.studentId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    updateStudentProfile({
      name: name.trim(),
      studentId: studentId.trim() || student.studentId,
      email: email.trim(),
      department,
      year,
      division,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
            Student Profile
          </h1>
          <p className="mt-1 text-sm text-slate-600">{INSTITUTION_NAME}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenQr}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#14213D] whitespace-nowrap"
          >
            <QrCode className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
            <span>Room QR Mode</span>
          </button>
          <button
            type="button"
            onClick={onSwitchAccount}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Switch Student</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editable Student Details Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              Academic Profile Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes update your Home Dashboard and booking records immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-slate-600 mb-1">
                Student Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="prof-id" className="block text-xs font-medium text-slate-600 mb-1">
                Student ID
              </label>
              <input
                id="prof-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-email" className="block text-xs font-medium text-slate-600 mb-1">
              College Email
            </label>
            <input
              id="prof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="prof-dept" className="block text-xs font-medium text-slate-600 mb-1">
              Department
            </label>
            <select
              id="prof-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-year" className="block text-xs font-medium text-slate-600 mb-1">
                Year
              </label>
              <select
                id="prof-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-div" className="block text-xs font-medium text-slate-600 mb-1">
                Division
              </label>
              <select
                id="prof-div"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              >
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Save Profile Changes
            </button>

            {savedNotice && (
              <span role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Profile updated</span>
              </span>
            )}
          </div>
        </form>

        {/* Right Column: Active Session, Recent Rooms, and Separate Staff Access */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Reservation Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#14213D]">
                Active Reservation
              </h2>
              <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            {activeReservation ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#14213D]">
                  {activeReservation.roomNumber} · {activeReservation.sectionLabel}
                </p>
                <p className="text-xs text-slate-600">
                  Until {formatMinutesTo12h(activeReservation.endMinutes)} · {activeReservation.buildingName}
                </p>
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  Open Countdown Timer
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No active reservation right now. Total past bookings: {studentBookings.length}.
              </p>
            )}
          </div>

          {/* Recently Visited Rooms */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#14213D]">
              Recently Visited Rooms
            </h2>
            {recentRooms.length === 0 ? (
              <p className="text-xs text-slate-500">Rooms you inspect will appear here.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRooms.map((room) => {
                  const avail = availabilityMap[room.roomId];
                  return (
                    <button
                      key={room.roomId}
                      type="button"
                      onClick={() => onSelectRoom(room.roomId)}
                      className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:text-[#2563EB] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#14213D] truncate">
                          {room.roomNumber}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span>{room.buildingName} · {room.floor}</span>
                        </p>
                      </div>
                      {avail && <RoomStatusText status={avail.effectiveStatus} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Separate Supporting Staff Panels (Faculty & Admin) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#14213D]">
                Staff &amp; Prototype Controls
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kept separate from student navigation. Requires demo staff sign-in.
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenFaculty}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[#2563EB] text-left text-sm font-medium text-[#14213D] flex items-center justify-between transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                  <span>Faculty Verification Panel</span>
                </span>
                <span className="text-xs text-slate-400">Staff login</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[#2563EB] text-left text-sm font-medium text-[#14213D] flex items-center justify-between transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#14213D]" aria-hidden="true" />
                  <span>Administrator Console</span>
                </span>
                <span className="text-xs text-slate-400">Admin login</span>
              </button>

              <button
                type="button"
                onClick={resetDemoData}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs font-medium text-slate-600 flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Prototype Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
