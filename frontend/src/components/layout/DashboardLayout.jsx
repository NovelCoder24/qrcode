import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  QrCode,
  Search,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { logout } from '@/redux/authSlice';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';
import { Progress } from '@/components/UI/progress';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/UI/sheet';
import UpgradeModal from '@/components/UpgradeModal';
import qrvibeLogoPrimary from '@/assets/qrvibe-logo-primary.svg';

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My QR Codes', path: '/qrcodes', icon: QrCode },
  { label: 'Create QR', path: '/create', icon: PlusCircle, gated: true },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Billing', path: '/billing', icon: CreditCard },
  { label: 'Privacy & Data', path: '/privacy-data', icon: Shield },
  { label: 'Settings', path: '/account', icon: Settings },
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

function getPlanLabel(subscription) {
  const plan = subscription?.plan || 'starter';
  if (plan === 'business') return 'Business';
  if (plan === 'pro') return 'Pro';
  if (plan === 'basic') return 'Basic';
  return 'Starter';
}

function SidebarNav({ onNavigate, onCreateBlocked }) {
  const { user } = useSelector((state) => state.auth);
  const subscription = user?.subscription;

  const handleClick = (event, item) => {
    if (item.gated && subscription?.plan === 'free' && user?.activeQrCount >= subscription?.dynamicQrLimit) {
      event.preventDefault();
      onCreateBlocked?.();
      return;
    }
    onNavigate?.();
  };

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={(event) => handleClick(event, item)}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function PlanCard() {
  const { user } = useSelector((state) => state.auth);
  const subscription = user?.subscription;
  const dynamicLimit = subscription?.dynamicQrLimit || 5;
  const used = user?.activeQrCount ?? 0;
  const value = dynamicLimit > 0 ? Math.min(100, (used / dynamicLimit) * 100) : 0;

  return (
    <Link to="/billing" className="block rounded-lg border border-sidebar-border bg-secondary/50 p-3 transition-colors hover:bg-secondary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground">{getPlanLabel(subscription)} Plan</p>
          <p className="mt-1 text-xs text-muted-foreground">{used}/{dynamicLimit} dynamic QR codes</p>
        </div>
        <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-primary">Manage</span>
      </div>
      <Progress value={value} className="mt-3 h-1.5" />
    </Link>
  );
}

function DesktopSidebar({ onCreateBlocked }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link to="/dashboard" className="inline-flex items-center">
          <img src={qrvibeLogoPrimary} alt="QRVibe" className="h-9 w-auto" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav onCreateBlocked={onCreateBlocked} />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <PlanCard />
      </div>
    </aside>
  );
}

function MobileSidebar({ onCreateBlocked }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center border-b border-border px-5">
          <img src={qrvibeLogoPrimary} alt="QRVibe" className="h-9 w-auto" />
        </div>
        <div className="py-4">
          <SidebarNav onNavigate={() => setOpen(false)} onCreateBlocked={onCreateBlocked} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <PlanCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Topbar({ onCreateBlocked }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const pageLabel = useMemo(() => {
    const item = navigation.find((entry) => location.pathname === entry.path || location.pathname.startsWith(`${entry.path}/`));
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
        <MobileSidebar onCreateBlocked={onCreateBlocked} />
        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-medium text-muted-foreground">QRVibe Workspace</p>
          <h1 className="truncate text-sm font-semibold text-foreground">{pageLabel}</h1>
        </div>
      </div>

      <div className="hidden max-w-sm flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
        <Search className="h-4 w-4" />
        <span>Search QR codes...</span>
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

export default function DashboardShell({ children }) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopSidebar onCreateBlocked={() => setUpgradeModalOpen(true)} />
      <div className="min-h-screen lg:pl-64">
        <Topbar onCreateBlocked={() => setUpgradeModalOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-5 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} type="limit" />
    </div>
  );
}
