const sharp = require('sharp');
const axios = require('axios');

class ImageProcessingService {
  constructor() {
    // Standard book cover aspect ratio (2:3)
    this.COVER_ASPECT_RATIO = 2 / 3;
    this.SIZES = {
      thumbnail: { width: 150, height: 225 },
      medium: { width: 300, height: 450 },
      full: { width: 600, height: 900 }
    };
  }

  /**
   * Process uploaded image: crop, resize, and optimize
   * @param {Buffer|String} imageInput - Image buffer or base64 string
   * @param {String} size - Size preset ('thumbnail', 'medium', 'full')
   * @returns {Promise<String>} Base64 encoded processed image
   */
  async processImage(imageInput, size = 'full') {
    try {
      let buffer;
      
      // Handle base64 input
      if (typeof imageInput === 'string') {
        // Remove data URL prefix if present
        const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = imageInput;
      }

      const dimensions = this.SIZES[size] || this.SIZES.full;
      
      // Process with sharp: auto-rotate, resize, and crop to aspect ratio
      const processedBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: size === 'thumbnail' ? 70 : 85 })
        .toBuffer();

      // Convert to base64
      const base64 = processedBuffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image: ' + error.message);
    }
  }

  /**
   * Generate all sizes for a cover image
   * @param {Buffer|String} imageInput - Image buffer or base64 string
   * @returns {Promise<Object>} Object with thumbnail, medium, and full sizes
   */
  async generateAllSizes(imageInput) {
    try {
      const [thumbnail, medium, full] = await Promise.all([
        this.processImage(imageInput, 'thumbnail'),
        this.processImage(imageInput, 'medium'),
        this.processImage(imageInput, 'full')
      ]);

      return {
        thumbnail,
        medium,
        full
      };
    } catch (error) {
      console.error('Error generating image sizes:', error);
      throw new Error('Failed to generate image sizes: ' + error.message);
    }
  }

  /**
   * Download and process image from URL
   * @param {String} imageUrl - URL of the image
   * @param {String} size - Size preset
   * @returns {Promise<String>} Base64 encoded image
   */
  async processImageFromUrl(imageUrl, size = 'full') {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': imageUrl.includes('bookshop.org') ? 'https://bookshop.org/' : 'https://www.google.com/',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
        }
      });

      const buffer = Buffer.from(response.data);
      return await this.processImage(buffer, size);
    } catch (error) {
      console.error('Error downloading/processing image from URL:', error.message);
      throw new Error('Failed to process image from URL: ' + error.message);
    }
  }

  /**
   * Validate image before processing
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<Object>} Validation result with metadata
   */
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      const validation = {
        valid: true,
        errors: [],
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length
        }
      };

      // Check file size (5MB limit)
      if (buffer.length > 5 * 1024 * 1024) {
        validation.valid = false;
        validation.errors.push('Image size exceeds 5MB limit');
      }

      // Check minimum dimensions
      if (metadata.width < 200 || metadata.height < 300) {
        validation.valid = false;
        validation.errors.push('Image dimensions too small (minimum 200x300)');
      }

      // Check format
      const supportedFormats = ['jpeg', 'png', 'webp'];
      if (!supportedFormats.includes(metadata.format)) {
        validation.valid = false;
        validation.errors.push(`Unsupported format: ${metadata.format}`);
      }

      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid image file: ' + error.message],
        metadata: null
      };
    }
  }

  /**
   * Extract dominant colors from image (for UI theming)
   * @param {Buffer|String} imageInput - Image buffer or base64
   * @returns {Promise<Array>} Array of dominant colors
   */
  async extractColors(imageInput) {
    try {
      let buffer;
      if (typeof imageInput === 'string') {
        const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = imageInput;
      }

      const { dominant } = await sharp(buffer)
        .resize(50, 50) // Small size for color extraction
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple dominant color extraction
      // In production, you might want to use a proper color quantization algorithm
      return ['#000000']; // Placeholder - implement if needed
    } catch (error) {
      console.error('Error extracting colors:', error);
      return ['#000000'];
    }
  }
}

module.exports = new ImageProcessingService();
