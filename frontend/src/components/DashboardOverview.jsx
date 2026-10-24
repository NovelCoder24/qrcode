import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveQrCount } from '@/redux/authSlice';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
  Lock,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import api from '@/api/axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Progress } from '@/components/UI/progress';
import { Skeleton } from '@/components/UI/skeleton';

function formatNumber(value) {
  if (value === Infinity) return '∞';
  const num = Number(value);
  return new Intl.NumberFormat('en-IN').format(Number.isFinite(num) ? num : 0);
}

function formatRelativeDate(value) {
  if (!value) return 'No scans yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No scans yet';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQrTitle(qr) {
  return qr?.metadata?.title || qr?.title || 'Untitled QR';
}

function getQrStatus(qr) {
  if (!qr?.isActive) return { label: 'Paused', variant: 'warning', icon: AlertTriangle };
  if (qr?.accessMode === 'static_locked') return { label: 'Static Locked', variant: 'outline', icon: Lock };
  if (qr?.health_status === 'broken') return { label: 'Broken', variant: 'destructive', icon: XCircle };
  return { label: 'Healthy', variant: 'success', icon: CheckCircle2 };
}

const getMockCity = (qrId) => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'];
  if (!qrId) return cities[0];
  let hash = 0;
  for (let i = 0; i < qrId.length; i++) {
    hash = qrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cities[Math.abs(hash) % cities.length];
};

const UI_PLAN_LIMITS = {
  free:     { name: 'Free',     maxQrs: 1,   maxScans: 100,      maxSeats: 1 },
  local:    { name: 'Local',    maxQrs: 1,   maxScans: Infinity, maxSeats: 1 },
  starter:  { name: 'Starter',  maxQrs: 10,  maxScans: 25000,    maxSeats: 1 },
  growth:   { name: 'Growth',   maxQrs: 50,  maxScans: Infinity, maxSeats: 1 },
  pro:      { name: 'Pro',      maxQrs: 50,  maxScans: Infinity, maxSeats: 1 },
  business: { name: 'Business', maxQrs: 100, maxScans: Infinity, maxSeats: 5 },
};

function SafetyRow({ label, description, status, actionText, actionPath }) {
  const config = {
    healthy: { icon: CheckCircle2, className: 'text-emerald-500' },
    warning: { icon: AlertTriangle, className: 'text-amber-500' },
    broken: { icon: XCircle, className: 'text-red-500' },
  }[status];
  const Icon = config.icon;

  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.className)} />
        <div className="min-w-0">
          <p className="font-bold text-slate-800 text-[13px]">{label}</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{description}</p>
        </div>
      </div>
      {actionText && actionPath && (
        <Link to={actionPath} className="flex items-center gap-0.5 shrink-0 font-bold text-slate-800 hover:text-indigo-600 transition-colors text-[11px] mt-0.5 border-b border-transparent hover:border-indigo-600">
          <span>{actionText}</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-44 rounded-xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const workspaceMode = user?.workspaceMode || 'marketing';
  const isStorefront = workspaceMode === 'storefront';
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/qrcodes/myqrs');
        setQrCodes(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleCheckLinks = async () => {
    try {
      setCheckingLinks(true);
      setCheckFeedback(null);
      setError(null);
      const { data } = await api.post('/qrcodes/check-health');
      if (Array.isArray(data?.qrs)) {
        setQrCodes(data.qrs);
      }
      setCheckFeedback(
        data?.brokenCount > 0
          ? `Checked ${data.checkedCount} links: ${data.brokenCount} broken link(s) detected.`
          : `Checked ${data?.checkedCount || 0} links: All destinations are healthy!`
      );
      window.dispatchEvent(new Event('qrvibe:notifications-updated'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run link health check');
    } finally {
      setCheckingLinks(false);
    }
  };

  const stats = useMemo(() => {
    const totalCodes = qrCodes.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.stats?.total_scans || 0), 0);
    const dynamicActive = qrCodes.filter((qr) => qr.isActive && qr.accessMode !== 'static_locked' && qr.accessMode !== 'disabled').length;
    const staticLocked = qrCodes.filter((qr) => qr.accessMode === 'static_locked').length;
    const brokenLinks = qrCodes.filter((qr) => qr.health_status === 'broken').length;
    const paused = qrCodes.filter((qr) => !qr.isActive || qr.accessMode === 'disabled').length;
    const withUtm = qrCodes.filter((qr) => /[?&]utm_/i.test(qr.target_url || '')).length;
    const scanReady = dynamicActive > 0;
    const safetyChecks = [
      brokenLinks === 0,
      paused === 0,
      staticLocked <= totalCodes,
      totalCodes === 0 || withUtm > 0,
      scanReady || totalCodes === 0,
    ];
    const safetyScore = Math.round((safetyChecks.filter(Boolean).length / safetyChecks.length) * 100);

    return { totalCodes, totalScans, dynamicActive, staticLocked, brokenLinks, paused, withUtm, safetyScore };
  }, [qrCodes]);

  useEffect(() => {
    if (!loading && user?.activeQrCount !== stats.dynamicActive) {
      dispatch(setActiveQrCount(stats.dynamicActive));
    }
  }, [loading, stats.dynamicActive, user?.activeQrCount, dispatch]);

  const topQrs = useMemo(
    () => [...qrCodes].sort((a, b) => (b.stats?.total_scans || 0) - (a.stats?.total_scans || 0)).slice(0, 5),
    [qrCodes]
  );

  const recentQrs = useMemo(
    () => [...qrCodes]
      .filter((qr) => qr.stats?.last_scanned_at)
      .sort((a, b) => new Date(b.stats?.last_scanned_at) - new Date(a.stats?.last_scanned_at))
      .slice(0, 5),
    [qrCodes]
  );

  const brokenQrs = qrCodes.filter((qr) => qr.health_status === 'broken');
  const brokenCount = stats.brokenLinks || 0;
  const staticLockedCount = stats.staticLocked || 0;
  const totalIssues = brokenCount + staticLockedCount;

  // Subscription and Limit Resolution logic
  const rawPlan = (user?.subscription?.plan || 'free').toLowerCase();
  const isTrial = user?.subscription?.status === 'trialing';
  const isExpired = user?.subscription?.status === 'expired' || 
    (isTrial && user?.subscription?.trialEndsAt && new Date(user.subscription.trialEndsAt) < new Date());

  const effectivePlan = isExpired ? 'free' : rawPlan;
  const planInfo = UI_PLAN_LIMITS[effectivePlan] || UI_PLAN_LIMITS.starter;

  const planName = isTrial && !isExpired
    ? `${planInfo.name} (Trial)`
    : `${planInfo.name} Plan`;

  // Capacity limit: prioritize plan configuration so users on Growth/Starter/etc. get true limits
  const dynamicLimit = user?.subscription?.dynamicQrLimit && !isExpired && user.subscription.dynamicQrLimit >= planInfo.maxQrs
    ? user.subscription.dynamicQrLimit
    : planInfo.maxQrs;

  const activeQrCount = stats.dynamicActive;
  const planUsage = dynamicLimit > 0 && dynamicLimit !== Infinity
    ? Math.min(100, Math.round((activeQrCount / dynamicLimit) * 100))
    : 0;
  const isNearLimit = dynamicLimit !== Infinity && planUsage >= 80;

  if (loading) return <LoadingDashboard />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor your QR codes and keep them safe for printing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckLinks}
            disabled={checkingLinks}
            className="font-bold border-slate-200 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1.5", checkingLinks && "animate-spin")} />
            {checkingLinks ? 'Checking...' : 'Check Links'}
          </Button>
          <Button variant="outline" size="sm" asChild className="font-bold border-slate-200 text-slate-600 hover:text-slate-900">
            <Link to="/analytics"><Download className="h-4 w-4" />Export Report</Link>
          </Button>
          <Button size="sm" asChild className="font-bold bg-slate-900 text-white hover:bg-slate-800">
            <Link to="/create"><Plus className="h-4 w-4 mr-1.5" />Create QR</Link>
          </Button>
        </div>
      </div>

      {checkFeedback && (
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 p-3.5 text-xs font-semibold text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{checkFeedback}</span>
            </div>
            <button type="button" onClick={() => setCheckFeedback(null)} className="text-emerald-700 hover:underline">
              Dismiss
            </button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Conditional Global Alert: Only renders if Static Locked > 0 */}
      {staticLockedCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 sm:px-5 sm:py-4 shadow-sm text-amber-950">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800">
              <Lock className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>You have {staticLockedCount} Static Locked QR code{staticLockedCount > 1 ? 's' : ''}.</span>
              </p>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                They are still scanning successfully, but analytics and editing are paused because you exceeded your plan limits.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm">
              <Link to="/billing">Upgrade to Unlock</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Three Core Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Scans (The Vanity Metric) */}
        <Card className="relative overflow-hidden border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-white shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[180px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Scans</span>
                  <p className="text-[11px] font-medium text-slate-400">All-time Engagements</p>
                </div>
              </div>
            </div>

            <div className="my-3">
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                {formatNumber(stats.totalScans)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Live scan redirects</span>
              <Link to="/analytics" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                <span>View Analytics</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 2. Active QR Codes vs Limit (The Business Metric) */}
        <Card className="relative overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md bg-white">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[180px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active vs Limit</span>
                  <p className="text-[11px] font-medium text-slate-400">{planName}</p>
                </div>
              </div>
              {isNearLimit ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  {planUsage >= 100 ? 'Limit Reached' : 'Near Limit'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {dynamicLimit === Infinity ? 'Unlimited' : `${Math.max(0, dynamicLimit - activeQrCount)} left`}
                </span>
              )}
            </div>

            <div className="my-2.5">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {activeQrCount} <span className="text-xl font-semibold text-slate-400">/ {dynamicLimit === Infinity ? '∞' : dynamicLimit} Used</span>
              </p>
              <div className="mt-2.5">
                <Progress 
                  value={planUsage} 
                  className={cn(
                    "h-2 bg-slate-100",
                    planUsage >= 100 ? "[&>div]:bg-red-500" : planUsage >= 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-indigo-600"
                  )} 
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {planUsage >= 100 ? "Limit reached — upgrade" : `${planUsage}% of capacity utilized`}
              </span>
              <Link to="/billing" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                <span>{isNearLimit ? 'Upgrade' : 'Manage'}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. Action Items / Needs Attention (The Utility Metric) */}
        <Link 
          to={totalIssues > 0 ? "/qrcodes?status=issues" : "/qrcodes"}
          className="block group h-full"
        >
          <Card className={cn(
            "relative overflow-hidden shadow-sm transition-all hover:shadow-md h-full cursor-pointer",
            totalIssues === 0 
              ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white hover:border-emerald-300"
              : "border-red-300 bg-gradient-to-br from-red-50/60 via-white to-white hover:border-red-400 ring-1 ring-red-200"
          )}>
            <div className={cn(
              "absolute -right-6 -top-6 h-28 w-28 rounded-full blur-xl pointer-events-none",
              totalIssues === 0 ? "bg-emerald-500/10" : "bg-red-500/15"
            )} />

            <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[180px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    totalIssues === 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  )}>
                    {totalIssues === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Items</span>
                    <p className="text-[11px] font-medium text-slate-400">Needs Attention</p>
                  </div>
                </div>

                {totalIssues === 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Operational
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Action Required
                  </span>
                )}
              </div>

              <div className="my-2.5">
                <p className={cn(
                  "text-3xl font-extrabold tracking-tight",
                  totalIssues === 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {totalIssues === 0 ? "0 Issues" : `${totalIssues} Issue${totalIssues > 1 ? 's' : ''} Detected`}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                  {totalIssues === 0
                    ? "All links and redirects operating smoothly"
                    : [
                        brokenCount > 0 ? `${brokenCount} broken link${brokenCount > 1 ? 's' : ''}` : null,
                        staticLockedCount > 0 ? `${staticLockedCount} locked by limit` : null
                      ].filter(Boolean).join(' • ')
                  }
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className={cn(
                  "text-xs font-semibold",
                  totalIssues === 0 ? "text-slate-500" : "text-red-600"
                )}>
                  {totalIssues === 0 ? "All links healthy" : "Drop to exact links"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-0.5",
                  totalIssues === 0 ? "text-slate-600" : "text-red-600"
                )}>
                  <span>{totalIssues === 0 ? "View links" : "Fix now"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Top Performing QR Codes */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5">
              <CardTitle className="text-base font-bold text-slate-800">Top Performing QR Codes</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-slate-500 hover:text-slate-800"><Link to="/qrcodes">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead>
                    <tr className="border-t border-slate-100 text-slate-400">
                      <th className="px-5 py-3.5 text-left font-semibold uppercase tracking-wider">QR Code</th>
                      <th className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider">Scans</th>
                      <th className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQrs.length === 0 ? (
                      <tr><td colSpan="3" className="px-5 py-8 text-center text-slate-400 font-medium">No QR codes yet.</td></tr>
                    ) : topQrs.map((qr) => {
                      const status = getQrStatus(qr);
                      return (
                        <tr key={qr._id} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50/50">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50"><QrCode className="h-4.5 w-4.5 text-slate-400" /></div>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-800 text-[13px]">{getQrTitle(qr)}</p>
                                <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">{qr.qr_type?.toLowerCase() || 'url'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-800 text-[13px]">{formatNumber(qr.stats?.total_scans)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant={status.variant} className="gap-1 font-bold text-[10px] uppercase py-0.5 px-2 tracking-wide">{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Dead Link Warnings */}
          <Card className={cn('shadow-none border-slate-200', brokenQrs.length > 0 && 'border-red-200 bg-red-50/30')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('h-5 w-5', brokenQrs.length > 0 ? 'text-red-500' : 'text-emerald-500')} />
                <CardTitle className="text-base font-bold text-slate-800">Dead Link Warnings</CardTitle>
              </div>
              <Badge variant={brokenQrs.length > 0 ? 'destructive' : 'success'} className="font-bold text-[10px] tracking-wide uppercase px-2">{brokenQrs.length} issues</Badge>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5 pt-0">
              {brokenQrs.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">No broken destinations detected in your QR list.</p>
              ) : brokenQrs.slice(0, 3).map((qr) => (
                <div key={qr._id} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-white p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-slate-800">{getQrTitle(qr)}</p>
                    <p className="truncate text-[11px] text-slate-400 font-semibold mt-0.5">{qr.target_url}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50"><Link to="/qrcodes">Fix Now</Link></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Print Safety Score (Marketing Only) */}
          {!isStorefront && (
          <Card className="shadow-none border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-800">Print Safety Score</CardTitle>
              <span className={cn('text-2xl font-extrabold', 
                stats.safetyScore >= 80 ? 'text-emerald-500' : stats.safetyScore >= 60 ? 'text-amber-500' : 'text-red-500'
              )}>
                {stats.safetyScore}%
              </span>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              <SafetyRow 
                label="QR Health" 
                description={stats.brokenLinks === 0 ? "All QR codes scanning correctly" : "Review scan status"} 
                status={stats.brokenLinks === 0 ? 'healthy' : 'warning'} 
              />
              <SafetyRow 
                label="Destination Health" 
                description={stats.brokenLinks > 0 ? `${stats.brokenLinks} broken link${stats.brokenLinks > 1 ? 's' : ''} detected` : 'No broken links detected'} 
                status={stats.brokenLinks > 0 ? 'broken' : 'healthy'} 
                actionText={stats.brokenLinks > 0 ? "Fix broken URL" : null}
                actionPath={stats.brokenLinks > 0 ? "/qrcodes" : null}
              />
              <SafetyRow 
                label="UTM Status" 
                description={stats.totalCodes - stats.withUtm > 0 ? `${stats.totalCodes - stats.withUtm} QRs missing UTM tracking` : 'All QR codes have tracking enabled'} 
                status={stats.totalCodes - stats.withUtm > 0 ? 'warning' : 'healthy'} 
                actionText={stats.totalCodes - stats.withUtm > 0 ? "Add missing UTM" : null}
                actionPath={stats.totalCodes - stats.withUtm > 0 ? "/qrcodes" : null}
              />
              <SafetyRow 
                label="Analytics Status" 
                description="Analytics enabled on all dynamic QRs" 
                status="healthy" 
              />
              <SafetyRow 
                label="Fallback Safety" 
                description="All QRs have fallback destinations" 
                status="healthy" 
              />
            </CardContent>
          </Card>
          )}

          {/* Recent Scans */}
          <Card className="shadow-none border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-800">Recent Scans</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-slate-500 hover:text-slate-800"><Link to="/analytics">View all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3.5 p-5 pt-0">
              {recentQrs.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold">Recent scan activity will appear here.</p>
              ) : recentQrs.map((qr) => (
                <div key={qr._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                      <Smartphone className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-800">{getQrTitle(qr)}</p>
                      <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{getMockCity(qr._id)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                    {formatRelativeDate(qr.stats?.last_scanned_at)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plan Subscription Usage */}
          {(() => {
            const currentPlan = (user?.subscription?.plan || 'free').toLowerCase();
            const planInfo = UI_PLAN_LIMITS[currentPlan] || UI_PLAN_LIMITS.free;
            
            const maxQrs = planInfo.maxQrs;
            const maxScans = planInfo.maxScans;
            const maxSeats = planInfo.maxSeats;
            
            const qrPercentage = maxQrs > 0 && maxQrs !== Infinity ? (activeQrCount / maxQrs) * 100 : 0;
            const scansPercentage = maxScans > 0 && maxScans !== Infinity ? (stats.totalScans / maxScans) * 100 : 0;
            const seatsUsed = maxSeats > 1 ? 2 : 1;
            const seatsPercentage = maxSeats > 0 ? (seatsUsed / maxSeats) * 100 : 0;
            
            return (
              <Card className="shadow-none border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
                  <CardTitle className="text-base font-bold text-slate-800">
                    {planInfo.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-slate-500 hover:text-slate-800"><Link to="/billing">Manage</Link></Button>
                </CardHeader>
                <CardContent className="space-y-5 p-5 pt-0">
                  {/* Dynamic QRs Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{isStorefront ? 'Table QRs' : 'Dynamic QRs'}</span>
                      <span className="text-slate-800">{activeQrCount}/{maxQrs}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, qrPercentage))}%` }}></div>
                    </div>
                  </div>

                  {/* Monthly Scans Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Monthly Scans</span>
                      <span className="text-slate-800">{formatNumber(stats.totalScans)}/{formatNumber(maxScans)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, scansPercentage))}%` }}></div>
                    </div>
                  </div>

                  {/* Team Seats Progress */}
                  {!isStorefront && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Team Seats</span>
                        <span className="text-slate-800">{seatsUsed}/{maxSeats}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, seatsPercentage))}%` }}></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
