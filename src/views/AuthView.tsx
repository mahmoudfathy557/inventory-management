import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Sparkles,
  Database,
  Users,
  Check,
  Factory
} from 'lucide-react';
import { UserRole, User } from '../types';
import { RBAC_ROLE_DEFINITIONS, RoleDefinition } from '../utils/rbac';
import { authService } from '../services/authService';
import { useApp } from '../context/AppContext';
import { CompanyLogo } from '../components/common/CompanyLogo';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login', onSuccess }) => {
  const { language, currentUser, setCurrentUser, setUsers, users } = useApp();
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

  const [backendInfo, setBackendInfo] = useState<{ connected: boolean; postgres: boolean }>({
    connected: false,
    postgres: false
  });

  useEffect(() => {
    authService.checkBackendStatus().then(status => {
      setBackendInfo({ connected: status.connected, postgres: status.postgres });
    });
  }, []);

  const handleQuickFill = (targetRole: UserRole, targetUser: string, dept: string) => {
    setEmailOrUsername(targetUser);
    setPassword('Password123!');
    setRole(targetRole);
    setDepartment(dept);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authService.login(emailOrUsername, password);
        setCurrentUser(res.user);
        setSuccessMsg(
          isAr
            ? `مرحباً بك ${res.user.fullName}! تم تسجيل الدخول بنجاح وتفعيل جلسة JWT.`
            : `Welcome back, ${res.user.fullName}! Login successful.`
        );
        if (onSuccess) {
          setTimeout(onSuccess, 700);
        }
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
        setSuccessMsg(
          isAr
            ? `تم إنشاء الحساب بنجاح وتعيين الصلاحيات (${role}).`
            : `Account created with role (${role}) successfully!`
        );
        if (onSuccess) {
          setTimeout(onSuccess, 700);
        }
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? 'حدث خطأ في عملية المصادقة' : 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const presetAccounts = [
    { role: UserRole.ADMIN, username: 'admin', titleAr: 'مدير النظام العام', titleEn: 'System Admin', color: 'border-rose-300 bg-rose-50 text-rose-800' },
    { role: UserRole.INVENTORY_USER, username: 'karim.inventory', titleAr: 'مدير المخازن', titleEn: 'Inventory Manager', color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { role: UserRole.PRODUCTION_USER, username: 'tarek.radwan', titleAr: 'مهندس الإنتاج', titleEn: 'Production Engineer', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { role: UserRole.QUALITY_USER, username: 'samir.sherif', titleAr: 'مدير الجودة', titleEn: 'QA/QC Manager', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
    { role: UserRole.FINANCE_USER, username: 'khaled.mansour', titleAr: 'محاسب التكاليف', titleEn: 'Cost Accountant', color: 'border-purple-300 bg-purple-50 text-purple-800' },
    { role: UserRole.MANAGEMENT_USER, username: 'director.general', titleAr: 'المدير العام', titleEn: 'Executive Director', color: 'border-slate-300 bg-slate-100 text-slate-800' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6" id="view-auth-page">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <CompanyLogo className="w-14 h-14 text-white shrink-0" light={true} />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>{isAr ? 'الشركة العربية للدائن - بوابة المصادقة والأمن' : 'Arab Co. For Plastic - Secure JWT Auth Portal'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {mode === 'login'
                ? (isAr ? 'تسجيل الدخول إلى نظام إدارة المخزون والإنتاج' : 'Sign in to Manufacturing Control System')
                : (isAr ? 'إنشاء حساب مستخدم جديد وتعيين الصلاحيات' : 'Register New User & Assign RBAC Role')}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              {isAr
                ? 'مصادقة متوافقة مع معايير ERP الصناعية تعتمد على تشفير bcrypt وتواقيع JWT مع فصل المهام الرقابي (Separation of Duties).'
                : 'Industrial ERP compliant authentication using bcrypt password hashing, JSON Web Tokens, and strict Separation of Duties.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
              backendInfo.postgres
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{backendInfo.postgres ? 'PostgreSQL Live' : 'Express API Active'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-lg transition text-center ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'تسجيل الدخول (Sign In)' : 'Sign In'}
            </button>
            <button
              id="tab-auth-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-lg transition text-center ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'تسجيل حساب جديد (Register)' : 'Create Account'}
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'login' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'اسم المستخدم أو البريد الإلكتروني *' : 'Username or Email *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                    <input
                      id="input-login-page-user"
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={e => setEmailOrUsername(e.target.value)}
                      placeholder="admin or mahmoudfathy2424@gmail.com"
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'كلمة المرور *' : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                    <input
                      id="input-login-page-password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'كلمة المرور الافتراضية لكافة الحسابات التجريبية: ' : 'Default password for all accounts: '}
                    <code className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Password123!</code>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                    <input
                      id="input-reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={isAr ? 'مثال: م. أحمد السعيد' : 'e.g. Ahmed El-Sayed'}
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isAr ? 'اسم المستخدم *' : 'Username *'}
                    </label>
                    <input
                      id="input-reg-username"
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="ahmed.elsayed"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                    </label>
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ahmed@factory.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'كلمة المرور *' : 'Password *'}
                  </label>
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isAr ? 'على الأقل 6 خانات' : 'Min 6 characters'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isAr ? 'الدور الوظيفي (RBAC Role) *' : 'Assigned Role *'}
                    </label>
                    <select
                      id="select-reg-role"
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                      {Object.values(RBAC_ROLE_DEFINITIONS).map(r => (
                        <option key={r.code} value={r.code}>
                          {isAr ? r.nameAr : r.nameEn} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isAr ? 'القسم / الإدارة' : 'Department'}
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder={RBAC_ROLE_DEFINITIONS[role]?.department || 'Manufacturing'}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              id="btn-auth-submit-page"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? (isAr ? 'جارِ التحقق والمصادقة...' : 'Authenticating...')
                  : mode === 'login'
                    ? (isAr ? 'تسجيل الدخول وإصدار التوكن (JWT Login)' : 'Sign In with JWT')
                    : (isAr ? 'تسجيل المستخدم وحفظه في PostgreSQL' : 'Register User to Database')}
              </span>
            </button>
          </form>
        </div>

        {/* Right Side: Quick Preset Accounts & RBAC Matrix Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-900">
                  {isAr ? 'حسابات تجريبية جاهزة للاختبار (100% Seed)' : 'Quick Demo Test Accounts'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Password123!</span>
            </div>

            <p className="text-[11px] text-slate-500">
              {isAr
                ? 'انقر على أي من الحسابات المعيارية لتعبئة بيانات الدخول مباشرة وفحص صلاحيات دوره الوظيفي:'
                : 'Click any role below to pre-fill credentials and test its specific RBAC permissions:'}
            </p>

            <div className="grid grid-cols-1 gap-2">
              {presetAccounts.map(account => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => {
                    setMode('login');
                    handleQuickFill(account.role, account.username, account.titleEn);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition hover:shadow-xs ${account.color}`}
                >
                  <div>
                    <div className="font-bold text-xs">{isAr ? account.titleAr : account.titleEn}</div>
                    <div className="font-mono text-[10px] opacity-80">{account.username}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/70">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Session Widget */}
          {currentUser ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? 'المستخدم النشط حالياً:' : 'Currently active user:'}</span>
                <span className="font-bold text-slate-900">{currentUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? 'الدور الوظيفي:' : 'Active Role:'}</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>{isAr ? 'البريد المسجل:' : 'Email:'}</span>
                <span className="font-mono truncate max-w-[180px]">{currentUser.email}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2 text-xs text-center text-amber-800">
              <p className="font-bold">{isAr ? 'لا توجد جلسة مستخدم نشطة حالياً' : 'No active user session'}</p>
              <p className="text-[11px] text-amber-700">{isAr ? 'يرجى تسجيل الدخول بأحد الحسابات النموذجية أعلاه' : 'Please log in with one of the quick preset accounts above'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
