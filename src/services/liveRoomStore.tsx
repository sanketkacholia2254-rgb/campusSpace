import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInitialNotifications,
  createInitialReservations,
  createInitialRooms,
  createInitialStudentTimetable,
  createInitialVerificationLogs,
  DEMO_STUDENT_PRESETS,
} from '../data/seedData';
import type {
  AdminProfile,
  AppNotification,
  ClockConfig,
  DayOfWeek,
  DeskSection,
  FacultyProfile,
  FreeTimeSummary,
  Reservation,
  Room,
  RoomAvailabilityResult,
  RoomStatus,
  StatusReport,
  StudentProfile,
  TimetableSlot,
  VerificationLog,
} from '../types';
import {
  calculateRoomAvailability,
  calculateStudentFreeTime,
  formatMinutesTo12h,
  getDayFromJsDate,
  validateReservationAttempt,
} from '../utils/availabilityEngine';

const STORAGE_KEY = 'dyp_live_room_state_v1';
const BROADCAST_CHANNEL_NAME = 'dyp_live_room_sync_v1';

interface PersistedState {
  student: StudentProfile;
  isStudentSignedIn: boolean;
  rooms: Room[];
  studentTimetable: TimetableSlot[];
  reservations: Reservation[];
  verificationLogs: VerificationLog[];
  statusReports: StatusReport[];
  notifications: AppNotification[];
  recentRoomIds: string[];
}

function loadInitialPersistedState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.student && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        return {
          student: parsed.student,
          isStudentSignedIn: parsed.isStudentSignedIn ?? true,
          rooms: parsed.rooms,
          studentTimetable:
            Array.isArray(parsed.studentTimetable) && parsed.studentTimetable.length > 0
              ? parsed.studentTimetable
              : createInitialStudentTimetable(),
          reservations: Array.isArray(parsed.reservations)
            ? parsed.reservations
            : createInitialReservations(),
          verificationLogs: Array.isArray(parsed.verificationLogs)
            ? parsed.verificationLogs
            : createInitialVerificationLogs(),
          statusReports: Array.isArray(parsed.statusReports) ? parsed.statusReports : [],
          notifications: Array.isArray(parsed.notifications)
            ? parsed.notifications
            : createInitialNotifications(),
          recentRoomIds: Array.isArray(parsed.recentRoomIds)
            ? parsed.recentRoomIds
            : ['room-101', 'room-201', 'lab-1'],
        };
      }
    }
  } catch {
    // Fallback cleanly to deterministic seed data
  }

  return {
    student: DEMO_STUDENT_PRESETS[0],
    isStudentSignedIn: true,
    rooms: createInitialRooms(),
    studentTimetable: createInitialStudentTimetable(),
    reservations: createInitialReservations(),
    verificationLogs: createInitialVerificationLogs(),
    statusReports: [],
    notifications: createInitialNotifications(),
    recentRoomIds: ['room-101', 'room-201', 'lab-1'],
  };
}

export interface LiveRoomContextValue {
  // User & auth state
  student: StudentProfile;
  isStudentSignedIn: boolean;
  facultySession: FacultyProfile | null;
  adminSession: AdminProfile | null;
  signInStudent: (profile: StudentProfile) => void;
  updateStudentProfile: (profile: StudentProfile) => void;
  signOutStudent: () => void;
  signInFaculty: (profile: FacultyProfile) => void;
  signOutFaculty: () => void;
  signInAdmin: (profile: AdminProfile) => void;
  signOutAdmin: () => void;

  // Campus Clock (supports both live system clock & demo campus 10:15 AM clock)
  clockConfig: ClockConfig;
  currentDay: DayOfWeek;
  currentMinutes: number;
  currentTotalSeconds: number;
  setClockPreset: (preset: { mode: 'demo' | 'live'; day?: DayOfWeek; minutes?: number }) => void;

  // Core data & computed intelligence
  rooms: Room[];
  studentTimetable: TimetableSlot[];
  reservations: Reservation[];
  activeReservation: Reservation | null;
  verificationLogs: VerificationLog[];
  statusReports: StatusReport[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  recentRoomIds: string[];
  freeTimeSummary: FreeTimeSummary;
  availabilityMap: Record<string, RoomAvailabilityResult>;
  lastSyncIso: string;

  // Student actions
  recordRoomVisit: (roomId: string) => void;
  createReservation: (params: {
    roomId: string;
    sectionId: string;
    endMinutes: number;
    groupSize: number;
  }) => { ok: boolean; error?: string; reservation?: Reservation };
  cancelReservation: (bookingId: string) => void;
  submitStatusReport: (roomId: string, observation: string) => void;

  // Timetable editing
  addTimetableSlot: (slot: Omit<TimetableSlot, 'scheduleId'>) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  deleteTimetableSlot: (scheduleId: string) => void;

  // Notifications
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  // Faculty actions (authorized)
  updateRoomStatusByStaff: (params: {
    roomId: string;
    newStatus: RoomStatus;
    reason: string;
    actorName: string;
    actorRole: 'faculty' | 'admin';
    source: Room['statusSource'];
    scheduleVerified?: boolean;
  }) => void;
  reportCancelledOrExtraLecture: (params: {
    roomId: string;
    action: 'cancel_next' | 'add_extra' | 'maintenance';
    subject: string;
    startTime: string;
    endTime: string;
    actorName: string;
  }) => void;
  resolveStatusReport: (reportId: string) => void;

  // Admin actions
  addRoom: (room: Omit<Room, 'roomId' | 'qrCodeValue'>) => void;
  updateRoomConfig: (roomId: string, updates: Partial<Pick<Room, 'roomNumber' | 'buildingName' | 'floor' | 'capacity' | 'facilities' | 'sections' | 'category' | 'scheduleVerified'>>) => void;
  resetDemoData: () => void;
}

const LiveRoomContext = createContext<LiveRoomContextValue | null>(null);

export function LiveRoomProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadInitialPersistedState());
  const [facultySession, setFacultySession] = useState<FacultyProfile | null>(null);
  const [adminSession, setAdminSession] = useState<AdminProfile | null>(null);
  const [lastSyncIso, setLastSyncIso] = useState<string>(() => new Date().toISOString());

  // Default to Demo Campus Clock at Monday 10:15:00 AM (ticking live every second)
  // so reviewers see the exact realistic campus free-period state regardless of local midnight time,
  // while providing a 1-click toggle to Live Local Clock.
  const [clockConfig, setClockConfig] = useState<ClockConfig>({
    mode: 'demo',
    demoDay: 'Monday',
    demoBaseMinutes: 10 * 60 + 15, // 10:15 AM
    demoOffsetSeconds: 0,
  });

  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  const tenMinAlertSentRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Tick every second for real-time clock and active study session countdown
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveNow(new Date());
      setClockConfig((prev) =>
        prev.mode === 'demo'
          ? { ...prev, demoOffsetSeconds: prev.demoOffsetSeconds + 1 }
          : prev,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Cross-tab real-time synchronization (simulates Firestore onSnapshot listeners locally)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_SYNC' && event.data.payload) {
        setState(event.data.payload as PersistedState);
        setLastSyncIso(new Date().toISOString());
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const persistAndBroadcast = useCallback((next: PersistedState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors in private browsing
    }
    setLastSyncIso(new Date().toISOString());
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'STATE_SYNC', payload: next });
    }
  }, []);

  const updateState = useCallback(
    (updater: (prev: PersistedState) => PersistedState) => {
      setState((prev) => {
        const next = updater(prev);
        persistAndBroadcast(next);
        return next;
      });
    },
    [persistAndBroadcast],
  );

  // Compute current day, minutes, and exact seconds of day
  const { currentDay, currentMinutes, currentTotalSeconds } = useMemo(() => {
    if (clockConfig.mode === 'live') {
      const hrs = liveNow.getHours();
      const mins = liveNow.getMinutes();
      const secs = liveNow.getSeconds();
      return {
        currentDay: getDayFromJsDate(liveNow),
        currentMinutes: hrs * 60 + mins,
        currentTotalSeconds: hrs * 3600 + mins * 60 + secs,
      };
    }
    const totalSecs = (clockConfig.demoBaseMinutes * 60 + clockConfig.demoOffsetSeconds) % 86400;
    return {
      currentDay: clockConfig.demoDay,
      currentMinutes: Math.floor(totalSecs / 60),
      currentTotalSeconds: totalSecs,
    };
  }, [clockConfig, liveNow]);

  const setClockPreset = useCallback(
    (preset: { mode: 'demo' | 'live'; day?: DayOfWeek; minutes?: number }) => {
      setClockConfig((prev) => ({
        mode: preset.mode,
        demoDay: preset.day ?? prev.demoDay,
        demoBaseMinutes: preset.minutes ?? prev.demoBaseMinutes,
        demoOffsetSeconds: 0,
      }));
    },
    [],
  );

  const freeTimeSummary = useMemo(
    () => calculateStudentFreeTime(currentMinutes, currentDay, state.studentTimetable),
    [currentMinutes, currentDay, state.studentTimetable],
  );

  const availabilityMap = useMemo(() => {
    const map: Record<string, RoomAvailabilityResult> = {};
    const nowMs = liveNow.getTime();
    for (const room of state.rooms) {
      map[room.roomId] = calculateRoomAvailability(
        room,
        currentMinutes,
        currentDay,
        state.studentTimetable,
        state.reservations,
        nowMs,
      );
    }
    return map;
  }, [state.rooms, state.studentTimetable, state.reservations, currentMinutes, currentDay, liveNow]);

  const activeReservation = useMemo(() => {
    return (
      state.reservations.find(
        (res) =>
          res.status === 'active' &&
          res.studentId === state.student.studentId &&
          res.day === currentDay &&
          res.endMinutes * 60 > currentTotalSeconds,
      ) ?? null
    );
  }, [state.reservations, state.student.studentId, currentDay, currentTotalSeconds]);

  // Auto-expire finished reservations & trigger 10-minute remaining alert (FR-10 & BR-10)
  useEffect(() => {
    const expired = state.reservations.filter(
      (res) =>
        res.status === 'active' &&
        res.day === currentDay &&
        res.endMinutes * 60 <= currentTotalSeconds,
    );
    if (expired.length > 0) {
      updateState((prev) => ({
        ...prev,
        reservations: prev.reservations.map((res) =>
          expired.some((e) => e.bookingId === res.bookingId)
            ? { ...res, status: 'completed' }
            : res,
        ),
        notifications: [
          ...expired.map((res) => ({
            notificationId: `notif-exp-${res.bookingId}`,
            type: 'warning' as const,
            title: `Study session ended (${res.roomNumber})`,
            message: `Your reservation for ${res.sectionLabel} in ${res.roomNumber} has expired at ${formatMinutesTo12h(res.endMinutes)}. Please vacate promptly for the next lecture.`,
            createdAtIso: new Date().toISOString(),
            read: false,
          })),
          ...prev.notifications,
        ].slice(0, 25),
      }));
    }

    if (activeReservation) {
      const remainingSeconds = activeReservation.endMinutes * 60 - currentTotalSeconds;
      if (
        remainingSeconds > 0 &&
        remainingSeconds <= 600 &&
        !tenMinAlertSentRef.current.has(activeReservation.bookingId)
      ) {
        tenMinAlertSentRef.current.add(activeReservation.bookingId);
        updateState((prev) => ({
          ...prev,
          notifications: [
            {
              notificationId: `notif-10m-${activeReservation.bookingId}`,
              type: 'warning' as const,
              title: '10 minutes remaining in study session',
              message: `Your session in ${activeReservation.roomNumber} (${activeReservation.sectionLabel}) ends at ${formatMinutesTo12h(activeReservation.endMinutes)}.`,
              createdAtIso: new Date().toISOString(),
              read: false,
            },
            ...prev.notifications,
          ].slice(0, 25),
        }));
      }
    }
  }, [activeReservation, currentDay, currentTotalSeconds, state.reservations, updateState]);

  const signInStudent = useCallback(
    (profile: StudentProfile) => {
      updateState((prev) => ({
        ...prev,
        student: profile,
        isStudentSignedIn: true,
      }));
    },
    [updateState],
  );

  const updateStudentProfile = useCallback(
    (profile: StudentProfile) => {
      updateState((prev) => ({
        ...prev,
        student: profile,
      }));
    },
    [updateState],
  );

  const signOutStudent = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      isStudentSignedIn: false,
    }));
  }, [updateState]);

  const signInFaculty = useCallback((profile: FacultyProfile) => {
    setFacultySession(profile);
  }, []);

  const signOutFaculty = useCallback(() => {
    setFacultySession(null);
  }, []);

  const signInAdmin = useCallback((profile: AdminProfile) => {
    setAdminSession(profile);
  }, []);

  const signOutAdmin = useCallback(() => {
    setAdminSession(null);
  }, []);

  const recordRoomVisit = useCallback(
    (roomId: string) => {
      updateState((prev) => ({
        ...prev,
        recentRoomIds: [roomId, ...prev.recentRoomIds.filter((id) => id !== roomId)].slice(0, 6),
      }));
    },
    [updateState],
  );

  const createReservation = useCallback(
    (params: { roomId: string; sectionId: string; endMinutes: number; groupSize: number }) => {
      const room = state.rooms.find((r) => r.roomId === params.roomId);
      if (!room) return { ok: false, error: 'Selected classroom was not found.' };

      const avail = availabilityMap[room.roomId];
      if (!avail) return { ok: false, error: 'Availability could not be verified.' };

      const validation = validateReservationAttempt({
        room,
        sectionId: params.sectionId,
        studentId: state.student.studentId,
        day: currentDay,
        startMinutes: currentMinutes,
        requestedEndMinutes: params.endMinutes,
        availability: avail,
        existingReservations: state.reservations,
      });

      if (!validation.ok) {
        return { ok: false, error: validation.error };
      }

      const section = room.sections.find((s) => s.sectionId === params.sectionId)!;
      const newBooking: Reservation = {
        bookingId: `DYP-BK-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: state.student.studentId,
        studentName: state.student.name,
        department: state.student.department,
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        buildingName: room.buildingName,
        floor: room.floor,
        sectionId: section.sectionId,
        sectionLabel: section.label,
        deskCount: section.deskCount,
        day: currentDay,
        startMinutes: currentMinutes,
        endMinutes: params.endMinutes,
        createdAtIso: new Date().toISOString(),
        status: 'active',
        limitingReason: avail.limitingReason,
        groupSize: Math.min(section.deskCount, Math.max(1, params.groupSize)),
      };

      updateState((prev) => ({
        ...prev,
        reservations: [newBooking, ...prev.reservations],
        recentRoomIds: [room.roomId, ...prev.recentRoomIds.filter((id) => id !== room.roomId)].slice(0, 6),
        notifications: [
          {
            notificationId: `notif-bk-${newBooking.bookingId}`,
            type: 'booking' as const,
            title: `Reserved ${room.roomNumber} · ${section.label}`,
            message: `${section.deskCount} desks reserved until ${formatMinutesTo12h(params.endMinutes)} (${room.buildingName}, ${room.floor}).`,
            createdAtIso: new Date().toISOString(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 25),
      }));

      return { ok: true, reservation: newBooking };
    },
    [state.rooms, state.student, state.reservations, availabilityMap, currentDay, currentMinutes, updateState],
  );

  const cancelReservation = useCallback(
    (bookingId: string) => {
      const target = state.reservations.find((r) => r.bookingId === bookingId);
      if (!target) return;

      updateState((prev) => ({
        ...prev,
        reservations: prev.reservations.map((res) =>
          res.bookingId === bookingId ? { ...res, status: 'cancelled' } : res,
        ),
        notifications: [
          {
            notificationId: `notif-cancel-${Date.now()}`,
            type: 'info' as const,
            title: `Reservation cancelled (${target.roomNumber})`,
            message: `${target.sectionLabel} has been released back to the student pool.`,
            createdAtIso: new Date().toISOString(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 25),
      }));
    },
    [state.reservations, updateState],
  );

  // BR-06: Student reports never automatically alter official verified status
  const submitStatusReport = useCallback(
    (roomId: string, observation: string) => {
      const room = state.rooms.find((r) => r.roomId === roomId);
      if (!room || !observation.trim()) return;
      const report: StatusReport = {
        reportId: `rep-${Date.now()}`,
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        studentId: state.student.studentId,
        studentName: state.student.name,
        reportedObservation: observation.trim(),
        createdAtIso: new Date().toISOString(),
        resolved: false,
      };
      updateState((prev) => ({
        ...prev,
        statusReports: [report, ...prev.statusReports],
        notifications: [
          {
            notificationId: `notif-rep-${Date.now()}`,
            type: 'info' as const,
            title: `Status report sent for ${room.roomNumber}`,
            message: 'Submitted to faculty verification queue. Official room status remains unchanged until staff verifies.',
            createdAtIso: new Date().toISOString(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 25),
      }));
    },
    [state.rooms, state.student, updateState],
  );

  const addTimetableSlot = useCallback(
    (slot: Omit<TimetableSlot, 'scheduleId'>) => {
      updateState((prev) => ({
        ...prev,
        studentTimetable: [
          ...prev.studentTimetable,
          { ...slot, scheduleId: `slot-${Date.now()}` },
        ],
      }));
    },
    [updateState],
  );

  const updateTimetableSlot = useCallback(
    (slot: TimetableSlot) => {
      updateState((prev) => ({
        ...prev,
        studentTimetable: prev.studentTimetable.map((item) =>
          item.scheduleId === slot.scheduleId ? slot : item,
        ),
      }));
    },
    [updateState],
  );

  const deleteTimetableSlot = useCallback(
    (scheduleId: string) => {
      updateState((prev) => ({
        ...prev,
        studentTimetable: prev.studentTimetable.filter((item) => item.scheduleId !== scheduleId),
      }));
    },
    [updateState],
  );

  const markAllNotificationsRead = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [updateState]);

  const dismissNotification = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.notificationId !== id),
      }));
    },
    [updateState],
  );

  const updateRoomStatusByStaff = useCallback(
    (params: {
      roomId: string;
      newStatus: RoomStatus;
      reason: string;
      actorName: string;
      actorRole: 'faculty' | 'admin';
      source: Room['statusSource'];
      scheduleVerified?: boolean;
    }) => {
      const target = state.rooms.find((r) => r.roomId === params.roomId);
      if (!target) return;

      const nowIso = new Date().toISOString();
      const log: VerificationLog = {
        eventId: `ver-${Date.now()}`,
        roomId: target.roomId,
        roomNumber: target.roomNumber,
        actorName: params.actorName,
        actorRole: params.actorRole,
        oldStatus: target.status,
        newStatus: params.newStatus,
        timestampIso: nowIso,
        reason: params.reason,
      };

      const statusLabelMap: Record<RoomStatus, string> = {
        verified_available: 'Verified Available',
        occupied: 'Occupied',
        reserved: 'Reserved',
        unknown: 'Unknown / Unverified',
      };

      updateState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((room) => {
          if (room.roomId !== params.roomId) return room;
          const updatedSections: DeskSection[] = room.sections.map((sec) => {
            if (params.newStatus === 'occupied') return { ...sec, status: 'occupied' };
            if (params.newStatus === 'unknown') return { ...sec, status: 'unavailable' };
            if (params.newStatus === 'verified_available') return { ...sec, status: 'available' };
            return sec;
          });
          return {
            ...room,
            status: params.newStatus,
            verifiedBy: params.actorName,
            verifiedAtIso: nowIso,
            statusSource: params.source,
            scheduleVerified: params.scheduleVerified ?? (params.newStatus === 'verified_available' ? true : room.scheduleVerified),
            sections: updatedSections,
          };
        }),
        verificationLogs: [log, ...prev.verificationLogs].slice(0, 40),
        notifications: [
          {
            notificationId: `notif-staff-${Date.now()}`,
            type: 'status_change' as const,
            title: `${target.roomNumber} updated to ${statusLabelMap[params.newStatus]}`,
            message: `Verified by ${params.actorName}: ${params.reason}`,
            createdAtIso: nowIso,
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 25),
      }));
    },
    [state.rooms, updateState],
  );

  const reportCancelledOrExtraLecture = useCallback(
    (params: {
      roomId: string;
      action: 'cancel_next' | 'add_extra' | 'maintenance';
      subject: string;
      startTime: string;
      endTime: string;
      actorName: string;
    }) => {
      const target = state.rooms.find((r) => r.roomId === params.roomId);
      if (!target) return;
      const nowIso = new Date().toISOString();

      updateState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((room) => {
          if (room.roomId !== params.roomId) return room;

          if (params.action === 'cancel_next') {
            const updatedTimetable = room.timetable.map((entry) =>
              entry.day === currentDay && entry.status === 'scheduled'
                ? { ...entry, status: 'cancelled' as const }
                : entry,
            );
            return {
              ...room,
              status: 'verified_available',
              verifiedBy: params.actorName,
              verifiedAtIso: nowIso,
              statusSource: 'faculty_panel',
              scheduleVerified: true,
              timetable: updatedTimetable,
              sections: room.sections.map((s) => ({ ...s, status: 'available' })),
            };
          }

          const newEntry = {
            scheduleId: `rs-staff-${Date.now()}`,
            day: currentDay,
            startTime: params.startTime,
            endTime: params.endTime,
            subject: params.subject,
            batchLabel: params.action === 'maintenance' ? 'Facility Maintenance' : 'Extra Lecture',
            status: params.action === 'maintenance' ? ('maintenance' as const) : ('extra' as const),
          };

          return {
            ...room,
            status: params.action === 'maintenance' ? 'unknown' : room.status,
            verifiedBy: params.actorName,
            verifiedAtIso: nowIso,
            statusSource: 'faculty_panel',
            maintenanceNote: params.action === 'maintenance' ? params.subject : room.maintenanceNote,
            timetable: [...room.timetable, newEntry],
          };
        }),
        verificationLogs: [
          {
            eventId: `ver-${Date.now()}`,
            roomId: target.roomId,
            roomNumber: target.roomNumber,
            actorName: params.actorName,
            actorRole: 'faculty' as const,
            oldStatus: target.status,
            newStatus:
              params.action === 'cancel_next'
                ? 'verified_available'
                : params.action === 'maintenance'
                  ? 'unknown'
                  : target.status,
            timestampIso: nowIso,
            reason:
              params.action === 'cancel_next'
                ? `Cancelled scheduled lecture on ${currentDay}; opened for student study.`
                : params.action === 'maintenance'
                  ? `Maintenance scheduled (${params.startTime}–${params.endTime}): ${params.subject}`
                  : `Extra lecture added (${params.startTime}–${params.endTime}): ${params.subject}`,
          },
          ...prev.verificationLogs,
        ].slice(0, 40),
        notifications: [
          {
            notificationId: `notif-tt-${Date.now()}`,
            type: 'status_change' as const,
            title: `${target.roomNumber} schedule updated`,
            message:
              params.action === 'cancel_next'
                ? `${params.actorName} reported a cancelled lecture. Room is now open.`
                : `${params.actorName} added ${params.subject} (${params.startTime}–${params.endTime}).`,
            createdAtIso: nowIso,
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 25),
      }));
    },
    [state.rooms, currentDay, updateState],
  );

  const resolveStatusReport = useCallback(
    (reportId: string) => {
      updateState((prev) => ({
        ...prev,
        statusReports: prev.statusReports.map((r) =>
          r.reportId === reportId ? { ...r, resolved: true } : r,
        ),
      }));
    },
    [updateState],
  );

  const addRoom = useCallback(
    (roomData: Omit<Room, 'roomId' | 'qrCodeValue'>) => {
      const id = `room-${Date.now()}`;
      const newRoom: Room = {
        ...roomData,
        roomId: id,
        qrCodeValue: `DYP-LIVE-ROOM:${id}`,
      };
      updateState((prev) => ({
        ...prev,
        rooms: [...prev.rooms, newRoom],
      }));
    },
    [updateState],
  );

  const updateRoomConfig = useCallback(
    (
      roomId: string,
      updates: Partial<
        Pick<
          Room,
          | 'roomNumber'
          | 'buildingName'
          | 'floor'
          | 'capacity'
          | 'facilities'
          | 'sections'
          | 'category'
          | 'scheduleVerified'
        >
      >,
    ) => {
      updateState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.roomId === roomId ? { ...room, ...updates } : room,
        ),
      }));
    },
    [updateState],
  );

  const resetDemoData = useCallback(() => {
    const fresh: PersistedState = {
      student: DEMO_STUDENT_PRESETS[0],
      isStudentSignedIn: true,
      rooms: createInitialRooms(),
      studentTimetable: createInitialStudentTimetable(),
      reservations: createInitialReservations(),
      verificationLogs: createInitialVerificationLogs(),
      statusReports: [],
      notifications: createInitialNotifications(),
      recentRoomIds: ['room-101', 'room-201', 'lab-1'],
    };
    setState(fresh);
    persistAndBroadcast(fresh);
  }, [persistAndBroadcast]);

  const unreadNotificationsCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  );

  const value: LiveRoomContextValue = {
    student: state.student,
    isStudentSignedIn: state.isStudentSignedIn,
    facultySession,
    adminSession,
    signInStudent,
    updateStudentProfile,
    signOutStudent,
    signInFaculty,
    signOutFaculty,
    signInAdmin,
    signOutAdmin,
    clockConfig,
    currentDay,
    currentMinutes,
    currentTotalSeconds,
    setClockPreset,
    rooms: state.rooms,
    studentTimetable: state.studentTimetable,
    reservations: state.reservations,
    activeReservation,
    verificationLogs: state.verificationLogs,
    statusReports: state.statusReports,
    notifications: state.notifications,
    unreadNotificationsCount,
    recentRoomIds: state.recentRoomIds,
    freeTimeSummary,
    availabilityMap,
    lastSyncIso,
    recordRoomVisit,
    createReservation,
    cancelReservation,
    submitStatusReport,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    markAllNotificationsRead,
    dismissNotification,
    updateRoomStatusByStaff,
    reportCancelledOrExtraLecture,
    resolveStatusReport,
    addRoom,
    updateRoomConfig,
    resetDemoData,
  };

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>;
}

export function useLiveRoom(): LiveRoomContextValue {
  const ctx = useContext(LiveRoomContext);
  if (!ctx) {
    throw new Error('useLiveRoom must be used inside LiveRoomProvider');
  }
  return ctx;
}
