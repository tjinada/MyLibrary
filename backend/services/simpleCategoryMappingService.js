/**
 * Simple Category Mapping Service
 * Maps various book subjects/genres to a simplified set of categories
 */

// Define the simplified categories
const SIMPLE_CATEGORIES = {
  // Fiction Categories
  'General Fiction': 'Fiction',
  'Science Fiction & Fantasy': 'Fiction',
  'Mystery / Thriller / Crime': 'Fiction',
  'Romance': 'Fiction',
  'Historical Fiction': 'Fiction',
  'Horror': 'Fiction',
  'Young Adult (YA) Fiction': 'Fiction',
  "Children's Fiction": 'Fiction',
  
  // Nonfiction Categories
  'Biography / Memoir': 'Nonfiction',
  'History': 'Nonfiction',
  'Politics & Current Affairs': 'Nonfiction',
  'Self-Help / Personal Development': 'Nonfiction',
  'Religion / Spirituality': 'Nonfiction',
  'Health & Fitness': 'Nonfiction',
  'Business & Economics': 'Nonfiction',
  'Travel': 'Nonfiction',
  'Cooking / Food / Drink': 'Nonfiction',
  'Art / Photography / Design': 'Nonfiction',
  'Education / Reference': 'Nonfiction',
  'Technology / Computers': 'Nonfiction'
};

// Comprehensive keyword mappings to categories
const KEYWORD_MAPPINGS = {
  // General Fiction keywords
  'General Fiction': [
    'literary fiction', 'contemporary fiction',
    'literary', 'literature', 'mainstream fiction',
    'book club fiction', 'womens fiction', "women's fiction"
  ],
  
  // Science Fiction & Fantasy keywords
  'Science Fiction & Fantasy': [
    'science fiction', 'sci-fi', 'scifi', 'fantasy', 'epic fantasy', 'urban fantasy',
    'paranormal', 'supernatural', 'magic', 'wizards', 'dragons', 'elves', 'vampires',
    'space opera', 'dystopian', 'post-apocalyptic', 'cyberpunk', 'steampunk',
    'time travel', 'aliens', 'robots', 'artificial intelligence', 'space',
    'sword and sorcery', 'high fantasy', 'low fantasy', 'dark fantasy',
    'magical realism', 'mythology', 'fairy tales', 'folklore'
  ],
  
  // Mystery / Thriller / Crime keywords
  'Mystery / Thriller / Crime': [
    'mystery', 'thriller', 'crime', 'detective', 'murder', 'suspense',
    'police procedural', 'noir', 'whodunit', 'psychological thriller',
    'espionage', 'spy', 'legal thriller', 'courtroom', 'forensic',
    'amateur sleuth', 'cozy mystery', 'hard-boiled', 'investigation',
    'action thriller', 'conspiracy', 'international crime'
  ],
  
  // Romance keywords
  'Romance': [
    'romance', 'love story', 'romantic', 'contemporary romance',
    'historical romance', 'paranormal romance', 'erotic romance',
    'romantic suspense', 'romantic comedy', 'rom-com', 'chick lit',
    'new adult romance', 'regency romance', 'love', 'relationships'
  ],
  
  // Historical Fiction keywords
  'Historical Fiction': [
    'historical fiction', 'historical novel',
    'period fiction', 'war fiction', 'world war', 'civil war',
    'medieval', 'victorian', 'regency', 'tudor', 'ancient',
    'historical mystery', 'historical romance', 'alternate history',
    'biographical fiction', 'saga'
  ],
  
  // Horror keywords
  'Horror': [
    'horror', 'scary', 'terror', 'frightening', 'gothic',
    'zombies', 'ghosts', 'haunted', 'possession', 'occult',
    'psychological horror', 'body horror', 'cosmic horror',
    'slasher', 'monster', 'creatures', 'dark fiction'
  ],
  
  // Young Adult Fiction keywords
  'Young Adult (YA) Fiction': [
    'young adult', 'ya fiction', 'teen fiction', 'juvenile fiction',
    'coming of age', 'teenage', 'adolescent', 'youth fiction',
    'ya fantasy', 'ya romance', 'ya dystopian', 'teen',
    'young adult fiction', 'ya', 'teen romance', 'teen fantasy'
  ],
  
  // Children's Fiction keywords
  "Children's Fiction": [
    "children's fiction", "childrens fiction", "juvenile fiction",
    "picture books", "early readers", "chapter books", "middle grade",
    "kids books", "children's literature", "fairy tales", "bedtime stories",
    "adventure stories", "animal stories", "school stories"
  ],
  
  // Biography / Memoir keywords
  'Biography / Memoir': [
    'biography', 'autobiography', 'memoir', 'memoirs', 'personal memoirs',
    'life story', 'biographical', 'diaries', 'journals', 'letters',
    'personal narrative', 'life history', 'oral history',
    'celebrity biography', 'political biography', 'sports biography',
    'true story', 'personal story'
  ],
  
  // History keywords
  'History': [
    'world history', 'american history',
    'european history', 'ancient history', 'modern history',
    'military history', 'social history', 'cultural history',
    'civilization', 'historical events',
    'archaeology', 'anthropology', 'genealogy'
  ],
  
  // Politics & Current Affairs keywords
  'Politics & Current Affairs': [
    'politics', 'political', 'government', 'political science',
    'current affairs', 'current events', 'journalism', 'news',
    'international relations', 'diplomacy', 'policy', 'elections',
    'democracy', 'political theory', 'ideology', 'activism',
    'social issues', 'public affairs', 'law', 'legal'
  ],
  
  // Self-Help / Personal Development keywords
  'Self-Help / Personal Development': [
    'self-help', 'self help', 'personal development', 'personal growth',
    'motivation', 'inspiration', 'success', 'happiness', 'mindfulness',
    'meditation', 'positive thinking', 'life coaching', 'goals',
    'productivity', 'habits', 'self-improvement', 'self improvement',
    'personal transformation', 'emotional intelligence'
  ],
  
  // Religion / Spirituality keywords
  'Religion / Spirituality': [
    'religion', 'spirituality', 'theology', 'faith', 'belief',
    'christianity', 'islam', 'judaism', 'buddhism', 'hinduism',
    'bible', 'religious', 'spiritual', 'prayer', 'worship',
    'devotional', 'sacred', 'divine', 'god', 'philosophy',
    'metaphysics', 'new age', 'occult', 'mysticism'
  ],
  
  // Science & Nature keywords
  'Science & Nature': [
    'physics', 'chemistry', 'biology', 'astronomy',
    'mathematics', 'nature', 'environment', 'ecology', 'climate',
    'animals', 'plants', 'wildlife', 'conservation', 'evolution',
    'genetics', 'neuroscience', 'psychology', 'medicine',
    'technology', 'engineering', 'space', 'cosmos', 'universe'
  ],
  
  // Health & Fitness keywords
  'Health & Fitness': [
    'health', 'fitness', 'wellness', 'nutrition', 'diet',
    'exercise', 'workout', 'yoga', 'weight loss', 'healthy living',
    'mental health', 'medical', 'disease', 'healing', 'alternative medicine',
    'sports', 'athletics', 'training', 'bodybuilding', 'running'
  ],
  
  // Business & Economics keywords
  'Business & Economics': [
    'business', 'economics', 'finance', 'management', 'leadership',
    'entrepreneurship', 'marketing', 'investing', 'money', 'wealth',
    'corporate', 'strategy', 'innovation', 'startup', 'career',
    'professional development', 'accounting', 'sales', 'negotiation',
    'organizational behavior', 'human resources'
  ],
  
  // Travel keywords
  'Travel': [
    'travel', 'traveling', 'journey', 'adventure', 'exploration',
    'travel guide', 'guidebook', 'tourism', 'destinations',
    'backpacking', 'road trip', 'vacation', 'holiday',
    'geography', 'places', 'countries', 'cities', 'culture'
  ],
  
  // Cooking / Food / Drink keywords
  'Cooking / Food / Drink': [
    'cooking', 'cookbook', 'recipes', 'food', 'cuisine',
    'baking', 'chef', 'culinary', 'gastronomy', 'diet',
    'nutrition', 'wine', 'beverages', 'cocktails', 'coffee',
    'vegetarian', 'vegan', 'healthy eating', 'meal planning'
  ],
  
  // Art / Photography / Design keywords
  'Art / Photography / Design': [
    'art', 'photography', 'design', 'painting', 'drawing',
    'sculpture', 'architecture', 'graphic design', 'fashion',
    'illustration', 'visual arts', 'modern art', 'contemporary art',
    'art history', 'museum', 'gallery', 'artist', 'creative',
    'crafts', 'diy', 'decorating', 'interior design'
  ],
  
  // Education / Reference keywords
  'Education / Reference': [
    'education', 'reference', 'textbook', 'study guide',
    'dictionary', 'encyclopedia', 'manual', 'handbook',
    'learning', 'teaching', 'academic', 'research', 'methodology',
    'language learning', 'test preparation', 'exam', 'curriculum',
    'pedagogy', 'educational', 'school', 'university'
  ],
  
  // Technology / Computers keywords
  'Technology / Computers': [
    'technology', 'computers', 'programming', 'coding', 'software',
    'hardware', 'internet', 'web development', 'app development',
    'artificial intelligence', 'machine learning', 'data science',
    'cybersecurity', 'networking', 'database', 'cloud computing',
    'digital', 'tech', 'it', 'information technology'
  ]
};

class SimpleCategoryMappingService {
  constructor() {
    console.log('[SimpleCategoryMappingService] Service initialized - THIS SHOULD NOT BE USED!');
    console.log('[SimpleCategoryMappingService] If you see this, the old service is being loaded instead of ImprovedCategoryService');
  }
  
  /**
   * Map an array of subjects/genres to simplified categories
   * @param {Array} subjects - Array of subject/genre strings
   * @returns {Array} Array of simplified category strings
   */
  mapToSimpleCategories(subjects) {
    console.log('\n[WARNING] SimpleCategoryMappingService.mapToSimpleCategories() called!');
    console.log('[WARNING] This service returns MULTIPLE categories and should be replaced by ImprovedCategoryService');
    console.log('[WARNING] Input subjects:', subjects);
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return [];
    }

    const categoryScores = {};
    const foundCategories = new Set();
    
    // Process each subject
    for (const subject of subjects) {
      if (!subject) continue;
      
      // Handle Open Library subject objects with 'name' property
      const subjectText = typeof subject === 'object' && subject.name ? subject.name : subject;
      const normalized = this.normalizeSubject(subjectText);
      
      // Skip generic terms that don't help with categorization
      if (normalized === 'fiction' || normalized === 'general' || normalized === 'adventure') {
        continue;
      }
      
      // Check each category's keywords
      for (const [category, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
        for (const keyword of keywords) {
          // For single-word keywords, require word boundary match to avoid false positives
          // e.g., "history" should not match in "prehistory" or "christopher"
          if (!keyword.includes(' ')) {
            // Single word keyword - use word boundary matching
            const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (wordBoundaryRegex.test(normalized)) {
              categoryScores[category] = (categoryScores[category] || 0) + 2;
              foundCategories.add(category);
              break;
            }
          } else {
            // Multi-word keyword - use contains match
            if (normalized.includes(keyword)) {
              categoryScores[category] = (categoryScores[category] || 0) + 2;
              foundCategories.add(category);
              break;
            }
          }
        }
      }
    }
    
    // Sort categories by score and get the top ones
    const sortedCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
    
    // Return top categories (limit to 3)
    const topCategories = sortedCategories.slice(0, 3);
    
    // If no categories found, try to determine based on fiction/nonfiction indicators
    if (topCategories.length === 0) {
      const fallbackCategory = this.determineFallbackCategory(subjects);
      if (fallbackCategory) {
        return [fallbackCategory];
      }
    }
    
    return topCategories;
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
   * Determine a fallback category if no specific mappings found
   * @param {Array} subjects - Original subjects array
   * @returns {string|null} Category or null
   */
  determineFallbackCategory(subjects) {
    const subjectsStr = subjects
      .map(s => typeof s === 'object' && s.name ? s.name : s)
      .join(' ')
      .toLowerCase();
    
    // Check for strong science fiction indicators first
    if (subjectsStr.includes('science fiction') || subjectsStr.includes('space')) {
      return 'Science Fiction & Fantasy';
    }
    
    // Check for strong fiction indicators
    if (subjectsStr.includes('fiction') || subjectsStr.includes('novel') || subjectsStr.includes('story')) {
      // Check for age indicators
      if (subjectsStr.includes('juvenile') || subjectsStr.includes('children')) {
        return "Children's Fiction";
      }
      if (subjectsStr.includes('young adult') || subjectsStr.includes('teen')) {
        return 'Young Adult (YA) Fiction';
      }
      return 'General Fiction';
    }
    
    // Check for nonfiction indicators
    if (subjectsStr.includes('nonfiction') || subjectsStr.includes('non-fiction')) {
      return 'Education / Reference'; // Safe fallback for nonfiction
    }
    
    // Look for biography indicators
    if (subjectsStr.includes('biography') || subjectsStr.includes('life') || subjectsStr.includes('memoir')) {
      return 'Biography / Memoir';
    }
    
    // Look for history indicators
    if (subjectsStr.includes('history') || subjectsStr.includes('historical')) {
      return 'History';
    }
    
    // Default to General Fiction if unclear
    return 'General Fiction';
  }
  
  /**
   * Get the parent category (Fiction or Nonfiction)
   * @param {string} category - The category name
   * @returns {string} 'Fiction' or 'Nonfiction'
   */
  getParentCategory(category) {
    return SIMPLE_CATEGORIES[category] || 'Fiction';
  }
  
  /**
   * Get all available categories
   * @returns {Object} Object with fiction and nonfiction arrays
   */
  getAllCategories() {
    const fiction = [];
    const nonfiction = [];
    
    for (const [category, parent] of Object.entries(SIMPLE_CATEGORIES)) {
      if (parent === 'Fiction') {
        fiction.push(category);
      } else {
        nonfiction.push(category);
      }
    }
    
    return { fiction, nonfiction };
  }
}

module.exports = new SimpleCategoryMappingService();
