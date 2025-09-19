/**
 * Improved Category Service
 * Ensures books are properly categorized as either Fiction or Nonfiction
 * with specific genre subcategories, avoiding generic "General Fiction"
 */

// Define the category hierarchy - each book gets ONE primary category
const CATEGORIES = {
  // Fiction Categories (ordered by specificity)
  'Science Fiction & Fantasy': 'Fiction',
  'Mystery / Thriller / Crime': 'Fiction',
  'Romance': 'Fiction',
  'Historical Fiction': 'Fiction',
  'Horror': 'Fiction',
  'Young Adult (YA) Fiction': 'Fiction',
  "Children's Fiction": 'Fiction',
  'Literary Fiction': 'Fiction', // Replaces "General Fiction"
  'Contemporary Fiction': 'Fiction', // More specific than "General"
  
  // Nonfiction Categories
  'Biography / Memoir': 'Nonfiction',
  'History': 'Nonfiction',
  'Science & Nature': 'Nonfiction',
  'Politics & Current Affairs': 'Nonfiction',
  'Self-Help / Personal Development': 'Nonfiction',
  'Religion / Spirituality': 'Nonfiction',
  'Health & Fitness': 'Nonfiction',
  'Business & Economics': 'Nonfiction',
  'Travel': 'Nonfiction',
  'Cooking / Food / Drink': 'Nonfiction',
  'Art / Photography / Design': 'Nonfiction',
  'Education / Reference': 'Nonfiction',
  'Technology / Computers': 'Nonfiction',
  'True Crime': 'Nonfiction', // Separate from fiction crime
  'Philosophy': 'Nonfiction',
  'Psychology': 'Nonfiction',
  'Parenting & Family': 'Nonfiction'
};

// Enhanced keyword mappings with weighted scoring
const KEYWORD_MAPPINGS = {
  // Science Fiction & Fantasy - HIGH PRIORITY
  'Science Fiction & Fantasy': {
    weight: 10,
    keywords: [
      'science fiction', 'sci-fi', 'scifi', 'fantasy', 'epic fantasy', 'urban fantasy',
      'paranormal', 'supernatural', 'magic', 'wizards', 'dragons', 'elves', 'vampires',
      'space opera', 'dystopian', 'post-apocalyptic', 'cyberpunk', 'steampunk',
      'time travel', 'aliens', 'robots', 'artificial intelligence', 'space exploration',
      'sword and sorcery', 'high fantasy', 'low fantasy', 'dark fantasy',
      'magical realism', 'mythology', 'fairy tales', 'folklore', 'werewolves',
      'witches', 'alternate reality', 'parallel universe', 'multiverse'
    ],
    excludeWords: ['true story', 'biography', 'history of', 'science of']
  },
  
  // Mystery / Thriller / Crime - HIGH PRIORITY
  'Mystery / Thriller / Crime': {
    weight: 10,
    keywords: [
      'mystery', 'thriller', 'crime fiction', 'detective', 'murder mystery', 'suspense',
      'police procedural', 'noir', 'whodunit', 'psychological thriller',
      'espionage', 'spy thriller', 'legal thriller', 'courtroom drama', 'forensic',
      'amateur sleuth', 'cozy mystery', 'hard-boiled', 'investigation',
      'action thriller', 'conspiracy thriller', 'international intrigue',
      'murder investigation', 'crime novel', 'suspense fiction'
    ],
    excludeWords: ['true crime', 'criminal justice', 'criminology']
  },
  
  // Romance - HIGH PRIORITY
  'Romance': {
    weight: 10,
    keywords: [
      'romance', 'love story', 'romantic fiction', 'contemporary romance',
      'historical romance', 'paranormal romance', 'erotic romance',
      'romantic suspense', 'romantic comedy', 'rom-com', 'chick lit',
      'new adult romance', 'regency romance', 'love triangle', 'relationships fiction',
      'harlequin', 'mills and boon', 'sweet romance', 'clean romance',
      'enemies to lovers', 'second chance romance'
    ],
    excludeWords: ['relationship advice', 'marriage counseling', 'dating guide']
  },
  
  // Historical Fiction - HIGH PRIORITY
  'Historical Fiction': {
    weight: 9,
    keywords: [
      'historical fiction', 'historical novel', 'period fiction', 'war fiction',
      'world war fiction', 'civil war fiction', 'medieval fiction', 'victorian fiction',
      'regency fiction', 'tudor fiction', 'ancient world fiction', 'biblical fiction',
      'historical mystery', 'historical romance', 'alternate history',
      'biographical fiction', 'family saga', 'generational saga', 'epic historical'
    ],
    excludeWords: ['history', 'historical account', 'biography', 'memoir']
  },
  
  // Horror - HIGH PRIORITY
  'Horror': {
    weight: 10,
    keywords: [
      'horror', 'scary stories', 'terror', 'frightening', 'gothic fiction',
      'zombie fiction', 'ghost stories', 'haunted', 'possession', 'occult fiction',
      'psychological horror', 'body horror', 'cosmic horror', 'lovecraftian',
      'slasher', 'monster fiction', 'creature feature', 'dark fiction',
      'splatterpunk', 'extreme horror', 'supernatural horror', 'horror anthology'
    ],
    excludeWords: ['horror films', 'horror movies']
  },
  
  // Young Adult Fiction - HIGH PRIORITY
  'Young Adult (YA) Fiction': {
    weight: 9,
    keywords: [
      'young adult fiction', 'ya fiction', 'teen fiction', 'juvenile fiction',
      'coming of age', 'teenage', 'adolescent fiction', 'youth fiction',
      'ya fantasy', 'ya romance', 'ya dystopian', 'teen drama',
      'high school fiction', 'teen supernatural', 'new adult fiction'
    ],
    excludeWords: ['parenting teens', 'adolescent psychology']
  },
  
  // Children's Fiction - HIGH PRIORITY
  "Children's Fiction": {
    weight: 9,
    keywords: [
      "children's fiction", "childrens fiction", "juvenile fiction",
      "picture books", "early readers", "chapter books", "middle grade",
      "kids books", "children's literature", "bedtime stories",
      "adventure stories for children", "animal stories", "school stories",
      "children's fantasy", "children's mystery"
    ],
    excludeWords: ['parenting', 'child development', 'education']
  },
  
  // Literary Fiction - MEDIUM PRIORITY (replaces General Fiction)
  'Literary Fiction': {
    weight: 5,
    keywords: [
      'literary fiction', 'literature', 'literary novel', 'book club fiction',
      'contemporary literary', 'modern classics', 'prize-winning fiction',
      'booker prize', 'pulitzer fiction', 'national book award',
      'character-driven', 'experimental fiction', 'postmodern fiction'
    ],
    excludeWords: ['literary criticism', 'literary theory']
  },
  
  // Contemporary Fiction - LOW PRIORITY (fallback for modern fiction)
  'Contemporary Fiction': {
    weight: 3,
    keywords: [
      'contemporary fiction', 'modern fiction', 'mainstream fiction',
      "women's fiction", 'family drama', 'domestic fiction',
      'slice of life', 'realistic fiction', 'general fiction'
    ],
    excludeWords: ['contemporary issues', 'modern history']
  },
  
  // NONFICTION CATEGORIES
  
  // Biography / Memoir - HIGH PRIORITY
  'Biography / Memoir': {
    weight: 10,
    keywords: [
      'biography', 'autobiography', 'memoir', 'memoirs', 'personal memoirs',
      'life story', 'biographical', 'diaries', 'journals', 'letters',
      'personal narrative', 'life history', 'oral history',
      'celebrity biography', 'political biography', 'sports biography',
      'true story', 'personal story', 'lived experience'
    ],
    excludeWords: ['biographical fiction', 'fictionalized']
  },
  
  // True Crime - HIGH PRIORITY (separate from fiction crime)
  'True Crime': {
    weight: 10,
    keywords: [
      'true crime', 'criminal cases', 'murder cases', 'crime investigation',
      'forensic science', 'criminology', 'criminal justice', 'cold cases',
      'serial killers', 'criminal psychology', 'crime journalism',
      'court cases', 'criminal trials'
    ],
    excludeWords: ['crime fiction', 'mystery novel']
  },
  
  // History - HIGH PRIORITY
  'History': {
    weight: 9,
    keywords: [
      'history', 'world history', 'american history', 'european history',
      'ancient history', 'modern history', 'military history', 'social history',
      'cultural history', 'civilization', 'historical events', 'historical account',
      'archaeology', 'anthropology', 'genealogy', 'historical period',
      'war history', 'political history'
    ],
    excludeWords: ['historical fiction', 'historical novel', 'alternate history']
  },
  
  // Science & Nature - HIGH PRIORITY
  'Science & Nature': {
    weight: 9,
    keywords: [
      'popular science', 'physics', 'chemistry', 'biology', 'astronomy',
      'mathematics', 'nature', 'environment', 'ecology', 'climate science',
      'animals', 'wildlife', 'conservation', 'evolution', 'natural history',
      'genetics', 'neuroscience', 'earth science', 'oceanography',
      'botany', 'zoology', 'scientific discovery'
    ],
    excludeWords: ['science fiction']
  },
  
  // Psychology - HIGH PRIORITY
  'Psychology': {
    weight: 9,
    keywords: [
      'psychology', 'psychological', 'mental health', 'cognitive science',
      'behavioral psychology', 'clinical psychology', 'psychotherapy',
      'psychiatry', 'mental illness', 'psychological research',
      'human behavior', 'personality', 'emotional intelligence'
    ],
    excludeWords: ['psychological thriller', 'psychological horror']
  },
  
  // Philosophy - HIGH PRIORITY
  'Philosophy': {
    weight: 9,
    keywords: [
      'philosophy', 'philosophical', 'ethics', 'moral philosophy',
      'existentialism', 'stoicism', 'metaphysics', 'epistemology',
      'logic', 'critical thinking', 'philosophical thought',
      'eastern philosophy', 'western philosophy', 'philosophers'
    ],
    excludeWords: []
  },
  
  // Politics & Current Affairs - MEDIUM PRIORITY
  'Politics & Current Affairs': {
    weight: 7,
    keywords: [
      'politics', 'political science', 'government', 'political theory',
      'current affairs', 'current events', 'journalism', 'news analysis',
      'international relations', 'diplomacy', 'public policy', 'elections',
      'democracy', 'political commentary', 'social issues', 'activism'
    ],
    excludeWords: ['political thriller', 'political fiction']
  },
  
  // Self-Help / Personal Development - MEDIUM PRIORITY
  'Self-Help / Personal Development': {
    weight: 7,
    keywords: [
      'self-help', 'self help', 'personal development', 'personal growth',
      'motivation', 'inspiration', 'success', 'happiness', 'mindfulness',
      'meditation', 'positive thinking', 'life coaching', 'goal setting',
      'productivity', 'habits', 'self-improvement', 'self improvement'
    ],
    excludeWords: []
  },
  
  // Religion / Spirituality - MEDIUM PRIORITY
  'Religion / Spirituality': {
    weight: 7,
    keywords: [
      'religion', 'spirituality', 'theology', 'faith', 'religious studies',
      'christianity', 'islam', 'judaism', 'buddhism', 'hinduism',
      'bible', 'religious text', 'spiritual practice', 'prayer', 'worship',
      'devotional', 'sacred texts', 'religious history', 'comparative religion'
    ],
    excludeWords: ['mythology', 'folklore']
  },
  
  // Health & Fitness - MEDIUM PRIORITY
  'Health & Fitness': {
    weight: 6,
    keywords: [
      'health', 'fitness', 'wellness', 'nutrition', 'diet',
      'exercise', 'workout', 'yoga', 'weight loss', 'healthy living',
      'medical', 'disease', 'healing', 'alternative medicine',
      'sports training', 'athletics', 'physical fitness'
    ],
    excludeWords: []
  },
  
  // Business & Economics - MEDIUM PRIORITY
  'Business & Economics': {
    weight: 6,
    keywords: [
      'business', 'economics', 'finance', 'management', 'leadership',
      'entrepreneurship', 'marketing', 'investing', 'financial planning',
      'corporate strategy', 'innovation', 'startup', 'career development',
      'accounting', 'sales', 'negotiation', 'organizational behavior'
    ],
    excludeWords: []
  },
  
  // Parenting & Family - MEDIUM PRIORITY
  'Parenting & Family': {
    weight: 6,
    keywords: [
      'parenting', 'child development', 'child rearing', 'family life',
      'pregnancy', 'childbirth', 'baby care', 'toddlers', 'teenagers',
      'family relationships', 'marriage', 'divorce', 'adoption',
      'special needs', 'education at home'
    ],
    excludeWords: ['family saga', 'family drama']
  },
  
  // Travel - LOW PRIORITY
  'Travel': {
    weight: 5,
    keywords: [
      'travel guide', 'travel writing', 'guidebook', 'destinations',
      'travel memoir', 'adventure travel', 'cultural travel',
      'backpacking', 'tourism', 'travel tips', 'travel photography'
    ],
    excludeWords: ['time travel', 'travel fiction']
  },
  
  // Cooking / Food / Drink - LOW PRIORITY
  'Cooking / Food / Drink': {
    weight: 5,
    keywords: [
      'cookbook', 'recipes', 'cooking', 'cuisine', 'culinary',
      'baking', 'chef', 'gastronomy', 'food writing', 'wine',
      'beverages', 'cocktails', 'vegetarian cooking', 'vegan cooking'
    ],
    excludeWords: []
  },
  
  // Art / Photography / Design - LOW PRIORITY
  'Art / Photography / Design': {
    weight: 5,
    keywords: [
      'art', 'photography', 'design', 'painting', 'drawing',
      'sculpture', 'architecture', 'graphic design', 'fashion design',
      'art history', 'visual arts', 'creative arts', 'crafts'
    ],
    excludeWords: []
  },
  
  // Technology / Computers - LOW PRIORITY
  'Technology / Computers': {
    weight: 4,
    keywords: [
      'technology', 'computers', 'programming', 'coding', 'software development',
      'computer science', 'information technology', 'web development',
      'data science', 'cybersecurity', 'networking', 'digital technology'
    ],
    excludeWords: ['science fiction', 'technological thriller']
  },
  
  // Education / Reference - LOWEST PRIORITY (fallback)
  'Education / Reference': {
    weight: 2,
    keywords: [
      'textbook', 'reference book', 'dictionary', 'encyclopedia',
      'study guide', 'educational', 'academic', 'research methods',
      'learning', 'teaching', 'curriculum', 'pedagogy'
    ],
    excludeWords: []
  }
};

class ImprovedCategoryService {
  /**
   * Categorize a book based on its subjects/genres
   * Returns exactly ONE category and ensures Fiction/Nonfiction separation
   */
  categorizeBook(subjects, title = '', description = '') {
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return this.inferFromTitleAndDescription(title, description);
    }

    // Combine all text for analysis
    const allText = [
      ...subjects.map(s => typeof s === 'object' && s.name ? s.name : s),
      title,
      description
    ].join(' ').toLowerCase();

    // Score each category
    const categoryScores = {};
    
    for (const [category, config] of Object.entries(KEYWORD_MAPPINGS)) {
      let score = 0;
      
      // Check for keyword matches
      for (const keyword of config.keywords) {
        if (this.containsKeyword(allText, keyword)) {
          score += config.weight;
        }
      }
      
      // Check for exclusion words (reduce score)
      for (const excludeWord of (config.excludeWords || [])) {
        if (this.containsKeyword(allText, excludeWord)) {
          score -= config.weight * 0.5;
        }
      }
      
      if (score > 0) {
        categoryScores[category] = score;
      }
    }
    
    // Find the highest scoring category
    let bestCategory = null;
    let bestScore = 0;
    
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // If no category found, use intelligent fallback
    if (!bestCategory) {
      bestCategory = this.intelligentFallback(allText);
    }
    
    return bestCategory;
  }
  
  /**
   * Check if text contains a keyword (with word boundary checking for single words)
   */
  containsKeyword(text, keyword) {
    // For single-word keywords, use word boundary matching
    if (!keyword.includes(' ')) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    }
    // For multi-word keywords, use simple inclusion
    return text.includes(keyword);
  }
  
  /**
   * Intelligent fallback when no specific category matches
   */
  intelligentFallback(text) {
    // Strong fiction indicators
    const fictionIndicators = [
      'novel', 'fiction', 'story', 'stories', 'tale', 'tales',
      'protagonist', 'character', 'plot', 'narrative'
    ];
    
    // Strong nonfiction indicators
    const nonfictionIndicators = [
      'guide', 'how to', 'introduction to', 'history of', 'theory',
      'analysis', 'study', 'research', 'facts', 'true', 'real',
      'actual', 'documentary', 'report', 'essay'
    ];
    
    let fictionScore = 0;
    let nonfictionScore = 0;
    
    for (const indicator of fictionIndicators) {
      if (this.containsKeyword(text, indicator)) fictionScore++;
    }
    
    for (const indicator of nonfictionIndicators) {
      if (this.containsKeyword(text, indicator)) nonfictionScore++;
    }
    
    // Check for specific age indicators
    if (text.includes('children') || text.includes('juvenile') || text.includes('kids')) {
      if (fictionScore > 0 || nonfictionScore === 0) {
        return "Children's Fiction";
      }
      return 'Education / Reference'; // Children's nonfiction
    }
    
    if (text.includes('young adult') || text.includes('teen') || text.includes('ya ')) {
      if (fictionScore > 0 || nonfictionScore === 0) {
        return 'Young Adult (YA) Fiction';
      }
    }
    
    // Default based on scores
    if (fictionScore > nonfictionScore) {
      return 'Contemporary Fiction'; // Better than "General Fiction"
    } else if (nonfictionScore > fictionScore) {
      return 'Education / Reference'; // Safe nonfiction fallback
    }
    
    // Final fallback - prefer specific fiction over generic
    return 'Contemporary Fiction';
  }
  
  /**
   * Infer category from title and description when no subjects available
   */
  inferFromTitleAndDescription(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    // Quick check for obvious categories
    if (text.includes('cookbook') || text.includes('recipes')) {
      return 'Cooking / Food / Drink';
    }
    if (text.includes('travel guide')) {
      return 'Travel';
    }
    if (text.includes('biography') || text.includes('memoir')) {
      return 'Biography / Memoir';
    }
    
    // Use intelligent fallback
    return this.intelligentFallback(text);
  }
  
  /**
   * Get the parent category (Fiction or Nonfiction)
   */
  getParentCategory(category) {
    return CATEGORIES[category] || 'Fiction';
  }
  
  /**
   * Get all available categories organized by type
   */
  getAllCategories() {
    const fiction = [];
    const nonfiction = [];
    
    for (const [category, parent] of Object.entries(CATEGORIES)) {
      if (parent === 'Fiction') {
        fiction.push(category);
      } else {
        nonfiction.push(category);
      }
    }
    
    return { fiction, nonfiction };
  }
  
  /**
   * Validate that a category is valid
   */
  isValidCategory(category) {
    return CATEGORIES.hasOwnProperty(category);
  }
}

module.exports = new ImprovedCategoryService();
