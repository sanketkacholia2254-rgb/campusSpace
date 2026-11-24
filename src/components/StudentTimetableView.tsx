import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock, Plus, Trash2 } from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import type { DayOfWeek, TimetableSlot } from '../types';
import {
  DAYS_OF_WEEK,
  formatDurationLabel,
  formatMinutesTo12h,
  parseTimeToMinutes,
} from '../utils/availabilityEngine';

interface StudentTimetableViewProps {
  onFindRooms: () => void;
}

type TimelineBlock =
  | { kind: 'slot'; slot: TimetableSlot; startMins: number; endMins: number }
  | { kind: 'free'; id: string; startMins: number; endMins: number };

export function StudentTimetableView({ onFindRooms }: StudentTimetableViewProps) {
  const {
    student,
    studentTimetable,
    currentDay,
    currentMinutes,
    addTimetableSlot,
    deleteTimetableSlot,
  } = useLiveRoom();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDay);
  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [roomLabel, setRoomLabel] = useState('Room 101');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [slotType, setSlotType] = useState<TimetableSlot['type']>('lecture');
  const [formError, setFormError] = useState<string | null>(null);

  const dayTimeline = useMemo<TimelineBlock[]>(() => {
    const slots = studentTimetable
      .filter((s) => s.day === selectedDay)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    const blocks: TimelineBlock[] = [];
    for (let i = 0; i < slots.length; i++) {
      const curr = slots[i];
      const currStart = parseTimeToMinutes(curr.startTime);
      const currEnd = parseTimeToMinutes(curr.endTime);

      if (i > 0) {
        const prevEnd = parseTimeToMinutes(slots[i - 1].endTime);
        if (currStart - prevEnd >= 15) {
          blocks.push({
            kind: 'free',
            id: `free-${selectedDay}-${prevEnd}-${currStart}`,
            startMins: prevEnd,
            endMins: currStart,
          });
        }
      }
      blocks.push({ kind: 'slot', slot: curr, startMins: currStart, endMins: currEnd });
    }
    return blocks;
  }, [studentTimetable, selectedDay]);

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError('Enter a subject name.');
      return;
    }
    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);
    if (endM <= startM) {
      setFormError('End time must be later than start time.');
      return;
    }
    setFormError(null);
    addTimetableSlot({
      day: selectedDay,
      startTime,
      endTime,
      subject: subject.trim(),
      roomLabel: roomLabel.trim() || 'Classroom TBD',
      type: slotType,
    });
    setSubject('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
            Student Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {student.department} · {student.year} · {student.division} — Editable demo schedule (not official college timetable).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1E2F54] text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Lecture to {selectedDay}</span>
        </button>
      </div>

      {/* Day of Week Selector Tabs (Monday - Saturday) */}
      <div
        role="tablist"
        aria-label="Days of the academic week"
        className="flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = day === currentDay;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{day}</span>
              {isToday && (
                <span className={`ml-1.5 text-[11px] ${isSelected ? 'text-blue-100' : 'text-[#2563EB]'}`}>
                  (Today)
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add Lecture Form */}
      {formOpen && (
        <form
          onSubmit={handleAddLecture}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#14213D]">
              Add Lecture or Practical ({selectedDay})
            </h2>
            <p className="text-xs text-slate-500">
              Updates your Free Time calculation automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label htmlFor="tt-subject" className="block text-xs font-medium text-slate-600 mb-1">
                Subject Name
              </label>
              <input
                id="tt-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cloud Computing"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="tt-room" className="block text-xs font-medium text-slate-600 mb-1">
                Classroom
              </label>
              <input
                id="tt-room"
                type="text"
                value={roomLabel}
                onChange={(e) => setRoomLabel(e.target.value)}
                placeholder="Room 101"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tt-start" className="block text-xs font-medium text-slate-600 mb-1">
                Start Time
              </label>
              <input
                id="tt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tt-end" className="block text-xs font-medium text-slate-600 mb-1">
                End Time
              </label>
              <input
                id="tt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 text-slate-700">
                <input
                  type="radio"
                  name="slotType"
                  checked={slotType === 'lecture'}
                  onChange={() => setSlotType('lecture')}
                />
                <span>Lecture</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-slate-700">
                <input
                  type="radio"
                  name="slotType"
                  checked={slotType === 'practical'}
                  onChange={() => setSlotType('practical')}
                />
                <span>Practical Lab</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
              >
                Save to Timetable
              </button>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[#DC2626]">
              {formError}
            </p>
          )}
        </form>
      )}

      {/* Day Schedule Timeline */}
      <div className="space-y-3">
        {dayTimeline.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-2">
            <CalendarDays className="h-7 w-7 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="font-display text-base font-semibold text-[#14213D]">
              No lectures scheduled for {selectedDay}
            </p>
            <p className="text-sm text-slate-500">
              Add your lectures above or explore open study rooms right away.
            </p>
          </div>
        ) : (
          dayTimeline.map((block) => {
            const isCurrentDay = selectedDay === currentDay;
            const isNowInside =
              isCurrentDay && currentMinutes >= block.startMins && currentMinutes < block.endMins;

            if (block.kind === 'free') {
              const duration = block.endMins - block.startMins;
              return (
                <div
                  key={block.id}
                  className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                    isNowInside
                      ? 'bg-emerald-50/70 border-[#16A34A]/50'
                      : 'bg-white border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="font-mono text-xs sm:text-sm font-semibold text-[#15803D] tabular-nums w-36 shrink-0">
                      {formatMinutesTo12h(block.startMins)} – {formatMinutesTo12h(block.endMins)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-[#14213D]">
                          {isNowInside ? 'Current Free Period' : 'Free Lecture Gap'}
                        </h3>
                        <span className="text-xs font-medium text-[#15803D] tabular-nums">
                          {formatDurationLabel(duration)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {isNowInside
                          ? 'Active right now — reserve a verified classroom desk section during this gap.'
                          : 'Eligible self-study or group study window between lectures.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onFindRooms}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Find Available Rooms
                  </button>
                </div>
              );
            }

            const { slot } = block;
            return (
              <div
                key={slot.scheduleId}
                className={`bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                  isNowInside ? 'border-[#2563EB]' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="font-mono text-xs sm:text-sm font-medium text-slate-700 tabular-nums w-36 shrink-0 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>
                      {formatMinutesTo12h(block.startMins)} – {formatMinutesTo12h(block.endMins)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-[#14213D]">
                        {slot.subject}
                      </h3>
                      {isNowInside && (
                        <span className="text-xs font-semibold text-[#2563EB]">
                          In progress now
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                      {slot.roomLabel} · {slot.type === 'practical' ? 'Practical Lab' : 'Lecture'}
                      {slot.facultyName ? ` · ${slot.facultyName}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTimetableSlot(slot.scheduleId)}
                  aria-label={`Remove ${slot.subject} from ${selectedDay}`}
                  className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
