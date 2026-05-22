'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { Employee, LeaveRecord } from '../types';

interface RosterEmployeeHeaderProps {
  selectedEmployee: Employee;
  leaves: LeaveRecord[];
  leaveType: 'sick' | 'business' | 'vacation';
  setLeaveType: (type: 'sick' | 'business' | 'vacation') => void;
  leaveDate: string;
  setLeaveDate: (date: string) => void;
  onCreateLeave: (employeeId: string) => void;
}

export function RosterEmployeeHeader({
  selectedEmployee,
  leaves,
  leaveType,
  setLeaveType,
  leaveDate,
  setLeaveDate,
  onCreateLeave,
}: RosterEmployeeHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#e4e4e7] p-4 rounded-2xl shadow-sm">
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-[#18181b]">{selectedEmployee.name}</h3>
        <div className="text-xs text-[#71717a] mt-0.5 font-thai">
          สถิติการลาเดือนนี้:{' '}
          {leaves.filter((leave) => leave.employeeId === selectedEmployee.id).length} วัน
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreateLeave(selectedEmployee.id);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-[#71717a] font-thai">ประเภทการลา</span>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as 'sick' | 'business' | 'vacation')}
            className="border border-[#e4e4e7] rounded-lg bg-white px-2 py-1 text-xs text-[#3f3f46] outline-none"
          >
            <option value="sick">ลาป่วย</option>
            <option value="business">ลากิจ</option>
            <option value="vacation">ลาพักร้อน</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-[#71717a] font-thai">วันที่ต้องการลา</span>
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            className="border border-[#e4e4e7] rounded-lg bg-[#fafafa] px-2 py-1 text-xs text-[#3f3f46] outline-none"
            required
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="bg-[#18181b] text-white rounded-lg text-xs px-3.5 py-1.5 font-semibold hover:bg-black transition-colors self-end"
        >
          บันทึกวันลา
        </motion.button>
      </form>
    </div>
  );
}
