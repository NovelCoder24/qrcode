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

        // 3. Device Breakdown (Pie/Donut friendly)
        const deviceBreakdown = await Scan.aggregate([
            { $match: { owner_id: userId, createdAt: { $gte: currentPeriodStart } } },
            { $group: { _id: "$device.type", count: { $sum: 1 } } }
        ]);

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
                uniqueScanners: currentUniqueScanners,
                uniqueDelta
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
