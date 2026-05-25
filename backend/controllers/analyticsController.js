import { Scan } from "../models/Scan.js";
import { QRCode } from "../models/QRCode.js";
import { DailyScanStats } from "../models/DailyScanStats.js";

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

            // Merge Location Maps
            if (stat.locations) {
                for (const [locKey, count] of stat.locations.entries()) {
                    locationCounts[locKey] = (locationCounts[locKey] || 0) + count;
                }
            } else if (stat.cities) {
                // Fallback for old data
                for (const [city, count] of stat.cities.entries()) {
                    const fallbackKey = `${city}::Unknown::Unknown::Unknown`;
                    locationCounts[fallbackKey] = (locationCounts[fallbackKey] || 0) + count;
                }
            }
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

        const topLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([locKey, count]) => {
                const parts = locKey.split('::');
                return {
                    city: parts[0] !== 'Unknown' ? parts[0] : null,
                    region: parts[1] !== 'Unknown' ? parts[1] : null,
                    countryCode: parts[2] !== 'Unknown' ? parts[2] : null,
                    countryname: parts[3] !== 'Unknown' ? parts[3] : null,
                    count,
                    coordinates: null // Coordinates stripped per user instructions
                };
            });

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
            .select('metadata.title short_id qr_type target_url stats isActive createdAt qrImageUrl');
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
            // Merge Location Maps
            if (stat.locations) {
                for (const [locKey, count] of stat.locations.entries()) {
                    locationCounts[locKey] = (locationCounts[locKey] || 0) + count;
                }
            } else if (stat.cities) {
                // Fallback for old data
                for (const [city, count] of stat.cities.entries()) {
                    const fallbackKey = `${city}::Unknown::Unknown::Unknown`;
                    locationCounts[fallbackKey] = (locationCounts[fallbackKey] || 0) + count;
                }
            }
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

        const topLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([locKey, count]) => {
                const parts = locKey.split('::');
                return {
                    city: parts[0] !== 'Unknown' ? parts[0] : null,
                    region: parts[1] !== 'Unknown' ? parts[1] : null,
                    countryCode: parts[2] !== 'Unknown' ? parts[2] : null,
                    countryname: parts[3] !== 'Unknown' ? parts[3] : null,
                    count
                };
            });

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

        const stats = await DailyScanStats.find({ qr_id: qr._id }).select('cities');
        
        const cityCounts = {};
        stats.forEach(stat => {
            if (stat.cities) {
                for (const [city, count] of stat.cities.entries()) {
                    cityCounts[city] = (cityCounts[city] || 0) + count;
                }
            }
        });

        const locations = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([city, count]) => ({
                city,
                region: '',
                countryCode: '',
                count,
                coordinates: null
            }));

        res.json({ locations });
    } catch (error) {
        console.error("Top Cities Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

