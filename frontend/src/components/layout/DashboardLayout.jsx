import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  CreditCard,
  LogOut,
  Menu,
  PlusCircle,
  User,
} from 'lucide-react';
import { logout } from '@/redux/authSlice';
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

function Topbar({ onCreateBlocked, onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const pageLabel = useMemo(() => {
    const item = pageLabels.find((entry) => location.pathname === entry.path || location.pathname.startsWith(`${entry.path}/`));
    return item?.label || 'Dashboard';
  }, [location.pathname]);

  const handleCreate = (event) => {
    const subscription = user?.subscription;
    if (subscription?.plan === 'free' && user?.activeQrCount >= subscription?.dynamicQrLimit) {
      event.preventDefault();
      onCreateBlocked?.();
    }
  };

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
        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-medium text-muted-foreground">QRVibe Workspace</p>
          <h1 className="truncate text-sm font-semibold text-foreground">{pageLabel}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" onClick={handleCreate}>
          <Link to="/create">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Create QR</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          onCreateBlocked={() => setUpgradeModalOpen(true)}
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
    </div>
  );
}
