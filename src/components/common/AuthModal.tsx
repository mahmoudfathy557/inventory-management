import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, KeyRound, Mail, User as UserIcon, Lock, CheckCircle2, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { UserRole } from '../../types';
import { RBAC_ROLE_DEFINITIONS } from '../../utils/rbac';
import { authService } from '../../services/authService';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode: initialMode = 'login' }) => {
  const { language, setCurrentUser, setUsers } = useApp();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [emailOrUsername, setEmailOrUsername] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.INVENTORY_USER);
  const [department, setDepartment] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authService.login(emailOrUsername, password);
        setCurrentUser(res.user);
        setSuccessMsg(isAr ? `مرحباً بك ${res.user.fullName}! تم تسجيل الدخول بنجاح.` : `Welcome back ${res.user.fullName}! Login successful.`);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        const res = await authService.register({
          username,
          email,
          fullName,
          password,
          role,
          department: department || RBAC_ROLE_DEFINITIONS[role]?.department,
        });
        setCurrentUser(res.user);
        setUsers(prev => [...prev.filter(u => u.id !== res.user.id), res.user]);
        setSuccessMsg(isAr ? `تم إنشاء الحساب بنجاح وتعيين الصلاحيات (${role}).` : `Account created with role (${role})!`);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? 'فشلت عملية المصادقة. يرجى التحقق من البيانات.' : 'Authentication error.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userRole: UserRole, userEmail: string, name: string) => {
    setEmailOrUsername(userEmail);
    setPassword('Password123!');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-6 h-6 text-blue-300" />
          </div>
          <h3 className="text-lg font-bold">
            {mode === 'login'
              ? (isAr ? 'تسجيل الدخول للنظام (JWT / RBAC)' : 'Enterprise Sign In (JWT / RBAC)')
              : (isAr ? 'إنشاء حساب مستخدم جديد' : 'Register New User Account')}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isAr
              ? 'نظام إدارة ومراقبة المخزون والتصنيع المتوافق مع Docker & PostgreSQL'
              : 'Inventory & Manufacturing Control System with RBAC on PostgreSQL'}
          </p>
        </div>

        {/* Quick Demo Credentials */}
        {mode === 'login' && (
          <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 text-xs text-slate-600">
            <div className="flex items-center justify-between mb-1.5 font-medium text-slate-700">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {isAr ? 'حسابات تجريبية سريعة (كلمة المرور: Password123!)' : 'Quick Demo Accounts (PW: Password123!)'}:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.ADMIN, 'admin', 'Super Admin')}
                className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-mono text-[11px]"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.INVENTORY_USER, 'ahmed.kamal', 'Inventory')}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-mono text-[11px]"
              >
                Inventory
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.PRODUCTION_USER, 'tarek.radwan', 'Production')}
                className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-mono text-[11px]"
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.QUALITY_USER, 'samir.sherif', 'Quality')}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-mono text-[11px]"
              >
                Quality
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.FINANCE_USER, 'khaled.mansour', 'Finance')}
                className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-mono text-[11px]"
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(UserRole.MANAGEMENT_USER, 'director.general', 'Executive Director')}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-mono text-[11px]"
              >
                Management
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني أو اسم المستخدم' : 'Email or Username'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="admin or mahmoudfathy2424@gmail.com"
                    className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAr ? 'مثال: م. مصطفى إبراهيم' : 'e.g. John Doe'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'اسم المستخدم' : 'Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="mostafa.ibrahim"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@factory.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'الدور الوظيفي (RBAC Role)' : 'RBAC Role'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {Object.values(RBAC_ROLE_DEFINITIONS).map(r => (
                      <option key={r.code} value={r.code}>
                        {isAr ? r.nameAr : r.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'القسم / الإدارة' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={RBAC_ROLE_DEFINITIONS[role]?.department || 'Warehouse'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? (isAr ? 'جارِ التحقق...' : 'Authenticating...')
                  : mode === 'login'
                    ? (isAr ? 'تسجيل الدخول بالـ JWT' : 'Sign In with JWT')
                    : (isAr ? 'إنشاء المستخدم وتعيين الصلاحيات' : 'Create User & Assign Role')}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode(mode === 'login' ? 'register' : 'login');
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                {mode === 'login'
                  ? (isAr ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'New user? Create account')
                  : (isAr ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign in')}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700"
              >
                {isAr ? 'إغلاق' : 'Cancel'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
