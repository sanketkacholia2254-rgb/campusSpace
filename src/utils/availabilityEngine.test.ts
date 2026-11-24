import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoomAvailability,
  calculateStudentFreeTime,
  filterRooms,
  formatCountdownHMS,
  formatDurationLabel,
  formatMinutesTo12h,
  validateReservationAttempt,
} from './availabilityEngine';
import type { Reservation, Room, TimetableSlot } from '../types';

const sampleStudentTimetable: TimetableSlot[] = [
  {
    scheduleId: 'stu-1',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    subject: 'Operating Systems',
    roomLabel: 'Room 201',
    type: 'lecture',
  },
  {
    scheduleId: 'stu-2',
    day: 'Monday',
    startTime: '12:00',
    endTime: '13:00',
    subject: 'Database Management Systems',
    roomLabel: 'Room 104',
    type: 'lecture',
  },
  {
    scheduleId: 'stu-3',
    day: 'Monday',
    startTime: '14:00',
    endTime: '15:00',
    subject: 'Computer Networks',
    roomLabel: 'Room 102',
    type: 'lecture',
  },
];

function makeDemoRoom(overrides: Partial<Room> = {}): Room {
  return {
    roomId: 'room-101',
    roomNumber: 'Room 101',
    buildingId: 'bldg-a',
    buildingName: 'Main Academic Block A',
    floor: '1st Floor',
    category: 'classroom',
    capacity: 20,
    facilities: ['Projector', 'Wi-Fi', 'Power Outlets'],
    status: 'verified_available',
    verifiedBy: 'Prof. S. Deshmukh',
    verifiedAtIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    statusSource: 'faculty_qr',
    scheduleVerified: true,
    qrCodeValue: 'DYP-LIVE-ROOM:room-101',
    sections: [
      { sectionId: '101-a', label: 'Section A', shortCode: 'A', deskCount: 5, status: 'available', zone: 'front-left' },
      { sectionId: '101-b', label: 'Section B', shortCode: 'B', deskCount: 5, status: 'available', zone: 'front-right' },
      { sectionId: '101-c', label: 'Section C', shortCode: 'C', deskCount: 5, status: 'occupied', zone: 'rear-left' },
    ],
    timetable: [
      {
        scheduleId: 'r-1',
        day: 'Monday',
        startTime: '11:45',
        endTime: '12:45',
        subject: 'Discrete Mathematics',
        batchLabel: 'SE Comp A',
        status: 'scheduled',
      },
    ],
    ...overrides,
  };
}

test('calculateStudentFreeTime computes exact 1 hour 45 min free window at 10:15 AM', () => {
  const result = calculateStudentFreeTime(10 * 60 + 15, 'Monday', sampleStudentTimetable);
  assert.equal(result.state, 'free_period');
  assert.equal(result.remainingFreeMinutes, 105);
  assert.equal(result.formattedRemainingFree, '1 hour 45 min');
  assert.equal(result.nextLecture?.subject, 'Database Management Systems');
  assert.equal(result.nextLecture?.startTime, '12:00');
});

test('calculateStudentFreeTime detects active lecture period', () => {
  const result = calculateStudentFreeTime(9 * 60 + 20, 'Monday', sampleStudentTimetable);
  assert.equal(result.state, 'in_lecture');
  assert.equal(result.currentLecture?.subject, 'Operating Systems');
  assert.equal(result.remainingLectureMinutes, 40);
  assert.equal(result.remainingFreeMinutes, 0);
});

test('calculateRoomAvailability picks earliest restriction between room lecture (11:45) and student lecture (12:00)', () => {
  const room = makeDemoRoom();
  const avail = calculateRoomAvailability(
    room,
    10 * 60 + 15, // 10:15 AM
    'Monday',
    sampleStudentTimetable,
    [],
  );

  assert.equal(avail.canBook, true);
  assert.equal(avail.effectiveStatus, 'verified_available');
  assert.equal(avail.permittedEndMinutes, 11 * 60 + 45);
  assert.equal(avail.availableMinutes, 90);
  assert.equal(avail.formattedAvailableDuration, '1 hour 30 min');
  assert.match(avail.limitingReason, /11:45 AM/);
  assert.equal(avail.availableSectionsCount, 2);
  assert.equal(avail.availableDesksCount, 10);
});

test('calculateRoomAvailability uses student next lecture when earlier than room next lecture', () => {
  const room = makeDemoRoom({
    timetable: [
      {
        scheduleId: 'r-late',
        day: 'Monday',
        startTime: '13:30',
        endTime: '14:30',
        subject: 'Data Structures',
        batchLabel: 'SE IT B',
        status: 'scheduled',
      },
    ],
  });

  const avail = calculateRoomAvailability(
    room,
    10 * 60 + 15,
    'Monday',
    sampleStudentTimetable,
    [],
  );

  assert.equal(avail.canBook, true);
  assert.equal(avail.permittedEndMinutes, 12 * 60);
  assert.equal(avail.availableMinutes, 105);
  assert.match(avail.limitingReason, /Database Management Systems/);
});

test('BR-07: expired verification (> 90 min) forces room to Unknown and disables booking', () => {
  const now = Date.now();
  const staleRoom = makeDemoRoom({
    verifiedAtIso: new Date(now - 120 * 60 * 1000).toISOString(),
  });

  const avail = calculateRoomAvailability(
    staleRoom,
    10 * 60 + 15,
    'Monday',
    sampleStudentTimetable,
    [],
    now,
  );

  assert.equal(avail.isVerificationStale, true);
  assert.equal(avail.effectiveStatus, 'unknown');
  assert.equal(avail.canBook, false);
});

test('FR-06: unverified timetable displays Schedule not verified and disables booking', () => {
  const room = makeDemoRoom({ scheduleVerified: false });
  const avail = calculateRoomAvailability(
    room,
    10 * 60 + 15,
    'Monday',
    sampleStudentTimetable,
    [],
  );
  assert.equal(avail.canBook, false);
  assert.equal(avail.formattedAvailableDuration, 'Schedule not verified');
});

test('BR-05: prevents overlapping reservations on the same desk section and prevents double booking by same student', () => {
  const room = makeDemoRoom();
  const avail = calculateRoomAvailability(
    room,
    10 * 60 + 15,
    'Monday',
    sampleStudentTimetable,
    [],
  );

  const existing: Reservation[] = [
    {
      bookingId: 'bk-1',
      studentId: 'DYP-IT-2026-042',
      studentName: 'Aarav Kulkarni',
      department: 'Information Technology',
      roomId: 'room-101',
      roomNumber: 'Room 101',
      buildingName: 'Main Academic Block A',
      floor: '1st Floor',
      sectionId: '101-a',
      sectionLabel: 'Section A',
      deskCount: 5,
      day: 'Monday',
      startMinutes: 10 * 60 + 15,
      endMinutes: 11 * 60 + 45,
      createdAtIso: new Date().toISOString(),
      status: 'active',
      limitingReason: 'Room scheduled at 11:45 AM',
      groupSize: 3,
    },
  ];

  // Another student attempting same section
  const conflictSameSection = validateReservationAttempt({
    room,
    sectionId: '101-a',
    studentId: 'DYP-CE-2026-019',
    day: 'Monday',
    startMinutes: 10 * 60 + 30,
    requestedEndMinutes: 11 * 60 + 30,
    availability: avail,
    existingReservations: existing,
  });
  assert.equal(conflictSameSection.ok, false);

  // Same student attempting another section while holding active booking
  const conflictSameStudent = validateReservationAttempt({
    room,
    sectionId: '101-b',
    studentId: 'DYP-IT-2026-042',
    day: 'Monday',
    startMinutes: 10 * 60 + 30,
    requestedEndMinutes: 11 * 60 + 30,
    availability: avail,
    existingReservations: existing,
  });
  assert.equal(conflictSameStudent.ok, false);

  // Different student booking free section B succeeds
  const validAttempt = validateReservationAttempt({
    room,
    sectionId: '101-b',
    studentId: 'DYP-CE-2026-019',
    day: 'Monday',
    startMinutes: 10 * 60 + 30,
    requestedEndMinutes: 11 * 60 + 30,
    availability: avail,
    existingReservations: existing,
  });
  assert.equal(validAttempt.ok, true);
});

test('filterRooms filters by search query, duration, and room category', () => {
  const room1 = makeDemoRoom({ roomId: 'r1', roomNumber: 'Room 101', category: 'classroom' });
  const room2 = makeDemoRoom({
    roomId: 'r2',
    roomNumber: 'Computer Lab 1',
    category: 'computer_lab',
    status: 'occupied',
  });
  const rooms = [room1, room2];
  const map = Object.fromEntries(
    rooms.map((r) => [
      r.roomId,
      calculateRoomAvailability(r, 10 * 60 + 15, 'Monday', sampleStudentTimetable, []),
    ]),
  );

  assert.equal(filterRooms(rooms, map, 'Lab', 'all').length, 1);
  assert.equal(filterRooms(rooms, map, '', 'available_now').length, 1);
  assert.equal(filterRooms(rooms, map, '', '1h').length, 1);
  assert.equal(filterRooms(rooms, map, '', '2h').length, 0);
});

test('formatting helpers produce clean 12-hour times, durations, and HH:MM:SS countdowns', () => {
  assert.equal(formatMinutesTo12h(10 * 60 + 15), '10:15 AM');
  assert.equal(formatMinutesTo12h(12 * 60), '12:00 PM');
  assert.equal(formatDurationLabel(90), '1 hour 30 min');
  assert.equal(formatCountdownHMS(5075), '01:24:35');
});
