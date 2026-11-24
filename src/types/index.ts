export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type RoomStatus =
  | 'verified_available'
  | 'occupied'
  | 'reserved'
  | 'unknown';

export type SectionStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'unavailable';

export type RoomCategory = 'classroom' | 'computer_lab' | 'group_study';

export type RoomFilterKey =
  | 'all'
  | 'available_now'
  | '30m'
  | '1h'
  | '2h'
  | 'computer_lab'
  | 'classroom'
  | 'group_study';

export type StudentTab =
  | 'home'
  | 'explore'
  | 'booking'
  | 'timetable'
  | 'profile';

export type AppViewMode = 'student' | 'login' | 'faculty' | 'admin';

export interface StudentProfile {
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: string;
  division: string;
}

export interface FacultyProfile {
  facultyId: string;
  name: string;
  department: string;
  assignedRoomIds: string[];
}

export interface AdminProfile {
  adminId: string;
  name: string;
  roleTitle: string;
}

export interface DeskSection {
  sectionId: string;
  label: string; // e.g., "Section A"
  shortCode: string; // e.g., "A"
  deskCount: number; // 4-5 desks
  status: SectionStatus;
  zone: 'front-left' | 'front-right' | 'rear-left' | 'rear-right' | 'center-left' | 'center-right';
  hasPowerOutlets?: boolean;
  nearWindow?: boolean;
}

export interface TimetableSlot {
  scheduleId: string;
  day: DayOfWeek;
  startTime: string; // 24h "HH:MM" e.g. "09:00"
  endTime: string; // 24h "HH:MM" e.g. "10:00"
  subject: string;
  roomLabel: string;
  facultyName?: string;
  type: 'lecture' | 'practical' | 'break' | 'cancelled';
}

export interface RoomScheduleEntry {
  scheduleId: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  subject: string;
  batchLabel: string;
  status: 'scheduled' | 'cancelled' | 'maintenance' | 'extra';
}

export interface Room {
  roomId: string;
  roomNumber: string; // e.g., "Room 101"
  buildingId: string;
  buildingName: string;
  floor: string;
  category: RoomCategory;
  capacity: number;
  facilities: string[];
  status: RoomStatus;
  verifiedBy: string;
  verifiedAtIso: string;
  statusSource: 'faculty_qr' | 'faculty_panel' | 'admin_panel' | 'system_expiry';
  scheduleVerified: boolean;
  sections: DeskSection[];
  timetable: RoomScheduleEntry[];
  maintenanceNote?: string;
  qrCodeValue: string;
}

export interface Reservation {
  bookingId: string;
  studentId: string;
  studentName: string;
  department: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  floor: string;
  sectionId: string;
  sectionLabel: string;
  deskCount: number;
  day: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
  createdAtIso: string;
  status: 'active' | 'cancelled' | 'completed';
  limitingReason: string;
  groupSize: number;
}

export interface VerificationLog {
  eventId: string;
  roomId: string;
  roomNumber: string;
  actorName: string;
  actorRole: 'faculty' | 'admin';
  oldStatus: RoomStatus;
  newStatus: RoomStatus;
  timestampIso: string;
  reason: string;
}

export interface StatusReport {
  reportId: string;
  roomId: string;
  roomNumber: string;
  studentId: string;
  studentName: string;
  reportedObservation: string;
  createdAtIso: string;
  resolved: boolean;
}

export interface AppNotification {
  notificationId: string;
  type: 'booking' | 'warning' | 'status_change' | 'info';
  title: string;
  message: string;
  createdAtIso: string;
  read: boolean;
}

export type FreeTimeState =
  | 'free_period'
  | 'in_lecture'
  | 'before_classes'
  | 'after_classes'
  | 'no_schedule';

export interface FreeTimeSummary {
  state: FreeTimeState;
  currentDay: DayOfWeek;
  currentMinutes: number;
  currentPeriodLabel: string;
  currentLecture: TimetableSlot | null;
  nextLecture: TimetableSlot | null;
  freeWindowStartMinutes: number | null;
  freeWindowEndMinutes: number | null;
  remainingFreeMinutes: number;
  remainingLectureMinutes: number;
  formattedRemainingFree: string;
  progressPercent: number;
}

export interface RoomAvailabilityResult {
  roomId: string;
  effectiveStatus: RoomStatus;
  isVerificationStale: boolean;
  isScheduleVerified: boolean;
  canBook: boolean;
  disabledReason: string | null;
  permittedEndMinutes: number | null;
  availableMinutes: number;
  formattedAvailableDuration: string;
  limitingReason: string;
  roomNextLecture: RoomScheduleEntry | null;
  studentNextLecture: TimetableSlot | null;
  availableSectionsCount: number;
  availableDesksCount: number;
  totalDesksCount: number;
}

export interface ClockConfig {
  mode: 'demo' | 'live';
  demoDay: DayOfWeek;
  demoBaseMinutes: number; // e.g., 10 * 60 + 15 = 615 (10:15 AM)
  demoOffsetSeconds: number;
}
