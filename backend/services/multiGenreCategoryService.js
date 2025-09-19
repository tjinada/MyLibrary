/**
 * Multi-Genre Categorization Service
 * Categorizes books into Fiction/Nonfiction and multiple specific genres
 * with detailed reasoning for each categorization decision
 */

// Define the allowed genres
const ALLOWED_GENRES = [
  'Historical Fiction',
  'Fantasy',
  'SciFi / Dystopian',
  'Mystery / Thriller',
  'Contemporary Fiction',
  'Romance',
  'Cookbooks',
  'Young Adult',
  'Poetry',
  "Children's Fiction",
  'Biography / Memoir'
];

// Define matching rules for each genre
const GENRE_RULES = {
  'Historical Fiction': {
    requiresFiction: true,
    exactMatches: [
      'historical fiction', 'historical novel', 'historical romance',
      'period fiction', 'period drama', 'historical mystery'
    ],
    strongKeywords: [
      'world war', 'civil war', 'medieval', 'victorian', 'regency',
      'tudor', 'elizabethan', 'ancient rome', 'ancient greece',
      'renaissance', 'colonial', 'revolutionary war', 'napoleonic'
    ],
    weakKeywords: [
      '18th century', '19th century', '20th century', 'historical',
      'period', 'wartime', 'post-war'
    ],
    excludeIfPresent: ['history', 'non-fiction', 'biography', 'true story']
  },
  
  'Fantasy': {
    requiresFiction: true,
    exactMatches: [
      'fantasy', 'epic fantasy', 'high fantasy', 'low fantasy',
      'urban fantasy', 'dark fantasy', 'fantasy fiction',
      'sword and sorcery', 'heroic fantasy', 'magical realism'
    ],
    strongKeywords: [
      'magic', 'wizard', 'witch', 'dragon', 'elf', 'elves',
      'dwarf', 'dwarves', 'orc', 'goblin', 'fairy', 'faerie',
      'sorcerer', 'sorcery', 'spell', 'enchantment', 'quest',
      'realm', 'kingdom', 'prophecy', 'chosen one'
    ],
    weakKeywords: [
      'magical', 'mystical', 'enchanted', 'supernatural',
      'mythology', 'legend', 'folklore'
    ],
    excludeIfPresent: []
  },
  
  'SciFi / Dystopian': {
    requiresFiction: true,
    exactMatches: [
      'science fiction', 'sci-fi', 'sci fi', 'scifi',
      'dystopian', 'dystopia', 'dystopian fiction',
      'post-apocalyptic', 'apocalyptic fiction', 'cyberpunk',
      'steampunk', 'space opera', 'hard science fiction',
      'soft science fiction', 'military science fiction'
    ],
    strongKeywords: [
      'space', 'spaceship', 'alien', 'robot', 'android', 'cyborg',
      'artificial intelligence', 'ai', 'time travel', 'parallel universe',
      'multiverse', 'future', 'futuristic', 'mars', 'colonization',
      'dystopian society', 'totalitarian', 'surveillance state',
      'post-apocalypse', 'apocalypse', 'pandemic', 'nuclear war'
    ],
    weakKeywords: [
      'technology', 'scientific', 'experiment', 'laboratory',
      'mutation', 'genetic', 'virtual reality', 'simulation'
    ],
    excludeIfPresent: ['science', 'technology', 'computing'] // when clearly nonfiction
  },
  
  'Mystery / Thriller': {
    requiresFiction: true,
    exactMatches: [
      'mystery', 'thriller', 'crime', 'crime fiction', 'detective',
      'murder mystery', 'cozy mystery', 'police procedural',
      'psychological thriller', 'suspense', 'noir', 'hardboiled',
      'whodunit', 'legal thriller', 'spy thriller', 'espionage',
      'horror', 'horror fiction', 'psychological horror', 'gothic horror'
    ],
    strongKeywords: [
      'detective', 'investigation', 'murder', 'crime', 'police',
      'fbi', 'cia', 'forensic', 'clue', 'suspect', 'victim',
      'serial killer', 'conspiracy', 'espionage', 'spy',
      'haunted', 'ghost', 'paranormal', 'supernatural', 'terror',
      'frightening', 'scary', 'creepy', 'vampire', 'zombie'
    ],
    weakKeywords: [
      'mysterious', 'investigate', 'solve', 'case', 'suspenseful',
      'dark', 'sinister', 'eerie', 'chilling'
    ],
    excludeIfPresent: ['true crime', 'criminology']
  },
  
  'Contemporary Fiction': {
    requiresFiction: true,
    exactMatches: [
      'contemporary fiction', 'literary fiction', 'general fiction',
      'women\'s fiction', 'book club fiction', 'domestic fiction',
      'family saga', 'coming of age', 'slice of life'
    ],
    strongKeywords: [
      'contemporary', 'modern day', 'present day', 'current',
      'family drama', 'relationship', 'marriage', 'divorce',
      'suburban', 'urban', 'small town', 'friendship'
    ],
    weakKeywords: [
      'today', 'modern', 'current events', 'social issues',
      'family', 'friends', 'work', 'career'
    ],
    excludeIfPresent: [],
    isDefault: true // Use as default for fiction without other genres
  },
  
  'Romance': {
    requiresFiction: false, // Can be fiction or nonfiction (relationship guides)
    exactMatches: [
      'romance', 'romantic fiction', 'contemporary romance',
      'historical romance', 'paranormal romance', 'romantic suspense',
      'erotic romance', 'sweet romance', 'clean romance',
      'rom-com', 'romantic comedy', 'chick lit'
    ],
    strongKeywords: [
      'love story', 'love affair', 'romantic', 'courtship',
      'relationship', 'dating', 'marriage', 'wedding',
      'bride', 'groom', 'kiss', 'passion', 'desire',
      'soulmate', 'true love', 'happily ever after'
    ],
    weakKeywords: [
      'love', 'heart', 'couple', 'attraction', 'chemistry',
      'flirt', 'date', 'boyfriend', 'girlfriend'
    ],
    excludeIfPresent: ['self-help', 'relationship advice']
  },
  
  'Cookbooks': {
    requiresFiction: false,
    requiresNonfiction: true,
    exactMatches: [
      'cookbook', 'cookery', 'recipes', 'cooking', 'baking',
      'cuisine', 'food & wine', 'food and wine', 'culinary'
    ],
    strongKeywords: [
      'recipe', 'ingredient', 'kitchen', 'chef', 'cook',
      'bake', 'grill', 'roast', 'saute', 'simmer',
      'vegetarian', 'vegan', 'gluten-free', 'diet',
      'meal', 'dish', 'menu', 'nutrition'
    ],
    weakKeywords: [
      'food', 'eat', 'taste', 'flavor', 'delicious',
      'restaurant', 'dining'
    ],
    excludeIfPresent: ['fiction', 'novel', 'story']
  },
  
  'Young Adult': {
    requiresFiction: false, // Can be YA fiction or YA nonfiction
    exactMatches: [
      'young adult', 'ya', 'teen', 'teenager', 'adolescent',
      'ya fiction', 'teen fiction', 'young adult fiction',
      'ya fantasy', 'ya romance', 'ya dystopian'
    ],
    strongKeywords: [
      'high school', 'teenager', 'teenage', 'coming of age',
      'first love', 'teen romance', 'teen drama', 'adolescence',
      'growing up', 'teen protagonist', 'young hero'
    ],
    weakKeywords: [
      'school', 'prom', 'graduation', 'college', 'youth',
      'young', 'sixteen', 'seventeen', 'eighteen'
    ],
    excludeIfPresent: ['parenting', 'child development']
  },
  
  'Poetry': {
    requiresFiction: false,
    requiresNonfiction: false,
    exactMatches: [
      'poetry', 'poems', 'verse', 'haiku', 'sonnets',
      'anthology', 'collected poems', 'selected poems'
    ],
    strongKeywords: [
      'poet', 'poetic', 'lyrical', 'verses', 'stanza',
      'rhyme', 'meter', 'free verse', 'blank verse',
      'epic poem', 'lyric poetry', 'narrative poetry'
    ],
    weakKeywords: [
      'poetical', 'rhythmic', 'metaphor', 'imagery'
    ],
    excludeIfPresent: []
  },
  
  "Children's Fiction": {
    requiresFiction: true,
    exactMatches: [
      'children\'s fiction', 'childrens fiction', 'juvenile fiction',
      'picture book', 'early reader', 'chapter book', 'middle grade',
      'children\'s literature', 'kids book', 'bedtime story'
    ],
    strongKeywords: [
      'children', 'kids', 'juvenile', 'picture book',
      'illustrated', 'bedtime', 'fairy tale', 'fable',
      'nursery rhyme', 'adventure for kids', 'animal story'
    ],
    weakKeywords: [
      'child', 'boy', 'girl', 'elementary', 'grade school',
      'playground', 'toy', 'imagination'
    ],
    excludeIfPresent: ['parenting', 'child psychology', 'education']
  },
  
  'Biography / Memoir': {
    requiresFiction: false,
    requiresNonfiction: true,
    exactMatches: [
      'biography', 'autobiography', 'memoir', 'memoirs',
      'life story', 'personal narrative', 'oral history',
      'letters', 'diaries', 'journals', 'personal history'
    ],
    strongKeywords: [
      'life of', 'story of', 'portrait of', 'true story',
      'as told by', 'remembering', 'memories', 'recollections',
      'experiences', 'journey', 'my life', 'his life', 'her life'
    ],
    weakKeywords: [
      'personal', 'individual', 'real', 'actual', 'authentic',
      'witness', 'testimony', 'account'
    ],
    excludeIfPresent: ['fiction', 'novel', 'fictional']
  }
};

// Fiction/Nonfiction determination rules
const CATEGORY_TYPE_RULES = {
  fiction: {
    strong: [
      'fiction', 'novel', 'story', 'stories', 'tale', 'tales',
      'narrative', 'novella', 'short stories', 'anthology'
    ],
    weak: [
      'adventure', 'drama', 'saga', 'epic', 'thriller', 'mystery'
    ],
    genreIndicators: [
      'Fantasy', 'SciFi / Dystopian', 'Mystery / Thriller', 
      'Romance', 'Historical Fiction', 'Contemporary Fiction'
    ]
  },
  nonfiction: {
    strong: [
      'non-fiction', 'nonfiction', 'true', 'real', 'actual',
      'guide', 'manual', 'textbook', 'reference', 'how to',
      'history', 'science', 'biography', 'memoir', 'cookbook'
    ],
    weak: [
      'learn', 'teach', 'study', 'research', 'analysis', 'facts'
    ],
    genreIndicators: [
      'Cookbooks', 'Biography / Memoir'
    ]
  }
};

class MultiGenreCategoryService {
  constructor() {
    console.log('[MultiGenreCategoryService] Service initialized');
    console.log('[MultiGenreCategoryService] Allowed genres:', ALLOWED_GENRES);
  }

  /**
   * Main categorization method
   */
  categorizeBook(apiGenres = [], title = '', description = '', authors = []) {
    console.log('\n=== Multi-Genre Categorization Starting ===');
    console.log('Title:', title);
    console.log('API Genres:', apiGenres);
    console.log('Authors:', authors);
    
    // Normalize input
    const normalizedApiGenres = this.normalizeGenres(apiGenres);
    const allText = `${title} ${description} ${normalizedApiGenres.join(' ')}`.toLowerCase();
    
    // Step 1: Determine Fiction/Nonfiction
    const categoryType = this.determineCategoryType(normalizedApiGenres, allText);
    console.log('\nCategory Type Determined:', categoryType);
    
    // Step 2: Find all applicable genres
    const genreResults = this.findGenres(normalizedApiGenres, allText, categoryType, title);
    
    // Step 3: Log reasoning
    console.log('\nGenres Found:', genreResults.genres);
    console.log('Reasoning:');
    Object.entries(genreResults.reasons).forEach(([genre, reasons]) => {
      console.log(`  ${genre}:`);
      reasons.forEach(reason => console.log(`    - ${reason}`));
    });
    
    console.log('=== Categorization Complete ===\n');
    
    return {
      categoryType,
      genres: genreResults.genres,
      genreReasons: genreResults.reasons
    };
  }

  /**
   * Normalize genres from API (handle objects, arrays, etc.)
   */
  normalizeGenres(apiGenres) {
    if (!apiGenres) return [];
    if (!Array.isArray(apiGenres)) return [String(apiGenres)];
    
    return apiGenres.map(genre => {
      if (typeof genre === 'object' && genre.name) {
        return genre.name;
      }
      return String(genre);
    }).filter(Boolean);
  }

  /**
   * Determine if book is Fiction or Nonfiction
   */
  determineCategoryType(apiGenres, allText) {
    let fictionScore = 0;
    let nonfictionScore = 0;
    const reasons = [];
    
    // Check for explicit fiction/nonfiction indicators
    const genresLower = apiGenres.map(g => g.toLowerCase()).join(' ');
    
    // Strong indicators
    CATEGORY_TYPE_RULES.fiction.strong.forEach(indicator => {
      if (genresLower.includes(indicator) || allText.includes(indicator)) {
        fictionScore += 10;
        reasons.push(`Strong fiction indicator: "${indicator}"`);
      }
    });
    
    CATEGORY_TYPE_RULES.nonfiction.strong.forEach(indicator => {
      if (genresLower.includes(indicator) || allText.includes(indicator)) {
        nonfictionScore += 10;
        reasons.push(`Strong nonfiction indicator: "${indicator}"`);
      }
    });
    
    // Weak indicators
    CATEGORY_TYPE_RULES.fiction.weak.forEach(indicator => {
      if (allText.includes(indicator)) {
        fictionScore += 2;
      }
    });
    
    CATEGORY_TYPE_RULES.nonfiction.weak.forEach(indicator => {
      if (allText.includes(indicator)) {
        nonfictionScore += 2;
      }
    });
    
    console.log(`Fiction score: ${fictionScore}, Nonfiction score: ${nonfictionScore}`);
    reasons.forEach(r => console.log(`  - ${r}`));
    
    // Default to Fiction if scores are equal or both zero
    return nonfictionScore > fictionScore ? 'Nonfiction' : 'Fiction';
  }

  /**
   * Find all applicable genres for the book
   */
  findGenres(apiGenres, allText, categoryType, title) {
    const foundGenres = [];
    const genreReasons = {};
    
    // Check each possible genre
    for (const [genreName, rules] of Object.entries(GENRE_RULES)) {
      const reasons = [];
      let score = 0;
      
      // Check category type requirements
      if (rules.requiresFiction && categoryType !== 'Fiction') continue;
      if (rules.requiresNonfiction && categoryType !== 'Nonfiction') continue;
      
      // Check for exact matches (highest priority)
      for (const exactMatch of rules.exactMatches) {
        const searchTerm = exactMatch.toLowerCase();
        if (apiGenres.some(g => g.toLowerCase() === searchTerm) ||
            apiGenres.some(g => g.toLowerCase().includes(searchTerm))) {
          score += 100;
          reasons.push(`Exact match from API: "${exactMatch}"`);
        }
      }
      
      // Check strong keywords
      for (const keyword of rules.strongKeywords) {
        if (allText.includes(keyword.toLowerCase())) {
          score += 10;
          reasons.push(`Strong keyword found: "${keyword}"`);
        }
      }
      
      // Check weak keywords
      for (const keyword of rules.weakKeywords) {
        if (allText.includes(keyword.toLowerCase())) {
          score += 2;
          reasons.push(`Weak keyword found: "${keyword}"`);
        }
      }
      
      // Check exclusions
      let excluded = false;
      for (const excludeWord of rules.excludeIfPresent) {
        if (allText.includes(excludeWord.toLowerCase())) {
          excluded = true;
          reasons.push(`EXCLUDED due to presence of: "${excludeWord}"`);
          break;
        }
      }
      
      // Add genre if score is sufficient and not excluded
      if (!excluded && score >= 10) {
        foundGenres.push(genreName);
        genreReasons[genreName] = reasons;
        console.log(`  ${genreName}: Score = ${score}`);
      }
    }
    
    // If Fiction but no specific genres found, default to Contemporary Fiction
    if (categoryType === 'Fiction' && foundGenres.length === 0) {
      foundGenres.push('Contemporary Fiction');
      genreReasons['Contemporary Fiction'] = ['Default fiction category (no specific genre matched)'];
    }
    
    return {
      genres: foundGenres,
      reasons: genreReasons
    };
  }

  /**
   * Get all available genres
   */
  getAllGenres() {
    return {
      fiction: ALLOWED_GENRES.filter(g => {
        const rules = GENRE_RULES[g];
        return !rules.requiresNonfiction;
      }),
      nonfiction: ALLOWED_GENRES.filter(g => {
        const rules = GENRE_RULES[g];
        return !rules.requiresFiction;
      })
    };
  }

  /**
   * Validate if a genre is allowed
   */
  isValidGenre(genre) {
    return ALLOWED_GENRES.includes(genre);
  }
}

module.exports = new MultiGenreCategoryService();
