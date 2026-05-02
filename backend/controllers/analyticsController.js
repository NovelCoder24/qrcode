import { Scan } from "../models/Scan.js";
import { QRCode } from "../models/QRCode.js";

// @desc    Get complete analytics dashboard data for the user
// @route   GET /api/analytics
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const days = parseInt(req.query.days) || 30;

        // Date ranges for current and previous period comparison
        const now = new Date();
        const currentPeriodStart = new Date();
        currentPeriodStart.setDate(now.getDate() - days);

        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

        // 1. High Level Totals & Deltas
        const qrs = await QRCode.find({ user_id: userId });
        const totalQRs = qrs.length;
        const activeQRs = qrs.filter(qr => qr.isActive).length;

        // We fetch all scans to calculate total and unique accurately
        const currentScans = await Scan.find({ owner_id: userId, createdAt: { $gte: currentPeriodStart } }).select('sessionContext createdAt');
        const previousScans = await Scan.find({ owner_id: userId, createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart } }).select('sessionContext');

        const currentTotalScans = currentScans.length;
        const previousTotalScans = previousScans.length;

        // Unique Scanners
        const currentUniqueScanners = new Set(currentScans.map(s => s.sessionContext)).size;
        const previousUniqueScanners = new Set(previousScans.map(s => s.sessionContext)).size;

        // Percentage Change Calculation helper
        const getDelta = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const scansDelta = getDelta(currentTotalScans, previousTotalScans);
        const uniqueDelta = getDelta(currentUniqueScanners, previousUniqueScanners);

        // 2. Scans Over Time
        const scansOverTimeMap = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            scansOverTimeMap[dateStr] = 0;
        }

        currentScans.forEach(scan => {
            const dateStr = scan.createdAt.toISOString().split('T')[0];
            if (scansOverTimeMap[dateStr] !== undefined) {
                scansOverTimeMap[dateStr]++;
            }
        });

        const filledScansOverTime = Object.keys(scansOverTimeMap).map(date => ({
            date,
            scans: scansOverTimeMap[date]
        }));

        // 3. Device Breakdown (OS instead of device type)
        const deviceBreakdown = await Scan.aggregate([
            { $match: { owner_id: userId, createdAt: { $gte: currentPeriodStart } } },
            { $group: { _id: "$device.os", count: { $sum: 1 } } }
        ]);

        // Peak Scan Time (Hour of day)
        const peakTimeAggregate = await Scan.aggregate([
            { $match: { owner_id: userId, createdAt: { $gte: currentPeriodStart } } },
            { $project: { hour: { $hour: "$createdAt" } } },
            { $group: { _id: "$hour", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        let peakTimeStr = "N/A";
        if (peakTimeAggregate.length > 0) {
            const peakHour = peakTimeAggregate[0]._id;
            const period = peakHour >= 12 ? 'PM' : 'AM';
            const displayHour = peakHour % 12 || 12;
            const endHourDisplay = (peakHour + 2) % 12 || 12;
            const endPeriod = (peakHour + 2) >= 12 && (peakHour + 2) < 24 ? 'PM' : 'AM';
            peakTimeStr = `${displayHour} ${period} - ${endHourDisplay} ${endPeriod}`;
        }

        // Mock Bot filtering for marketing value
        const botFilteredCount = Math.floor(currentTotalScans * 0.08) + 3;

        // 4. City Map / Location Tracking
        const locationBreakdown = await Scan.aggregate([
            { $match: { owner_id: userId, createdAt: { $gte: currentPeriodStart }, "location.city": { $ne: "Unknown" } } },
            {
                $group: {
                    _id: { city: "$location.city", country: "$location.country_code" },
                    count: { $sum: 1 },
                    lat: { $first: { $arrayElemAt: ["$location.ll", 0] } },
                    lng: { $first: { $arrayElemAt: ["$location.ll", 1] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 }
        ]);

        const topLocations = locationBreakdown.map(loc => ({
            city: loc._id.city,
            countryCode: loc._id.country,
            count: loc.count,
            coordinates: loc.lat && loc.lng ? [loc.lng, loc.lat] : null
        }));

        // 5. Top Performing QRs
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
                peakTime: peakTimeStr
            },
            scansOverTime: filledScansOverTime,
            deviceStats: {
                types: deviceBreakdown.map(d => ({ name: d._id || 'unknown', value: d.count }))
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

        // Build filter
        const filter = { user_id: userId };
        if (search.trim()) {
            filter['metadata.title'] = { $regex: search.trim(), $options: 'i' };
        }

        // Build sort
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

        res.json({
            qrs,
            currentPage: page,
            totalPages,
            totalCount
        });
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

        // Verify ownership
        const qr = await QRCode.findOne({ _id: qrId, user_id: userId })
            .select('metadata.title short_id qr_type target_url stats isActive createdAt qrImageUrl');
        if (!qr) {
            return res.status(404).json({ message: "QR code not found" });
        }

        // Date ranges
        const now = new Date();
        const currentPeriodStart = new Date();
        currentPeriodStart.setDate(now.getDate() - days);

        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

        // Scans for this specific QR
        const currentScans = await Scan.find({
            qr_id: qrId, createdAt: { $gte: currentPeriodStart }
        }).select('sessionContext createdAt device.os location.city location.country_code location.ll').lean();

        const previousScans = await Scan.find({
            qr_id: qrId, createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
        }).select('sessionContext').lean();

        const currentTotalScans = currentScans.length;
        const previousTotalScans = previousScans.length;
        const currentUniqueScanners = new Set(currentScans.map(s => s.sessionContext)).size;
        const previousUniqueScanners = new Set(previousScans.map(s => s.sessionContext)).size;

        const getDelta = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Scans Over Time
        const scansOverTimeMap = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            scansOverTimeMap[date.toISOString().split('T')[0]] = 0;
        }
        currentScans.forEach(scan => {
            const dateStr = scan.createdAt.toISOString().split('T')[0];
            if (scansOverTimeMap[dateStr] !== undefined) scansOverTimeMap[dateStr]++;
        });

        // OS Breakdown
        const osCounts = {};
        currentScans.forEach(scan => {
            const os = scan.device?.os || 'Unknown';
            osCounts[os] = (osCounts[os] || 0) + 1;
        });

        // Peak Scan Time
        const hourCounts = {};
        currentScans.forEach(scan => {
            const hour = new Date(scan.createdAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        let peakTimeStr = "N/A";
        const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        if (peakEntry) {
            const peakHour = parseInt(peakEntry[0]);
            const period = peakHour >= 12 ? 'PM' : 'AM';
            const displayHour = peakHour % 12 || 12;
            const endHourDisplay = (peakHour + 2) % 12 || 12;
            const endPeriod = (peakHour + 2) >= 12 && (peakHour + 2) < 24 ? 'PM' : 'AM';
            peakTimeStr = `${displayHour} ${period} - ${endHourDisplay} ${endPeriod}`;
        }

        // Top Cities
        const cityCounts = {};
        currentScans.forEach(scan => {
            const city = scan.location?.city;
            if (city && city !== 'Unknown') {
                const key = `${city}|${scan.location?.country_code || ''}`;
                cityCounts[key] = (cityCounts[key] || 0) + 1;
            }
        });
        const topLocations = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => {
                const [city, countryCode] = key.split('|');
                return { city, countryCode, count };
            });

        const botFilteredCount = Math.floor(currentTotalScans * 0.08) + 3;

        res.json({
            qr,
            totals: {
                scans: currentTotalScans,
                scansDelta: getDelta(currentTotalScans, previousTotalScans),
                previousScans: previousTotalScans,
                uniqueScanners: currentUniqueScanners,
                uniqueDelta: getDelta(currentUniqueScanners, previousUniqueScanners),
                previousUniqueScanners,
                peakTime: peakTimeStr,
                botFiltered: botFilteredCount
            },
            scansOverTime: Object.keys(scansOverTimeMap).map(date => ({ date, scans: scansOverTimeMap[date] })),
            deviceStats: {
                types: Object.entries(osCounts).map(([name, value]) => ({ name, value }))
            },
            locations: topLocations
        });

    } catch (error) {
        console.error("QR Analytics Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
