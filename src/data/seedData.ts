import type {
  AppNotification,
  DayOfWeek,
  FacultyProfile,
  Reservation,
  Room,
  StudentProfile,
  TimetableSlot,
  VerificationLog,
} from '../types';

export const INSTITUTION_NAME =
  'Dr. D. Y. Patil Institute of Technology, Pimpri, Akurdi, Pune';

export const DEPARTMENTS: string[] = [
  'Information Technology',
  'Computer Engineering',
  'Computer Science and Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electronics and Telecommunication',
];

export const ACADEMIC_YEARS: string[] = [
  'FE (First Year)',
  'SE (Second Year)',
  'TE (Third Year)',
  'BE (Final Year)',
];

export const DIVISIONS: string[] = ['Division A', 'Division B', 'Division C'];

export const BUILDINGS = [
  { buildingId: 'bldg-a', name: 'Main Academic Block A (Demo)', floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'] },
  { buildingId: 'bldg-b', name: 'Engineering Wing B (Demo)', floors: ['1st Floor', '2nd Floor', '3rd Floor'] },
  { buildingId: 'bldg-c', name: 'Computing Center C (Demo)', floors: ['Ground Floor', '1st Floor', '2nd Floor'] },
];

export const DEMO_STUDENT_PRESETS: StudentProfile[] = [
  {
    studentId: 'DYP-IT-2026-042',
    name: 'Aarav Kulkarni',
    email: 'aarav.kulkarni@dyp-demo.edu.in',
    department: 'Information Technology',
    year: 'TE (Third Year)',
    division: 'Division A',
  },
  {
    studentId: 'DYP-CE-2026-108',
    name: 'Ananya Deshpande',
    email: 'ananya.deshpande@dyp-demo.edu.in',
    department: 'Computer Engineering',
    year: 'SE (Second Year)',
    division: 'Division B',
  },
  {
    studentId: 'DYP-ENTC-2026-073',
    name: 'Rohan Patil',
    email: 'rohan.patil@dyp-demo.edu.in',
    department: 'Electronics and Telecommunication',
    year: 'BE (Final Year)',
    division: 'Division A',
  },
];

export const DEMO_FACULTY_PRESETS: FacultyProfile[] = [
  {
    facultyId: 'FAC-IT-104',
    name: 'Prof. Sneha Deshmukh',
    department: 'Information Technology',
    assignedRoomIds: ['room-101', 'room-102', 'room-103', 'lab-1', 'lab-2'],
  },
  {
    facultyId: 'FAC-CE-209',
    name: 'Prof. Rajesh Joshi',
    department: 'Computer Engineering',
    assignedRoomIds: ['room-201', 'room-202', 'seminar-hall', 'room-101'],
  },
];

export function createInitialStudentTimetable(): TimetableSlot[] {
  return [
    // Monday — At 10:15 AM: Free period 10:00 -> 12:00 (1 hr 45 min remaining!)
    {
      scheduleId: 'mon-1',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Operating Systems',
      roomLabel: 'Room 201',
      facultyName: 'Prof. R. Joshi',
      type: 'lecture',
    },
    {
      scheduleId: 'mon-2',
      day: 'Monday',
      startTime: '12:00',
      endTime: '13:00',
      subject: 'Database Management Systems',
      roomLabel: 'Room 104',
      facultyName: 'Prof. S. Deshmukh',
      type: 'lecture',
    },
    {
      scheduleId: 'mon-3',
      day: 'Monday',
      startTime: '14:00',
      endTime: '15:00',
      subject: 'Computer Networks',
      roomLabel: 'Room 102',
      facultyName: 'Prof. M. Kulkarni',
      type: 'lecture',
    },
    {
      scheduleId: 'mon-4',
      day: 'Monday',
      startTime: '15:00',
      endTime: '17:00',
      subject: 'Web Application Development Lab',
      roomLabel: 'Computer Lab 2',
      facultyName: 'Prof. P. Shinde',
      type: 'practical',
    },

    // Tuesday
    {
      scheduleId: 'tue-1',
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Software Engineering',
      roomLabel: 'Room 101',
      facultyName: 'Prof. N. Pawar',
      type: 'lecture',
    },
    {
      scheduleId: 'tue-2',
      day: 'Tuesday',
      startTime: '11:30',
      endTime: '12:30',
      subject: 'Database Management Systems',
      roomLabel: 'Room 103',
      facultyName: 'Prof. S. Deshmukh',
      type: 'lecture',
    },
    {
      scheduleId: 'tue-3',
      day: 'Tuesday',
      startTime: '14:00',
      endTime: '16:00',
      subject: 'DBMS Practical',
      roomLabel: 'Computer Lab 1',
      facultyName: 'Prof. S. Deshmukh',
      type: 'practical',
    },

    // Wednesday
    {
      scheduleId: 'wed-1',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Computer Networks',
      roomLabel: 'Room 102',
      facultyName: 'Prof. M. Kulkarni',
      type: 'lecture',
    },
    {
      scheduleId: 'wed-2',
      day: 'Wednesday',
      startTime: '12:00',
      endTime: '13:00',
      subject: 'Theory of Computation',
      roomLabel: 'Room 201',
      facultyName: 'Prof. V. Gokhale',
      type: 'lecture',
    },
    {
      scheduleId: 'wed-3',
      day: 'Wednesday',
      startTime: '14:30',
      endTime: '15:30',
      subject: 'Operating Systems',
      roomLabel: 'Room 101',
      facultyName: 'Prof. R. Joshi',
      type: 'lecture',
    },

    // Thursday
    {
      scheduleId: 'thu-1',
      day: 'Thursday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Theory of Computation',
      roomLabel: 'Room 201',
      facultyName: 'Prof. V. Gokhale',
      type: 'lecture',
    },
    {
      scheduleId: 'thu-2',
      day: 'Thursday',
      startTime: '11:45',
      endTime: '12:45',
      subject: 'Software Engineering',
      roomLabel: 'Room 103',
      facultyName: 'Prof. N. Pawar',
      type: 'lecture',
    },
    {
      scheduleId: 'thu-3',
      day: 'Thursday',
      startTime: '14:00',
      endTime: '16:00',
      subject: 'Computer Networks Lab',
      roomLabel: 'Computer Lab 1',
      facultyName: 'Prof. M. Kulkarni',
      type: 'practical',
    },

    // Friday
    {
      scheduleId: 'fri-1',
      day: 'Friday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Database Management Systems',
      roomLabel: 'Room 101',
      facultyName: 'Prof. S. Deshmukh',
      type: 'lecture',
    },
    {
      scheduleId: 'fri-2',
      day: 'Friday',
      startTime: '12:00',
      endTime: '13:00',
      subject: 'Operating Systems',
      roomLabel: 'Room 102',
      facultyName: 'Prof. R. Joshi',
      type: 'lecture',
    },
    {
      scheduleId: 'fri-3',
      day: 'Friday',
      startTime: '14:00',
      endTime: '15:00',
      subject: 'Mini Project Seminar',
      roomLabel: 'Seminar Hall',
      facultyName: 'Prof. P. Shinde',
      type: 'lecture',
    },

    // Saturday
    {
      scheduleId: 'sat-1',
      day: 'Saturday',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Technical Aptitude Workshop',
      roomLabel: 'Seminar Hall',
      facultyName: 'Placement Cell (Demo)',
      type: 'lecture',
    },
    {
      scheduleId: 'sat-2',
      day: 'Saturday',
      startTime: '12:00',
      endTime: '13:00',
      subject: 'Open Elective — Cloud Basics',
      roomLabel: 'Room 102',
      facultyName: 'Prof. N. Pawar',
      type: 'lecture',
    },
  ];
}

function minutesAgoIso(minsAgo: number): string {
  return new Date(Date.now() - minsAgo * 60 * 1000).toISOString();
}

function makeRoomScheduleForAllDays(
  entries: Array<{ startTime: string; endTime: string; subject: string; batchLabel: string; status?: 'scheduled' | 'maintenance' }>,
): Room['timetable'] {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.flatMap((day, dIdx) =>
    entries.map((entry, eIdx) => ({
      scheduleId: `rs-${day.slice(0, 3).toLowerCase()}-${dIdx}-${eIdx}`,
      day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      batchLabel: entry.batchLabel,
      status: entry.status ?? 'scheduled',
    })),
  );
}

export function createInitialRooms(): Room[] {
  return [
    {
      roomId: 'room-101',
      roomNumber: 'Room 101',
      buildingId: 'bldg-a',
      buildingName: 'Main Academic Block A',
      floor: '1st Floor',
      category: 'classroom',
      capacity: 20,
      facilities: ['Whiteboard', 'Projector', 'Wi-Fi', 'Power Outlets'],
      status: 'verified_available',
      verifiedBy: 'Prof. Sneha Deshmukh',
      verifiedAtIso: minutesAgoIso(6),
      statusSource: 'faculty_qr',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:room-101',
      sections: [
        { sectionId: '101-a', label: 'Section A', shortCode: 'A', deskCount: 5, status: 'available', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: '101-b', label: 'Section B', shortCode: 'B', deskCount: 5, status: 'available', zone: 'front-right', nearWindow: true },
        { sectionId: '101-c', label: 'Section C', shortCode: 'C', deskCount: 5, status: 'reserved', zone: 'rear-left', hasPowerOutlets: true },
        { sectionId: '101-d', label: 'Section D', shortCode: 'D', deskCount: 5, status: 'available', zone: 'rear-right', nearWindow: true },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '08:30', endTime: '09:30', subject: 'Engineering Mathematics III', batchLabel: 'SE IT A' },
        { startTime: '11:45', endTime: '12:45', subject: 'Discrete Mathematics', batchLabel: 'SE Comp A' },
        { startTime: '14:00', endTime: '15:00', subject: 'Data Structures', batchLabel: 'SE IT B' },
      ]),
    },
    {
      roomId: 'room-102',
      roomNumber: 'Room 102',
      buildingId: 'bldg-a',
      buildingName: 'Main Academic Block A',
      floor: '1st Floor',
      category: 'classroom',
      capacity: 20,
      facilities: ['Whiteboard', 'Wi-Fi', 'Ceiling Fans'],
      status: 'verified_available',
      verifiedBy: 'Prof. Sneha Deshmukh',
      verifiedAtIso: minutesAgoIso(11),
      statusSource: 'faculty_panel',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:room-102',
      sections: [
        { sectionId: '102-a', label: 'Section A', shortCode: 'A', deskCount: 5, status: 'available', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: '102-b', label: 'Section B', shortCode: 'B', deskCount: 5, status: 'occupied', zone: 'front-right' },
        { sectionId: '102-c', label: 'Section C', shortCode: 'C', deskCount: 5, status: 'available', zone: 'rear-left' },
        { sectionId: '102-d', label: 'Section D', shortCode: 'D', deskCount: 5, status: 'available', zone: 'rear-right', nearWindow: true },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '09:00', endTime: '10:00', subject: 'Digital Electronics', batchLabel: 'SE ENTC A' },
        { startTime: '13:00', endTime: '14:00', subject: 'Microprocessors', batchLabel: 'TE Comp B' },
        { startTime: '14:00', endTime: '15:00', subject: 'Computer Networks', batchLabel: 'TE IT A' },
      ]),
    },
    {
      roomId: 'room-103',
      roomNumber: 'Room 103',
      buildingId: 'bldg-a',
      buildingName: 'Main Academic Block A',
      floor: '1st Floor',
      category: 'classroom',
      capacity: 20,
      facilities: ['Projector', 'Smart Board', 'Wi-Fi', 'AC'],
      status: 'occupied',
      verifiedBy: 'Prof. Sneha Deshmukh',
      verifiedAtIso: minutesAgoIso(14),
      statusSource: 'faculty_qr',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:room-103',
      sections: [
        { sectionId: '103-a', label: 'Section A', shortCode: 'A', deskCount: 5, status: 'occupied', zone: 'front-left' },
        { sectionId: '103-b', label: 'Section B', shortCode: 'B', deskCount: 5, status: 'occupied', zone: 'front-right' },
        { sectionId: '103-c', label: 'Section C', shortCode: 'C', deskCount: 5, status: 'occupied', zone: 'rear-left' },
        { sectionId: '103-d', label: 'Section D', shortCode: 'D', deskCount: 5, status: 'occupied', zone: 'rear-right' },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '10:00', endTime: '11:30', subject: 'Machine Learning Elective', batchLabel: 'BE Comp A' },
        { startTime: '12:30', endTime: '13:30', subject: 'Software Testing', batchLabel: 'TE IT B' },
      ]),
    },
    {
      roomId: 'room-201',
      roomNumber: 'Room 201',
      buildingId: 'bldg-b',
      buildingName: 'Engineering Wing B',
      floor: '2nd Floor',
      category: 'group_study',
      capacity: 16,
      facilities: ['Group Tables', 'Whiteboard', 'Wi-Fi', 'Power Outlets'],
      status: 'verified_available',
      verifiedBy: 'Prof. Rajesh Joshi',
      verifiedAtIso: minutesAgoIso(4),
      statusSource: 'faculty_qr',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:room-201',
      sections: [
        { sectionId: '201-a', label: 'Section A', shortCode: 'A', deskCount: 4, status: 'available', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: '201-b', label: 'Section B', shortCode: 'B', deskCount: 4, status: 'available', zone: 'front-right', hasPowerOutlets: true, nearWindow: true },
        { sectionId: '201-c', label: 'Section C', shortCode: 'C', deskCount: 4, status: 'available', zone: 'rear-left', hasPowerOutlets: true },
        { sectionId: '201-d', label: 'Section D', shortCode: 'D', deskCount: 4, status: 'unavailable', zone: 'rear-right' },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '09:00', endTime: '10:00', subject: 'Operating Systems', batchLabel: 'TE IT A' },
        { startTime: '12:30', endTime: '13:30', subject: 'Project Review Slot', batchLabel: 'BE IT A' },
      ]),
    },
    {
      roomId: 'room-202',
      roomNumber: 'Room 202',
      buildingId: 'bldg-b',
      buildingName: 'Engineering Wing B',
      floor: '2nd Floor',
      category: 'classroom',
      capacity: 20,
      facilities: ['Whiteboard', 'Wi-Fi'],
      status: 'unknown',
      verifiedBy: 'Not verified today',
      verifiedAtIso: minutesAgoIso(180),
      statusSource: 'system_expiry',
      scheduleVerified: false,
      qrCodeValue: 'DYP-LIVE-ROOM:room-202',
      sections: [
        { sectionId: '202-a', label: 'Section A', shortCode: 'A', deskCount: 5, status: 'unavailable', zone: 'front-left' },
        { sectionId: '202-b', label: 'Section B', shortCode: 'B', deskCount: 5, status: 'unavailable', zone: 'front-right' },
        { sectionId: '202-c', label: 'Section C', shortCode: 'C', deskCount: 5, status: 'unavailable', zone: 'rear-left' },
        { sectionId: '202-d', label: 'Section D', shortCode: 'D', deskCount: 5, status: 'unavailable', zone: 'rear-right' },
      ],
      timetable: [],
    },
    {
      roomId: 'lab-1',
      roomNumber: 'Computer Lab 1',
      buildingId: 'bldg-c',
      buildingName: 'Computing Center C',
      floor: '1st Floor',
      category: 'computer_lab',
      capacity: 24,
      facilities: ['Desktop PCs', 'High-Speed LAN', 'AC', 'Power Outlets', 'Projector'],
      status: 'verified_available',
      verifiedBy: 'Prof. Sneha Deshmukh',
      verifiedAtIso: minutesAgoIso(9),
      statusSource: 'faculty_qr',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:lab-1',
      sections: [
        { sectionId: 'lab1-a', label: 'Bay A', shortCode: 'A', deskCount: 4, status: 'available', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: 'lab1-b', label: 'Bay B', shortCode: 'B', deskCount: 4, status: 'available', zone: 'front-right', hasPowerOutlets: true },
        { sectionId: 'lab1-c', label: 'Bay C', shortCode: 'C', deskCount: 4, status: 'reserved', zone: 'center-left', hasPowerOutlets: true },
        { sectionId: 'lab1-d', label: 'Bay D', shortCode: 'D', deskCount: 4, status: 'available', zone: 'center-right', hasPowerOutlets: true },
        { sectionId: 'lab1-e', label: 'Bay E', shortCode: 'E', deskCount: 4, status: 'occupied', zone: 'rear-left', hasPowerOutlets: true },
        { sectionId: 'lab1-f', label: 'Bay F', shortCode: 'F', deskCount: 4, status: 'available', zone: 'rear-right', hasPowerOutlets: true },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '08:30', endTime: '10:00', subject: 'Python Programming Lab', batchLabel: 'FE Comp B' },
        { startTime: '11:15', endTime: '13:15', subject: 'Data Science Practical', batchLabel: 'TE CSE A' },
      ]),
    },
    {
      roomId: 'lab-2',
      roomNumber: 'Computer Lab 2',
      buildingId: 'bldg-c',
      buildingName: 'Computing Center C',
      floor: '1st Floor',
      category: 'computer_lab',
      capacity: 20,
      facilities: ['Linux Workstations', 'LAN', 'AC', 'Power Outlets'],
      status: 'reserved',
      verifiedBy: 'Prof. Sneha Deshmukh',
      verifiedAtIso: minutesAgoIso(18),
      statusSource: 'faculty_panel',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:lab-2',
      sections: [
        { sectionId: 'lab2-a', label: 'Bay A', shortCode: 'A', deskCount: 5, status: 'reserved', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: 'lab2-b', label: 'Bay B', shortCode: 'B', deskCount: 5, status: 'reserved', zone: 'front-right', hasPowerOutlets: true },
        { sectionId: 'lab2-c', label: 'Bay C', shortCode: 'C', deskCount: 5, status: 'reserved', zone: 'rear-left', hasPowerOutlets: true },
        { sectionId: 'lab2-d', label: 'Bay D', shortCode: 'D', deskCount: 5, status: 'reserved', zone: 'rear-right', hasPowerOutlets: true },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '11:00', endTime: '13:00', subject: 'Hackathon Prep Allocation', batchLabel: 'Coding Club' },
        { startTime: '15:00', endTime: '17:00', subject: 'Web App Dev Lab', batchLabel: 'TE IT A' },
      ]),
    },
    {
      roomId: 'seminar-hall',
      roomNumber: 'Seminar Hall',
      buildingId: 'bldg-a',
      buildingName: 'Main Academic Block A',
      floor: 'Ground Floor',
      category: 'group_study',
      capacity: 25,
      facilities: ['AC', 'Audio System', 'Wi-Fi', 'Collaborative Desks', 'Power Outlets'],
      status: 'verified_available',
      verifiedBy: 'Prof. Rajesh Joshi',
      verifiedAtIso: minutesAgoIso(5),
      statusSource: 'faculty_qr',
      scheduleVerified: true,
      qrCodeValue: 'DYP-LIVE-ROOM:seminar-hall',
      sections: [
        { sectionId: 'sem-a', label: 'Zone A', shortCode: 'A', deskCount: 5, status: 'available', zone: 'front-left', hasPowerOutlets: true },
        { sectionId: 'sem-b', label: 'Zone B', shortCode: 'B', deskCount: 5, status: 'available', zone: 'front-right', hasPowerOutlets: true },
        { sectionId: 'sem-c', label: 'Zone C', shortCode: 'C', deskCount: 5, status: 'available', zone: 'center-left' },
        { sectionId: 'sem-d', label: 'Zone D', shortCode: 'D', deskCount: 5, status: 'available', zone: 'center-right' },
        { sectionId: 'sem-e', label: 'Zone E', shortCode: 'E', deskCount: 5, status: 'available', zone: 'rear-left', nearWindow: true },
      ],
      timetable: makeRoomScheduleForAllDays([
        { startTime: '13:30', endTime: '15:00', subject: 'Department Guest Talk', batchLabel: 'All TE Batches' },
      ]),
    },
  ];
}

export function createInitialReservations(): Reservation[] {
  return [
    {
      bookingId: 'DYP-BK-8412',
      studentId: 'DYP-IT-2026-042',
      studentName: 'Aarav Kulkarni',
      department: 'Information Technology',
      roomId: 'room-201',
      roomNumber: 'Room 201',
      buildingName: 'Engineering Wing B',
      floor: '2nd Floor',
      sectionId: '201-a',
      sectionLabel: 'Section A',
      deskCount: 4,
      day: 'Saturday',
      startMinutes: 10 * 60 + 15,
      endMinutes: 11 * 60 + 45,
      createdAtIso: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status: 'completed',
      limitingReason: 'Your next lecture started at 12:00 PM',
      groupSize: 3,
    },
  ];
}

export function createInitialVerificationLogs(): VerificationLog[] {
  return [
    {
      eventId: 'ver-1',
      roomId: 'room-101',
      roomNumber: 'Room 101',
      actorName: 'Prof. Sneha Deshmukh',
      actorRole: 'faculty',
      oldStatus: 'unknown',
      newStatus: 'verified_available',
      timestampIso: minutesAgoIso(6),
      reason: 'QR scan occupancy check after 9:30 AM lecture cleared.',
    },
    {
      eventId: 'ver-2',
      roomId: 'room-201',
      roomNumber: 'Room 201',
      actorName: 'Prof. Rajesh Joshi',
      actorRole: 'faculty',
      oldStatus: 'occupied',
      newStatus: 'verified_available',
      timestampIso: minutesAgoIso(4),
      reason: 'Operating Systems lecture ended; room open for group study.',
    },
    {
      eventId: 'ver-3',
      roomId: 'room-103',
      roomNumber: 'Room 103',
      actorName: 'Prof. Sneha Deshmukh',
      actorRole: 'faculty',
      oldStatus: 'verified_available',
      newStatus: 'occupied',
      timestampIso: minutesAgoIso(14),
      reason: 'Machine Learning Elective currently in progress.',
    },
  ];
}

export function createInitialNotifications(): AppNotification[] {
  return [
    {
      notificationId: 'notif-1',
      type: 'status_change',
      title: 'Room 101 verified open',
      message: 'Prof. Sneha Deshmukh verified Room 101 (Block A) available until 11:45 AM.',
      createdAtIso: minutesAgoIso(6),
      read: false,
    },
    {
      notificationId: 'notif-2',
      type: 'info',
      title: 'Free lecture window detected',
      message: 'You have a free period before Database Management Systems at 12:00 PM.',
      createdAtIso: minutesAgoIso(12),
      read: false,
    },
  ];
}
