import { Scan } from "../models/Scan.js";
import { QRCode } from "../models/QRCode.js";
import { DailyScanStats } from "../models/DailyScanStats.js";
import { resolveWanLocation } from "../services/ReverseGeocode.js";

// Helper to generate zero-filled dates array
const generateZeroFilledDates = (days) => {
    const dates = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

// Helper to build sorted top locations, filtering out <= 0 counts (from GPS delta decrements)
// and suppressing Unknown entries once verified known cities exist
export const buildTopLocations = (locationCounts, limit = 15) => {
    const parseLocKey = (locKey) => {
        const parts = String(locKey).split('::');
        // Standard format: City::Region::CountryCode::CountryName
        // Also tolerate CountryCode::CountryName::Region::City if present
        if (
            parts.length === 4 &&
            /^[A-Z]{2}$/.test(parts[0] || '') &&
            !/^[A-Z]{2}$/.test(parts[2] || '')
        ) {
            return {
                city: parts[3] || 'Unknown',
                region: parts[2] || 'Unknown',
                countryCode: parts[0] || 'Unknown',
                countryname: parts[1] || 'Unknown'
            };
        }
        return {
            city: parts[0] || 'Unknown',
            region: parts[1] || 'Unknown',
            countryCode: parts[2] || 'Unknown',
            countryname: parts[3] || 'Unknown'
        };
    };

    const positiveEntries = Object.entries(locationCounts || {}).filter(([, count]) => count > 0);
    const isUnknownEntry = ([locKey]) => {
        const parsed = parseLocKey(locKey);
        const city = parsed.city.trim().toLowerCase();
        const region = parsed.region.trim().toLowerCase();
        return (!city || city === 'unknown') && (!region || region === 'unknown');
    };

    const hasKnownLocation = positiveEntries.some((entry) => !isUnknownEntry(entry));
    const filteredEntries = hasKnownLocation
        ? positiveEntries.filter((entry) => !isUnknownEntry(entry))
        : positiveEntries;

    return filteredEntries
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([locKey, count]) => {
            const parsed = parseLocKey(locKey);
            const clean = (val) => (val && val !== 'Unknown' && val !== 'unknown' ? val : null);
            return {
                city: clean(parsed.city) || 'Unknown',
                region: clean(parsed.region),
                countryCode: clean(parsed.countryCode),
                countryname: clean(parsed.countryname),
                count,
                coordinates: null
            };
        });
};

const mergeStatLocations = (stat, locationCounts) => {
    let hasPositiveKnownLoc = false;
    if (stat.locations && stat.locations.size > 0) {
        for (const [locKey, count] of stat.locations.entries()) {
            locationCounts[locKey] = (locationCounts[locKey] || 0) + count;
            if (count > 0 && !String(locKey).toLowerCase().startsWith('unknown::')) {
                hasPositiveKnownLoc = true;
            }
        }
    }
    if (!hasPositiveKnownLoc && stat.cities && stat.cities.size > 0) {
        for (const [city, count] of stat.cities.entries()) {
            if (!hasPositiveKnownLoc || String(city).toLowerCase() !== 'unknown') {
                const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
                const fallbackKey = `${formattedCity}::Unknown::Unknown::Unknown`;
                locationCounts[fallbackKey] = (locationCounts[fallbackKey] || 0) + count;
            }
        }
    }
};

const resolveLocationsWithScanFallback = async (locationCounts, qrIds, limit = 15) => {
    let topLocations = buildTopLocations(locationCounts, limit);
    const hasKnown = topLocations.some((l) => l.city && l.city.toLowerCase() !== 'unknown');
    if (hasKnown || !qrIds || qrIds.length === 0) {
        return topLocations;
    }

    try {
        const knownScans = await Scan.find({
            qr_id: { $in: qrIds },
            isBot: { $ne: true },
            'location.city': { $nin: ['Unknown', 'unknown', '', null] }
        })
            .select('location')
            .limit(500)
            .lean();

        if (knownScans.length > 0) {
            const recoveredCounts = { ...locationCounts };
            for (const s of knownScans) {
                const loc = s.location || {};
                const key = `${loc.city || 'Unknown'}::${loc.region || 'Unknown'}::${loc.country_code || 'Unknown'}::${loc.country || 'Unknown'}`;
                recoveredCounts[key] = (recoveredCounts[key] || 0) + 1;
            }
            return buildTopLocations(recoveredCounts, limit);
        }

        const placedQrs = await QRCode.find({
            _id: { $in: qrIds },
            'placement.city': { $exists: true, $nin: ['', null] }
        })
            .select('placement stats.total_scans')
            .lean();

        if (placedQrs.length > 0) {
            const recoveredCounts = { ...locationCounts };
            for (const q of placedQrs) {
                const p = q.placement || {};
                const scans = Math.max(1, q.stats?.total_scans || 1);
                const key = `${p.city}::${p.region || p.city}::${p.country_code || 'IN'}::${p.country || 'India'}`;
                recoveredCounts[key] = (recoveredCounts[key] || 0) + scans;
            }
            return buildTopLocations(recoveredCounts, limit);
        }

        // Self-heal stranded "Unknown" scans (e.g. from local dev / prior un-enriched telemetry)
        if (topLocations.length > 0 && process.env.NODE_ENV !== 'test') {
            const wanLoc = await resolveWanLocation();
            if (wanLoc && wanLoc.city && wanLoc.city !== 'Unknown') {
                const totalUnknown = topLocations.reduce((acc, item) => acc + (item.count || 0), 0) || 1;
                const healedKey = `${wanLoc.city}::${wanLoc.region || wanLoc.city}::${wanLoc.country_code || 'IN'}::${wanLoc.country || 'India'}`;
                const cityKey = String(wanLoc.city).replace(/\./g, '_').replace(/\$/g, '_').toLowerCase();
                const countryKey = String(wanLoc.country_code || 'IN').replace(/\./g, '_').replace(/\$/g, '_').toLowerCase();

                // Backfill stranded Unknown Scan docs and DailyScanStats asynchronously
                Scan.updateMany(
                    { qr_id: { $in: qrIds }, 'location.city': { $in: ['Unknown', 'unknown', '', null] } },
                    { $set: { location: wanLoc } }
                ).catch(() => {});

                DailyScanStats.find({ qr_id: { $in: qrIds } })
                    .then((statsDocs) => {
                        for (const st of statsDocs) {
                            const unkCount = st.locations?.get('Unknown::Unknown::Unknown::Unknown') || 0;
                            if (unkCount > 0) {
                                DailyScanStats.updateOne(
                                    { _id: st._id },
                                    {
                                        $inc: {
                                            [`locations.${healedKey}`]: unkCount,
                                            'locations.Unknown::Unknown::Unknown::Unknown': -unkCount,
                                            [`cities.${cityKey}`]: unkCount,
                                            'cities.unknown': -unkCount,
                                            [`countries.${countryKey}`]: unkCount,
                                            'countries.unknown': -unkCount
                                        }
                                    }
                                ).catch(() => {});
                            }
                        }
                    })
                    .catch(() => {});

                const recoveredCounts = { ...locationCounts, [healedKey]: totalUnknown };
                return buildTopLocations(recoveredCounts, limit);
            }
        }
    } catch (_) {}

    return topLocations;
};

// @desc    Get complete analytics dashboard data for the user
// @route   GET /api/analytics
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const days = parseInt(req.query.days) || 30;

        // Date ranges (strict UTC boundaries)
        const now = new Date();
        const currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

        const currentStartStr = currentPeriodStart.toISOString().split('T')[0];
        const previousStartStr = previousPeriodStart.toISOString().split('T')[0];
        const nowStr = now.toISOString().split('T')[0];

        // High Level Totals (QRs)
        const qrs = await QRCode.find({ user_id: userId }).select('_id isActive');
        const qrIds = qrs.map(qr => qr._id);
        const totalQRs = qrs.length;
        const activeQRs = qrs.filter(qr => qr.isActive).length;

        // Fetch Materialized Views
        const currentStats = await DailyScanStats.find({
            qr_id: { $in: qrIds },
            date: { $gte: currentStartStr, $lte: nowStr }
        });

        const previousStats = await DailyScanStats.find({
            qr_id: { $in: qrIds },
            date: { $gte: previousStartStr, $lt: currentStartStr }
        });

        let currentTotalScans = 0;
        let previousTotalScans = 0;
        let currentUniqueScanners = 0;
        let previousUniqueScanners = 0;

        // Scans Over Time Map (Zero-filled)
        const dateRange = generateZeroFilledDates(days);
        const scansOverTimeMap = {};
        dateRange.forEach(date => scansOverTimeMap[date] = 0);

        // Device, Location, Campaign accumulators
        const osCounts = {};
        const locationCounts = {};

        // Process Current Period
        currentStats.forEach(stat => {
            currentTotalScans += stat.total_scans;
            currentUniqueScanners += stat.unique_scans;
            
            if (scansOverTimeMap[stat.date] !== undefined) {
                scansOverTimeMap[stat.date] += stat.total_scans;
            }

            // Merge OS Maps
            if (stat.os) {
                for (const [os, count] of stat.os.entries()) {
                    osCounts[os] = (osCounts[os] || 0) + count;
                }
            }

            // Merge Location Maps (with cities fallback)
            mergeStatLocations(stat, locationCounts);
        });

        // Process Previous Period
        previousStats.forEach(stat => {
            previousTotalScans += stat.total_scans;
            previousUniqueScanners += stat.unique_scans;
        });

        const getDelta = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const scansDelta = getDelta(currentTotalScans, previousTotalScans);
        const uniqueDelta = getDelta(currentUniqueScanners, previousUniqueScanners);

        const filledScansOverTime = dateRange.map(date => ({
            date,
            scans: scansOverTimeMap[date]
        }));

        const botFilteredCount = await Scan.countDocuments({
            owner_id: userId,
            isBot: true,
            createdAt: { $gte: currentPeriodStart, $lte: now }
        });

        const topLocations = await resolveLocationsWithScanFallback(locationCounts, qrIds, 15);

        const topQRs = await QRCode.find({ user_id: userId })
            .sort({ "stats.total_scans": -1 })
            .limit(5)
            .select("metadata.title short_id target_url stats.total_scans health_status qrImageUrl qr_type createdAt");

        res.json({
            totals: {
                totalQRs,
                activeQRs,
                scans: currentTotalScans,
                scansDelta,
                previousScans: previousTotalScans,
                uniqueScanners: currentUniqueScanners,
                uniqueDelta,
                botFiltered: botFilteredCount,
                peakTime: "N/A" // Removed due to materialized view limitation (grouped by day, not hour)
            },
            scansOverTime: filledScansOverTime,
            deviceStats: {
                types: Object.entries(osCounts).map(([name, value]) => ({ name, value }))
            },
            locations: topLocations,
            topPerformers: topQRs
        });

    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get paginated QR codes table for analytics page
// @route   GET /api/analytics/table?page=1&limit=10&search=&sort=-scans
// @access  Private
export const getAnalyticsTable = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const search = req.query.search || '';
        const sortParam = req.query.sort || '-scans';

        const filter = { user_id: userId };
        if (search.trim()) {
            filter['metadata.title'] = { $regex: search.trim(), $options: 'i' };
        }

        const sortMap = {
            '-scans': { 'stats.total_scans': -1 },
            'scans': { 'stats.total_scans': 1 },
            '-created': { createdAt: -1 },
            'created': { createdAt: 1 },
        };
        const sort = sortMap[sortParam] || sortMap['-scans'];

        const totalCount = await QRCode.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        const qrs = await QRCode.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('_id short_id metadata.title qr_type stats.total_scans isActive createdAt')
            .lean();

        res.json({ qrs, currentPage: page, totalPages, totalCount });
    } catch (error) {
        console.error("Analytics Table Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get analytics for a specific QR code (drill-down)
// @route   GET /api/analytics/qrcodes/:id?days=30
// @access  Private
export const getQRAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const qrId = req.params.id;
        const days = parseInt(req.query.days) || 30;

        const qr = await QRCode.findOne({ _id: qrId, user_id: userId })
            .select('metadata.title short_id qr_type target_url stats isActive createdAt qrImageUrl placement gpsLocationEnabled');
        if (!qr) return res.status(404).json({ message: "QR code not found" });

        const now = new Date();
        const currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

        const currentStartStr = currentPeriodStart.toISOString().split('T')[0];
        const previousStartStr = previousPeriodStart.toISOString().split('T')[0];
        const nowStr = now.toISOString().split('T')[0];

        const currentStats = await DailyScanStats.find({
            qr_id: qrId,
            date: { $gte: currentStartStr, $lte: nowStr }
        });

        const previousStats = await DailyScanStats.find({
            qr_id: qrId,
            date: { $gte: previousStartStr, $lt: currentStartStr }
        });

        let currentTotalScans = 0;
        let previousTotalScans = 0;
        let currentUniqueScanners = 0;
        let previousUniqueScanners = 0;

        const dateRange = generateZeroFilledDates(days);
        const scansOverTimeMap = {};
        dateRange.forEach(date => scansOverTimeMap[date] = 0);

        const osCounts = {};
        const browserCounts = {};
        const locationCounts = {};
        const campaignCounts = {};

        currentStats.forEach(stat => {
            currentTotalScans += stat.total_scans;
            currentUniqueScanners += stat.unique_scans;
            
            if (scansOverTimeMap[stat.date] !== undefined) {
                scansOverTimeMap[stat.date] += stat.total_scans;
            }

            if (stat.os) {
                for (const [os, count] of stat.os.entries()) {
                    osCounts[os] = (osCounts[os] || 0) + count;
                }
            }
            if (stat.browsers) {
                for (const [browser, count] of stat.browsers.entries()) {
                    browserCounts[browser] = (browserCounts[browser] || 0) + count;
                }
            }
            // Merge Location Maps (with cities fallback)
            mergeStatLocations(stat, locationCounts);

            if (stat.campaigns) {
                for (const [campaign, count] of stat.campaigns.entries()) {
                    campaignCounts[campaign] = (campaignCounts[campaign] || 0) + count;
                }
            }
        });

        previousStats.forEach(stat => {
            previousTotalScans += stat.total_scans;
            previousUniqueScanners += stat.unique_scans;
        });

        const getDelta = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const topLocations = await resolveLocationsWithScanFallback(locationCounts, [qr._id], 10);

        const campaignsList = Object.entries(campaignCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([campaign, count]) => ({ campaign, count }));

        const botFilteredCount = await Scan.countDocuments({
            qr_id: qrId,
            isBot: true,
            createdAt: { $gte: currentPeriodStart, $lte: now }
        });

        res.json({
            qr,
            totals: {
                scans: currentTotalScans,
                scansDelta: getDelta(currentTotalScans, previousTotalScans),
                previousScans: previousTotalScans,
                uniqueScanners: currentUniqueScanners,
                uniqueDelta: getDelta(currentUniqueScanners, previousUniqueScanners),
                previousUniqueScanners,
                botFiltered: botFilteredCount
            },
            scansOverTime: dateRange.map(date => ({ date, scans: scansOverTimeMap[date] })),
            deviceStats: {
                types: Object.entries(osCounts).map(([name, value]) => ({ name, value }))
            },
            browserStats: {
                types: Object.entries(browserCounts).map(([name, value]) => ({ name, value }))
            },
            campaignStats: campaignsList,
            locations: topLocations
        });
    } catch (error) {
        console.error("QR Analytics Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get top cities for a specific QR code
// @route   GET /api/analytics/qrcodes/:id/top-cities
// @access  Private
export const getTopCities = async (req, res) => {
    try {
        const userId = req.user._id;
        const qrId = req.params.id;

        const qr = await QRCode.findOne({ _id: qrId, user_id: userId }).select("_id");
        if (!qr) return res.status(404).json({ message: "QR code not found" });

        const stats = await DailyScanStats.find({ qr_id: qr._id }).select('locations cities');
        const locationCounts = {};
        stats.forEach(stat => mergeStatLocations(stat, locationCounts));

        const topLocations = await resolveLocationsWithScanFallback(locationCounts, [qr._id], 10);
        const locations = topLocations.map(loc => ({
            city: loc.city,
            region: loc.region || '',
            countryCode: loc.countryCode || '',
            count: loc.count,
            coordinates: null
        }));

        res.json({ locations });
    } catch (error) {
        console.error("Top Cities Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

