import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, QrCode, ShieldCheck, X } from 'lucide-react';
import { useLiveRoom } from '../services/liveRoomStore';
import { RoomStatusText } from './StatusIndicator';

interface QrModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentScanRoom: (roomId: string) => void;
  onFacultyScanRoom: (roomId: string) => void;
}

export function QrModeModal({
  isOpen,
  onClose,
  onStudentScanRoom,
  onFacultyScanRoom,
}: QrModeModalProps) {
  const { rooms, availabilityMap } = useLiveRoom();
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.roomId ?? 'room-101');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  useEffect(() => {
    if (!isOpen && cameraActive) {
      setCameraActive(false);
    }
  }, [isOpen, cameraActive]);

  useEffect(() => {
    if (!isOpen || !cameraActive) return;

    let cancelled = false;
    setCameraError(null);

    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        const qr = new Html5Qrcode('dyp-qr-reader');
        scannerRef.current = qr;
        qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            const matchedRoom = rooms.find(
              (r) =>
                r.qrCodeValue === decodedText ||
                decodedText.includes(r.roomId) ||
                decodedText.toLowerCase().includes(r.roomNumber.toLowerCase()),
            );
            if (matchedRoom) {
              qr.stop().catch(() => {});
              setCameraActive(false);
              onStudentScanRoom(matchedRoom.roomId);
            }
          },
          () => {
            // Ignore frame-by-frame scan misses
          },
        ).catch(() => {
          if (!cancelled) {
            setCameraError(
              'Camera access is unavailable in this browser session. Use Demo QR Scan below to test any classroom.',
            );
            setCameraActive(false);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError('Could not initialize camera scanner. Use Demo QR Scan below.');
          setCameraActive(false);
        }
      });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, cameraActive, rooms, onStudentScanRoom]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? rooms[0];
  const avail = selectedRoom ? availabilityMap[selectedRoom.roomId] : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 bg-[#14213D]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="qr-modal-title" className="font-display text-lg font-bold text-[#14213D]">
              Classroom QR System
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR scanner"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600">
            Each classroom doorway displays a unique QR code containing only its room identifier. Student scans open live availability and desk sections; faculty scans require staff authentication before unlocking verification controls.
          </p>

          {/* Optional Live Camera Scanner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#14213D]">Camera QR Scanner</span>
              <button
                type="button"
                onClick={() => setCameraActive((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-[#14213D] hover:bg-slate-50 whitespace-nowrap"
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{cameraActive ? 'Stop Camera' : 'Use Device Camera'}</span>
              </button>
            </div>

            {cameraActive && (
              <div
                id="dyp-qr-reader"
                className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-950 min-h-[220px]"
              />
            )}

            {cameraError && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {cameraError}
              </p>
            )}
          </div>

          {/* Interactive Classroom QR Code Directory & Demo Scan */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2 border-t border-slate-100 items-start">
            <div className="sm:col-span-5 space-y-2">
              <label htmlFor="qr-room-picker" className="block text-xs font-semibold text-slate-600">
                Select Classroom Door Plaque
              </label>
              <select
                id="qr-room-picker"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.roomId} value={r.roomId}>
                    {r.roomNumber} — {r.buildingName}
                  </option>
                ))}
              </select>

              {selectedRoom && avail && (
                <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                  <RoomStatusText status={avail.effectiveStatus} />
                  <p>{selectedRoom.buildingName} · {selectedRoom.floor}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    Code: {selectedRoom.qrCodeValue}
                  </p>
                </div>
              )}
            </div>

            {selectedRoom && (
              <div className="sm:col-span-7 bg-[#F5F7FB] rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <QRCodeSVG
                    value={selectedRoom.qrCodeValue}
                    size={136}
                    bgColor="#FFFFFF"
                    fgColor="#14213D"
                    level="M"
                  />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-[#14213D]">
                    {selectedRoom.roomNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    DY Patil Live Room · Demo Classroom QR
                  </p>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onStudentScanRoom(selectedRoom.roomId)}
                    className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Simulate Student Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => onFacultyScanRoom(selectedRoom.roomId)}
                    className="px-4 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1E2F54] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Faculty Verify Scan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
