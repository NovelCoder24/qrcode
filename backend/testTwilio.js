import mongoose from 'mongoose';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const testTwilio = async () => {
    try {
        console.log("Mocking Health Alert Twilio Dispatch...");
        
        // Use standard Twilio SDK logic from our healthMonitor
        const twilioClient = process.env.TWILIO_ACCOUNT_SID 
            ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
            : null;

        if (!twilioClient) {
            console.log("No Twilio credentials found in .env. Skipping WhatsApp test.");
            process.exit(0);
        }

        const user = { whatsappNumber: "+15005550006" }; // Twilio Magic Number for successful tests
        const qrCode = { metadata: { title: "Test QR" }, target_url: "https://broken-link.com" };
        const reason = "Timeout Error";

        console.log(`Sending ping to ${user.whatsappNumber}...`);
        
        const shortMessage = `🚨 *QRVibe Alert*\nYour QR Code "${qrCode.metadata.title}" is broken. The provided link returned: ${reason}.\nPlease log in to fix it immediately.`;
        
        const res = await twilioClient.messages.create({
            body: shortMessage,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_SENDER || '+14155238886'}`,
            to: `whatsapp:${user.whatsappNumber}`
        });
        
        console.log("Twilio Response SID:", res.sid);
        console.log("Twilio Response Status:", res.status);
        console.log("✅ Twilio integration is working correctly.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Twilio SDK Error:", err.message);
        process.exit(1);
    }
};

testTwilio();
