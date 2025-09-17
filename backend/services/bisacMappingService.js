/**
 * BISAC Subject Headings Mapping Service
 * Maps various subject/genre terms to standardized BISAC categories
 */

// Core BISAC Categories - Starting with most common fiction and non-fiction categories
const BISAC_CATEGORIES = {
  // FICTION Categories
  'FIC000000': 'FICTION / General',
  'FIC009000': 'FICTION / Fantasy / General',
  'FIC009010': 'FICTION / Fantasy / Contemporary',
  'FIC009020': 'FICTION / Fantasy / Epic',
  'FIC009030': 'FICTION / Fantasy / Historical',
  'FIC009050': 'FICTION / Fantasy / Paranormal',
  'FIC009070': 'FICTION / Fantasy / Urban',
  'FIC014000': 'FICTION / Historical / General',
  'FIC019000': 'FICTION / Literary',
  'FIC022000': 'FICTION / Mystery & Detective / General',
  'FIC022010': 'FICTION / Mystery & Detective / Amateur Sleuth',
  'FIC022040': 'FICTION / Mystery & Detective / International Crime & Mystery',
  'FIC022050': 'FICTION / Mystery & Detective / Police Procedural',
  'FIC027000': 'FICTION / Romance / General',
  'FIC027020': 'FICTION / Romance / Contemporary',
  'FIC027050': 'FICTION / Romance / Historical / General',
  'FIC027110': 'FICTION / Romance / Paranormal / General',
  'FIC028000': 'FICTION / Science Fiction / General',
  'FIC028010': 'FICTION / Science Fiction / Action & Adventure',
  'FIC028020': 'FICTION / Science Fiction / Hard Science Fiction',
  'FIC028030': 'FICTION / Science Fiction / Space Opera',
  'FIC028090': 'FICTION / Science Fiction / Dystopian',
  'FIC031000': 'FICTION / Thrillers / General',
  'FIC031010': 'FICTION / Thrillers / Espionage',
  'FIC031050': 'FICTION / Thrillers / Psychological',
  'FIC050000': 'FICTION / Crime',
  
  // JUVENILE FICTION Categories
  'JUV000000': 'JUVENILE FICTION / General',
  'JUV001000': 'JUVENILE FICTION / Action & Adventure / General',
  'JUV037000': 'JUVENILE FICTION / Fantasy & Magic',
  'JUV039000': 'JUVENILE FICTION / Social Themes / General',
  'JUV053000': 'JUVENILE FICTION / Science Fiction / General',
  
  // YOUNG ADULT FICTION Categories
  'YAF000000': 'YOUNG ADULT FICTION / General',
  'YAF001000': 'YOUNG ADULT FICTION / Action & Adventure / General',
  'YAF018000': 'YOUNG ADULT FICTION / Dystopian',
  'YAF019000': 'YOUNG ADULT FICTION / Fantasy / General',
  'YAF052000': 'YOUNG ADULT FICTION / Romance / General',
  'YAF053000': 'YOUNG ADULT FICTION / Science Fiction / General',
  
  // NON-FICTION Categories
  'BIO000000': 'BIOGRAPHY & AUTOBIOGRAPHY / General',
  'BIO022000': 'BIOGRAPHY & AUTOBIOGRAPHY / Women',
  'BIO026000': 'BIOGRAPHY & AUTOBIOGRAPHY / Personal Memoirs',
  'BIO003000': 'BIOGRAPHY & AUTOBIOGRAPHY / African American & Black',
  'BIO010000': 'BIOGRAPHY & AUTOBIOGRAPHY / Presidents & Heads of State',
  'BIO020000': 'BIOGRAPHY & AUTOBIOGRAPHY / Lawyers & Judges',
  'BUS000000': 'BUSINESS & ECONOMICS / General',
  'BUS041000': 'BUSINESS & ECONOMICS / Management',
  'BUS071000': 'BUSINESS & ECONOMICS / Leadership',
  'COM000000': 'COMPUTERS / General',
  'COM051000': 'COMPUTERS / Programming / General',
  'COM051230': 'COMPUTERS / Programming / Software Development',
  'CKB000000': 'COOKING / General',
  'CKB009000': 'COOKING / Methods / General',
  'HIS000000': 'HISTORY / General',
  'HIS036000': 'HISTORY / Modern / General',
  'HIS037000': 'HISTORY / Modern / 20th Century / General',
  'MED000000': 'MEDICAL / General',
  'PHI000000': 'PHILOSOPHY / General',
  'PHI015000': 'PHILOSOPHY / Political',
  'POL000000': 'POLITICAL SCIENCE / General',
  'POL040000': 'POLITICAL SCIENCE / Government / General',
  'PSY000000': 'PSYCHOLOGY / General',
  'PSY031000': 'PSYCHOLOGY / Social Psychology',
  'REL000000': 'RELIGION / General',
  'REL108000': 'RELIGION / Spirituality',
  'SCI000000': 'SCIENCE / General',
  'SCI075000': 'SCIENCE / Philosophy & Social Aspects',
  'SEL000000': 'SELF-HELP / General',
  'SEL027000': 'SELF-HELP / Personal Growth / Success',
  'SOC000000': 'SOCIAL SCIENCE / General',
  'TRV000000': 'TRAVEL / General',
  'TRV024000': 'TRAVEL / Special Interest / General',
};

// Mapping of keywords/subjects to BISAC codes
// This is a comprehensive but starter mapping that can be expanded
const KEYWORD_TO_BISAC = {
  // Fantasy keywords
  'fantasy': ['FIC009020', 'FIC009050'], // Epic and Paranormal instead of General
  'fantasy fiction': ['FIC009020', 'FIC009050'],
  'epic fantasy': ['FIC009020'],
  'urban fantasy': ['FIC009070'],
  'paranormal fantasy': ['FIC009050'],
  'wizards': ['FIC009020', 'JUV037000'], // Epic fantasy for wizards
  'magic': ['FIC009050', 'JUV037000'], // Paranormal for magic
  'dragons': ['FIC009020', 'JUV037000'], // Epic for dragons
  'elves': ['FIC009020'],
  'sword and sorcery': ['FIC009020'],
  'magical realism': ['FIC019000', 'FIC009010'],
  
  // Science Fiction keywords
  'science fiction': ['FIC028010', 'FIC028030'], // Action & Adventure, Space Opera instead of General
  'sci-fi': ['FIC028010', 'FIC028030'],
  'space opera': ['FIC028030'],
  'dystopian': ['FIC028090', 'YAF018000'],
  'dystopian fiction': ['FIC028090', 'YAF018000'],
  'time travel': ['FIC028010'], // Sci-fi action instead of general
  'aliens': ['FIC028030'], // Space opera
  'robots': ['FIC028020'], // Hard sci-fi
  'artificial intelligence': ['FIC028020'], // Hard sci-fi
  'cyberpunk': ['FIC028090'], // Dystopian
  'post-apocalyptic': ['FIC028090'],
  'hard science fiction': ['FIC028020'],
  
  // Mystery & Crime keywords
  'mystery': ['FIC022010', 'FIC022050'], // Amateur Sleuth, Police Procedural instead of General
  'detective': ['FIC022050'], // Police Procedural
  'crime': ['FIC050000'],
  'murder': ['FIC022050'], // Police procedural
  'police procedural': ['FIC022050'],
  'amateur sleuth': ['FIC022010'],
  'cozy mystery': ['FIC022010'],
  'noir': ['FIC022040'], // International Crime
  'whodunit': ['FIC022010'], // Amateur sleuth
  
  // Thriller keywords
  'thriller': ['FIC031050', 'FIC031010'], // Psychological, Espionage instead of General
  'psychological thriller': ['FIC031050'],
  'espionage': ['FIC031010'],
  'suspense': ['FIC031050'], // Psychological
  'action thriller': ['FIC031010'], // Espionage
  
  // Romance keywords
  'romance': ['FIC027020', 'FIC027050'], // Contemporary, Historical instead of General
  'contemporary romance': ['FIC027020'],
  'historical romance': ['FIC027050'],
  'paranormal romance': ['FIC027110'],
  'love story': ['FIC027020'], // Contemporary
  'romantic fiction': ['FIC027020'], // Contemporary
  
  // Literary Fiction keywords
  'literary fiction': ['FIC019000'],
  'literary': ['FIC019000'],
  'contemporary fiction': ['FIC019000'],
  'general fiction': ['FIC019000'], // Map general fiction to literary instead
  
  // Historical Fiction keywords
  'historical fiction': ['FIC014000'],
  'historical novel': ['FIC014000'],
  'historical': ['FIC014000'],
  
  // Young Adult keywords
  'young adult': ['YAF019000', 'YAF052000'], // Fantasy and Romance for YA
  'young adult fiction': ['YAF019000', 'YAF052000'],
  'ya fiction': ['YAF019000', 'YAF052000'],
  'teen fiction': ['YAF019000', 'YAF052000'],
  'coming of age': ['YAF019000', 'YAF052000'],
  
  // Juvenile keywords
  'juvenile fiction': ['JUV001000', 'JUV037000'], // Action & Adventure, Fantasy instead of General
  'children\'s fiction': ['JUV001000', 'JUV037000'],
  'middle grade': ['JUV001000', 'JUV037000'],
  'picture books': ['JUV001000'],
  
  // Non-fiction keywords
  'biography': ['BIO026000', 'BIO022000'], // Personal Memoirs, Women instead of General
  'autobiography': ['BIO026000'], // Personal Memoirs
  'memoir': ['BIO026000'],
  'memoirs': ['BIO026000'],
  'personal memoirs': ['BIO026000'],
  'women': ['BIO022000'],
  'african american': ['BIO003000'],
  'african americans': ['BIO003000'],
  'presidents spouses': ['BIO010000'],
  'first lady': ['BIO010000'],
  'lawyers': ['BIO020000'],
  'women lawyers': ['BIO020000', 'BIO022000'],
  'business': ['BUS041000', 'BUS071000'], // Management, Leadership instead of General
  'management': ['BUS041000'],
  'leadership': ['BUS071000'],
  'self-help': ['SEL027000'], // Personal Growth instead of General
  'self help': ['SEL027000'],
  'personal growth': ['SEL027000'],
  'psychology': ['PSY031000'], // Social Psychology or another specific
  'history': ['HIS036000', 'HIS037000'], // Modern history instead of General
  'science': ['SCI075000'], // Philosophy of Science or another specific
  'philosophy': ['PHI015000'], // Political Philosophy or another specific
  'religion': ['REL108000'], // Spirituality or another specific
  'cooking': ['CKB009000'], // Methods or another specific
  'cookbook': ['CKB009000'],
  'travel': ['TRV024000'], // Special Interest or another specific
  'politics': ['POL040000'], // Government or another specific
  'political science': ['POL040000'],
  'programming': ['COM051000'],
  'computer science': ['COM051000'], // Programming instead of General
  'software development': ['COM051230'],
  
  // Common subject combinations
  'fantasy adventure': ['FIC009000', 'JUV001000'],
  'science fiction adventure': ['FIC028010'],
  'historical mystery': ['FIC022000', 'FIC014000'],
  'romantic suspense': ['FIC027000', 'FIC031000'],
};

class BISACMappingService {
  /**
   * Map an array of subjects/genres to BISAC categories
   * @param {Array} subjects - Array of subject/genre strings
   * @returns {Array} Array of BISAC category objects
   */
  mapToBISAC(subjects) {
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return [];
    }

    const bisacSet = new Set();
    const mappedCategories = [];
    
    // Process each subject
    for (const subject of subjects) {
      if (!subject) continue;
      
      const normalized = this.normalizeSubject(subject);
      const bisacCodes = this.findBISACCodes(normalized);
      
      for (const code of bisacCodes) {
        if (!bisacSet.has(code) && BISAC_CATEGORIES[code]) {
          bisacSet.add(code);
          mappedCategories.push({
            code,
            description: BISAC_CATEGORIES[code]
          });
        }
      }
    }
    
    // If no specific mappings found, try to determine general category
    if (mappedCategories.length === 0) {
      const generalCode = this.determineGeneralCategory(subjects);
      if (generalCode && BISAC_CATEGORIES[generalCode]) {
        mappedCategories.push({
          code: generalCode,
          description: BISAC_CATEGORIES[generalCode]
        });
      }
    }
    
    // Apply smart filtering and prioritization
    return this.prioritizeCategories(mappedCategories);
  }
  
  /**
   * Normalize a subject string for matching
   * @param {string} subject - Raw subject string
   * @returns {string} Normalized subject
   */
  normalizeSubject(subject) {
    return subject
      .toLowerCase()
      .replace(/[^\w\s'-]/g, '') // Keep apostrophes and hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Find BISAC codes for a normalized subject
   * @param {string} subject - Normalized subject string
   * @returns {Array} Array of BISAC codes
   */
  findBISACCodes(subject) {
    const codes = [];
    
    // Check if this is already a BISAC category from Open Library
    // Open Library sometimes provides subjects like "BIOGRAPHY & AUTOBIOGRAPHY / Women"
    if (subject.includes('&') && subject.includes('/')) {
      // Try to find matching BISAC category by description
      for (const [code, description] of Object.entries(BISAC_CATEGORIES)) {
        // Normalize both for comparison
        const normalizedDesc = description.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const normalizedSubj = subject.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        
        if (normalizedDesc === normalizedSubj || normalizedDesc.includes(normalizedSubj)) {
          codes.push(code);
          return codes; // Return immediately as this is already a BISAC category
        }
      }
    }
    
    // Direct mapping
    if (KEYWORD_TO_BISAC[subject]) {
      return KEYWORD_TO_BISAC[subject];
    }
    
    // Try partial matches (both ways)
    for (const [keyword, bisacCodes] of Object.entries(KEYWORD_TO_BISAC)) {
      // Check if subject contains keyword or keyword contains subject
      if (subject.includes(keyword) || keyword.includes(subject)) {
        codes.push(...bisacCodes);
      }
    }
    
    // Try word-by-word matching for multi-word subjects
    if (codes.length === 0 && subject.includes(' ')) {
      const words = subject.split(' ');
      for (const word of words) {
        if (word.length > 3) { // Skip short words
          for (const [keyword, bisacCodes] of Object.entries(KEYWORD_TO_BISAC)) {
            if (keyword.includes(word)) {
              codes.push(...bisacCodes);
            }
          }
        }
      }
    }
    
    return [...new Set(codes)]; // Remove duplicates
  }
  
  /**
   * Determine a general category if no specific mappings found
   * @param {Array} subjects - Original subjects array
   * @returns {string|null} BISAC code or null
   */
  determineGeneralCategory(subjects) {
    // We're now avoiding general categories, so return null
    // Unless we absolutely need to provide something
    const subjectsStr = subjects.join(' ').toLowerCase();
    
    // Only return a general category if we have strong indicators and nothing else
    // Better to have no category than a useless "General" one
    
    // Check for fiction indicators with age groups
    if (subjectsStr.includes('juvenile') && subjectsStr.includes('fiction')) {
      // Try to find more specific juvenile category
      if (subjectsStr.includes('fantasy') || subjectsStr.includes('magic')) {
        return null; // Will be caught by keyword mapping
      }
      return null; // Avoid general juvenile
    }
    
    if (subjectsStr.includes('young adult') && subjectsStr.includes('fiction')) {
      return null; // Avoid general YA
    }
    
    // For regular fiction or non-fiction, avoid returning general categories
    return null;
  }
  
  /**
   * Prioritize and limit categories
   * @param {Array} categories - Array of BISAC category objects
   * @returns {Array} Prioritized and limited categories
   */
  prioritizeCategories(categories) {
    if (categories.length === 0) return [];
    
    // Filter out overly general categories unless they're the only ones
    const generalCodes = [
      'FIC000000', // FICTION / General
      'JUV000000', // JUVENILE FICTION / General
      'YAF000000', // YOUNG ADULT FICTION / General
      'BIO000000', // BIOGRAPHY & AUTOBIOGRAPHY / General
      'BUS000000', // BUSINESS & ECONOMICS / General
      'COM000000', // COMPUTERS / General
      'HIS000000', // HISTORY / General
      'SCI000000', // SCIENCE / General
      'SOC000000', // SOCIAL SCIENCE / General
      'PSY000000', // PSYCHOLOGY / General
      'POL000000', // POLITICAL SCIENCE / General
      'REL000000', // RELIGION / General
      'MED000000', // MEDICAL / General
      'PHI000000', // PHILOSOPHY / General
      'SEL000000', // SELF-HELP / General
      'CKB000000', // COOKING / General
      'TRV000000', // TRAVEL / General
    ];
    
    // First, separate general from specific categories
    const specificCategories = categories.filter(cat => !generalCodes.includes(cat.code));
    const generalCategories = categories.filter(cat => generalCodes.includes(cat.code));
    
    // If we have specific categories, use those and ignore general ones
    let filteredCategories = specificCategories.length > 0 ? specificCategories : generalCategories;
    
    // Sort by specificity (more slashes = more specific)
    const sorted = filteredCategories.sort((a, b) => {
      const aSpecificity = (a.description.match(/\//g) || []).length;
      const bSpecificity = (b.description.match(/\//g) || []).length;
      
      // Prefer more specific categories, but not too specific
      // Sweet spot is 2-3 levels deep
      const aScore = aSpecificity === 2 ? 3 : (aSpecificity === 3 ? 2 : (aSpecificity === 1 ? 1 : 0));
      const bScore = bSpecificity === 2 ? 3 : (bSpecificity === 3 ? 2 : (bSpecificity === 1 ? 1 : 0));
      
      return bScore - aScore;
    });
    
    // Remove redundant categories (e.g., both general and specific fantasy)
    const filtered = this.removeRedundantCategories(sorted);
    
    // Return top 5 categories maximum, but exclude general if we have enough specific ones
    const result = filtered.slice(0, 5);
    
    // Final check: if we only have general categories and nothing else, keep just one
    if (result.every(cat => generalCodes.includes(cat.code)) && result.length > 1) {
      return [result[0]];
    }
    
    return result;
  }
  
  /**
   * Remove redundant parent/child categories
   * @param {Array} categories - Sorted categories
   * @returns {Array} Filtered categories
   */
  removeRedundantCategories(categories) {
    const filtered = [];
    const addedPrefixes = new Set();
    
    for (const category of categories) {
      const prefix = category.code.substring(0, 6); // First 6 chars of BISAC code
      
      // Skip if we already have a category with same prefix (parent category)
      if (!addedPrefixes.has(prefix) || category.code.length > 6) {
        filtered.push(category);
        addedPrefixes.add(prefix);
      }
    }
    
    return filtered;
  }
}

module.exports = new BISACMappingService();
