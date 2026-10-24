import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Info,
  LogOut,
  Menu,
  Trash2,
  User,
} from 'lucide-react';
import { logout } from '@/redux/authSlice';
import api from '@/api/axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import UpgradeModal from '@/components/UpgradeModal';
import WorkspaceModeModal from '@/components/WorkspaceModeModal';
import Sidebar from '@/components/Sidebar';

const pageLabels = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My QR Codes', path: '/qrcodes' },
  { label: 'Create QR', path: '/create' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Billing', path: '/billing' },
  { label: 'Privacy & Data', path: '/privacy-data' },
  { label: 'Settings', path: '/account' },
];

function getInitials(user) {
  const source = user?.name || user?.email || 'QR';
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'QR';
}

function formatNotifTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Topbar({ onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch {
      // Silent fail on background poll
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('qrvibe:notifications-updated', handleRefresh);
    return () => window.removeEventListener('qrvibe:notifications-updated', handleRefresh);
  }, [fetchNotifications, location.pathname]);

  const handleMarkAllRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore error
    }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.isRead) {
      try {
        const { data } = await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(Number(data?.unreadCount) || 0);
      } catch {
        // Ignore error
      }
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else if (notif.qr_id) {
      navigate(`/qrcodes/${notif.qr_id}`);
    }
  };

  const handleDismissNotification = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch {
      // Ignore error
    }
  };

  const pageLabel = useMemo(() => {
    const item = pageLabels.find((entry) => location.pathname === entry.path || location.pathname.startsWith(`${entry.path}/`));
    return item?.label || 'Dashboard';
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">{pageLabel}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">No alerts right now</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Broken link and recovery alerts will appear here.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon =
                    notif.type === 'alert'
                      ? AlertTriangle
                      : notif.type === 'recovery'
                        ? CheckCircle2
                        : Info;
                  const iconColor =
                    notif.type === 'alert'
                      ? 'text-red-600 bg-red-50'
                      : notif.type === 'recovery'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-indigo-600 bg-indigo-50';

                  return (
                    <div
                      key={notif._id}
                      onClick={() => handleClickNotification(notif)}
                      className={cn(
                        'flex items-start justify-between gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50',
                        !notif.isRead && 'bg-indigo-50/40'
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', iconColor)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={cn('truncate text-xs text-slate-900', !notif.isRead ? 'font-bold' : 'font-semibold')}>
                              {notif.title}
                            </p>
                            {!notif.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-slate-400">
                            {formatNotifTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDismissNotification(e, notif._id)}
                        className="mt-0.5 rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                        aria-label="Dismiss notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="User menu">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-900 text-white">{getInitials(user)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || 'QRVibe User'}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email || 'Signed in'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account"><User className="mr-2 h-4 w-4" />Account</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/billing"><CreditCard className="mr-2 h-4 w-4" />Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = Boolean(user && user.workspaceMode === null && !user.hasCreatedFirstQR);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="min-h-screen lg:pl-64">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-5 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} type="limit" />
      {showOnboarding && !onboardingDismissed && (
        <WorkspaceModeModal
          open={true}
          onClose={() => setOnboardingDismissed(true)}
        />
      )}
    </div>
  );
}
