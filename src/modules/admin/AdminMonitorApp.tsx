'use client';

/**
 * Admin Console & Live Workflow Monitor
 * Comprehensive user management, cross-department SLA monitor, and defect defend audit
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Shield,
  Activity,
  AlertCircle,
  Plus,
  Search,
  Key,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Filter,
  UserCheck,
  Package,
  Wrench,
  HelpCircle,
  X,
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAuditLogs,
  fetchMonitorMetrics,
  getAvailableRoles,
  type UserAccount,
  type AuditLogItem,
  type MonitorMetrics
} from '@/src/services/userManagement';
import { UserRole } from '@/src/config/auth.config';
import { useNotification } from '@/src/contexts/NotificationContext';
import type { User } from '@/src/services/auth';

interface AdminMonitorAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

type TabType = 'users' | 'monitor' | 'audit';

export function AdminMonitorApp({ user, onBackToPortal }: AdminMonitorAppProps) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(UserRole.PDF);
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [usersRes, metricsRes, logsRes] = await Promise.all([
        getAllUsers(),
        fetchMonitorMetrics(),
        fetchAuditLogs(50),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role?.toUpperCase() === roleFilter.toUpperCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleOpenCreateModal = () => {
    setFormUsername('');
    setFormName('');
    setFormPassword('');
    setFormRole(UserRole.PDF);
    setFormEmployeeId('');
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditModal = (u: UserAccount) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormRole((u.role as UserRole) || UserRole.PDF);
    setFormEmployeeId(u.employee_id || '');
    setIsEditUserModalOpen(true);
  };

  const handleOpenResetPassModal = (u: UserAccount) => {
    setSelectedUser(u);
    setFormPassword('');
    setIsResetPassModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim() || !formPassword.trim()) {
      showAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser({
        username: formUsername.trim(),
        name: formName.trim(),
        password: formPassword,
        role: formRole,
        employee_id: formEmployeeId.trim() || undefined,
      });

      if (res.success) {
        showToast('เพิ่มผู้ใช้งานใหม่สำเร็จ', 'success');
        setIsAddUserModalOpen(false);
        loadData(true);
      } else {
        showAlert(res.error || 'ไม่สามารถเพิ่มผู้ใช้งานได้', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateUser({
        id: selectedUser.id,
        name: formName.trim(),
        role: formRole,
        employee_id: formEmployeeId.trim() || undefined,
      });

      if (res.success) {
        showToast('อัปเดตข้อมูลผู้ใช้สำเร็จ', 'success');
        setIsEditUserModalOpen(false);
        loadData(true);
      } else {
        showAlert(res.error || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formPassword.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateUser({
        id: selectedUser.id,
        password: formPassword,
      });

      if (res.success) {
        showToast(`รีเซ็ตรหัสผ่านของ ${selectedUser.username} สำเร็จ`, 'success');
        setIsResetPassModalOpen(false);
        loadData(true);
      } else {
        showAlert(res.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (u.username === user?.email?.toLowerCase()) {
      showAlert('ไม่อนุญาตให้ลบบัญชีที่กำลังใช้งานอยู่', 'warning');
      return;
    }

    showConfirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${u.username} (${u.name})"? การกระทำนี้ไม่สามารถย้อนกลับได้`, async () => {
      const res = await deleteUser(u.id);
      if (res.success) {
        showToast('ลบบัญชีผู้ใช้งานสำเร็จ', 'success');
        loadData(true);
      } else {
        showAlert(res.error || 'ไม่สามารถลบบัญชีได้', 'error');
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Shield size={12} /> Admin</span>;
      case 'QSMS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><ShieldCheck size={12} /> QSMS (QC)</span>;
      case 'WPK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Package size={12} /> WPK (คลัง)</span>;
      case 'PDF':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Wrench size={12} /> PDF (ซ่อม)</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{role}</span>;
    }
  };

  const getBlockedReasonName = (key?: string) => {
    switch (key) {
      case 'waiting_oil': return 'รอน้ำมัน';
      case 'waiting_container': return 'รอภาชนะ / แกลลอน';
      case 'waiting_label': return 'รอฉลาก / สติกเกอร์';
      case 'waiting_cap': return 'รอฝา';
      case 'waiting_machine': return 'รอคิวเครื่องจักร';
      case 'waiting_lab': return 'รอผลแล็บ';
      default: return 'อื่นๆ / ปัญหาหน้างาน';
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] text-[#1d1d1f] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToPortal}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
            title="กลับหน้า Portal"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Admin Console & Monitor</h1>
              <p className="text-xs text-slate-500">ศูนย์ควบคุมบัญชีผู้ใช้งาน และมอนิเตอร์สถานะ Defend แบบเรียลไทม์</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} /> บัญชีผู้ใช้งาน ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'monitor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={14} /> มอนิเตอร์งาน Rework & Defend
            {metrics?.cases.blocked ? (
              <span className="h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                {metrics.cases.blocked}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} /> ประวัติกิจกรรม ({auditLogs.length})
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          {activeTab === 'users' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
            >
              <Plus size={15} />
              <span>เพิ่มผู้ใช้ใหม่</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">ผู้ใช้งานทั้งหมด</span>
                    <Users size={16} className="text-slate-400" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{users.length}</div>
                  <div className="mt-1 text-[11px] text-slate-400">ควบคุมโดย Admin เท่านั้น</div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Admin & QSMS</span>
                    <Shield size={16} className="text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-indigo-900">
                    {(metrics?.users.roleCounts['ADMIN'] || 0) + (metrics?.users.roleCounts['QSMS'] || 0)}
                  </div>
                  <div className="mt-1 text-[11px] text-indigo-600">Admin: {metrics?.users.roleCounts['ADMIN'] || 0} | QSMS: {metrics?.users.roleCounts['QSMS'] || 0}</div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase">WPK (คลัง/เปิดเคส)</span>
                    <Package size={16} className="text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-amber-900">
                    {metrics?.users.roleCounts['WPK'] || 0}
                  </div>
                  <div className="mt-1 text-[11px] text-amber-600">เปิดเคส & เบิกจ่ายภาชนะ</div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase">PDF (ฝ่ายผลิต/ซ่อม)</span>
                    <Wrench size={16} className="text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-emerald-900">
                    {metrics?.users.roleCounts['PDF'] || 0}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600">ซ่อมสินค้า & Defend ปัญหา</div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, รหัสพนักงาน..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  <div className="w-full sm:w-52">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                        <SelectValue placeholder="ทุกแผนก / ทุก Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-[100]">
                        <SelectItem value="all" className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">ทุกแผนก / ทุก Role</SelectItem>
                        <SelectItem value="ADMIN" className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">Admin (ผู้ดูแลระบบ)</SelectItem>
                        <SelectItem value="QSMS" className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">QSMS (ฝ่ายคุณภาพ)</SelectItem>
                        <SelectItem value="WPK" className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">WPK (คลัง/บรรจุภัณฑ์)</SelectItem>
                        <SelectItem value="PDF" className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">PDF (ฝ่ายซ่อม)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">ชื่อผู้ใช้ & พนักงาน</th>
                        <th className="py-3 px-4">รหัสพนักงาน</th>
                        <th className="py-3 px-4">บทบาท (Role / แผนก)</th>
                        <th className="py-3 px-4">วันที่สร้างบัญชี</th>
                        <th className="py-3 px-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            ไม่พบบัญชีผู้ใช้งานที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold uppercase text-xs border border-slate-200">
                                  {u.username.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {u.employee_id || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              {getRoleBadge(u.role)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenResetPassModal(u)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="รีเซ็ตรหัสผ่าน"
                                >
                                  <Key size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(u)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                  title="แก้ไขข้อมูล"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="ลบบัญชี"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKFLOW & DEFEND MONITOR */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* 5-Stage Pipeline Monitor Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="text-xs font-bold text-amber-800">1. รอวิเคราะห์</div>
                  <div className="mt-1 text-2xl font-black text-amber-950">{metrics?.cases.pendingAnalysis || 0}</div>
                  <div className="mt-1 text-[10px] text-amber-700 font-medium">WPK ➔ QSMS</div>
                </div>

                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                  <div className="text-xs font-bold text-orange-800">2. รอเบิกภาชนะ</div>
                  <div className="mt-1 text-2xl font-black text-orange-950">{metrics?.cases.awaitingMaterials || 0}</div>
                  <div className="mt-1 text-[10px] text-orange-700 font-medium">QSMS ➔ WPK</div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                  <div className="text-xs font-bold text-sky-800">3. กำลังซ่อม</div>
                  <div className="mt-1 text-2xl font-black text-sky-950">{metrics?.cases.inProgress || 0}</div>
                  <div className="mt-1 text-[10px] text-sky-700 font-medium">WPK ➔ PDF</div>
                </div>

                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-sm ring-2 ring-rose-400/20">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                    <span>4. ติดปัญหา Defend</span>
                    <AlertCircle size={14} className="text-rose-500 animate-pulse" />
                  </div>
                  <div className="mt-1 text-2xl font-black text-rose-950">{metrics?.cases.blocked || 0}</div>
                  <div className="mt-1 text-[10px] text-rose-700 font-medium">PDF แจ้งปัญหาหน้างาน</div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="text-xs font-bold text-emerald-800">5. เสร็จสิ้น</div>
                  <div className="mt-1 text-2xl font-black text-emerald-950">{metrics?.cases.completed || 0}</div>
                  <div className="mt-1 text-[10px] text-emerald-700 font-medium">ปิดเคสสมบูรณ์</div>
                </div>
              </div>

              {/* Blocked Defend Issues Board */}
              <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">กระดานปัญหาที่ถูกพักไว้ (Active Defend Board)</h3>
                      <p className="text-xs text-slate-500">เคสที่ฝ่ายซ่อม (PDF) ระบุว่าติดปัญหาภายนอก ไม่ใช่ความล่าช้าของฝ่ายซ่อม</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                    ติดปัญหา {metrics?.blockedCases.length || 0} รายการ
                  </span>
                </div>

                {metrics?.blockedCases.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700">ไม่มีเคสที่ติดปัญหาในขณะนี้</p>
                    <p className="text-[11px] text-slate-400">ทุกเคสกำลังดำเนินการซ่อมได้อย่างราบรื่น</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metrics?.blockedCases.map((bc) => (
                      <div key={bc.id} className="rounded-xl border border-rose-200/90 bg-rose-50/40 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-rose-950">{bc.id}</span>
                          <span className="rounded-md bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                            {getBlockedReasonName(bc.reasonCategory)}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{bc.caseName}</div>
                        {bc.customerName && <div className="text-[11px] text-slate-500">ลูกค้า: {bc.customerName}</div>}
                        {bc.reasonDetail && (
                          <div className="rounded-lg bg-white/90 border border-rose-200 p-2 text-xs text-slate-700 font-medium">
                            💬 "{bc.reasonDetail}"
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-rose-100">
                          <span>ผู้แจ้ง: {bc.reportedBy || 'ฝ่ายซ่อม PDF'}</span>
                          <span>{bc.blockedAt ? new Date(bc.blockedAt).toLocaleString('th-TH') : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">บันทึกกิจกรรมระบบ (System Audit Trail)</h3>
                    <p className="text-xs text-slate-500">ประวัติการสร้างเคส อัปเดตสถานะ และการจัดการผู้ใช้แบบเรียลไทม์</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">แสดง {auditLogs.length} รายการล่าสุด</span>
              </div>

              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/60">
                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    ยังไม่มีประวัติกิจกรรมในระบบ
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Activity size={13} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{log.action}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            เคส: <span className="font-mono font-semibold text-slate-600">{log.case_id}</span> • ผู้ดำเนินการ: <span className="font-semibold text-slate-700">{log.performed_by}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 shrink-0">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: ADD USER */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Users size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่ (Add User)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username (ชื่อล็อกอิน) *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="เช่น somchai.p"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่านเริ่มต้น *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">บทบาท (Role) *</label>
                    <Select value={formRole} onValueChange={(val) => setFormRole(val as UserRole)}>
                      <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                        <SelectValue placeholder="เลือกบทบาท (Role)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-[100]">
                        <SelectItem value={UserRole.ADMIN} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">Admin (ผู้ดูแลระบบ)</SelectItem>
                        <SelectItem value={UserRole.QSMS} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">QSMS (ฝ่ายคุณภาพ)</SelectItem>
                        <SelectItem value={UserRole.WPK} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">WPK (คลัง/บรรจุภัณฑ์)</SelectItem>
                        <SelectItem value={UserRole.PDF} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">PDF (ฝ่ายซ่อม)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">รหัสพนักงาน</label>
                    <input
                      type="text"
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      placeholder="เช่น EMP0123"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'สร้างบัญชีผู้ใช้'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT USER */}
      <AnimatePresence>
        {isEditUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Edit2 size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">แก้ไขข้อมูล: {selectedUser.username}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">บทบาท (Role) *</label>
                    <Select value={formRole} onValueChange={(val) => setFormRole(val as UserRole)}>
                      <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                        <SelectValue placeholder="เลือกบทบาท (Role)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-[100]">
                        <SelectItem value={UserRole.ADMIN} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">Admin (ผู้ดูแลระบบ)</SelectItem>
                        <SelectItem value={UserRole.QSMS} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">QSMS (ฝ่ายคุณภาพ)</SelectItem>
                        <SelectItem value={UserRole.WPK} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">WPK (คลัง/บรรจุภัณฑ์)</SelectItem>
                        <SelectItem value={UserRole.PDF} className="rounded-lg text-xs font-semibold text-slate-700 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">PDF (ฝ่ายซ่อม)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">รหัสพนักงาน</label>
                    <input
                      type="text"
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RESET PASSWORD */}
      <AnimatePresence>
        {isResetPassModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Key size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                ตั้งรหัสผ่านใหม่สำหรับผู้ใช้งาน <strong className="text-slate-800">@{selectedUser.username}</strong>
              </p>

              <form onSubmit={handleResetPassSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่านใหม่ *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetPassModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
