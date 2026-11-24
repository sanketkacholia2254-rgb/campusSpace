import dayjs from 'dayjs';
import type { RoomStatus, SectionStatus } from '../types';

export function formatRelativeVerifiedTime(iso: string): string {
  const parsed = dayjs(iso);
  if (!parsed.isValid()) return 'Not verified';
  const diffMins = Math.max(0, dayjs().diff(parsed, 'minute'));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ${diffMins % 60}m ago`;
  return parsed.format('D MMM, h:mm A');
}

const ROOM_STATUS_META: Record<
  RoomStatus,
  { label: string; textClass: string; swatchClass: string }
> = {
  verified_available: {
    label: 'Verified Available',
    textClass: 'text-[#15803D]',
    swatchClass: 'bg-[#16A34A]',
  },
  occupied: {
    label: 'Occupied',
    textClass: 'text-[#B91C1C]',
    swatchClass: 'bg-[#DC2626]',
  },
  reserved: {
    label: 'Reserved',
    textClass: 'text-[#A16207]',
    swatchClass: 'bg-[#EAB308]',
  },
  unknown: {
    label: 'Unknown · Not Verified',
    textClass: 'text-[#6B7280]',
    swatchClass: 'bg-[#9CA3AF]',
  },
};

export function RoomStatusText({ status }: { status: RoomStatus }) {
  const meta = ROOM_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${meta.textClass}`}>
      <span className={`h-2 w-2 rounded-xs shrink-0 ${meta.swatchClass}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

const SECTION_STATUS_META: Record<
  SectionStatus,
  { label: string; textClass: string; swatchClass: string }
> = {
  available: {
    label: 'Available',
    textClass: 'text-[#15803D]',
    swatchClass: 'bg-[#16A34A]',
  },
  occupied: {
    label: 'Occupied',
    textClass: 'text-[#B91C1C]',
    swatchClass: 'bg-[#DC2626]',
  },
  reserved: {
    label: 'Reserved',
    textClass: 'text-[#A16207]',
    swatchClass: 'bg-[#EAB308]',
  },
  unavailable: {
    label: 'Unavailable',
    textClass: 'text-[#6B7280]',
    swatchClass: 'bg-[#9CA3AF]',
  },
};

export function SectionStatusText({ status }: { status: SectionStatus }) {
  const meta = SECTION_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.textClass}`}>
      <span className={`h-2 w-2 rounded-xs shrink-0 ${meta.swatchClass}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
