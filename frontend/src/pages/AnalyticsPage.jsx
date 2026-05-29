"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  Filter,
  Download,
  Bot,
  ChevronDown,
  BarChart3,
  QrCode
} from "lucide-react"
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Badge } from "@/components/UI/badge"
import { Progress } from "@/components/UI/progress"
import { cn } from "@/lib/utils"
import axiosInstance from "../api/axios"

function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num || 0)
}

// Inline Table Components mapped exactly to Shadcn
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
))
TableCell.displayName = "TableCell"

// KPI Card Component
function KPICard({ title, value, change, changeLabel, icon: Icon }) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {change !== undefined && change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
          {change === 0 && (
            <span className="text-xs text-muted-foreground font-medium">Flat</span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {changeLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Scans Over Time Chart
function ScansOverTimeChart({ data, days, onDaysChange }) {
  const chartData = data?.map(item => ({
    date: new Date(item.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
    scans: item.scans,
  })) || []

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Scans Over Time</CardTitle>
            <CardDescription>Last {days} days of scan activity</CardDescription>
          </div>
          <select 
            value={days} 
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                stroke="#64748b"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                stroke="#64748b"
              />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#fillScans)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Device Breakdown Chart
function DeviceBreakdownChart({ data, totalScans }) {
  const deviceIcons = { mobile: Smartphone, desktop: Monitor, tablet: Tablet }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Device Breakdown</CardTitle>
        <CardDescription>How users scan your QR codes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.length > 0 ? data.map((item) => {
            const Icon = deviceIcons[item.name.toLowerCase()] || Smartphone
            const percentage = Math.round((item.value / (totalScans || 1)) * 100)
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="mt-1 h-1.5" />
                </div>
              </div>
            )
          }) : <p className="text-sm text-muted-foreground">No device data available.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// Browser Breakdown Chart
function BrowserBreakdownChart({ data, totalScans }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Browser Breakdown</CardTitle>
        <CardDescription>Browsers used to scan QR codes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.length > 0 ? data.slice(0, 5).map((item) => {
            const percentage = Math.round((item.value / (totalScans || 1)) * 100)
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="mt-1 h-1.5" />
                </div>
              </div>
            )
          }) : <p className="text-sm text-muted-foreground">No browser data available.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// Top Cities Table
function TopCitiesTable({ data, totalScans }) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Top Cities</CardTitle>
            <CardDescription>Where your QR codes are being scanned</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">City</TableHead>
              <TableHead className="text-right">Scans</TableHead>
              <TableHead className="text-right pr-6">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.length > 0 ? data.slice(0, 6).map((city, index) => {
              const cityName = city.city && city.city !== 'Unknown' ? city.city : city.region || 'Unknown';
              const regionText = city.region && city.region !== 'Unknown' && city.region !== cityName ? city.region : '';
              const countryText = city.countryCode && city.countryCode !== 'Unknown' ? city.countryCode : '';
              
              let subText = '';
              if (regionText && countryText) subText = `${regionText}, ${countryText}`;
              else if (regionText) subText = regionText;
              else if (countryText) subText = countryText;

              const percentage = Math.round((city.count / (totalScans || 1)) * 100)
              return (
                <TableRow key={index}>
                  <TableCell className="pl-6 py-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[150px] leading-tight">{cityName}</span>
                          {subText && <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{subText}</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(city.count)}
                  </TableCell>
                  <TableCell className="text-right pr-6 w-40">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={percentage} className="w-16 h-1.5" />
                      <span className="w-10 text-muted-foreground text-xs">{percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <p className="text-muted-foreground">No location data available.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Campaign Comparison Table
function CampaignComparisonTable({ qrs, onSelectQR }) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Campaign Comparison</CardTitle>
            <CardDescription>Performance by campaign</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Campaign</TableHead>
              <TableHead className="text-center">QR Type</TableHead>
              <TableHead className="text-right">Total Scans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <p className="text-muted-foreground">No campaigns found.</p>
                </TableCell>
              </TableRow>
            ) : (
              qrs?.map((qr) => (
                <TableRow key={qr._id} onClick={() => onSelectQR(qr._id)} className="cursor-pointer group hover:bg-muted/50">
                  <TableCell className="pl-6">
                    <Badge variant="outline" className="font-medium bg-background">
                      {qr.metadata?.title || 'Untitled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                     <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded uppercase">
                      {qr.qr_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium pr-6">
                    {formatNumber(qr.stats?.total_scans)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Bot Filtered Notice
function BotFilteredNotice({ count }) {
  if (!count) return null;
  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Bot Traffic Filtered</p>
          <p className="text-sm text-muted-foreground">
            {formatNumber(count)} bot scans were detected and excluded from analytics this period.
          </p>
        </div>
        <Badge variant="outline" className="bg-background">Auto-filtered</Badge>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [globalData, setGlobalData] = useState(null)
  const [drillData, setDrillData] = useState(null)
  const [selectedQrId, setSelectedQrId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)
  const [qrs, setQrs] = useState([])

  // Fetch Global Data
  useEffect(() => {
    if (selectedQrId) return;
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [dashRes, tableRes] = await Promise.all([
          axiosInstance.get(`/analytics/dashboard?days=${days}`),
          axiosInstance.get(`/analytics/table?limit=50&sort=-scans`)
        ]);
        setGlobalData(dashRes.data)
        setQrs(tableRes.data.qrs)
      } catch (err) {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [days, selectedQrId])

  // Fetch Drill Data
  useEffect(() => {
    if (!selectedQrId) { setDrillData(null); return; }
    const fetchDrill = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get(`/analytics/qrcodes/${selectedQrId}?days=${days}`)
        setDrillData(res.data)
      } catch (err) {
        setError('Failed to load QR analytics')
        setSelectedQrId(null)
      } finally {
        setLoading(false)
      }
    }
    fetchDrill()
  }, [selectedQrId, days])

  if (loading && !globalData && !drillData) {
    return <div className="flex justify-center items-center h-full min-h-[500px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  if (error && !globalData && !drillData) {
    return <div className="p-8"><div className="bg-destructive/10 text-destructive p-4 rounded-xl font-medium">{error}</div></div>
  }

  const isDrillDown = !!selectedQrId;
  const dataContext = isDrillDown ? drillData : globalData;
  if (!dataContext) return null;

  const { totals, scansOverTime, deviceStats, locations } = dataContext;

  const topCity = locations?.length > 0 ? {
    name: locations[0].city && locations[0].city !== 'Unknown' ? locations[0].city : locations[0].region || 'Unknown',
    share: Math.round((locations[0].count / (totals?.scans || 1)) * 100)
  } : { name: '--', share: 0 };

  const topDevice = deviceStats?.types?.length > 0 ? {
    name: deviceStats.types[0].name,
    share: Math.round((deviceStats.types[0].value / (totals?.scans || 1)) * 100)
  } : { name: '--', share: 0 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {isDrillDown && (
            <Button variant="outline" size="icon" onClick={() => setSelectedQrId(null)} className="h-9 w-9">
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isDrillDown ? drillData.qr?.metadata?.title || 'QR Analytics' : 'Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDrillDown ? 'Analytics for specific QR code.' : 'Track scan performance and understand your audience.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDrillDown && (
            <select 
              className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={(e) => {
                if (e.target.value !== 'all') setSelectedQrId(e.target.value);
              }}
              value="all"
            >
              <option value="all">All QR Codes</option>
              {qrs.map(qr => (
                <option key={qr._id} value={qr._id}>{qr.metadata?.title || 'Untitled'}</option>
              ))}
            </select>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Scans"
          value={formatNumber(totals?.scans)}
          change={totals?.scansDelta}
          changeLabel="vs. last period"
          icon={BarChart3}
        />
        <KPICard
          title="Unique Scanners"
          value={formatNumber(totals?.uniqueScanners)}
          change={totals?.uniqueDelta}
          changeLabel="vs. last period"
          icon={Users}
        />
        <KPICard
          title="Top City"
          value={topCity.name}
          changeLabel={`${topCity.share}% of scans`}
          icon={MapPin}
        />
        <KPICard
          title="Top Device"
          value={topDevice.name}
          changeLabel={`${topDevice.share}% of scans`}
          icon={Smartphone}
        />
      </div>

      {/* Bot Filtered Notice */}
      <BotFilteredNotice count={totals?.botFiltered} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ScansOverTimeChart data={scansOverTime} days={days} onDaysChange={setDays} />
        <DeviceBreakdownChart data={deviceStats?.types} totalScans={totals?.scans} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TopCitiesTable data={locations} totalScans={totals?.scans} />
        <BrowserBreakdownChart data={deviceStats?.browsers} totalScans={totals?.scans} />
      </div>

      {/* Campaign Comparison Table */}
      {!isDrillDown && <CampaignComparisonTable qrs={qrs} onSelectQR={setSelectedQrId} />}
    </div>
  )
}
