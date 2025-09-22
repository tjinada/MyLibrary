const sharp = require('sharp');
const axios = require('axios');

class CompositeImageService {
  /**
   * Generate a composite cover image from multiple book covers
   * @param {Array} coverUrls - Array of cover image URLs
   * @param {Object} options - Configuration options
   * @returns {String} Base64 encoded composite image
   */
  async generateCompositeImage(coverUrls, options = {}) {
    const {
      width = 400,
      height = 600,
      gap = 4,
      backgroundColor = '#f5f5f5',
      quality = 90
    } = options;

    if (!coverUrls || coverUrls.length === 0) {
      throw new Error('No cover URLs provided');
    }

    // Filter out invalid URLs
    const validUrls = coverUrls.filter(url => url && url.length > 0).slice(0, 4);
    
    if (validUrls.length === 0) {
      throw new Error('No valid cover URLs');
    }

    try {
      // Download all images
      const imageBuffers = await this.downloadImages(validUrls);
      
      if (imageBuffers.length === 0) {
        throw new Error('Failed to download any images');
      }

      // Determine grid layout
      const { cols, rows } = this.getGridDimensions(imageBuffers.length);
      
      // Calculate cell dimensions
      const cellWidth = Math.floor((width - gap * (cols - 1)) / cols);
      const cellHeight = Math.floor((height - gap * (rows - 1)) / rows);

      // Process and resize images
      const processedImages = await Promise.all(
        imageBuffers.map((buffer, index) => this.processImage(buffer, cellWidth, cellHeight))
      );

      // Create composite image
      const composite = await this.createComposite(
        processedImages,
        width,
        height,
        cellWidth,
        cellHeight,
        gap,
        cols,
        rows,
        backgroundColor
      );

      // Convert to base64
      const base64 = composite.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error generating composite image:', error);
      throw new Error('Failed to generate composite image');
    }
  }

  /**
   * Download images from URLs
   * @param {Array} urls - Array of image URLs
   * @returns {Array} Array of image buffers
   */
  async downloadImages(urls) {
    const imageBuffers = [];
    
    for (const url of urls) {
      try {
        // Handle different URL types
        let imageBuffer;
        
        if (url.startsWith('data:image')) {
          // Handle base64 data URLs
          const base64Data = url.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          // Download from URL
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            maxContentLength: 10 * 1024 * 1024 // 10MB limit
          });
          imageBuffer = Buffer.from(response.data);
        } else if (url.startsWith('/')) {
          // Local file path - skip for now
          console.log('Local file paths not supported in composite generation');
          continue;
        } else {
          console.log('Unsupported URL format:', url);
          continue;
        }
        
        imageBuffers.push(imageBuffer);
      } catch (error) {
        console.error('Failed to download image:', url, error.message);
        // Continue with other images
      }
    }
    
    return imageBuffers;
  }

  /**
   * Process and resize a single image
   * @param {Buffer} buffer - Image buffer
   * @param {Number} width - Target width
   * @param {Number} height - Target height
   * @returns {Object} Processed image with metadata
   */
  async processImage(buffer, width, height) {
    try {
      const processed = await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      return {
        buffer: processed,
        width,
        height
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Create the composite image
   * @param {Array} images - Array of processed images
   * @param {Number} totalWidth - Total width of composite
   * @param {Number} totalHeight - Total height of composite
   * @param {Number} cellWidth - Width of each cell
   * @param {Number} cellHeight - Height of each cell
   * @param {Number} gap - Gap between images
   * @param {Number} cols - Number of columns
   * @param {Number} rows - Number of rows
   * @param {String} backgroundColor - Background color
   * @returns {Buffer} Composite image buffer
   */
  async createComposite(images, totalWidth, totalHeight, cellWidth, cellHeight, gap, cols, rows, backgroundColor) {
    // Create base canvas
    const compositeData = [];
    
    images.forEach((image, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);
      
      compositeData.push({
        input: image.buffer,
        top: y,
        left: x
      });
    });

    // Create the composite
    const composite = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: backgroundColor
      }
    })
    .composite(compositeData)
    .jpeg({ quality: 90 })
    .toBuffer();

    return composite;
  }

  /**
   * Determine grid dimensions based on number of images
   * @param {Number} count - Number of images
   * @returns {Object} Grid dimensions
   */
  getGridDimensions(count) {
    switch (count) {
      case 1:
        return { cols: 1, rows: 1 };
      case 2:
        return { cols: 2, rows: 1 };
      case 3:
        return { cols: 2, rows: 2 };
      case 4:
      default:
        return { cols: 2, rows: 2 };
    }
  }

  /**
   * Check if a collection should have auto-generated cover
   * @param {Object} collection - Collection object
   * @returns {Boolean} Whether to auto-generate
   */
  shouldAutoGenerate(collection) {
    // Auto-generate if:
    // 1. Collection has no custom cover image
    // 2. Collection has 2 or more books with covers
    // 3. Collection is of type 'series' or has auto-generate preference
    
    if (collection.coverImage && !collection.coverBookId) {
      // Has custom cover, don't auto-generate
      return false;
    }
    
    const booksWithCovers = collection.books?.filter(book => 
      book.coverImage && book.coverImage.length > 0
    ) || [];
    
    if (booksWithCovers.length < 2) {
      // Not enough books with covers
      return false;
    }
    
    // Auto-generate for series or if no cover is set
    return collection.collectionType === 'series' || !collection.coverImage;
  }
}

module.exports = new CompositeImageService();
