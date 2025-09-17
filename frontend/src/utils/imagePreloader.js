// Simple image preloader utility
class ImagePreloader {
  constructor() {
    this.loadedImages = new Set();
  }

  /**
   * Preload a single image
   * @param {string} url - Image URL to preload
   * @returns {Promise<boolean>} - Promise that resolves when done
   */
  preload(url) {
    if (!url || this.loadedImages.has(url)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(url);
        resolve(true);
      };

      img.onerror = () => {
        // Don't mark as loaded if it failed
        resolve(false);
      };

      img.src = url;
    });
  }

  /**
   * Preload multiple images in parallel
   * @param {string[]} urls - Array of image URLs
   * @returns {Promise<void>}
   */
  async preloadMultiple(urls) {
    const promises = urls.map(url => this.preload(url));
    await Promise.allSettled(promises);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.loadedImages.clear();
  }
}

export default new ImagePreloader();
