const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../public/uploads/favicons');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

class UploadController {
    /**
     * Upload and process a favicon image
     * Resizes to 256x256 PNG
     */
    async uploadFavicon(req, res) {
        try {
            console.log('📂 Upload request received');
            if (!req.file) {
                console.error('❌ No file in request');
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            console.log(`📂 Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

            // Generate unique filename
            const timestamp = Date.now();
            const filename = `favicon-${timestamp}.png`;
            const filepath = path.join(uploadDir, filename);

            console.log(`📂 Target path: ${filepath}`);

            // Process image with Sharp
            await sharp(req.file.buffer)
                .resize(256, 256, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                })
                .png()
                .toFile(filepath);

            console.log('✅ Sharp processing complete');

            // Return public URL
            const publicUrl = `/uploads/favicons/${filename}`;

            res.status(200).json({
                success: true,
                data: {
                    url: publicUrl,
                    filename: filename
                },
                message: 'Favicon uploaded successfully'
            });
        } catch (error) {
            console.error('❌ Error uploading favicon:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload favicon'
            });
        }
    }
}

module.exports = new UploadController();
