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
  Lock,
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

function StatCard({ label, value, icon: Icon, tone = 'default', helper }) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={cn('mt-3 text-3xl font-semibold tracking-tight', toneClass)}>{value}</p>
            {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
          </div>
          <div className="rounded-md bg-secondary p-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyRow({ label, description, status }) {
  const config = {
    healthy: { icon: CheckCircle2, className: 'text-success', text: 'Healthy' },
    warning: { icon: AlertTriangle, className: 'text-warning', text: 'Review' },
    broken: { icon: XCircle, className: 'text-destructive', text: 'Action needed' },
  }[status];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2.5">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.className)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <span className={cn('text-xs font-semibold', config.className)}>{config.text}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
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

export default function DashboardHome() {
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor QR code health, scan activity, and print safety.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/qrcodes"><RefreshCw className="h-4 w-4" />Check Links</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/analytics"><Download className="h-4 w-4" />Export Report</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/create"><Plus className="h-4 w-4" />Create QR</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total QR Codes" value={formatNumber(stats.totalCodes)} icon={QrCode} />
        <StatCard label="Dynamic Active" value={formatNumber(stats.dynamicActive)} icon={ShieldCheck} tone="success" />
        <StatCard label="Static Locked" value={formatNumber(stats.staticLocked)} icon={Lock} helper="Still scans. Editing paused." />
        <StatCard label="Total Scans" value={formatNumber(stats.totalScans)} icon={BarChart3} tone="success" />
        <StatCard label="Broken Links" value={formatNumber(stats.brokenLinks)} icon={AlertTriangle} tone={stats.brokenLinks > 0 ? 'destructive' : 'success'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle>Top Performing QR Codes</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/qrcodes">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-t border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">QR Code</th>
                      <th className="px-4 py-3 text-left font-medium">Destination</th>
                      <th className="px-4 py-3 text-right font-medium">Scans</th>
                      <th className="px-4 py-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQrs.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">No QR codes yet.</td></tr>
                    ) : topQrs.map((qr) => {
                      const status = getQrStatus(qr);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={qr._id} className="border-t border-border">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-secondary"><QrCode className="h-4 w-4 text-muted-foreground" /></div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{getQrTitle(qr)}</p>
                                <p className="text-xs text-muted-foreground">{qr.qr_type || 'URL'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[240px] px-4 py-3 text-muted-foreground"><span className="block truncate">{qr.target_url}</span></td>
                          <td className="px-4 py-3 text-right font-medium">{formatNumber(qr.stats?.total_scans)}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={status.variant} className="gap-1"><StatusIcon className="h-3 w-3" />{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(brokenQrs.length > 0 && 'border-destructive/30 bg-destructive/5')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('h-4 w-4', brokenQrs.length > 0 ? 'text-destructive' : 'text-success')} />
                <CardTitle>Dead Link Warnings</CardTitle>
              </div>
              <Badge variant={brokenQrs.length > 0 ? 'destructive' : 'success'}>{brokenQrs.length} issues</Badge>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {brokenQrs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No broken destinations detected in your QR list.</p>
              ) : brokenQrs.slice(0, 3).map((qr) => (
                <div key={qr._id} className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{getQrTitle(qr)}</p>
                    <p className="truncate text-xs text-muted-foreground">{qr.target_url}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild><Link to="/qrcodes">Fix</Link></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle>Print Safety Score</CardTitle>
              <span className={cn('text-2xl font-semibold', stats.safetyScore >= 80 ? 'text-success' : stats.safetyScore >= 60 ? 'text-warning' : 'text-destructive')}>{stats.safetyScore}%</span>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <SafetyRow label="QR Health" description={`${stats.dynamicActive} dynamic QR codes currently active`} status={stats.dynamicActive > 0 || stats.totalCodes === 0 ? 'healthy' : 'warning'} />
              <SafetyRow label="Destination Health" description={stats.brokenLinks > 0 ? `${stats.brokenLinks} broken link needs attention` : 'No broken links detected'} status={stats.brokenLinks > 0 ? 'broken' : 'healthy'} />
              <SafetyRow label="Tracking Status" description={stats.withUtm > 0 ? `${stats.withUtm} QR destinations include UTM tracking` : 'Add UTMs to improve campaign reporting'} status={stats.withUtm > 0 || stats.totalCodes === 0 ? 'healthy' : 'warning'} />
              <SafetyRow label="Static Lock Safety" description={`${stats.staticLocked} QR codes are static locked and still scan`} status="healthy" />
              <SafetyRow label="Analytics Status" description="Dynamic scans continue to be tracked for active QR codes" status="healthy" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle>Recent Scans</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/analytics">View all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {recentQrs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Recent scan activity will appear here.</p>
              ) : recentQrs.map((qr) => (
                <div key={qr._id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary"><Smartphone className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{getQrTitle(qr)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(qr.stats?.last_scanned_at)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle>{user?.subscription?.plan ? `${user.subscription.plan} Plan` : 'Plan Usage'}</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/billing">Manage</Link></Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dynamic QR Codes</span>
                  <span className="font-medium">{activeQrCount}/{dynamicLimit}</span>
                </div>
                <Progress value={planUsage} />
              </div>
              <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                Static locked QR codes still scan to the last saved link, but editing and analytics are paused.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
