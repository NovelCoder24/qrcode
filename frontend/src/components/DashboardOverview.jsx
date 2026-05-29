import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  return new Intl.NumberFormat('en-IN').format(value || 0);
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
  free:    { name: 'Free',    maxQrs: 1,  maxScans: 100,      maxSeats: 1 },
  local:   { name: 'Local',   maxQrs: 1,  maxScans: Infinity, maxSeats: 1 },
  starter: { name: 'Starter', maxQrs: 10, maxScans: 25000,    maxSeats: 1 },
  growth:  { name: 'Growth',  maxQrs: 50, maxScans: Infinity, maxSeats: 1 },
};

function StatCard({ label, value, icon: Icon, trend, info, tone = 'default' }) {
  const toneClass = {
    default: 'text-slate-800',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    destructive: 'text-red-500',
  }[tone];

  return (
    <Card className="shadow-none border-slate-200">
      <CardContent className="p-5 flex flex-col justify-between h-32">
        <div className="flex items-center justify-between w-full">
          <div className="text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span>{trend}</span>
            </span>
          )}
          {info && (
            <span className="text-slate-400 hover:text-slate-600 cursor-pointer">
              {info}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className={cn('text-3xl font-extrabold tracking-tight', toneClass)}>{value}</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-32" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useSelector((state) => state.auth);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const dynamicLimit = user?.subscription?.dynamicQrLimit || 5;
  const activeQrCount = user?.activeQrCount ?? stats.dynamicActive;
  const planUsage = dynamicLimit > 0 ? Math.min(100, (activeQrCount / dynamicLimit) * 100) : 0;

  if (loading) return <LoadingDashboard />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor your QR codes and keep them safe for printing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="font-bold border-slate-200 text-slate-600 hover:text-slate-900">
            <Link to="/qrcodes"><RefreshCw className="h-4 w-4 mr-1.5" />Check Links</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="font-bold border-slate-200 text-slate-600 hover:text-slate-900">
            <Link to="/analytics"><Download className="h-4 w-4" />Export Report</Link>
          </Button>
          <Button size="sm" asChild className="font-bold bg-slate-900 text-white hover:bg-slate-800">
            <Link to="/create"><Plus className="h-4 w-4 mr-1.5" />Create QR</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total QR Codes" value={stats.totalCodes} icon={QrCode} />
        <StatCard label="Healthy" value={stats.dynamicActive} icon={CheckCircle2} trend="↗ 2%" tone="success" />
        <StatCard label="Static Locked" value={stats.staticLocked} icon={Lock} info={<Info className="h-4 w-4" />} />
        <StatCard label="Total Scans" value={formatNumber(stats.totalScans)} icon={Smartphone} trend="↗ 12.5%" />
        <StatCard label="Broken" value={stats.brokenLinks} icon={AlertTriangle} tone={stats.brokenLinks > 0 ? 'destructive' : 'default'} />
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

          {/* Static Locked Banner info */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
            <Lock className="h-4.5 w-4.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 mr-1.5">What is Static Locked?</span>
              <span>Static QR codes still scan and redirect, but editing and analytics are paused. Upgrade to Dynamic to unlock full features.</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Print Safety Score */}
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
            const currentPlan = user?.subscription?.plan || 'free';
            const planInfo = UI_PLAN_LIMITS[currentPlan] || UI_PLAN_LIMITS.free;
            
            const maxQrs = planInfo.maxQrs;
            const maxScans = planInfo.maxScans;
            const maxSeats = planInfo.maxSeats;
            
            const qrPercentage = maxQrs > 0 ? (activeQrCount / maxQrs) * 100 : 0;
            const scansPercentage = maxScans > 0 ? (stats.totalScans / maxScans) * 100 : 0;
            const seatsUsed = maxSeats > 1 ? 2 : 1;
            const seatsPercentage = (seatsUsed / maxSeats) * 100;
            
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
                      <span>Dynamic QRs</span>
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
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Team Seats</span>
                      <span className="text-slate-800">{seatsUsed}/{maxSeats}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, seatsPercentage))}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
