const axios = require('axios');
let cheerio;
try {
  cheerio = require('cheerio');
} catch (error) {
  console.warn('Cheerio not available, LibraryThing cover extraction will be limited');
}

class LibraryThingService {
  constructor() {
    this.talpaUrl = process.env.LT_TALPA_URL || 'https://www.librarything.com/api/talpa.php';
    this.apiKey = process.env.LT_API_KEY;
    this.userAgent = 'CoverFetcher/1.0 (+personal use)';
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
      
      // Try to fetch the covers page
      try {
        const coversUrl = `https://www.librarything.com/work/${workId}/covers`;
        console.log(`Fetching covers from: ${coversUrl}`);
        
        const { data: html } = await axios.get(coversUrl, {
          headers: { 
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 10000,
          maxRedirects: 5
        });
        
        return this.extractCoverUrls(html);
      } catch (pageError) {
        console.log(`Could not fetch covers page (${pageError.message}), trying direct URL construction`);
        
        // Fallback: Construct likely cover URLs based on work ID
        // LibraryThing often uses predictable patterns for cover URLs
        const fallbackUrls = [];
        
        // Common LibraryThing CDN patterns
        // These are educated guesses based on common patterns
        const patterns = [
          `https://pics.cdn.librarything.com/picsizes/large_${workId}.jpg`,
          `https://pics.cdn.librarything.com/picsizes/${workId}_large.jpg`,
          `https://pics.cdn.librarything.com/picsizes/${workId}.jpg`,
          `https://covers.librarything.com/large/${workId}.jpg`,
          `https://covers.librarything.com/medium/${workId}.jpg`
        ];
        
        // Add the patterns but we'll validate them later
        patterns.forEach(url => {
          fallbackUrls.push(url);
        });
        
        console.log(`Generated ${fallbackUrls.length} fallback cover URLs for work ${workId}`);
        return fallbackUrls;
      }
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
      
      let coverUrls = [];
      
      // Try to fetch the covers page first
      try {
        const coversUrl = `https://www.librarything.com/work/${workId}/covers`;
        const { data: html } = await axios.get(coversUrl, {
          headers: { 
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 10000,
          maxRedirects: 5
        });
        
        coverUrls = this.extractCoverUrls(html);
      } catch (pageError) {
        console.log(`Could not fetch covers page, using fallback URLs`);
        // Use fallback URLs
        coverUrls = await this.getCoverUrls(isbn);
      }
      
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
    if (!cheerio) {
      console.warn('Cheerio not available, using fallback regex extraction');
      return this.extractCoverUrlsRegex(html);
    }
    
    try {
      const $ = cheerio.load(html);
      const urls = [];
      const seenUrls = new Set();
      
      // LibraryThing loads covers dynamically, but they're in the page
      // Look for all image sources that match the LibraryThing CDN pattern
      
      // Extract from img tags
      $('img').each((_, el) => {
        const src = $(el).attr('src');
        const dataSrc = $(el).attr('data-src');
        
        [src, dataSrc].forEach(url => {
          if (url && url.includes('pics.cdn.librarything.com/picsizes/')) {
            const normalized = this.normalizeUrl(url);
            if (!seenUrls.has(normalized)) {
              urls.push(normalized);
              seenUrls.add(normalized);
            }
          }
        });
      });
      
      // Also check for URLs in JavaScript or data attributes
      // LibraryThing might store cover URLs in JavaScript arrays
      const scriptContent = $('script').text();
      const jsUrlPattern = /["'](https?:\/\/pics\.cdn\.librarything\.com\/picsizes\/[^"']+)["']/gi;
      let match;
      while ((match = jsUrlPattern.exec(scriptContent)) !== null) {
        const url = match[1];
        const normalized = this.normalizeUrl(url);
        if (!seenUrls.has(normalized)) {
          urls.push(normalized);
          seenUrls.add(normalized);
        }
      }
      
      console.log(`Found ${urls.length} unique LibraryThing cover URLs`);
      
      // If we found URLs, return them prioritized
      if (urls.length > 0) {
        return this.prioritizeCoverUrls(urls);
      }
      
      // If no URLs found in HTML, return empty array
      // The getCoverUrls method will handle the fallback
      return [];
    } catch (error) {
      console.error('Error parsing HTML with cheerio:', error);
      return this.extractCoverUrlsRegex(html);
    }
  }
  
  // Fallback regex-based extraction if cheerio is not available
  extractCoverUrlsRegex(html) {
    const urls = [];
    const seenUrls = new Set();
    
    // Updated patterns for finding LibraryThing CDN image URLs
    const patterns = [
      /src=["']([^"']*pics\.cdn\.librarything\.com\/picsizes\/[^"']+)["']/gi,
      /data-src=["']([^"']*pics\.cdn\.librarything\.com\/picsizes\/[^"']+)["']/gi,
      /["'](https?:\/\/pics\.cdn\.librarything\.com\/picsizes\/[\w\d\/\-_]+\.jpg)["']/gi,
      /url\(["']?([^"')]*pics\.cdn\.librarything\.com\/picsizes\/[^"')]+)["']?\)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (url) {
          const normalized = this.normalizeUrl(url);
          if (!seenUrls.has(normalized)) {
            urls.push(normalized);
            seenUrls.add(normalized);
          }
        }
      }
    }
    
    console.log(`Found ${urls.length} LibraryThing cover URLs using regex fallback`);
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
      // Extract height from LibraryThing URL patterns like h200, h400, etc.
      const heightPattern = /h(\d+)/;
      const aHeightMatch = a.match(heightPattern);
      const bHeightMatch = b.match(heightPattern);
      
      if (aHeightMatch && bHeightMatch) {
        const aHeight = parseInt(aHeightMatch[1]);
        const bHeight = parseInt(bHeightMatch[1]);
        return bHeight - aHeight; // Larger height first
      }
      
      // Check for other size indicators in the URL
      const sizeIndicators = [
        { pattern: /large/i, score: 100 },
        { pattern: /_L\./i, score: 95 },
        { pattern: /h1000|h800|h600/i, score: 90 },
        { pattern: /h400/i, score: 70 },
        { pattern: /medium/i, score: 60 },
        { pattern: /_M\./i, score: 55 },
        { pattern: /h200/i, score: 50 },
        { pattern: /small/i, score: 40 },
        { pattern: /_S\./i, score: 35 },
        { pattern: /h100/i, score: 30 },
        { pattern: /thumb/i, score: 20 }
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
