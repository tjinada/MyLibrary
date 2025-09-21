const axios = require('axios');
const cheerio = require('cheerio');

class LibraryThingService {
  constructor() {
    this.talpaUrl = process.env.LT_TALPA_URL || 'https://www.librarything.com/talpa';
    this.apiKey = process.env.LT_API_KEY;
    this.userAgent = 'MyLibrary/1.0';
    this.workIdCache = new Map();
    this.coverCache = new Map();
    this.cacheTimeout = 1000 * 60 * 60 * 24; // 24 hours
  }

  async getWorkIdFromISBN(isbn) {
    if (!isbn) return null;
    
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check cache
    const cached = this.workIdCache.get(cleanISBN);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      console.log(`Using cached work ID for ISBN ${cleanISBN}: ${cached.workId}`);
      return cached.workId;
    }

    try {
      const params = { 
        search: cleanISBN
      };
      
      // Add API key if available
      if (this.apiKey) {
        params.token = this.apiKey;
      }
      
      console.log(`Fetching LibraryThing work ID for ISBN: ${cleanISBN}`);
      
      const response = await axios.get(this.talpaUrl, {
        params,
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });
      
      const list = response.data?.response?.resultlist || [];
      
      // Prefer exact ISBN hit, else fallback to top result
      const exact = list.find(x => (x.isbns || []).includes(cleanISBN));
      const workId = (exact || list[0])?.work_id || null;
      
      if (workId) {
        console.log(`Found LibraryThing work ID for ${cleanISBN}: ${workId}`);
      } else {
        console.log(`No LibraryThing work ID found for ${cleanISBN}`);
      }
      
      // Cache result
      this.workIdCache.set(cleanISBN, { workId, timestamp: Date.now() });
      return workId;
    } catch (error) {
      console.log(`LibraryThing work ID lookup failed for ${cleanISBN}:`, error.message);
      // Cache the failure too
      this.workIdCache.set(cleanISBN, { workId: null, timestamp: Date.now() });
      return null;
    }
  }

  async getCoverUrls(isbn) {
    if (!isbn) return [];
    
    try {
      const workId = await this.getWorkIdFromISBN(isbn);
      if (!workId) return [];
      
      const coversUrl = `https://www.librarything.com/work/${workId}/covers`;
      console.log(`Fetching covers from: ${coversUrl}`);
      
      const { data: html } = await axios.get(coversUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });
      
      return this.extractCoverUrls(html);
    } catch (error) {
      console.log(`LibraryThing cover fetch failed:`, error.message);
      return [];
    }
  }

  async getAllCovers(isbn) {
    if (!isbn) return [];
    
    try {
      const workId = await this.getWorkIdFromISBN(isbn);
      if (!workId) return [];
      
      const coversUrl = `https://www.librarything.com/work/${workId}/covers`;
      const { data: html } = await axios.get(coversUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });
      
      const coverUrls = this.extractCoverUrls(html);
      
      // Return with metadata for each cover
      return coverUrls.map((url, index) => ({
        url,
        source: 'librarything',
        priority: index, // First is highest quality
        label: this.getCoverLabel(url, index)
      }));
    } catch (error) {
      console.log(`LibraryThing cover fetch failed:`, error.message);
      return [];
    }
  }

  extractCoverUrls(html) {
    const $ = cheerio.load(html);
    const urls = [];
    const seenUrls = new Set();
    
    // Extract all cover URLs
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const dataSrc = $(el).attr('data-src');
      const srcset = $(el).attr('srcset');
      
      [src, dataSrc].forEach(url => {
        if (url && this.isLibraryThingCoverUrl(url)) {
          const normalized = this.normalizeUrl(url);
          if (!seenUrls.has(normalized)) {
            urls.push(normalized);
            seenUrls.add(normalized);
          }
        }
      });
      
      if (srcset) {
        srcset.split(',').forEach(entry => {
          const url = entry.trim().split(' ')[0];
          if (url && this.isLibraryThingCoverUrl(url)) {
            const normalized = this.normalizeUrl(url);
            if (!seenUrls.has(normalized)) {
              urls.push(normalized);
              seenUrls.add(normalized);
            }
          }
        });
      }
    });
    
    // Also check background-image styles
    $('[style*="background-image"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?(.*?)['"]?\)/i);
      if (match && match[1] && this.isLibraryThingCoverUrl(match[1])) {
        const normalized = this.normalizeUrl(match[1]);
        if (!seenUrls.has(normalized)) {
          urls.push(normalized);
          seenUrls.add(normalized);
        }
      }
    });
    
    console.log(`Found ${urls.length} unique LibraryThing cover URLs`);
    
    // Return unique URLs, prioritized by size indicators
    return this.prioritizeCoverUrls(urls);
  }

  isLibraryThingCoverUrl(url) {
    return url && (
      url.includes('pics.cdn.librarything.com') || 
      url.includes('/picsizes/') ||
      url.includes('covers.librarything.com')
    );
  }

  normalizeUrl(url) {
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // Handle relative URLs
    if (!url.startsWith('http')) {
      // If it starts with /, it's relative to domain
      if (url.startsWith('/')) {
        return `https://www.librarything.com${url}`;
      }
      // Otherwise, add protocol
      return `https://${url}`;
    }
    
    // Ensure HTTPS
    return url.replace('http://', 'https://');
  }

  prioritizeCoverUrls(urls) {
    // Sort by quality indicators (larger sizes first)
    return urls.sort((a, b) => {
      // Check for size indicators in the URL
      const sizeIndicators = [
        { pattern: /large/i, score: 100 },
        { pattern: /_L\./i, score: 95 },
        { pattern: /\b1000\b/, score: 90 },
        { pattern: /\b800\b/, score: 85 },
        { pattern: /\b600\b/, score: 80 },
        { pattern: /medium/i, score: 70 },
        { pattern: /_M\./i, score: 65 },
        { pattern: /\b400\b/, score: 60 },
        { pattern: /small/i, score: 50 },
        { pattern: /_S\./i, score: 45 },
        { pattern: /\b200\b/, score: 40 },
        { pattern: /thumb/i, score: 30 }
      ];
      
      let aScore = 50; // Default score
      let bScore = 50;
      
      for (const { pattern, score } of sizeIndicators) {
        if (pattern.test(a)) aScore = Math.max(aScore, score);
        if (pattern.test(b)) bScore = Math.max(bScore, score);
      }
      
      return bScore - aScore;
    });
  }

  getCoverLabel(url, index) {
    if (/large/i.test(url) || /_L\./i.test(url)) return 'Large';
    if (/medium/i.test(url) || /_M\./i.test(url)) return 'Medium';
    if (/small/i.test(url) || /_S\./i.test(url)) return 'Small';
    if (/thumb/i.test(url)) return 'Thumbnail';
    if (/\b1000\b/.test(url)) return 'Extra Large (1000px)';
    if (/\b800\b/.test(url)) return 'Large (800px)';
    if (/\b600\b/.test(url)) return 'Medium (600px)';
    if (/\b400\b/.test(url)) return 'Small (400px)';
    if (/\b200\b/.test(url)) return 'Thumbnail (200px)';
    return `Cover ${index + 1}`;
  }

  // For future use - convert cover to base64 if needed
  async fetchCoverAsBase64(url) {
    try {
      console.log(`Fetching cover as base64: ${url}`);
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 
          'User-Agent': this.userAgent,
          'Referer': 'https://www.librarything.com'
        },
        timeout: 10000
      });
      
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64 = Buffer.from(response.data).toString('base64');
      
      return {
        data: `data:${contentType};base64,${base64}`,
        contentType,
        size: response.data.length
      };
    } catch (error) {
      console.log(`Failed to fetch cover as base64:`, error.message);
      return null;
    }
  }
}

module.exports = new LibraryThingService();
