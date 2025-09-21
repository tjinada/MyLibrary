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
      //const exact = list.find(x => (x.isbns || []).includes(cleanISBN));
      const workId = (list[0])?.work_id || null;
      
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
    
    console.log(`\n=== LibraryThing getCoverUrls START for ISBN: ${isbn} ===`);
    
    try {
      const workId = await this.getWorkIdFromISBN(isbn);
      if (!workId) {
        console.log('No work ID found, returning empty array');
        return [];
      }
      
      // Since LibraryThing is behind Cloudflare, we can't scrape it
      // Instead, return a special URL that indicates where covers can be found
      console.log(`LibraryThing work ID found: ${workId}`);
      console.log(`Covers available at: https://www.librarything.com/work/${workId}/covers`);
      console.log('Note: LibraryThing covers cannot be automatically fetched due to Cloudflare protection');
      
      // Return empty array since we can't actually get the covers
      // The frontend could show a link to the covers page instead
      return [];
    } catch (error) {
      console.log(`\nLibraryThing cover fetch failed:`, error.message);
      return [];
    } finally {
      console.log(`=== LibraryThing getCoverUrls END ===\n`);
    }
  }

  async getAllCovers(isbn) {
    if (!isbn) return [];
    
    console.log(`\n=== LibraryThing getAllCovers START for ISBN: ${isbn} ===`);
    
    try {
      const workId = await this.getWorkIdFromISBN(isbn);
      if (!workId) {
        console.log('No work ID found in getAllCovers, returning empty array');
        return [];
      }
      
      // We can provide a link to LibraryThing but can't fetch the actual covers
      console.log(`LibraryThing work ID found: ${workId}`);
      console.log(`User can manually visit: https://www.librarything.com/work/${workId}/covers`);
      
      // Return a special entry that indicates LibraryThing has covers but they need manual access
      return [{
        url: `https://www.librarything.com/work/${workId}/covers`,
        source: 'librarything',
        priority: 0,
        label: 'View on LibraryThing (manual)',
        isLink: true, // Special flag to indicate this is a link, not an image
        workId: workId
      }];
    } catch (error) {
      console.log(`\ngetAllCovers failed:`, error.message);
      return [];
    } finally {
      console.log(`=== LibraryThing getAllCovers END ===\n`);
    }
  }

  extractCoverUrls(html) {
    console.log('\n--- extractCoverUrls START ---');
    console.log(`HTML length to parse: ${html ? html.length : 0} characters`);
    
    if (!cheerio) {
      console.warn('Cheerio not available, using fallback regex extraction');
      return this.extractCoverUrlsRegex(html);
    }
    
    try {
      const $ = cheerio.load(html);
      const urls = [];
      const seenUrls = new Set();
      
      console.log('Looking for img tags with LibraryThing CDN URLs...');
      
      // LibraryThing loads covers dynamically, but they're in the page
      // Look for all image sources that match the LibraryThing CDN pattern
      
      // Extract from img tags
      let imgCount = 0;
      $('img').each((_, el) => {
        imgCount++;
        const src = $(el).attr('src');
        const dataSrc = $(el).attr('data-src');
        
        if (src) {
          console.log(`  img[${imgCount}] src: ${src.substring(0, 100)}...`);
        }
        if (dataSrc) {
          console.log(`  img[${imgCount}] data-src: ${dataSrc.substring(0, 100)}...`);
        }
        
        [src, dataSrc].forEach(url => {
          if (url && url.includes('pics.cdn.librarything.com/picsizes/')) {
            const normalized = this.normalizeUrl(url);
            if (!seenUrls.has(normalized)) {
              console.log(`  ✓ Found cover URL: ${normalized}`);
              urls.push(normalized);
              seenUrls.add(normalized);
            }
          }
        });
      });
      
      console.log(`Total img tags found: ${imgCount}`);
      
      // Also check for URLs in JavaScript or data attributes
      // LibraryThing might store cover URLs in JavaScript arrays
      console.log('Checking script tags for cover URLs...');
      const scriptContent = $('script').text();
      console.log(`Total script content length: ${scriptContent.length} characters`);
      
      const jsUrlPattern = /["'](https?:\/\/pics\.cdn\.librarything\.com\/picsizes\/[^"']+)["']/gi;
      let match;
      let scriptMatches = 0;
      while ((match = jsUrlPattern.exec(scriptContent)) !== null) {
        scriptMatches++;
        const url = match[1];
        const normalized = this.normalizeUrl(url);
        if (!seenUrls.has(normalized)) {
          console.log(`  ✓ Found in script: ${normalized}`);
          urls.push(normalized);
          seenUrls.add(normalized);
        }
      }
      console.log(`Script matches found: ${scriptMatches}`);
      
      console.log(`\nTotal unique cover URLs found: ${urls.length}`);
      
      // If we found URLs, return them prioritized
      if (urls.length > 0) {
        const prioritized = this.prioritizeCoverUrls(urls);
        console.log('URLs after prioritization:');
        prioritized.slice(0, 3).forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`);
        });
        console.log('--- extractCoverUrls END ---\n');
        return prioritized;
      }
      
      console.log('No cover URLs found in HTML!');
      console.log('--- extractCoverUrls END ---\n');
      // If no URLs found in HTML, return empty array
      // The getCoverUrls method will handle the fallback
      return [];
    } catch (error) {
      console.error('Error parsing HTML with cheerio:', error);
      console.log('--- extractCoverUrls END (with error) ---\n');
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
