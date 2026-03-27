import mongoose from "mongoose";

const qrCodeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  short_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  target_url: {
    type: String,
    required: true,
    trim: true
  },
  qr_type: {
    type: String,
    enum: ['URL', 'PDF', 'VCARD', 'WHATSAPP', 'SOCIAL', 'MEDIA'],
    required: true,
    default: 'URL'
  },
  customization: {
    type: Object,
    default: {}
  },
  logo_url: {
    type: String,
    default: null
  },
  qrImageUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  health_status: {
    type: String,
    enum: ['active', 'broken', 'unchecked'],
    default: 'unchecked',
    index: true
  },
  last_pinged_at: {
    type: Date,
    default: null
  },
  stats: {
    total_scans: { type: Number, default: 0 },
    last_scanned_at: { type: Date }
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

//  1. sanitize url -> middleware
// Ensures that every URL saved is a valid clickable link
// Only sanitize for types that use real HTTP URLs
qrCodeSchema.pre("save", function () {
  if (this.isModified("target_url")) {
    const skipTypes = ['VCARD', 'SOCIAL', 'MEDIA'];
    if (!skipTypes.includes(this.qr_type) && !/^https?:\/\//i.test(this.target_url)) {
      this.target_url = `https://${this.target_url}`;
    };
  };
});
// 2. INSTANCE METHODS
// Helper to get the full short link for the QR image
qrCodeSchema.methods.getFullShortUrl = function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:4000";
  return `${baseUrl}/r/${this.short_id}`
}
// Method to safely increment scans
qrCodeSchema.methods.recordScan = async function () {
  this.stats.total_scans += 1;
  this.stats.last_scanned_at = new Date();
  return await this.save()
};

export const QRCode = mongoose.model("QRCode", qrCodeSchema);
