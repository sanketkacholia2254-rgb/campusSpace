/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ActiveBookingView } from './components/ActiveBookingView';
import { AdminPanelView } from './components/AdminPanelView';
import { FacultyVerificationView } from './components/FacultyVerificationView';
import { LayoutShell } from './components/LayoutShell';
import { QrModeModal } from './components/QrModeModal';
import { RoomDetailView } from './components/RoomDetailView';
import { RoomDiscoveryView } from './components/RoomDiscoveryView';
import { StudentHomeDashboard } from './components/StudentHomeDashboard';
import { StudentLoginView } from './components/StudentLoginView';
import { StudentProfileView } from './components/StudentProfileView';
import { StudentTimetableView } from './components/StudentTimetableView';
import { LiveRoomProvider, useLiveRoom } from './services/liveRoomStore';
import type { AppViewMode, StudentTab } from './types';

function AppRouter() {
  const { student, isStudentSignedIn, signInStudent, recordRoomVisit } = useLiveRoom();

  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === '1') return 'login';
    if (params.get('autostart') === '1') return 'student';
    return isStudentSignedIn ? 'student' : 'login';
  });

  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [facultyFocusedRoomId, setFacultyFocusedRoomId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, selectedRoomId, viewMode]);

  const handleSelectTab = (tab: StudentTab) => {
    setSelectedRoomId(null);
    setActiveTab(tab);
  };

  const handleInspectRoom = (roomId: string) => {
    recordRoomVisit(roomId);
    setSelectedRoomId(roomId);
    setActiveTab('explore');
  };

  if (viewMode === 'faculty') {
    return (
      <FacultyVerificationView
        initialFocusedRoomId={facultyFocusedRoomId}
        onExitToStudent={() => {
          setFacultyFocusedRoomId(null);
          setViewMode('student');
        }}
      />
    );
  }

  if (viewMode === 'admin') {
    return <AdminPanelView onExitToStudent={() => setViewMode('student')} />;
  }

  if (viewMode === 'login') {
    return (
      <StudentLoginView
        initialProfile={student}
        onCompleteLogin={(profile) => {
          signInStudent(profile);
          setViewMode('student');
          setActiveTab('home');
        }}
        onOpenFaculty={() => setViewMode('faculty')}
        onOpenAdmin={() => setViewMode('admin')}
      />
    );
  }

  return (
    <>
      <LayoutShell
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenQr={() => setQrOpen(true)}
        onOpenFaculty={() => setViewMode('faculty')}
        onOpenAdmin={() => setViewMode('admin')}
      >
        {selectedRoomId ? (
          <RoomDetailView
            roomId={selectedRoomId}
            onBack={() => setSelectedRoomId(null)}
            onGoToBooking={() => {
              setSelectedRoomId(null);
              setActiveTab('booking');
            }}
          />
        ) : activeTab === 'home' ? (
          <StudentHomeDashboard
            onFindRooms={() => handleSelectTab('explore')}
            onSelectRoom={handleInspectRoom}
            onOpenBooking={() => handleSelectTab('booking')}
            onOpenTimetable={() => handleSelectTab('timetable')}
            onOpenProfile={() => handleSelectTab('profile')}
            onOpenQr={() => setQrOpen(true)}
            onSwitchAccount={() => setViewMode('login')}
          />
        ) : activeTab === 'explore' ? (
          <RoomDiscoveryView onSelectRoom={handleInspectRoom} />
        ) : activeTab === 'booking' ? (
          <ActiveBookingView
            onFindRooms={() => handleSelectTab('explore')}
            onReturnHome={() => handleSelectTab('home')}
          />
        ) : activeTab === 'timetable' ? (
          <StudentTimetableView onFindRooms={() => handleSelectTab('explore')} />
        ) : (
          <StudentProfileView
            onSelectRoom={handleInspectRoom}
            onOpenBooking={() => handleSelectTab('booking')}
            onOpenQr={() => setQrOpen(true)}
            onOpenFaculty={() => setViewMode('faculty')}
            onOpenAdmin={() => setViewMode('admin')}
            onSwitchAccount={() => setViewMode('login')}
          />
        )}
      </LayoutShell>

      <QrModeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        onStudentScanRoom={(roomId) => {
          setQrOpen(false);
          handleInspectRoom(roomId);
        }}
        onFacultyScanRoom={(roomId) => {
          setQrOpen(false);
          setFacultyFocusedRoomId(roomId);
          setViewMode('faculty');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <LiveRoomProvider>
      <AppRouter />
    </LiveRoomProvider>
  );
}
