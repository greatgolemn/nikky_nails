import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, UserPlus, BarChart3, Settings, LogOut, Search,
  Smartphone, Menu, X, CreditCard, Calendar, Gem, Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

const NAV_ITEMS = [
  { path: '/', icon: <BarChart3 size={18} />, label: 'แดชบอร์ด' },
  { path: '/members', icon: <Users size={18} />, label: 'รายชื่อลูกค้า' },
  { path: '/bookings', icon: <Calendar size={18} />, label: 'รายการจองคิว' },
  { path: '/catalog', icon: <CreditCard size={18} />, label: 'บริการ & แพ็กเกจ' },
  { path: '/members/new', icon: <UserPlus size={18} />, label: 'ลงทะเบียนลูกค้า' },
  { path: '/preview', icon: <Smartphone size={18} />, label: 'พรีวิวสมาร์ทโฟน' },
  { path: '/staff', icon: <Users size={18} />, label: 'จัดการพนักงาน' },
  { path: '/billing', icon: <CreditCard size={18} />, label: 'แพ็กเกจของร้าน' },
  { path: '/settings', icon: <Settings size={18} />, label: 'ตั้งค่าระบบ' },
];

export const StoreLayout: React.FC = () => {
  const { firebaseUser, userProfile, logout } = useAuth();
  const { shopConfig } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  useEffect(() => {
    if (shopConfig?.theme?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', shopConfig.theme.primaryColor);
    } else {
      document.documentElement.style.setProperty('--color-primary', '#C89595'); // Default theme
    }
  }, [shopConfig?.theme?.primaryColor]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop for mobile */}
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
              className="w-64 bg-sidebar-bg text-text-main flex flex-col z-50 fixed md:relative h-full max-h-screen border-r border-border shadow-2xl md:shadow-none overflow-y-auto scrollbar-hide"
            >
              <div className="p-8 pb-12 flex items-center justify-between">
                <span className="text-xl font-bold text-primary">✨ {shopConfig.shopName}</span>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-text-muted">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`sidebar-item group w-full ${isActive ? 'sidebar-item-active' : ''}`}
                    >
                      <div className={`${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary-dark shadow-sm'} transition-colors`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-primary font-bold overflow-hidden border border-border">
                    {firebaseUser?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate">{firebaseUser?.email}</p>
                    <p className="text-[10px] text-text-muted capitalize">{userProfile?.role?.replace('_', ' ') || 'User'}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-xs text-text-muted hover:text-text-main transition-colors"
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
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white border border-border rounded-2xl text-text-muted hover:text-primary transition-all hover:shadow-md"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold font-serif hidden lg:block">{shopConfig.shopName} CRM</h2>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group hidden md:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={16} />
              <input
                type="text"
                placeholder="ค้นหาลูกค้าด้วยชื่อหรือเบอร์โทร..."
                className="pl-13 pr-6 py-3.5 bg-white border border-border rounded-2xl text-sm w-96 outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {location.pathname === '/' && (
              <button
                onClick={() => navigate('/members/new')}
                className="btn-primary !px-5 !py-2.5 !text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>เพิ่มลูกค้าใหม่</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full scroll-smooth">
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </main>
      </div>
    </div>
  );
};
