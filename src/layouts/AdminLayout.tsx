import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Store, LogOut, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_NAV = [
  { path: '/admin', icon: <BarChart3 size={18} />, label: 'ภาพรวมแพลตฟอร์ม' },
  { path: '/admin/tenants', icon: <Store size={18} />, label: 'จัดการร้านค้า' },
];

export const AdminLayout: React.FC = () => {
  const { firebaseUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className="w-64 bg-[#1a1225] text-white flex flex-col z-50 fixed md:relative h-full max-h-screen border-r border-white/10 shadow-2xl md:shadow-none overflow-y-auto scrollbar-hide"
            >
              <div className="p-8 pb-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-purple-400" />
                  <span className="text-lg font-bold text-white">Super Admin</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-white/60">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-1">
                {ADMIN_NAV.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-4 px-6 py-4.5 rounded-3xl transition-all cursor-pointer w-full ${
                        isActive
                          ? 'bg-white/10 text-white font-bold'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={isActive ? 'text-purple-400' : ''}>{item.icon}</div>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm border border-purple-500/30">
                    {firebaseUser?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate text-white/80">{firebaseUser?.email}</p>
                    <p className="text-[10px] text-purple-300">Super Admin</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
                >
                  <LogOut size={14} /> ออกจากระบบ
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg relative">
        <header className="h-24 flex items-center justify-between px-10 bg-bg/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white border border-border rounded-2xl text-text-muted hover:text-primary transition-all hover:shadow-md"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Shield size={20} className="text-purple-500" /> NailSaaS Admin
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
