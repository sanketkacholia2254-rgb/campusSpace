import type {
  DayOfWeek,
  DeskSection,
  FreeTimeSummary,
  Reservation,
  Room,
  RoomAvailabilityResult,
  RoomFilterKey,
  RoomScheduleEntry,
  RoomStatus,
  SectionStatus,
  TimetableSlot,
} from '../types';

export const CAMPUS_OPEN_MINUTES = 8 * 60; // 08:00 AM
export const CAMPUS_CLOSE_MINUTES = 18 * 60; // 06:00 PM
export const VERIFICATION_FRESHNESS_MINUTES = 90; // BR-07: stale after 90 min

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function parseTimeToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

export function formatMinutesTo12h(totalMinutes: number): string {
  const clamped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function formatDurationLabel(minutes: number): string {
  const safeMins = Math.max(0, Math.floor(minutes));
  if (safeMins === 0) return '0 min';
  const hours = Math.floor(safeMins / 60);
  const remMins = safeMins % 60;
  if (hours === 0) return `${remMins} min`;
  if (remMins === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remMins} min`;
}

export function formatShortDuration(minutes: number): string {
  const safeMins = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMins / 60);
  const remMins = safeMins % 60;
  if (hours === 0) return `${remMins}m`;
  if (remMins === 0) return `${hours}h`;
  return `${hours}h ${remMins}m`;
}

export function formatCountdownHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function getDayFromJsDate(date: Date): DayOfWeek {
  const map: Record<number, DayOfWeek> = {
    0: 'Monday', // Sunday fallback to Monday for academic timetable preview
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  return map[date.getDay()] ?? 'Monday';
}

/**
 * Dynamic Free Time calculation comparing current campus time against the
 * student's active day timetable.
 */
export function calculateStudentFreeTime(
  currentMinutes: number,
  day: DayOfWeek,
  studentTimetable: TimetableSlot[],
): FreeTimeSummary {
  const activeDaySlots = studentTimetable
    .filter((slot) => slot.day === day && slot.type !== 'cancelled')
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  if (activeDaySlots.length === 0) {
    const remainingUntilClose = Math.max(0, CAMPUS_CLOSE_MINUTES - currentMinutes);
    return {
      state: 'no_schedule',
      currentDay: day,
      currentMinutes,
      currentPeriodLabel: 'No lectures scheduled today',
      currentLecture: null,
      nextLecture: null,
      freeWindowStartMinutes: CAMPUS_OPEN_MINUTES,
      freeWindowEndMinutes: CAMPUS_CLOSE_MINUTES,
      remainingFreeMinutes: remainingUntilClose,
      remainingLectureMinutes: 0,
      formattedRemainingFree: formatDurationLabel(remainingUntilClose),
      progressPercent: 0,
    };
  }

  // 1. Check if currently inside a lecture or practical
  const ongoingSlot = activeDaySlots.find((slot) => {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  const upcomingSlot =
    activeDaySlots.find((slot) => parseTimeToMinutes(slot.startTime) > currentMinutes) ?? null;

  if (ongoingSlot) {
    const start = parseTimeToMinutes(ongoingSlot.startTime);
    const end = parseTimeToMinutes(ongoingSlot.endTime);
    const total = Math.max(1, end - start);
    const remainingLecture = Math.max(0, end - currentMinutes);
    const progress = Math.min(100, Math.max(0, Math.round(((currentMinutes - start) / total) * 100)));

    // Also inspect if there's a free gap right after this ongoing lecture
    const nextAfterCurrent =
      activeDaySlots.find((slot) => parseTimeToMinutes(slot.startTime) >= end) ?? null;

    return {
      state: 'in_lecture',
      currentDay: day,
      currentMinutes,
      currentPeriodLabel: `${ongoingSlot.subject} (${ongoingSlot.roomLabel})`,
      currentLecture: ongoingSlot,
      nextLecture: nextAfterCurrent,
      freeWindowStartMinutes: null,
      freeWindowEndMinutes: null,
      remainingFreeMinutes: 0,
      remainingLectureMinutes: remainingLecture,
      formattedRemainingFree: '0 min (In lecture)',
      progressPercent: progress,
    };
  }

  const firstStart = parseTimeToMinutes(activeDaySlots[0].startTime);
  const lastEnd = parseTimeToMinutes(activeDaySlots[activeDaySlots.length - 1].endTime);

  // 2. Before first lecture of the day
  if (currentMinutes < firstStart) {
    const windowStart = Math.min(currentMinutes, CAMPUS_OPEN_MINUTES);
    const remainingFree = Math.max(0, firstStart - currentMinutes);
    const totalWindow = Math.max(1, firstStart - windowStart);
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((currentMinutes - windowStart) / totalWindow) * 100)),
    );

    return {
      state: 'before_classes',
      currentDay: day,
      currentMinutes,
      currentPeriodLabel: 'Pre-Lecture Study Window',
      currentLecture: null,
      nextLecture: activeDaySlots[0],
      freeWindowStartMinutes: windowStart,
      freeWindowEndMinutes: firstStart,
      remainingFreeMinutes: remainingFree,
      remainingLectureMinutes: 0,
      formattedRemainingFree: formatDurationLabel(remainingFree),
      progressPercent: progress,
    };
  }

  // 3. After last lecture of the day
  if (currentMinutes >= lastEnd) {
    const remainingUntilClose = Math.max(0, CAMPUS_CLOSE_MINUTES - currentMinutes);
    const totalPost = Math.max(1, CAMPUS_CLOSE_MINUTES - lastEnd);
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((currentMinutes - lastEnd) / totalPost) * 100)),
    );
    return {
      state: 'after_classes',
      currentDay: day,
      currentMinutes,
      currentPeriodLabel: 'Post-Lecture Self-Study',
      currentLecture: null,
      nextLecture: null,
      freeWindowStartMinutes: lastEnd,
      freeWindowEndMinutes: CAMPUS_CLOSE_MINUTES,
      remainingFreeMinutes: remainingUntilClose,
      remainingLectureMinutes: 0,
      formattedRemainingFree:
        remainingUntilClose > 0 ? formatDurationLabel(remainingUntilClose) : 'Campus closed',
      progressPercent: progress,
    };
  }

  // 4. Inside a free period between two lectures
  const previousSlots = activeDaySlots.filter(
    (slot) => parseTimeToMinutes(slot.endTime) <= currentMinutes,
  );
  const prevEnd =
    previousSlots.length > 0
      ? parseTimeToMinutes(previousSlots[previousSlots.length - 1].endTime)
      : CAMPUS_OPEN_MINUTES;
  const nextStart = upcomingSlot ? parseTimeToMinutes(upcomingSlot.startTime) : CAMPUS_CLOSE_MINUTES;
  const remainingFree = Math.max(0, nextStart - currentMinutes);
  const totalWindow = Math.max(1, nextStart - prevEnd);
  const progress = Math.min(
    100,
    Math.max(0, Math.round(((currentMinutes - prevEnd) / totalWindow) * 100)),
  );

  return {
    state: 'free_period',
    currentDay: day,
    currentMinutes,
    currentPeriodLabel: 'Free Lecture Period',
    currentLecture: null,
    nextLecture: upcomingSlot,
    freeWindowStartMinutes: prevEnd,
    freeWindowEndMinutes: nextStart,
    remainingFreeMinutes: remainingFree,
    remainingLectureMinutes: 0,
    formattedRemainingFree: formatDurationLabel(remainingFree),
    progressPercent: progress,
  };
}

/**
 * Computes effective section status taking active reservations into account.
 */
export function getEffectiveSectionStatus(
  section: DeskSection,
  roomId: string,
  day: DayOfWeek,
  currentMinutes: number,
  reservations: Reservation[],
): SectionStatus {
  if (section.status === 'occupied' || section.status === 'unavailable') {
    return section.status;
  }

  const hasActiveReservation = reservations.some(
    (res) =>
      res.status === 'active' &&
      res.roomId === roomId &&
      res.sectionId === section.sectionId &&
      res.day === day &&
      res.endMinutes > currentMinutes,
  );

  if (hasActiveReservation) {
    return 'reserved';
  }

  return section.status;
}

/**
 * Smart Timetable-Based Availability Engine (PRD FR-06 & BR-01..BR-10)
 * End time = earliest applicable restriction time
 * Available duration = permitted end time - current time
 */
export function calculateRoomAvailability(
  room: Room,
  currentMinutes: number,
  day: DayOfWeek,
  studentTimetable: TimetableSlot[],
  reservations: Reservation[],
  nowMs: number = Date.now(),
): RoomAvailabilityResult {
  const verifiedAtMs = Date.parse(room.verifiedAtIso);
  const ageMinutes = Number.isNaN(verifiedAtMs)
    ? Infinity
    : (nowMs - verifiedAtMs) / (1000 * 60);
  const isVerificationStale =
    room.status === 'verified_available' && ageMinutes > VERIFICATION_FRESHNESS_MINUTES;

  // BR-07: Expired verification changes room to Unknown until reverified
  let effectiveStatus: RoomStatus = isVerificationStale ? 'unknown' : room.status;

  // Check active room timetable entries for today
  const dayRoomEntries = room.timetable
    .filter((entry) => entry.day === day && entry.status !== 'cancelled')
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  // BR-09: Maintenance or scheduled class happening right now overrides availability
  const ongoingRoomEvent = dayRoomEntries.find((entry) => {
    const start = parseTimeToMinutes(entry.startTime);
    const end = parseTimeToMinutes(entry.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  if (ongoingRoomEvent && effectiveStatus === 'verified_available') {
    effectiveStatus = 'occupied';
  }

  const roomNextLecture: RoomScheduleEntry | null =
    dayRoomEntries.find((entry) => parseTimeToMinutes(entry.startTime) > currentMinutes) ?? null;

  const studentFree = calculateStudentFreeTime(currentMinutes, day, studentTimetable);
  const studentNextLecture = studentFree.nextLecture;

  // Count available sections & desks dynamically
  let availableSectionsCount = 0;
  let availableDesksCount = 0;
  let totalDesksCount = 0;

  for (const section of room.sections) {
    totalDesksCount += section.deskCount;
    const secStatus = getEffectiveSectionStatus(
      section,
      room.roomId,
      day,
      currentMinutes,
      reservations,
    );
    if (secStatus === 'available') {
      availableSectionsCount += 1;
      availableDesksCount += section.deskCount;
    }
  }

  // If all sections are reserved while room is verified_available, show room as reserved
  if (
    effectiveStatus === 'verified_available' &&
    room.sections.length > 0 &&
    availableSectionsCount === 0
  ) {
    const hasReservedSection = room.sections.some(
      (s) =>
        getEffectiveSectionStatus(s, room.roomId, day, currentMinutes, reservations) ===
        'reserved',
    );
    if (hasReservedSection) {
      effectiveStatus = 'reserved';
    }
  }

  // FR-06: Missing or unverified timetable data
  if (!room.scheduleVerified) {
    return {
      roomId: room.roomId,
      effectiveStatus: 'unknown',
      isVerificationStale,
      isScheduleVerified: false,
      canBook: false,
      disabledReason: 'Schedule not verified — booking disabled until staff confirms timetable.',
      permittedEndMinutes: null,
      availableMinutes: 0,
      formattedAvailableDuration: 'Schedule not verified',
      limitingReason: 'Schedule not verified',
      roomNextLecture,
      studentNextLecture,
      availableSectionsCount: 0,
      availableDesksCount: 0,
      totalDesksCount,
    };
  }

  // BR-01 & BR-02: Only verified_available rooms can be offered for booking
  if (effectiveStatus !== 'verified_available') {
    let disabledReason = 'Room is currently not open for booking.';
    if (isVerificationStale) {
      disabledReason = 'Verification expired (>90 min ago). Waiting for faculty re-verification.';
    } else if (effectiveStatus === 'occupied') {
      disabledReason = ongoingRoomEvent
        ? `Currently occupied by ${ongoingRoomEvent.subject} (${formatMinutesTo12h(parseTimeToMinutes(ongoingRoomEvent.startTime))} – ${formatMinutesTo12h(parseTimeToMinutes(ongoingRoomEvent.endTime))}).`
        : 'Room is confirmed occupied by authorized staff.';
    } else if (effectiveStatus === 'reserved') {
      disabledReason = 'All desk sections in this room are currently reserved.';
    } else if (effectiveStatus === 'unknown') {
      disabledReason = 'Room status is unverified. Booking disabled until faculty verifies occupancy.';
    }

    return {
      roomId: room.roomId,
      effectiveStatus,
      isVerificationStale,
      isScheduleVerified: room.scheduleVerified,
      canBook: false,
      disabledReason,
      permittedEndMinutes: null,
      availableMinutes: 0,
      formattedAvailableDuration: 'Unavailable',
      limitingReason: disabledReason,
      roomNextLecture,
      studentNextLecture,
      availableSectionsCount: effectiveStatus === 'occupied' || effectiveStatus === 'unknown' ? 0 : availableSectionsCount,
      availableDesksCount: effectiveStatus === 'occupied' || effectiveStatus === 'unknown' ? 0 : availableDesksCount,
      totalDesksCount,
    };
  }

  // Student currently in a lecture
  if (studentFree.state === 'in_lecture' && studentFree.currentLecture) {
    return {
      roomId: room.roomId,
      effectiveStatus,
      isVerificationStale: false,
      isScheduleVerified: true,
      canBook: false,
      disabledReason: `You currently have ${studentFree.currentLecture.subject} until ${formatMinutesTo12h(parseTimeToMinutes(studentFree.currentLecture.endTime))}.`,
      permittedEndMinutes: null,
      availableMinutes: 0,
      formattedAvailableDuration: 'In lecture now',
      limitingReason: `Student scheduled for ${studentFree.currentLecture.subject}`,
      roomNextLecture,
      studentNextLecture,
      availableSectionsCount,
      availableDesksCount,
      totalDesksCount,
    };
  }

  // Compute earliest applicable restriction time (FR-06 & BR-04)
  interface Constraint {
    endMinutes: number;
    reason: string;
  }

  const constraints: Constraint[] = [
    {
      endMinutes: CAMPUS_CLOSE_MINUTES,
      reason: `Campus study hours close at ${formatMinutesTo12h(CAMPUS_CLOSE_MINUTES)}`,
    },
  ];

  if (studentNextLecture) {
    const stuStart = parseTimeToMinutes(studentNextLecture.startTime);
    if (stuStart > currentMinutes) {
      constraints.push({
        endMinutes: stuStart,
        reason: `Your next lecture (${studentNextLecture.subject}) starts at ${formatMinutesTo12h(stuStart)}`,
      });
    }
  }

  if (roomNextLecture) {
    const roomStart = parseTimeToMinutes(roomNextLecture.startTime);
    if (roomStart > currentMinutes) {
      const label =
        roomNextLecture.status === 'maintenance'
          ? `Scheduled maintenance begins at ${formatMinutesTo12h(roomStart)}`
          : `Room scheduled for ${roomNextLecture.subject} at ${formatMinutesTo12h(roomStart)}`;
      constraints.push({
        endMinutes: roomStart,
        reason: label,
      });
    }
  }

  constraints.sort((a, b) => a.endMinutes - b.endMinutes);
  const earliest = constraints[0];
  const availableMinutes = Math.max(0, earliest.endMinutes - currentMinutes);

  if (availableMinutes < 10) {
    return {
      roomId: room.roomId,
      effectiveStatus,
      isVerificationStale: false,
      isScheduleVerified: true,
      canBook: false,
      disabledReason: `Less than 10 minutes remaining before restriction (${earliest.reason}).`,
      permittedEndMinutes: earliest.endMinutes,
      availableMinutes,
      formattedAvailableDuration: formatDurationLabel(availableMinutes),
      limitingReason: earliest.reason,
      roomNextLecture,
      studentNextLecture,
      availableSectionsCount,
      availableDesksCount,
      totalDesksCount,
    };
  }

  return {
    roomId: room.roomId,
    effectiveStatus,
    isVerificationStale: false,
    isScheduleVerified: true,
    canBook: availableSectionsCount > 0,
    disabledReason:
      availableSectionsCount === 0 ? 'No unallocated desk sections remaining.' : null,
    permittedEndMinutes: earliest.endMinutes,
    availableMinutes,
    formattedAvailableDuration: formatDurationLabel(availableMinutes),
    limitingReason: earliest.reason,
    roomNextLecture,
    studentNextLecture,
    availableSectionsCount,
    availableDesksCount,
    totalDesksCount,
  };
}

export interface ReservationValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Atomic booking validation enforcing BR-01, BR-02, BR-04, BR-05
 */
export function validateReservationAttempt(params: {
  room: Room;
  sectionId: string;
  studentId: string;
  day: DayOfWeek;
  startMinutes: number;
  requestedEndMinutes: number;
  availability: RoomAvailabilityResult;
  existingReservations: Reservation[];
}): ReservationValidationResult {
  const {
    room,
    sectionId,
    studentId,
    day,
    startMinutes,
    requestedEndMinutes,
    availability,
    existingReservations,
  } = params;

  // BR-01
  if (!availability.canBook || availability.effectiveStatus !== 'verified_available') {
    return {
      ok: false,
      error: availability.disabledReason ?? 'Room is not verified available for reservation.',
    };
  }

  // BR-04: Never exceed earliest applicable restriction
  if (
    availability.permittedEndMinutes === null ||
    requestedEndMinutes > availability.permittedEndMinutes
  ) {
    return {
      ok: false,
      error: `Booking cannot continue beyond ${
        availability.permittedEndMinutes !== null
          ? formatMinutesTo12h(availability.permittedEndMinutes)
          : 'permitted limit'
      }.`,
    };
  }

  if (requestedEndMinutes - startMinutes < 10) {
    return {
      ok: false,
      error: 'Minimum study session duration is 10 minutes.',
    };
  }

  const section = room.sections.find((s) => s.sectionId === sectionId);
  if (!section) {
    return { ok: false, error: 'Selected desk section does not exist.' };
  }

  // BR-02: Section must be available
  const effectiveSecStatus = getEffectiveSectionStatus(
    section,
    room.roomId,
    day,
    startMinutes,
    existingReservations,
  );
  if (effectiveSecStatus !== 'available') {
    return {
      ok: false,
      error: `${section.label} is currently ${effectiveSecStatus} and cannot be reserved.`,
    };
  }

  // Prevent student from holding two overlapping active reservations
  const studentOverlap = existingReservations.find(
    (res) =>
      res.status === 'active' &&
      res.studentId === studentId &&
      res.day === day &&
      res.startMinutes < requestedEndMinutes &&
      res.endMinutes > startMinutes,
  );
  if (studentOverlap) {
    return {
      ok: false,
      error: `You already have an active study session in ${studentOverlap.roomNumber} (${studentOverlap.sectionLabel}). Cancel it first to book another space.`,
    };
  }

  // BR-05: Two active reservations cannot overlap for the same section
  const sectionOverlap = existingReservations.find(
    (res) =>
      res.status === 'active' &&
      res.roomId === room.roomId &&
      res.sectionId === sectionId &&
      res.day === day &&
      res.startMinutes < requestedEndMinutes &&
      res.endMinutes > startMinutes,
  );
  if (sectionOverlap) {
    return {
      ok: false,
      error: `${section.label} was just reserved by another student for an overlapping time window.`,
    };
  }

  return { ok: true };
}

export function filterRooms(
  rooms: Room[],
  availabilityMap: Record<string, RoomAvailabilityResult>,
  searchQuery: string,
  filterKey: RoomFilterKey,
): Room[] {
  const q = searchQuery.trim().toLowerCase();

  return rooms.filter((room) => {
    const avail = availabilityMap[room.roomId];
    if (!avail) return false;

    if (q.length > 0) {
      const searchable = [
        room.roomNumber,
        room.buildingName,
        room.floor,
        room.category.replace('_', ' '),
        ...room.facilities,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    switch (filterKey) {
      case 'available_now':
        return avail.effectiveStatus === 'verified_available' && avail.availableSectionsCount > 0;
      case '30m':
        return avail.canBook && avail.availableMinutes >= 30;
      case '1h':
        return avail.canBook && avail.availableMinutes >= 60;
      case '2h':
        return avail.canBook && avail.availableMinutes >= 120;
      case 'computer_lab':
        return room.category === 'computer_lab';
      case 'classroom':
        return room.category === 'classroom';
      case 'group_study':
        return room.category === 'group_study';
      case 'all':
      default:
        return true;
    }
  });
}
