import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine resource type based on file mimetype
        const isPdf = file.mimetype === 'application/pdf';

        return {
            folder: 'qr-code-app',
            // Cloudinary allows PDFs to be uploaded as 'image' resource type.
            // Using 'raw' on free tiers often causes "Customer is marked as untrusted" errors.
            resource_type: 'image',
            // Strip the extension here, because Cloudinary auto-appends it for 'image' resources.
            public_id: `${Date.now()}-${file.originalname.replace(/\.[^.]+$/, '')}`,
        };
    },
})

export { cloudinary, storage };