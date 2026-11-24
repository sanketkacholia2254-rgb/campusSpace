import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  ACADEMIC_YEARS,
  DEMO_STUDENT_PRESETS,
  DEPARTMENTS,
  DIVISIONS,
  INSTITUTION_NAME,
} from '../data/seedData';
import type { StudentProfile } from '../types';

interface StudentLoginViewProps {
  initialProfile: StudentProfile;
  onCompleteLogin: (profile: StudentProfile) => void;
  onOpenFaculty: () => void;
  onOpenAdmin: () => void;
}

export function StudentLoginView({
  initialProfile,
  onCompleteLogin,
  onOpenFaculty,
  onOpenAdmin,
}: StudentLoginViewProps) {
  const [name, setName] = useState(initialProfile.name);
  const [identifier, setIdentifier] = useState(initialProfile.email);
  const [studentId, setStudentId] = useState(initialProfile.studentId);
  const [department, setDepartment] = useState(initialProfile.department);
  const [year, setYear] = useState(initialProfile.year);
  const [division, setDivision] = useState(initialProfile.division);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to continue.');
      return;
    }
    if (!identifier.trim()) {
      setError('Please enter your college email or student ID.');
      return;
    }
    setError(null);
    onCompleteLogin({
      name: name.trim(),
      email: identifier.trim(),
      studentId: studentId.trim() || `DYP-${department.slice(0, 2).toUpperCase()}-2026-001`,
      department,
      year,
      division,
    });
  };

  const applyPreset = (preset: StudentProfile) => {
    setName(preset.name);
    setIdentifier(preset.email);
    setStudentId(preset.studentId);
    setDepartment(preset.department);
    setYear(preset.year);
    setDivision(preset.division);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Institutional Intro */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
              DY Patil Live Room
            </p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {INSTITUTION_NAME}
            </p>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#14213D] leading-tight [text-wrap:balance]">
            Find your space. Make your free time productive.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Discover verified vacant classrooms, view 4–5 desk sections, and reserve a study space matched automatically to your next lecture time.
          </p>

          {/* Demo Student Quick-Fill Presets */}
          <div className="pt-2 space-y-2.5">
            <p className="text-xs font-semibold text-slate-500">
              Quick Demo Student Profiles
            </p>
            <div className="space-y-2">
              {DEMO_STUDENT_PRESETS.map((preset) => (
                <button
                  key={preset.studentId}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#14213D] truncate">
                      {preset.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {preset.department} · {preset.year} · {preset.division}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#2563EB] shrink-0 whitespace-nowrap">
                    Use profile
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Student Sign-In Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-[#14213D]">
              Student Demo Sign In
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Prototype mode — no institutional password required. All sample timetables and rooms are editable.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="login-name" className="block text-sm font-medium text-[#14213D] mb-1.5">
                  Student Name
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Kulkarni"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-student-id" className="block text-sm font-medium text-[#14213D] mb-1.5">
                  Student ID
                </label>
                <input
                  id="login-student-id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. DYP-IT-2026-042"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#14213D] mb-1.5">
                College Email
              </label>
              <input
                id="login-email"
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="student@dyp-demo.edu.in"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="login-dept" className="block text-sm font-medium text-[#14213D] mb-1.5">
                Department
              </label>
              <select
                id="login-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="login-year" className="block text-sm font-medium text-[#14213D] mb-1.5">
                  Year
                </label>
                <select
                  id="login-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="login-division" className="block text-sm font-medium text-[#14213D] mb-1.5">
                  Division
                </label>
                <select
                  id="login-division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none"
                >
                  {DIVISIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#DC2626] font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Enter Student Dashboard</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Demo data only — not connected to official college servers.</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenFaculty}
                className="text-[#14213D] font-medium hover:text-[#2563EB] inline-flex items-center gap-1 whitespace-nowrap"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Faculty Verification</span>
              </button>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-[#14213D] font-medium hover:text-[#2563EB] whitespace-nowrap"
              >
                Admin Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
