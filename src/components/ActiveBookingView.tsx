import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import {
  formatCountdownHMS,
  formatDurationLabel,
  formatMinutesTo12h,
} from '../utils/availabilityEngine';

interface ActiveBookingViewProps {
  onFindRooms: () => void;
  onReturnHome: () => void;
}

export function ActiveBookingView({ onFindRooms, onReturnHome }: ActiveBookingViewProps) {
  const {
    student,
    activeReservation,
    reservations,
    currentTotalSeconds,
    cancelReservation,
  } = useLiveRoom();

  const [confirmCancel, setConfirmCancel] = useState(false);

  const studentHistory = reservations.filter(
    (res) => res.studentId === student.studentId && res.bookingId !== activeReservation?.bookingId,
  );

  const remainingSeconds = activeReservation
    ? Math.max(0, activeReservation.endMinutes * 60 - currentTotalSeconds)
    : 0;
  const totalSessionSeconds = activeReservation
    ? Math.max(60, (activeReservation.endMinutes - activeReservation.startMinutes) * 60)
    : 1;
  const elapsedPercent = activeReservation
    ? Math.min(100, Math.max(0, Math.round(((totalSessionSeconds - remainingSeconds) / totalSessionSeconds) * 100)))
    : 0;
  const isUnderTenMinutes = activeReservation !== null && remainingSeconds > 0 && remainingSeconds <= 600;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
          My Booking
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your active classroom desk reservation and past study sessions.
        </p>
      </div>

      {/* Active Study Session Card OR Empty State */}
      {activeReservation ? (
        <section
          aria-label="Active study session details"
          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden"
        >
          {/* Top Navy Header Strip */}
          <div className="bg-[#14213D] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-blue-200">
                Your study session is active · Booking {activeReservation.bookingId}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                {activeReservation.roomNumber} · {activeReservation.sectionLabel}
              </h2>
              <p className="text-sm text-slate-300 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-blue-200" aria-hidden="true" />
                  {activeReservation.buildingName}, {activeReservation.floor}
                </span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4 text-blue-200" aria-hidden="true" />
                  {activeReservation.deskCount} desks ({activeReservation.groupSize} reserved)
                </span>
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl px-6 py-4 text-left md:text-right shrink-0">
              <p className="text-xs text-blue-200">Remaining time</p>
              <p
                data-testid="active-countdown"
                className="mt-1 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums"
              >
                {formatCountdownHMS(remainingSeconds)}
              </p>
              <p className="mt-1 text-xs text-slate-300 tabular-nums">
                Ends at {formatMinutesTo12h(activeReservation.endMinutes)}
              </p>
            </div>
          </div>

          {/* Body Details + 10-Minute Alert + Actions */}
          <div className="p-6 sm:p-8 space-y-6">
            {isUnderTenMinutes && (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 flex items-start gap-3 text-sm text-amber-900"
              >
                <AlertTriangle className="h-5 w-5 text-[#EAB308] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Less than 10 minutes remaining</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Please wrap up your study session so the classroom is ready before {formatMinutesTo12h(activeReservation.endMinutes)}.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Started {formatMinutesTo12h(activeReservation.startMinutes)}</span>
                <span>Ends {formatMinutesTo12h(activeReservation.endMinutes)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
                  style={{ width: `${Math.max(3, elapsedPercent)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Schedule constraint: {activeReservation.limitingReason}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onReturnHome}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-[#14213D] transition-colors whitespace-nowrap"
              >
                Return to Dashboard
              </button>

              {!confirmCancel ? (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="px-5 py-2.5 rounded-xl border border-red-200 text-[#DC2626] hover:bg-red-50 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Cancel Booking
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Release this section?</span>
                  <button
                    type="button"
                    onClick={() => {
                      cancelReservation(activeReservation.bookingId);
                      setConfirmCancel(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Yes, Cancel Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Keep Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[#F5F7FB] flex items-center justify-center text-[#2563EB]">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              No Active Study Reservation
            </h2>
            <p className="text-sm text-slate-500">
              Reserve an available 4–5 desk section in a verified vacant classroom to start a timed study session.
            </p>
          </div>
          <button
            type="button"
            onClick={onFindRooms}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <span>Find Available Rooms</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Booking History Table */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[#14213D]">
          Booking History
        </h2>
        {studentHistory.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-6">
            Your past and cancelled reservations will appear here.
          </p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Room &amp; Section</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Window</th>
                  <th className="py-3 px-4 font-medium">Duration</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentHistory.map((item) => (
                  <tr key={item.bookingId} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-medium text-[#14213D] whitespace-nowrap">
                      {item.roomNumber} · {item.sectionLabel}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {item.buildingName}, {item.floor}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {item.day} · {formatMinutesTo12h(item.startMinutes)} – {formatMinutesTo12h(item.endMinutes)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDurationLabel(item.endMinutes - item.startMinutes)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          item.status === 'cancelled'
                            ? 'text-slate-500'
                            : 'text-[#15803D]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
