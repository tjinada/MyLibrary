const coverValidationService = require('./coverValidationService');
const libraryThingService = require('./libraryThingService');
const axios = require('axios');

class CoverAggregationService {
  constructor() {
    this.maxCoversPerSource = 5; // Limit to prevent overwhelming the UI
  }

  /**
   * Fetch all available covers from all sources
   * Returns array of cover options with metadata
   */
  async fetchAllAvailableCovers(isbn, googleBooksId, existingCoverUrl) {
    const allCovers = [];
    const seenUrls = new Set();

    try {
      console.log(`Aggregating covers for ISBN: ${isbn}, Google ID: ${googleBooksId}`);
      
      // 1. LibraryThing covers (highest priority)
      if (isbn && process.env.USE_LIBRARYTHING !== 'false') {
        try {
          const ltCovers = await libraryThingService.getAllCovers(isbn);
          console.log(`Found ${ltCovers.length} LibraryThing covers`);
          
          ltCovers.slice(0, this.maxCoversPerSource).forEach((cover, index) => {
            if (!seenUrls.has(cover.url)) {
              allCovers.push({
                ...cover,
                id: `lt_${index}`,
                source: 'librarything',
                sourceName: 'LibraryThing'
              });
              seenUrls.add(cover.url);
            }
          });
        } catch (error) {
          console.log('LibraryThing fetch failed:', error.message);
        }
      }

      // 2. Google Books covers (different zoom levels)
      if (googleBooksId) {
        const googleCovers = [
          { zoom: 0, label: 'High Quality' },
          { zoom: 1, label: 'Medium Quality' },
          { zoom: 2, label: 'Standard Quality' }
        ];

        for (const { zoom, label } of googleCovers) {
          const url = `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=${zoom}&edge=none&source=gbs_api`;
          if (!seenUrls.has(url)) {
            allCovers.push({
              id: `google_${zoom}`,
              url,
              source: 'google',
              sourceName: 'Google Books',
              label,
              priority: zoom
            });
            seenUrls.add(url);
          }
        }
      }

      // 3. OpenLibrary covers
      if (isbn) {
        try {
          const openLibraryCovers = await coverValidationService.checkOpenLibraryCover(isbn);
          if (openLibraryCovers) {
            const olSizes = [
              { url: openLibraryCovers.large, label: 'Large', priority: 0 },
              { url: openLibraryCovers.medium, label: 'Medium', priority: 1 },
              { url: openLibraryCovers.small, label: 'Small', priority: 2 }
            ];

            olSizes.forEach(({ url, label, priority }) => {
              if (url && !seenUrls.has(url)) {
                allCovers.push({
                  id: `ol_${priority}`,
                  url,
                  source: 'openlibrary',
                  sourceName: 'Open Library',
                  label,
                  priority
                });
                seenUrls.add(url);
              }
            });
          }
        } catch (error) {
          console.log('OpenLibrary fetch failed:', error.message);
        }
      }

      // 4. Add existing cover if it's not already in the list
      if (existingCoverUrl && !seenUrls.has(existingCoverUrl)) {
        allCovers.push({
          id: 'existing',
          url: existingCoverUrl,
          source: 'existing',
          sourceName: 'Current Cover',
          label: 'Current',
          priority: 99
        });
      }

      console.log(`Total covers found: ${allCovers.length}`);

      // Validate all covers in parallel
      const validationResults = await Promise.allSettled(
        allCovers.map(cover => this.validateAndEnhanceCover(cover))
      );

      // Filter out invalid covers and add validation data
      const validCovers = validationResults
        .filter(result => result.status === 'fulfilled' && result.value.valid)
        .map(result => result.value)
        .sort((a, b) => b.score - a.score); // Sort by quality score

      console.log(`Valid covers after validation: ${validCovers.length}`);

      return {
        covers: validCovers,
        defaultCover: validCovers[0] || null,
        totalFound: validCovers.length
      };

    } catch (error) {
      console.error('Error aggregating covers:', error);
      return {
        covers: [],
        defaultCover: null,
        totalFound: 0,
        error: error.message
      };
    }
  }

  async validateAndEnhanceCover(cover) {
    try {
      // Quick validation with HEAD request
      const validation = await coverValidationService.validateCoverUrl(cover.url);
      
      if (!validation.valid) {
        console.log(`Cover validation failed for ${cover.url}`);
        return { ...cover, valid: false };
      }

      // Calculate quality score
      const score = coverValidationService.getQualityScore(
        cover.url,
        validation.contentType,
        validation.contentLength
      );

      return {
        ...cover,
        valid: true,
        score,
        contentType: validation.contentType,
        contentLength: validation.contentLength,
        sizeLabel: this.formatFileSize(validation.contentLength)
      };
    } catch (error) {
      console.log(`Cover validation error for ${cover.url}:`, error.message);
      return { ...cover, valid: false, error: error.message };
    }
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  /**
   * Generate thumbnail versions for preview
   * Returns base64 encoded thumbnails for quick loading
   */
  async generateThumbnails(covers, maxThumbnails = 10) {
    const thumbnailPromises = covers
      .slice(0, maxThumbnails)
      .map(async (cover) => {
        try {
          // For performance, we'll just return the URL
          // The frontend will handle lazy loading
          return {
            ...cover,
            thumbnail: cover.url, // Frontend will handle resizing
            loadError: false
          };
        } catch (error) {
          return {
            ...cover,
            thumbnail: null,
            loadError: true
          };
        }
      });

    return Promise.all(thumbnailPromises);
  }
}

module.exports = new CoverAggregationService();
