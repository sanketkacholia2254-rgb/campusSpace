import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  QrCode,
  Users,
} from 'lucide-react';
import { INSTITUTION_NAME } from '../data/seedData';
import { useLiveRoom } from '../services/liveRoomStore';
import {
  formatCountdownHMS,
  formatMinutesTo12h,
  parseTimeToMinutes,
} from '../utils/availabilityEngine';
import { formatRelativeVerifiedTime, RoomStatusText } from './StatusIndicator';

interface StudentHomeDashboardProps {
  onFindRooms: () => void;
  onSelectRoom: (roomId: string) => void;
  onOpenBooking: () => void;
  onOpenTimetable: () => void;
  onOpenProfile: () => void;
  onOpenQr: () => void;
  onSwitchAccount: () => void;
}

const TIME_PRESETS = [
  { id: 'free-1015', label: '10:15 AM Free', mode: 'demo' as const, minutes: 10 * 60 + 15 },
  { id: 'short-1120', label: '11:20 AM Gap', mode: 'demo' as const, minutes: 11 * 60 + 20 },
  { id: 'class-1215', label: '12:15 PM Lecture', mode: 'demo' as const, minutes: 12 * 60 + 15 },
  { id: 'live', label: 'Live Clock', mode: 'live' as const },
];

export function StudentHomeDashboard({
  onFindRooms,
  onSelectRoom,
  onOpenBooking,
  onOpenTimetable,
  onOpenProfile,
  onOpenQr,
  onSwitchAccount,
}: StudentHomeDashboardProps) {
  const {
    student,
    rooms,
    availabilityMap,
    freeTimeSummary,
    activeReservation,
    clockConfig,
    currentDay,
    currentMinutes,
    currentTotalSeconds,
    setClockPreset,
  } = useLiveRoom();

  const verifiedAvailableRooms = rooms.filter((room) => {
    const avail = availabilityMap[room.roomId];
    return avail?.effectiveStatus === 'verified_available' && avail.availableSectionsCount > 0;
  });

  const totalOpenSections = verifiedAvailableRooms.reduce(
    (acc, room) => acc + (availabilityMap[room.roomId]?.availableSectionsCount ?? 0),
    0,
  );
  const totalOpenDesks = verifiedAvailableRooms.reduce(
    (acc, room) => acc + (availabilityMap[room.roomId]?.availableDesksCount ?? 0),
    0,
  );

  // Live ticking countdown for Free Time remaining (or current lecture remaining)
  const targetEndSeconds =
    freeTimeSummary.state === 'in_lecture' && freeTimeSummary.currentLecture
      ? parseTimeToMinutes(freeTimeSummary.currentLecture.endTime) * 60
      : freeTimeSummary.freeWindowEndMinutes !== null
        ? freeTimeSummary.freeWindowEndMinutes * 60
        : null;

  const liveFreeCountdownSeconds =
    targetEndSeconds !== null ? Math.max(0, targetEndSeconds - currentTotalSeconds) : 0;

  const activeBookingRemainingSeconds = activeReservation
    ? Math.max(0, activeReservation.endMinutes * 60 - currentTotalSeconds)
    : 0;

  const activePresetId =
    clockConfig.mode === 'live'
      ? 'live'
      : clockConfig.demoBaseMinutes === 10 * 60 + 15
        ? 'free-1015'
        : clockConfig.demoBaseMinutes === 11 * 60 + 20
          ? 'short-1120'
          : clockConfig.demoBaseMinutes === 12 * 60 + 15
            ? 'class-1215'
            : '';

  const isFreeNow =
    freeTimeSummary.state === 'free_period' ||
    freeTimeSummary.state === 'before_classes' ||
    (freeTimeSummary.state === 'after_classes' && freeTimeSummary.remainingFreeMinutes > 0) ||
    freeTimeSummary.state === 'no_schedule';

  return (
    <div className="space-y-8">
      {/* Top Hero & Student Identity Section */}
      <section className="bg-[#14213D] text-white rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-xs sm:text-sm text-blue-200 font-medium">
              DY Patil Live Room · {INSTITUTION_NAME}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Find your space. Make your free time productive.
            </h1>

            {/* Student Profile Details — Clean Unboxed Inline Metadata */}
            <div
              data-testid="student-profile-summary"
              className="pt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-200"
            >
              <span className="font-semibold text-white">{student.name}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>{student.department}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>{student.year}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span>{student.division}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="font-mono text-xs text-slate-300">{student.studentId}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors whitespace-nowrap"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onSwitchAccount}
              className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
            >
              Demo Login
            </button>
          </div>
        </div>

        {/* Dynamic Free Time Calculation Panel */}
        <div
          data-testid="free-time-calculator"
          className="mt-6 pt-5 border-t border-white/15 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Free Time Headline + Ticking Comparison */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <p className="text-xs font-medium text-blue-200">
                {freeTimeSummary.state === 'in_lecture'
                  ? 'Current Lecture In Progress'
                  : 'Available Free Time Before Next Lecture'}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {freeTimeSummary.state === 'in_lecture'
                    ? `${freeTimeSummary.remainingLectureMinutes} min left in class`
                    : freeTimeSummary.formattedRemainingFree}
                </p>
                {targetEndSeconds !== null && liveFreeCountdownSeconds > 0 && (
                  <span className="font-mono text-sm text-blue-200 tabular-nums">
                    {formatCountdownHMS(liveFreeCountdownSeconds)} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Crisp 3-Column Comparison Strip: Current Time vs Current Period vs Next Lecture */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-0.5">
              <div>
                <dt className="text-slate-400">Current time</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white tabular-nums">
                  {formatMinutesTo12h(currentMinutes)} · {currentDay}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Current period</dt>
                <dd className="mt-0.5 font-medium text-slate-100 truncate">
                  {freeTimeSummary.currentPeriodLabel}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Next lecture</dt>
                <dd className="mt-0.5 font-medium text-white truncate">
                  {freeTimeSummary.nextLecture
                    ? `${formatMinutesTo12h(parseTimeToMinutes(freeTimeSummary.nextLecture.startTime))} · ${freeTimeSummary.nextLecture.subject}`
                    : 'None remaining today'}
                </dd>
              </div>
            </dl>

            {/* Period Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isFreeNow ? 'bg-[#16A34A]' : 'bg-[#EAB308]'
                  }`}
                  style={{ width: `${Math.max(4, freeTimeSummary.progressPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
                <span>
                  {freeTimeSummary.freeWindowStartMinutes !== null
                    ? `Free since ${formatMinutesTo12h(freeTimeSummary.freeWindowStartMinutes)}`
                    : freeTimeSummary.currentPeriodLabel}
                </span>
                <span>
                  {freeTimeSummary.nextLecture
                    ? `Next: ${formatMinutesTo12h(parseTimeToMinutes(freeTimeSummary.nextLecture.startTime))} (${freeTimeSummary.nextLecture.roomLabel})`
                    : 'Campus study hours close 6:00 PM'}
                </span>
              </div>
            </div>

            {/* Time Simulation Controls for testing dynamic free time math */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-slate-300 mr-1">Time preview:</span>
              {TIME_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setClockPreset({
                        mode: preset.mode,
                        day: 'Monday',
                        minutes: preset.minutes,
                      })
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-[#14213D]'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary CTA Column */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              type="button"
              onClick={onFindRooms}
              className="w-full h-12 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Find Available Rooms</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenTimetable}
                className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Timetable</span>
              </button>
              <button
                type="button"
                onClick={onOpenQr}
                className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Room QR</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Study Session Banner (only shown when student holds an active reservation) */}
      {activeReservation && (
        <section
          aria-label="Active study session"
          className="bg-white rounded-2xl border border-[#2563EB]/30 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Active Study Session</span>
            </div>
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              {activeReservation.roomNumber} · {activeReservation.sectionLabel} ({activeReservation.deskCount} desks)
            </h2>
            <p className="text-sm text-slate-600">
              {activeReservation.buildingName}, {activeReservation.floor} · Ends at{' '}
              <span className="font-medium text-[#14213D] tabular-nums">
                {formatMinutesTo12h(activeReservation.endMinutes)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">Time remaining</p>
              <p className="font-mono text-2xl font-bold text-[#14213D] tabular-nums">
                {formatCountdownHMS(activeBookingRemainingSeconds)}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1E2F54] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Open Session
            </button>
          </div>
        </section>
      )}

      {/* Live Campus Availability Strip */}
      <section aria-label="Live campus availability summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <p className="text-xs font-medium text-slate-500">Verified Available Rooms</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#14213D] tabular-nums">
            {verifiedAvailableRooms.length}
            <span className="text-base font-normal text-slate-400"> / {rooms.length}</span>
          </p>
          <p className="mt-1 text-xs text-[#15803D] font-medium">
            Staff-verified open right now
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <p className="text-xs font-medium text-slate-500">Open Desk Sections</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#14213D] tabular-nums">
            {totalOpenSections}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            4–5 desk clusters ready to reserve
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <p className="text-xs font-medium text-slate-500">Available Study Desks</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#14213D] tabular-nums">
            {totalOpenDesks}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Individual &amp; group study seating
          </p>
        </div>
      </section>

      {/* Recommended Verified Rooms Available Right Now */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#14213D]">
              Ready to Reserve Now
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Verified rooms matched against your {currentDay} timetable (Demo campus inventory).
            </p>
          </div>
          <button
            type="button"
            onClick={onFindRooms}
            className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>View all rooms</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {verifiedAvailableRooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
            <p className="font-display text-base font-semibold text-[#14213D]">
              No verified rooms currently open for this time window
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Switch the time preview above or check Explore to view upcoming vacant classrooms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {verifiedAvailableRooms.slice(0, 3).map((room) => {
              const avail = availabilityMap[room.roomId];
              return (
                <article
                  key={room.roomId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4 hover:border-[#2563EB]/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-[#14213D] truncate">
                          {room.roomNumber}
                        </h3>
                        <RoomStatusText status={avail.effectiveStatus} />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{room.buildingName} · {room.floor}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Max study window</span>
                        <span className="font-semibold text-[#14213D] tabular-nums">
                          {avail.canBook
                            ? avail.formattedAvailableDuration
                            : avail.formattedAvailableDuration}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Open seating</span>
                        <span className="font-medium text-[#14213D] tabular-nums inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          <span>
                            {avail.availableDesksCount} desks · {avail.availableSectionsCount} sections
                          </span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 pt-1">
                        {avail.permittedEndMinutes !== null
                          ? `Available until ${formatMinutesTo12h(avail.permittedEndMinutes)}`
                          : avail.limitingReason}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      Verified {formatRelativeVerifiedTime(room.verifiedAtIso)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room.roomId)}
                      className="px-3.5 py-2 rounded-lg bg-[#14213D] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Select Section
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
