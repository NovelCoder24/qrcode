import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveQrCount } from '@/redux/authSlice';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Download,
  ExternalLink,
  Lock,
  MapPin,
  MessageSquare,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Scissors,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Utensils,
  XCircle,
} from 'lucide-react';
import api from '@/api/axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Progress } from '@/components/UI/progress';
import { Skeleton } from '@/components/UI/skeleton';
import { getVocabulary } from '@/config/vocabulary';

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

const UI_PLAN_LIMITS = {
  free:     { name: 'Free',     maxQrs: 1,   maxScans: 100,      maxSeats: 1 },
  local:    { name: 'Local',    maxQrs: 1,   maxScans: Infinity, maxSeats: 1 },
  starter:  { name: 'Starter',  maxQrs: 10,  maxScans: 25000,    maxSeats: 1 },
  growth:   { name: 'Growth',   maxQrs: 50,  maxScans: Infinity, maxSeats: 1 },
  pro:      { name: 'Pro',      maxQrs: 50,  maxScans: Infinity, maxSeats: 1 },
  business: { name: 'Business', maxQrs: 100, maxScans: Infinity, maxSeats: 5 },
};

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 xl:col-span-2 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const workspaceMode = user?.workspaceMode || 'storefront';
  const isStorefront = workspaceMode === 'storefront';
  const businessCategory = user?.businessCategory || 'salon';
  const isSalon = businessCategory === 'salon';
  const v = getVocabulary(businessCategory);

  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

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

  // Primary Rate Card / Menu QR
  const primaryQr = useMemo(() => {
    return qrCodes.find((qr) => qr.qr_type === 'MENU') || qrCodes[0] || null;
  }, [qrCodes]);

  const hasPrimaryQr = !!primaryQr;

  // Extract active catalog items directly from primary QR categories (Senior Product Rule #1)
  const activeLookbookItems = useMemo(() => {
    if (!primaryQr?.metadata?.categories || !Array.isArray(primaryQr.metadata.categories)) {
      return [];
    }
    const items = [];
    primaryQr.metadata.categories.forEach((cat) => {
      if (Array.isArray(cat?.items)) {
        cat.items.forEach((item) => {
          if (item?.name) {
            items.push({
              ...item,
              categoryName: cat.name || 'General',
            });
          }
        });
      }
    });
    return items;
  }, [primaryQr]);

  // Aggregate stats honestly without fake fallback numbers (Senior Product Rule #2)
  const stats = useMemo(() => {
    const totalCodes = qrCodes.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.stats?.total_scans || 0), 0);
    const dynamicActive = qrCodes.filter(
      (qr) => qr.isActive && qr.accessMode !== 'static_locked' && qr.accessMode !== 'disabled'
    ).length;
    const staticLocked = qrCodes.filter((qr) => qr.accessMode === 'static_locked').length;
    const brokenLinks = qrCodes.filter((qr) => qr.health_status === 'broken').length;

    // Real review booster telemetry (0 if not yet tracked)
    const googleReviewsCount = qrCodes.reduce(
      (sum, qr) => sum + (qr.stats?.google_review_clicks || qr.metadata?.google_review_clicks || 0),
      0
    );
    const whatsappShieldCount = qrCodes.reduce(
      (sum, qr) => sum + (qr.stats?.whatsapp_shield_clicks || qr.metadata?.whatsapp_shield_clicks || 0),
      0
    );

    return {
      totalCodes,
      totalScans,
      dynamicActive,
      staticLocked,
      brokenLinks,
      googleReviewsCount,
      whatsappShieldCount,
    };
  }, [qrCodes]);

  useEffect(() => {
    if (!loading && user?.activeQrCount !== stats.dynamicActive) {
      dispatch(setActiveQrCount(stats.dynamicActive));
    }
  }, [loading, stats.dynamicActive, user?.activeQrCount, dispatch]);

  // Subscription and Capacity Resolution
  const rawPlan = (user?.subscription?.plan || 'free').toLowerCase();
  const isTrial = user?.subscription?.status === 'trialing';
  const isExpired =
    user?.subscription?.status === 'expired' ||
    (isTrial && user?.subscription?.trialEndsAt && new Date(user.subscription.trialEndsAt) < new Date());

  const effectivePlan = isExpired ? 'free' : rawPlan;
  const planInfo = UI_PLAN_LIMITS[effectivePlan] || UI_PLAN_LIMITS.starter;

  const planName = isTrial && !isExpired ? `${planInfo.name} (Trial)` : `${planInfo.name} Plan`;

  const dynamicLimit =
    user?.subscription?.dynamicQrLimit && !isExpired && user.subscription.dynamicQrLimit >= planInfo.maxQrs
      ? user.subscription.dynamicQrLimit
      : planInfo.maxQrs;

  const activeQrCount = stats.dynamicActive;
  const planUsage =
    dynamicLimit > 0 && dynamicLimit !== Infinity
      ? Math.min(100, Math.round((activeQrCount / dynamicLimit) * 100))
      : 0;
  const isNearLimit = dynamicLimit !== Infinity && planUsage >= 80;

  // Front-Desk Setup Checklist calculation (Senior Product Rule #3)
  const checklistSteps = useMemo(() => {
    const hasRateCard = hasPrimaryQr;
    const hasGoogleReview = Boolean(primaryQr?.metadata?.googleReviewUrl?.trim());
    const hasWhatsAppPhone = Boolean(
      primaryQr?.metadata?.shieldPhone?.trim() ||
      primaryQr?.metadata?.whatsappNumber?.trim() ||
      user?.whatsappNumber?.trim()
    );
    const hasStandeeDownloaded = Boolean(primaryQr);

    return [
      {
        id: 'rate_card',
        label: `Create Your ${v.assetNameShort || 'Rate Card'}`,
        description: isSalon ? 'Hair, skin, styling and pricing catalog' : 'Food, beverages, and pricing menu',
        completed: hasRateCard,
        actionText: hasRateCard ? 'Edit' : 'Create Now',
        actionPath: hasRateCard ? `/create?edit=${primaryQr._id}&step=2` : '/create',
      },
      {
        id: 'google_review',
        label: 'Connect Google Review Link',
        description: 'Auto-copies 5★ AI drafts for Google Maps',
        completed: hasGoogleReview,
        actionText: hasGoogleReview ? 'Edit Link' : 'Add Link',
        actionPath: hasRateCard ? `/create?edit=${primaryQr._id}&step=2` : '/create',
      },
      {
        id: 'whatsapp_shield',
        label: 'Connect Owner WhatsApp Number',
        description: 'Shields 1–3★ complaints privately on-site',
        completed: hasWhatsAppPhone,
        actionText: hasWhatsAppPhone ? 'Update' : 'Add Number',
        actionPath: hasRateCard ? `/create?edit=${primaryQr._id}&step=2` : '/account',
      },
      {
        id: 'standee_canvas',
        label: 'Download 4x6 Acrylic Standee Canvas',
        description: 'Printable countertop canvas with camera scan framing',
        completed: hasStandeeDownloaded,
        actionText: hasRateCard ? 'Download' : 'Setup First',
        actionPath: hasRateCard ? `/qrcodes/${primaryQr._id}` : '/create',
      },
    ];
  }, [hasPrimaryQr, primaryQr, user?.whatsappNumber, v.assetNameShort, isSalon]);

  const completedStepsCount = checklistSteps.filter((s) => s.completed).length;
  const checklistPercent = Math.round((completedStepsCount / checklistSteps.length) * 100);

  // Smart Action Bar Handlers (Senior Product Rule #4)
  const handleCopyShareLink = () => {
    if (!primaryQr) return;
    const baseUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_BASE_URL ||
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';
    const targetUrl = `${baseUrl}/r/${primaryQr.short_id || primaryQr._id}`;
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2200);
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(targetUrl).catch(() => {});
      }
    } catch {
      // Fallback
    }
  };

  const handleTestReviewFunnel = () => {
    if (!primaryQr) return;
    window.open(`/menu/${primaryQr.short_id || primaryQr._id}`, '_blank');
  };

  if (loading) return <LoadingDashboard />;

  return (
    <div className="space-y-6">
      {/* Top Header & Countertop Essentials Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {isStorefront ? (isSalon ? 'Salon Front-Desk Pulse' : 'Cafe Front-Desk Pulse') : 'Dashboard Overview'}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'font-extrabold text-[11px] py-0.5 px-2.5 rounded-full border',
                isSalon
                  ? 'border-pink-200 bg-pink-50 text-pink-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              )}
            >
              {isSalon ? (
                <span className="flex items-center gap-1.5">
                  <Scissors className="h-3 w-3 text-pink-600" /> Salon & Spa
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Coffee className="h-3 w-3 text-amber-600" /> Cafe & Dining
                </span>
              )}
            </Badge>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Print-Safe Guarantee: Active</span>
            </div>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {isStorefront
              ? `Real-time in-store scans, Google review booster, and ${v.itemsName.toLowerCase()} health.`
              : 'Monitor your dynamic QR codes and keep them safe for printing.'}
          </p>
        </div>

        {/* Countertop Essentials Bar (Senior Product Rule #4) */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasPrimaryQr ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="font-bold border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Copy live link to clipboard"
              >
                {copiedShareLink ? <Check className="h-4 w-4 mr-1 text-emerald-600" /> : <Share2 className="h-4 w-4 mr-1 text-slate-500" />}
                {copiedShareLink ? 'Copied Link!' : 'Share Link'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestReviewFunnel}
                className="font-bold border-amber-300 bg-amber-50/70 text-amber-950 hover:bg-amber-100/80 transition-colors"
                title="Preview in-menu rating modal & AI Google review drafts"
              >
                <Star className="h-4 w-4 mr-1.5 fill-amber-400 text-amber-500" />
                Test Review Funnel
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="font-bold border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Link to={`/qrcodes/${primaryQr._id}`}>
                  <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                  Standee Canvas (4x6)
                </Link>
              </Button>

              <Button size="sm" asChild className="font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm">
                <Link to="/create">
                  <Plus className="h-4 w-4 mr-1 text-white" />
                  New Standee
                </Link>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              asChild
              className="font-bold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 shadow-sm transition-colors"
            >
              <Link to="/create">
                <Plus className="h-4 w-4 mr-1.5 text-white" />
                Create Your First {v.assetNameShort || 'Rate Card'}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {checkFeedback && (
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 p-3.5 text-xs font-semibold text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{checkFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckFeedback(null)}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Global Limit Alert */}
      {stats.staticLocked > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 sm:px-5 sm:py-4 shadow-sm text-amber-950">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800">
              <Lock className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>You have {stats.staticLocked} Static Locked QR code{stats.staticLocked > 1 ? 's' : ''}.</span>
              </p>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed font-normal">
                They are scanning successfully, but editing and live telemetry are paused because you reached your plan limit.
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm shrink-0">
            <Link to="/billing">Upgrade to Unlock</Link>
          </Button>
        </div>
      )}

      {/* Executive Storefront Pulse: 4 Clean KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: In-Store Scans */}
        <Card className="relative overflow-hidden border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[155px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Smartphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In-Store Scans</span>
                  <p className="text-[10px] text-slate-400">Total customer visits</p>
                </div>
              </div>
            </div>

            <div className="my-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 tabular-nums">
                {formatNumber(stats.totalScans)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Sub-50ms edge redirect</span>
              <Link to="/qrcodes" className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5">
                <span>View Standees</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: 5-Star Google Reviews (Senior Product Rule #2) */}
        <Card className="relative overflow-hidden border-amber-200/80 bg-white shadow-2xs hover:shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[155px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600">
                  <Star className="h-4.5 w-4.5 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Google Reviews</span>
                  <p className="text-[10px] text-amber-700/80">AI 5★ Draft Launcher</p>
                </div>
              </div>
              <Badge variant="outline" className="border-amber-200 bg-amber-100/60 text-amber-900 text-[10px] font-bold px-2 py-0.2 rounded-full">
                Booster
              </Badge>
            </div>

            <div className="my-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-amber-950 tabular-nums">
                {formatNumber(stats.googleReviewsCount)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-100/80 text-xs">
              <span className="text-[11px] text-slate-500 truncate max-w-[170px]" title={primaryQr?.metadata?.googleReviewUrl ? 'Google Review link active' : 'Connect link to activate'}>
                {primaryQr?.metadata?.googleReviewUrl ? 'Connected & ready' : 'Add Google link'}
              </span>
              <button
                type="button"
                onClick={handleTestReviewFunnel}
                disabled={!hasPrimaryQr}
                className="font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-0.5 cursor-pointer disabled:opacity-40"
              >
                <span>Test</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Private WhatsApp Shield (Senior Product Rule #2) */}
        <Card className="relative overflow-hidden border-emerald-200/80 bg-white shadow-2xs hover:shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[155px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">WhatsApp Shield</span>
                  <p className="text-[10px] text-emerald-700/80">Private 1–3★ Defusal</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-100/60 text-emerald-900 text-[10px] font-bold px-2 py-0.2 rounded-full">
                Shielded
              </Badge>
            </div>

            <div className="my-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-950 tabular-nums">
                {formatNumber(stats.whatsappShieldCount)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-100/80 text-xs">
              <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                {stats.whatsappShieldCount > 0 ? 'Complaints defused' : '0 bad public reviews'}
              </span>
              <span className="font-bold text-emerald-700 text-[11px]">Protected</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Standee Capacity */}
        <Card className="relative overflow-hidden border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[155px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {isSalon ? <Scissors className="h-4.5 w-4.5" /> : <Coffee className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {isStorefront ? (isSalon ? 'Mirror Standees' : 'Table Standees') : 'Active QRs'}
                  </span>
                  <p className="text-[10px] text-slate-400">{planName}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {dynamicLimit === Infinity ? 'Unlimited' : `${Math.max(0, dynamicLimit - activeQrCount)} left`}
              </span>
            </div>

            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {activeQrCount}
                <span className="text-lg font-semibold text-slate-400 ml-1">
                  / {dynamicLimit === Infinity ? '∞' : dynamicLimit}
                </span>
              </p>
              <div className="mt-2">
                <Progress
                  value={planUsage}
                  className={cn(
                    'h-1.5 bg-slate-100',
                    planUsage >= 100 ? '[&>div]:bg-red-500' : planUsage >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-indigo-600'
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                {planUsage >= 100 ? 'Limit reached' : `${planUsage}% utilized`}
              </span>
              <Link to="/billing" className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5">
                <span>{isNearLimit ? 'Upgrade' : 'Manage'}</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split Operational Grid: 2/3 (Left) + 1/3 (Right) */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left 2/3 Column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Active Lookbook & Rate Card Items (Senior Product Rule #1) */}
          <Card className="border-slate-200/90 shadow-2xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border',
                    isSalon ? 'bg-pink-50 border-pink-100 text-pink-700' : 'bg-amber-50 border-amber-100 text-amber-800'
                  )}
                >
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-extrabold text-slate-900">
                      {isSalon ? 'Active Lookbook & Rate Card Items' : 'Active Digital Menu Items'}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-slate-200 text-slate-700">
                      {activeLookbookItems.length} live
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    {hasPrimaryQr
                      ? `Browsed live by guests on your ${primaryQr?.metadata?.restaurantName || (isSalon ? 'Salon' : 'Cafe')} rate card.`
                      : 'Create your digital catalog to activate live browsing.'}
                  </p>
                </div>
              </div>

              {hasPrimaryQr && (
                <Button variant="outline" size="sm" asChild className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Link to={`/create?edit=${primaryQr._id}&step=2`}>
                    Edit {v.assetNameShort || 'Catalog'}
                  </Link>
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {activeLookbookItems.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    {isSalon ? <Scissors className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    No {v.itemsName.toLowerCase()} listed yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-normal leading-relaxed">
                    Upload a smartphone photo of your paper menu or rate card. AI reads categories and prices in 60s!
                  </p>
                  <Button size="sm" asChild className="bg-slate-900 text-white font-bold hover:bg-slate-800">
                    <Link to="/create">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Your First {v.itemName || 'Service'}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeLookbookItems.slice(0, 6).map((item, idx) => (
                    <div key={item.id || idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.img ? (
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            {isSalon ? <Scissors className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {item.categoryName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {item.duration && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.2 rounded-md">
                                <Clock className="h-3 w-3 text-slate-400" /> {item.duration}
                              </span>
                            )}
                            {item.brandUsed && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-pink-700 bg-pink-50 border border-pink-100 px-2 py-0.2 rounded-md">
                                🧴 {item.brandUsed}
                              </span>
                            )}
                            {item.targetGender && item.targetGender !== 'unisex' && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded-md">
                                {item.targetGender === 'for_her' ? 'For Her' : 'For Him'}
                              </span>
                            )}
                            {item.tags?.includes('veg') && (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                Pure Veg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {primaryQr?.metadata?.currency || '₹'}
                          {item.price || '0'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {activeLookbookItems.length > 6 && (
                    <div className="p-3 text-center bg-slate-50/70 border-t border-slate-100">
                      <Link
                        to={`/create?edit=${primaryQr._id}&step=2`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        + View all {activeLookbookItems.length} items in editor
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Countertop Physical Standee Status Card */}
          <Card className="border-slate-200/90 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Printer className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900">
                    {isSalon ? 'Mirror Standee Hardware' : 'Table Standee Hardware'}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    Countertop acrylic hardware specifications & print setup
                  </p>
                </div>
              </div>

              {hasPrimaryQr && (
                <Button variant="outline" size="sm" asChild className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                  <Link to={`/qrcodes/${primaryQr._id}`}>
                    <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Print Setup
                  </Link>
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Patron-Facing Countertop Standee
                  </span>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Framed with <strong>"Open Camera to Scan, Not GPay"</strong> and category center icon. Directs customers straight to your visual {v.assetNameShort.toLowerCase()} & Google review engine without payment confusion.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Venue Placement:{' '}
                    <strong>
                      {primaryQr?.placement?.city
                        ? `${primaryQr.placement.city}${primaryQr.placement.label ? ` (${primaryQr.placement.label})` : ''}`
                        : 'Fixed In-Store Counter'}
                    </strong>
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">4x6 inch Acrylic & 5cm Vinyl Sticker Compatible</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1/3 Column */}
        <div className="space-y-6">
          {/* Front-Desk Setup Checklist (Senior Product Rule #3) */}
          <Card className="border-slate-200/90 shadow-2xs overflow-hidden">
            <CardHeader className="p-5 pb-3 bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <CardTitle className="text-sm font-extrabold text-slate-900">
                  Front-Desk Setup Checklist
                </CardTitle>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">
                  {completedStepsCount}/{checklistSteps.length} Completed
                </span>
              </div>
              <Progress value={checklistPercent} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {checklistSteps.map((step) => (
                <div key={step.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className={cn('font-bold', step.completed ? 'text-slate-800' : 'text-slate-700')}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={step.actionPath}
                    className={cn(
                      'shrink-0 font-bold text-[11px] transition-colors',
                      step.completed ? 'text-slate-400 hover:text-slate-700' : 'text-indigo-600 hover:text-indigo-800 underline'
                    )}
                  >
                    {step.actionText}
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly Monday Morning Push Digest */}
          <Card className="border-slate-200/90 shadow-2xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-900">
                      Weekly WhatsApp Digest
                    </CardTitle>
                    <p className="text-[11px] text-slate-400 font-normal">Automated owner push report</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  Scheduled
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-1 space-y-3.5 text-xs text-slate-600">
              <p className="text-slate-500 font-normal leading-relaxed text-[11px]">
                Every Monday at 9:00 AM, QRVibe sends your total scan counts, review clicks, and top-viewed items directly to your WhatsApp.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Recipient Phone:</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {user?.whatsappNumber || primaryQr?.metadata?.shieldPhone || primaryQr?.metadata?.whatsappNumber || 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Frequency:</span>
                  <span className="font-semibold text-slate-700">Mondays @ 9:00 AM</span>
                </div>
              </div>

              {!(user?.whatsappNumber || primaryQr?.metadata?.shieldPhone) && (
                <Link to="/account" className="block text-center font-bold text-xs text-indigo-600 hover:underline">
                  + Add WhatsApp number in Settings
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Plan Quota Card */}
          <Card className="border-slate-200/90 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
              <CardTitle className="text-sm font-extrabold text-slate-900">
                {planInfo.name} Tier
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-slate-500 hover:text-slate-800">
                <Link to="/billing">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{isStorefront ? (v.quotaUnit || 'Mirror Standees') : 'Dynamic QRs'}</span>
                  <span className="text-slate-800 tabular-nums">{activeQrCount} / {dynamicLimit === Infinity ? '∞' : dynamicLimit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, planUsage))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Monthly Scans</span>
                  <span className="text-slate-800 tabular-nums">
                    {formatNumber(stats.totalScans)} / {formatNumber(planInfo.maxScans)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          planInfo.maxScans > 0 && planInfo.maxScans !== Infinity
                            ? (stats.totalScans / planInfo.maxScans) * 100
                            : 0
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
