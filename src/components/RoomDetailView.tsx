import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DoorOpen,
  Flag,
  MapPin,
  Plug,
  Sun,
  Users,
} from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import type { DeskSection, Reservation, SectionStatus } from '../types';
import {
  formatDurationLabel,
  formatMinutesTo12h,
  getEffectiveSectionStatus,
  parseTimeToMinutes,
} from '../utils/availabilityEngine';
import { formatRelativeVerifiedTime, RoomStatusText, SectionStatusText } from './StatusIndicator';

interface RoomDetailViewProps {
  roomId: string;
  onBack: () => void;
  onGoToBooking: () => void;
}

const SECTION_TILE_STYLES: Record<SectionStatus, string> = {
  available:
    'bg-emerald-50/70 border-[#16A34A]/45 hover:border-[#16A34A] hover:bg-emerald-50 text-[#14213D] cursor-pointer',
  occupied:
    'bg-red-50/60 border-[#DC2626]/35 text-slate-600 cursor-not-allowed opacity-85',
  reserved:
    'bg-amber-50/70 border-[#EAB308]/50 text-slate-700 cursor-not-allowed opacity-90',
  unavailable:
    'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed opacity-80',
};

const DESK_MINI_STYLES: Record<SectionStatus, string> = {
  available: 'bg-[#16A34A]/85',
  occupied: 'bg-[#DC2626]/80',
  reserved: 'bg-[#EAB308]/85',
  unavailable: 'bg-[#9CA3AF]/80',
};

export function RoomDetailView({ roomId, onBack, onGoToBooking }: RoomDetailViewProps) {
  const {
    rooms,
    availabilityMap,
    reservations,
    currentDay,
    currentMinutes,
    createReservation,
    submitStatusReport,
    freeTimeSummary,
  } = useLiveRoom();

  const room = rooms.find((r) => r.roomId === roomId);
  const avail = room ? availabilityMap[room.roomId] : undefined;

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedDurationMins, setSelectedDurationMins] = useState<number | null>(null);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Reservation | null>(null);

  // Student status report form state (BR-06)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const sectionStatuses = useMemo(() => {
    if (!room) return {} as Record<string, SectionStatus>;
    const map: Record<string, SectionStatus> = {};
    for (const sec of room.sections) {
      if (avail && (avail.effectiveStatus === 'occupied' || avail.effectiveStatus === 'unknown')) {
        map[sec.sectionId] = avail.effectiveStatus === 'occupied' ? 'occupied' : 'unavailable';
      } else {
        map[sec.sectionId] = getEffectiveSectionStatus(
          sec,
          room.roomId,
          currentDay,
          currentMinutes,
          reservations,
        );
      }
    }
    return map;
  }, [room, avail, currentDay, currentMinutes, reservations]);

  if (!room || !avail) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <p className="font-display text-lg font-semibold text-[#14213D]">Classroom not found</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-[#14213D] text-white text-sm font-medium"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  const selectedSection: DeskSection | null =
    room.sections.find((s) => s.sectionId === selectedSectionId) ?? null;

  const maxMinutes = avail.availableMinutes;
  const effectiveDurationMins =
    selectedDurationMins !== null && selectedDurationMins <= maxMinutes
      ? selectedDurationMins
      : maxMinutes;
  const computedEndMinutes = currentMinutes + effectiveDurationMins;

  // Build quick duration presets strictly <= earliest restriction (BR-04)
  const durationOptions: number[] = [];
  if (avail.canBook && maxMinutes >= 10) {
    for (const step of [30, 60, 90, 120]) {
      if (step < maxMinutes) durationOptions.push(step);
    }
    durationOptions.push(maxMinutes);
  }

  const handleSelectSection = (section: DeskSection) => {
    const secStatus = sectionStatuses[section.sectionId];
    if (!avail.canBook || secStatus !== 'available') return;
    setSelectedSectionId(section.sectionId);
    setSelectedDurationMins(avail.availableMinutes);
    setGroupSize((prev) => Math.min(section.deskCount, Math.max(1, prev)));
    setBookingError(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedSection) return;
    const res = createReservation({
      roomId: room.roomId,
      sectionId: selectedSection.sectionId,
      endMinutes: computedEndMinutes,
      groupSize,
    });
    if (!res.ok) {
      setBookingError(res.error ?? 'Could not complete reservation.');
      return;
    }
    setBookingError(null);
    setConfirmedBooking(res.reservation ?? null);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;
    submitStatusReport(room.roomId, reportNote);
    setReportNote('');
    setReportSent(true);
    setReportOpen(false);
  };

  // Reservation Confirmation State (Requirement 9)
  if (confirmedBooking) {
    const durationMins = confirmedBooking.endMinutes - confirmedBooking.startMinutes;
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3.5">
          <CheckCircle2 className="h-7 w-7 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#14213D]">
              Study Space Reserved
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Booking ID <span className="font-mono font-semibold text-[#14213D]">{confirmedBooking.bookingId}</span> · Your desk section is locked until{' '}
              <span className="font-semibold text-[#14213D] tabular-nums">
                {formatMinutesTo12h(confirmedBooking.endMinutes)}
              </span>.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 py-5 border-y border-slate-100 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Classroom</dt>
            <dd className="mt-0.5 font-semibold text-[#14213D]">{confirmedBooking.roomNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Building &amp; Floor</dt>
            <dd className="mt-0.5 font-medium text-[#14213D]">
              {confirmedBooking.buildingName} · {confirmedBooking.floor}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Desk Section</dt>
            <dd className="mt-0.5 font-semibold text-[#14213D]">
              {confirmedBooking.sectionLabel} ({confirmedBooking.deskCount} desks)
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Study Group</dt>
            <dd className="mt-0.5 font-medium text-[#14213D]">
              {confirmedBooking.groupSize} {confirmedBooking.groupSize === 1 ? 'student' : 'students'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Start Time</dt>
            <dd className="mt-0.5 font-mono font-medium text-[#14213D] tabular-nums">
              {formatMinutesTo12h(confirmedBooking.startMinutes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">End Time</dt>
            <dd className="mt-0.5 font-mono font-medium text-[#14213D] tabular-nums">
              {formatMinutesTo12h(confirmedBooking.endMinutes)} ({formatDurationLabel(durationMins)})
            </dd>
          </div>
        </dl>

        <p className="text-xs text-slate-500">
          Time limit basis: {confirmedBooking.limitingReason}. Please vacate promptly before the next lecture begins.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGoToBooking}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Go to Active Study Session
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-[#14213D] transition-colors whitespace-nowrap"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back bar & Room Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#14213D] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Rooms</span>
          </button>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
              {room.roomNumber}
            </h1>
            <RoomStatusText status={avail.effectiveStatus} />
          </div>
          <p className="text-sm text-slate-600 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {room.buildingName} · {room.floor}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Capacity {room.capacity} desks</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Verified {formatRelativeVerifiedTime(room.verifiedAtIso)} by {room.verifiedBy}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setReportOpen((v) => !v);
            setReportSent(false);
          }}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 whitespace-nowrap"
        >
          <Flag className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Report Incorrect Status</span>
        </button>
      </div>

      {/* Optional Student Report Form (BR-06) */}
      {reportOpen && (
        <form
          onSubmit={handleReportSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-[#14213D]">
                Report Room Status Discrepancy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Student reports notify faculty for physical verification and never automatically overwrite the official status.
              </p>
            </div>
          </div>
          <label htmlFor="status-report-input" className="sr-only">
            Describe what you observed in this classroom
          </label>
          <textarea
            id="status-report-input"
            rows={2}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Example: An unscheduled tutorial is currently running inside Room 101."
            className="w-full p-3 rounded-xl border border-slate-200 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
            required
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#1E2F54]"
            >
              Submit Report to Faculty
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reportSent && (
        <div
          role="status"
          className="bg-white rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#14213D]"
        >
          Thank you — your observation was logged for faculty review. Official status remains unchanged until staff verifies.
        </div>
      )}

      {/* Main Split: Visual RedBus-Style Classroom Map (Left 7 cols) + Smart Timetable Reservation Panel (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Classroom Visual Floor Plan & Desk Section Allocation */}
        <section
          aria-label="Classroom desk section map"
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#14213D]">
                Select a Desk Section
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each section groups 4–5 desks. Choose a green available section to inspect duration and reserve.
              </p>
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3 border-b border-slate-100">
            <SectionStatusText status="available" />
            <SectionStatusText status="occupied" />
            <SectionStatusText status="reserved" />
            <SectionStatusText status="unavailable" />
          </div>

          {/* Architectural Classroom Diagram */}
          <div className="rounded-2xl bg-[#F5F7FB] border border-slate-200/80 p-4 sm:p-5 space-y-5">
            {/* Front of Room: Whiteboard / Podium + Entrance Door */}
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                <DoorOpen className="h-3.5 w-3.5 text-[#14213D]" aria-hidden="true" />
                <span>Entrance Door</span>
              </div>

              <div className="flex-1 max-w-xs mx-auto text-center py-2 px-4 rounded-lg bg-[#14213D] text-white text-xs font-medium tracking-wide">
                Whiteboard &amp; Instructor Podium
              </div>

              <div className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500">
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Windows</span>
              </div>
            </div>

            {/* Sections Grid with Central Walkway Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              {room.sections.map((section) => {
                const secStatus = sectionStatuses[section.sectionId] ?? 'unavailable';
                const isSelected = selectedSectionId === section.sectionId;
                const isClickable = avail.canBook && secStatus === 'available';

                return (
                  <button
                    key={section.sectionId}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => handleSelectSection(section)}
                    aria-pressed={isSelected}
                    aria-label={`${section.label}, ${section.deskCount} desks, status ${secStatus}`}
                    className={`text-left rounded-xl border-2 p-4 ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#2563EB]/20 text-[#14213D]'
                        : SECTION_TILE_STYLES[secStatus]
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="font-display text-sm font-bold text-[#14213D]">
                          {section.label}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 tabular-nums">
                          {section.deskCount} desks
                        </span>
                      </div>
                      <SectionStatusText status={secStatus} />
                    </div>

                    {/* Visual Desk Cluster Shapes (RedBus-style individual desk grid) */}
                    <div className="flex items-center gap-2 py-2" aria-hidden="true">
                      {Array.from({ length: section.deskCount }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                          <div
                            className={`w-full h-5 rounded-md ${
                              isSelected ? 'bg-[#2563EB]' : DESK_MINI_STYLES[secStatus]
                            }`}
                          />
                          <div className="w-3/5 h-1.5 rounded-full bg-slate-300/80" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        {section.hasPowerOutlets && (
                          <span className="inline-flex items-center gap-0.5">
                            <Plug className="h-3 w-3" aria-hidden="true" />
                            Power
                          </span>
                        )}
                        {section.nearWindow && (
                          <span className="inline-flex items-center gap-0.5">
                            <Sun className="h-3 w-3" aria-hidden="true" />
                            Window
                          </span>
                        )}
                        {!section.hasPowerOutlets && !section.nearWindow && (
                          <span>Standard seating</span>
                        )}
                      </span>
                      {isSelected && (
                        <span className="font-semibold text-[#2563EB]">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-slate-400">
              Rear Wall · Demo classroom layout (illustrative until verified by DY Patil Akurdi)
            </div>
          </div>

          {/* Facilities Footer */}
          <div className="text-xs text-slate-600 pt-1">
            <span className="font-semibold text-[#14213D]">Room facilities:</span>{' '}
            {room.facilities.join(' · ')}
          </div>
        </section>

        {/* Right Panel: Smart Timetable Availability Engine & Booking Confirmation */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#14213D]">
              Smart Timetable Availability
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically caps your booking at the earliest schedule restriction.
            </p>
          </div>

          {/* Timetable Calculation Breakdown */}
          <dl className="space-y-2.5 text-sm py-3 border-y border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Current time</dt>
              <dd className="font-mono font-medium text-[#14213D] tabular-nums">
                {formatMinutesTo12h(currentMinutes)} ({currentDay})
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Your next lecture</dt>
              <dd className="font-medium text-[#14213D] text-right">
                {freeTimeSummary.nextLecture
                  ? `${formatMinutesTo12h(parseTimeToMinutes(freeTimeSummary.nextLecture.startTime))} · ${freeTimeSummary.nextLecture.subject}`
                  : 'None remaining today'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Room next lecture</dt>
              <dd className="font-medium text-[#14213D] text-right">
                {!avail.isScheduleVerified
                  ? 'Schedule not verified'
                  : avail.roomNextLecture
                    ? `${formatMinutesTo12h(parseTimeToMinutes(avail.roomNextLecture.startTime))} · ${avail.roomNextLecture.subject}`
                    : 'No more classes today'}
              </dd>
            </div>
          </dl>

          {/* Maximum Study Duration Callout */}
          {avail.canBook ? (
            <div className="rounded-xl bg-[#F5F7FB] border border-slate-200/80 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Available for {avail.formattedAvailableDuration}</span>
              </div>
              <p className="text-sm font-semibold text-[#14213D] tabular-nums">
                Maximum study session: Until{' '}
                {avail.permittedEndMinutes !== null
                  ? formatMinutesTo12h(avail.permittedEndMinutes)
                  : '—'}
              </p>
              <p className="text-xs text-slate-600">{avail.limitingReason}.</p>
            </div>
          ) : (
            <div
              role="alert"
              className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#14213D]">
                  Booking Currently Disabled
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {avail.disabledReason}
                </p>
              </div>
            </div>
          )}

          {/* Selected Section Booking Form */}
          {avail.canBook && (
            <div className="space-y-4 pt-1">
              {!selectedSection ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-[#F5F7FB] rounded-xl border border-dashed border-slate-300">
                  Tap any green available desk section on the room layout to reserve it.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Selected space</span>
                    <span className="font-display font-bold text-[#14213D]">
                      {selectedSection.label} · {selectedSection.deskCount} desks
                    </span>
                  </div>

                  {/* Duration Selector (capped strictly at earliest restriction) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Study Duration (max {avail.formattedAvailableDuration})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {durationOptions.map((mins) => {
                        const isPicked = effectiveDurationMins === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSelectedDurationMins(mins)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                              isPicked
                                ? 'bg-[#14213D] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {mins === maxMinutes
                              ? `Max (${formatDurationLabel(mins)})`
                              : formatDurationLabel(mins)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Study Group Size */}
                  <div className="space-y-2">
                    <label htmlFor="group-size-select" className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Students in your group</span>
                      </span>
                      <span className="font-mono text-[#14213D]">{groupSize} / {selectedSection.deskCount}</span>
                    </label>
                    <select
                      id="group-size-select"
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                    >
                      {Array.from({ length: selectedSection.deskCount }).map((_, idx) => {
                        const count = idx + 1;
                        return (
                          <option key={count} value={count}>
                            {count} {count === 1 ? 'student (Solo study)' : 'students (Group study)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                    <span>Session window</span>
                    <span className="font-mono font-semibold text-[#14213D] tabular-nums">
                      {formatMinutesTo12h(currentMinutes)} – {formatMinutesTo12h(computedEndMinutes)}
                    </span>
                  </div>

                  {bookingError && (
                    <p role="alert" className="text-xs font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {bookingError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Confirm Reservation ({selectedSection.label})
                  </button>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
