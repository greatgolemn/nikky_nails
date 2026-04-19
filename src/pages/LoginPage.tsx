import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Gem, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { firebaseUser, loading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  if (!loading && firebaseUser) {
    return <Navigate to="/" replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerWithEmail(email, password, displayName);
      // After registration, AuthContext will pick up the new user
      // and redirect will happen via the Navigate above
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_#c4a48420,_transparent)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card rounded-[40px] p-12"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary text-white rounded-3xl mx-auto flex items-center justify-center mb-6 rotate-12 shadow-xl shadow-primary/20">
            <Gem size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">NailSaaS</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            ระบบ CRM สำหรับร้านทำเล็บ<br />
            {mode === 'login' ? 'เข้าสู่ระบบเพื่อจัดการร้านของคุณ' : 'สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Email Form */}
        <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="ชื่อร้านค้าหรือชื่อของคุณ"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="input-field w-full pl-13"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="email"
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field w-full pl-13"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field w-full pl-13 pr-13"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-4 text-base"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">หรือ</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Login */}
        <button
          onClick={loginWithGoogle}
          className="w-full btn-secondary py-4 flex items-center justify-center gap-3 text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          {mode === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครด้วย Google'}
        </button>

        {/* Toggle Login/Register */}
        <div className="mt-8 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-sm text-text-muted hover:text-primary transition-colors font-medium"
          >
            {mode === 'login' ? (
              <>ยังไม่มีบัญชี? <span className="text-primary font-bold underline underline-offset-4">สมัครเลย</span></>
            ) : (
              <>มีบัญชีอยู่แล้ว? <span className="text-primary font-bold underline underline-offset-4">เข้าสู่ระบบ</span></>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-text-muted uppercase tracking-widest border-t border-black/5 pt-8 text-center">
          The standard in boutique CRM
        </div>
      </motion.div>
    </div>
  );
};
