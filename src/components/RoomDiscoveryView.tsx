import { useMemo, useState } from 'react';
import {
  Clock,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import type { RoomFilterKey } from '../types';
import {
  filterRooms,
  formatMinutesTo12h,
  parseTimeToMinutes,
} from '../utils/availabilityEngine';
import { formatRelativeVerifiedTime, RoomStatusText } from './StatusIndicator';

interface RoomDiscoveryViewProps {
  onSelectRoom: (roomId: string) => void;
}

const FILTER_OPTIONS: Array<{ key: RoomFilterKey; label: string }> = [
  { key: 'all', label: 'All rooms' },
  { key: 'available_now', label: 'Available now' },
  { key: '30m', label: '30 min+' },
  { key: '1h', label: '1 hour+' },
  { key: '2h', label: '2 hours+' },
  { key: 'computer_lab', label: 'Computer labs' },
  { key: 'classroom', label: 'Regular classrooms' },
  { key: 'group_study', label: 'Group study spaces' },
];

const CATEGORY_LABELS: Record<string, string> = {
  classroom: 'Classroom',
  computer_lab: 'Computer Lab',
  group_study: 'Group Study',
};

export function RoomDiscoveryView({ onSelectRoom }: RoomDiscoveryViewProps) {
  const { rooms, availabilityMap, currentDay, currentMinutes, freeTimeSummary } = useLiveRoom();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomFilterKey>('all');

  const filteredRooms = useMemo(() => {
    const matched = filterRooms(rooms, availabilityMap, searchQuery, activeFilter);
    // Sort Verified Available rooms first, then Reserved, Occupied, Unknown
    const rank = { verified_available: 0, reserved: 1, occupied: 2, unknown: 3 };
    return [...matched].sort((a, b) => {
      const aStatus = availabilityMap[a.roomId]?.effectiveStatus ?? 'unknown';
      const bStatus = availabilityMap[b.roomId]?.effectiveStatus ?? 'unknown';
      return rank[aStatus] - rank[bStatus];
    });
  }, [rooms, availabilityMap, searchQuery, activeFilter]);

  const availableCount = useMemo(
    () =>
      rooms.filter((r) => {
        const a = availabilityMap[r.roomId];
        return a?.effectiveStatus === 'verified_available' && a.availableSectionsCount > 0;
      }).length,
    [rooms, availabilityMap],
  );

  return (
    <div className="space-y-6">
      {/* Page Header & Free Window Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
            Live Room Discovery
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Showing {rooms.length} demo campus spaces for {currentDay} at{' '}
            <span className="font-mono font-medium text-[#14213D] tabular-nums">
              {formatMinutesTo12h(currentMinutes)}
            </span>{' '}
            · {availableCount} verified available right now.
          </p>
        </div>

        <div className="text-sm text-slate-600 tabular-nums">
          Your free time:{' '}
          <span className="font-semibold text-[#14213D]">
            {freeTimeSummary.formattedRemainingFree}
          </span>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search
            className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="room-search" className="sr-only">
            Search rooms by number, building, or facility
          </label>
          <input
            id="room-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by room number, building, floor, or facility (e.g. Room 101, Block A, Lab)..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-[#F5F7FB] focus:bg-white text-sm text-[#14213D] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear room search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0 mr-1" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            {FILTER_OPTIONS.map((opt) => {
              const isSelected = activeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setActiveFilter(opt.key)}
                  aria-pressed={isSelected}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#14213D] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room Results Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-[#14213D]">
            No matching classrooms found
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try clearing your search query or switching to a shorter duration filter to view all demo campus rooms.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRooms.map((room) => {
            const avail = availabilityMap[room.roomId];
            const nextClassLabel = !avail.isScheduleVerified
              ? 'Schedule not verified'
              : avail.roomNextLecture
                ? `${formatMinutesTo12h(parseTimeToMinutes(avail.roomNextLecture.startTime))} · ${avail.roomNextLecture.subject}`
                : 'No further lectures today';

            return (
              <article
                key={room.roomId}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Row: Room ID, Building/Floor, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-display text-xl font-bold text-[#14213D] truncate">
                          {room.roomNumber}
                        </h2>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {CATEGORY_LABELS[room.category] ?? 'Room'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {room.buildingName} · {room.floor}
                        </span>
                      </p>
                    </div>
                    <RoomStatusText status={avail.effectiveStatus} />
                  </div>

                  {/* Key Availability Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Available desks</p>
                      <p className="mt-0.5 font-semibold text-[#14213D] tabular-nums">
                        {avail.availableDesksCount}
                        <span className="text-xs font-normal text-slate-400"> / {room.capacity}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Open sections</p>
                      <p className="mt-0.5 font-semibold text-[#14213D] tabular-nums">
                        {avail.availableSectionsCount}
                        <span className="text-xs font-normal text-slate-400"> / {room.sections.length}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Study window</p>
                      <p className="mt-0.5 font-semibold text-[#14213D] tabular-nums">
                        {avail.canBook ? avail.formattedAvailableDuration : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Next Lecture & Facilities Metadata (unboxed inline prose) */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 text-slate-600">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong className="font-medium text-[#14213D]">Next room lecture:</strong>{' '}
                        {nextClassLabel}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <Users className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong className="font-medium text-[#14213D]">Facilities:</strong>{' '}
                        {room.facilities.join(' · ')}
                      </span>
                    </div>
                  </div>

                  {!avail.canBook && avail.disabledReason && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200/70">
                      {avail.disabledReason}
                    </p>
                  )}
                </div>

                {/* Footer: Verification Timestamp + CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 min-w-0 truncate">
                    <span>Verified {formatRelativeVerifiedTime(room.verifiedAtIso)}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                    <span>{room.verifiedBy}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room.roomId)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      avail.canBook
                        ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-[#14213D]'
                    }`}
                  >
                    {avail.canBook ? 'View Desk Sections' : 'Inspect Room'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
