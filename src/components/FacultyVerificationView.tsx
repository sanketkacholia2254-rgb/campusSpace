import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { DEMO_FACULTY_PRESETS } from '../data/seedData';
import { useLiveRoom } from '../services/liveRoomStore';
import type { RoomStatus } from '../types';
import { formatRelativeVerifiedTime, RoomStatusText } from './StatusIndicator';

interface FacultyVerificationViewProps {
  initialFocusedRoomId?: string | null;
  onExitToStudent: () => void;
}

export function FacultyVerificationView({
  initialFocusedRoomId,
  onExitToStudent,
}: FacultyVerificationViewProps) {
  const {
    facultySession,
    signInFaculty,
    signOutFaculty,
    rooms,
    availabilityMap,
    statusReports,
    verificationLogs,
    updateRoomStatusByStaff,
    reportCancelledOrExtraLecture,
    resolveStatusReport,
  } = useLiveRoom();

  const [selectedFacultyId, setSelectedFacultyId] = useState(DEMO_FACULTY_PRESETS[0].facultyId);
  const [pin, setPin] = useState('2026');
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Extra lecture / maintenance quick form per room
  const [scheduleRoomId, setScheduleRoomId] = useState<string | null>(initialFocusedRoomId ?? null);
  const [eventMode, setEventMode] = useState<'add_extra' | 'maintenance'>('add_extra');
  const [eventSubject, setEventSubject] = useState('');
  const [eventStart, setEventStart] = useState('11:00');
  const [eventEnd, setEventEnd] = useState('12:00');

  const handleFacultyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length < 4) {
      setAuthError('Enter the 4-digit demo staff PIN (default: 2026).');
      return;
    }
    const found = DEMO_FACULTY_PRESETS.find((f) => f.facultyId === selectedFacultyId);
    if (!found) return;
    setAuthError(null);
    signInFaculty(found);
  };

  if (!facultySession) {
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
              <ShieldCheck className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-[#14213D]">
                Faculty Verification Sign In
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              QR codes never bypass authentication. Sign in as authorized demo faculty to verify classroom occupancy.
            </p>
          </div>

          <form onSubmit={handleFacultyLogin} className="space-y-4">
            <div>
              <label htmlFor="fac-select" className="block text-xs font-medium text-slate-600 mb-1">
                Authorized Demo Faculty
              </label>
              <select
                id="fac-select"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              >
                {DEMO_FACULTY_PRESETS.map((fac) => (
                  <option key={fac.facultyId} value={fac.facultyId}>
                    {fac.name} ({fac.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fac-pin" className="block text-xs font-medium text-slate-600 mb-1">
                Demo Staff PIN (pre-filled: 2026)
              </label>
              <input
                id="fac-pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
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
              Authenticate Faculty Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  const assignedRooms = rooms.filter(
    (r) =>
      facultySession.assignedRoomIds.includes(r.roomId) ||
      r.roomId === initialFocusedRoomId,
  );
  const openReports = statusReports.filter((r) => !r.resolved);

  const handleStatusChange = (roomId: string, newStatus: RoomStatus, reason: string) => {
    updateRoomStatusByStaff({
      roomId,
      newStatus,
      reason,
      actorName: facultySession.name,
      actorRole: 'faculty',
      source: initialFocusedRoomId === roomId ? 'faculty_qr' : 'faculty_panel',
      scheduleVerified: newStatus === 'verified_available' ? true : undefined,
    });
    const room = rooms.find((r) => r.roomId === roomId);
    setActionFeedback(
      `${room?.roomNumber ?? 'Room'} updated to ${newStatus.replace('_', ' ')} — student dashboards synced immediately.`,
    );
  };

  const handleEventSubmit = (e: React.FormEvent, roomId: string) => {
    e.preventDefault();
    if (!eventSubject.trim()) return;
    reportCancelledOrExtraLecture({
      roomId,
      action: eventMode,
      subject: eventSubject.trim(),
      startTime: eventStart,
      endTime: eventEnd,
      actorName: facultySession.name,
    });
    setEventSubject('');
    setScheduleRoomId(null);
    setActionFeedback('Schedule override recorded and synced to student availability engine.');
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
            Faculty Verification Panel
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0">
          <span className="hidden sm:inline text-slate-300">
            {facultySession.name} · {facultySession.department}
          </span>
          <button
            type="button"
            onClick={signOutFaculty}
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {actionFeedback && (
          <div
            role="status"
            className="bg-emerald-50 border border-[#16A34A]/40 text-[#14213D] rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" aria-hidden="true" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Student Reports Queue */}
        {openReports.length > 0 && (
          <section className="bg-white rounded-2xl border border-amber-300 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#14213D]">
              Pending Student Status Reports ({openReports.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {openReports.map((rep) => (
                <div key={rep.reportId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#14213D]">
                      {rep.roomNumber} · Reported by {rep.studentName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{rep.reportedObservation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resolveStatusReport(rep.reportId)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#14213D] whitespace-nowrap"
                  >
                    Mark Reviewed
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assigned Classrooms Verification Controls */}
        <section className="space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#14213D]">
              Assigned Classrooms
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Every official update records your faculty ID, timestamp, and pushes instantaneously to connected student screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedRooms.map((room) => {
              const avail = availabilityMap[room.roomId];
              const isExpanded = scheduleRoomId === room.roomId;
              return (
                <div
                  key={room.roomId}
                  className={`bg-white rounded-2xl border p-5 space-y-4 ${
                    initialFocusedRoomId === room.roomId ? 'border-[#2563EB]' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#14213D]">
                        {room.roomNumber}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {room.buildingName} · {room.floor} · Last verified {formatRelativeVerifiedTime(room.verifiedAtIso)}
                      </p>
                    </div>
                    {avail && <RoomStatusText status={avail.effectiveStatus} />}
                  </div>

                  {/* Quick Official Status Controls */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          room.roomId,
                          'verified_available',
                          'Physically verified vacant and ready for student study.',
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Verify Available
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          room.roomId,
                          'occupied',
                          'Classroom currently occupied by lecture or batch.',
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Mark Occupied
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        reportCancelledOrExtraLecture({
                          roomId: room.roomId,
                          action: 'cancel_next',
                          subject: 'Cancelled Lecture',
                          startTime: '10:00',
                          endTime: '11:00',
                          actorName: facultySession.name,
                        });
                        setActionFeedback(
                          `Cancelled lecture reported for ${room.roomNumber}; room opened for student study.`,
                        );
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-[#14213D] whitespace-nowrap"
                    >
                      Report Cancelled Lecture
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleRoomId(isExpanded ? null : room.roomId)}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-[#14213D] inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Extra Lecture / Maintenance</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <form
                      onSubmit={(e) => handleEventSubmit(e, room.roomId)}
                      className="pt-3 border-t border-slate-100 space-y-3"
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={eventMode === 'add_extra'}
                            onChange={() => setEventMode('add_extra')}
                          />
                          <span>Additional Lecture</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={eventMode === 'maintenance'}
                            onChange={() => setEventMode('maintenance')}
                          />
                          <span>Maintenance Unavailable</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={eventSubject}
                          onChange={(e) => setEventSubject(e.target.value)}
                          placeholder={
                            eventMode === 'maintenance'
                              ? 'e.g. Projector servicing'
                              : 'e.g. Extra DSA Tutorial'
                          }
                          className="h-9 px-3 rounded-lg border border-slate-300 text-xs text-[#14213D]"
                          required
                        />
                        <input
                          type="time"
                          value={eventStart}
                          onChange={(e) => setEventStart(e.target.value)}
                          className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={eventEnd}
                          onChange={(e) => setEventEnd(e.target.value)}
                          className="h-9 px-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Apply Override
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Verification Audit Log */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#14213D]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              Recent Verification Audit Log
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Room</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 font-medium">Transition</th>
                  <th className="py-3 px-4 font-medium">Reason</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationLogs.slice(0, 8).map((log) => (
                  <tr key={log.eventId}>
                    <td className="py-3 px-4 font-semibold text-[#14213D] whitespace-nowrap">
                      {log.roomNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{log.actorName}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {log.oldStatus.replace('_', ' ')} →{' '}
                      <strong className="text-[#14213D]">{log.newStatus.replace('_', ' ')}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.reason}</td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatRelativeVerifiedTime(log.timestampIso)}
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
