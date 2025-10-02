/**
 * Multi-Genre Categorization Service
 * Categorizes books into Fiction/Nonfiction and multiple specific genres
 * with detailed reasoning for each categorization decision
 */

// Define the allowed genres
const ALLOWED_GENRES = [
  'Fiction',
  'Nonfiction',
  'Historical Fiction',
  'Fantasy',
  'Science Fiction',
  'Dystopian',
  'Mystery / Thriller',
  'Contemporary Fiction',
  'Romance',
  'Cookbooks',
  'Young Adult',
  'Poetry',
  "Children's Fiction",
  'Biography / Memoir',
  'Anime'
];

// Define matching rules for each genre
const GENRE_RULES = {
  'Fiction': {
    requiresFiction: true,
    requiresNonfiction: false,
    exactMatches: [
      'fiction', 'general fiction', 'literary fiction'
    ],
    strongKeywords: [
      'novel', 'novella', 'short stories'
    ],
    weakKeywords: [
      'narrative', 'story', 'tale'
    ],
    excludeIfPresent: ['nonfiction', 'non-fiction', 'true story', 'factual'],
    isGeneralCategory: true // Flag to indicate this is a broad category
  },
  
  'Nonfiction': {
    requiresFiction: false,
    requiresNonfiction: true,
    exactMatches: [
      'nonfiction', 'non-fiction', 'non fiction'
    ],
    strongKeywords: [
      'true story', 'factual', 'real events', 'documentary'
    ],
    weakKeywords: [
      'guide', 'manual', 'reference'
    ],
    excludeIfPresent: ['fiction', 'novel', 'fantasy', 'imaginary'],
    isGeneralCategory: true // Flag to indicate this is a broad category
  },
  
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
      'sorcerer', 'sorcery', 'spell', 'enchantment',
      'realm', 'kingdom', 'prophecy', 'chosen one', 'mage',
      'magical powers', 'spellcasting', 'unicorn', 'phoenix'
    ],
    weakKeywords: [
      'magical', 'mystical', 'enchanted', 'supernatural',
      'mythology', 'legend', 'folklore'
    ],
    excludeIfPresent: ['space', 'spaceship', 'science fiction', 'sci-fi']
  },
  
  'Science Fiction': {
    requiresFiction: true,
    exactMatches: [
      'science fiction', 'sci-fi', 'sci fi', 'scifi',
      'cyberpunk', 'steampunk', 'space opera', 'hard science fiction',
      'soft science fiction', 'military science fiction',
      'science fiction & fantasy', 'space', 'space exploration'
    ],
    strongKeywords: [
      'space station', 'spaceship', 'alien', 'robot', 'android', 'cyborg',
      'artificial intelligence', 'ai', 'time travel', 'parallel universe',
      'multiverse', 'futuristic', 'mars colony', 'space colonization',
      'galaxy', 'interstellar', 'starship', 'space exploration',
      'terraforming', 'cryosleep', 'wormhole', 'light speed',
      'laser', 'plasma', 'quantum', 'nano technology', 'nanotechnology',
      'virtual reality', 'simulation', 'matrix', 'hologram'
    ],
    weakKeywords: [
      'future', 'space', 'stars', 'planet', 'orbit',
      'technology', 'scientific', 'experiment', 'laboratory',
      'mutation', 'genetic', 'spacecraft', 'astronaut'
    ],
    excludeIfPresent: ['astronomy', 'astrophysics', 'space science', 'nasa history']
  },
  
  'Dystopian': {
    requiresFiction: true,
    exactMatches: [
      'dystopian', 'dystopia', 'dystopian fiction',
      'post-apocalyptic', 'apocalyptic fiction', 'post apocalyptic',
      'apocalypse', 'dystopian ya', 'dystopian young adult'
    ],
    strongKeywords: [
      'dystopian society', 'totalitarian', 'surveillance state',
      'post-apocalypse', 'apocalypse', 'pandemic fiction',
      'oppressive government', 'rebellion', 'uprising', 'revolution',
      'survival', 'wasteland', 'collapse of civilization',
      'authoritarian', 'dictatorship', 'thought police',
      'book burning', 'censorship', 'propaganda', 'brainwashing',
      'faction', 'divergent', 'hunger games', 'maze runner'
    ],
    weakKeywords: [
      'future society', 'controlled', 'oppression', 'resistance',
      'underground', 'rebels', 'survivors', 'outbreak'
    ],
    excludeIfPresent: ['history of', 'true story', 'actual events']
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
      'detective', 'investigation', 'murder', 'police',
      'fbi', 'cia', 'forensic', 'serial killer', 'conspiracy',
      'haunted', 'ghost story', 'paranormal thriller', 'supernatural horror',
      'zombie', 'vampire thriller'
    ],
    weakKeywords: [
      'mysterious', 'suspenseful', 'creepy', 'eerie'
    ],
    excludeIfPresent: ['true crime', 'criminology', 'criminal justice']
  },
  
  'Contemporary Fiction': {
    requiresFiction: true,
    exactMatches: [
      'contemporary fiction', 'literary fiction', 'general fiction',
      'women\'s fiction', 'book club fiction', 'domestic fiction',
      'family saga', 'coming of age', 'slice of life'
    ],
    strongKeywords: [
      'contemporary', 'modern day', 'present day',
      'family drama', 'relationship drama', 'marriage story'
    ],
    weakKeywords: [
      // Removed generic words that match too easily
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
      'love story', 'love affair', 'romantic relationship',
      'courtship', 'wedding romance', 'bride and groom',
      'soulmate', 'true love', 'happily ever after'
    ],
    weakKeywords: [
      // Removed overly generic words
      'passion', 'desire', 'chemistry'
    ],
    excludeIfPresent: ['self-help', 'relationship advice', 'marriage counseling']
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
    // Only match if explicitly marked as children's content
    exactMatches: [
      'children\'s fiction', 'childrens fiction', 'juvenile fiction',
      'children\'s', 'children', 'kids', 'juvenile',
      'picture book', 'early reader', 'chapter book', 'middle grade',
      'children\'s literature', 'kids book', 'bedtime story',
      'children\'s books', 'books for children', 'books for kids'
    ],
    strongKeywords: [
      // Only use very specific children's book terms
      // Removed generic terms that could match adult books
    ],
    weakKeywords: [
      // Removed all weak keywords to prevent false positives
    ],
    excludeIfPresent: ['young adult', 'ya', 'teen', 'parenting', 'child psychology', 'education'],
    // Special flag to require API genre match
    requiresApiMatch: true
  },
  
  'Biography / Memoir': {
    requiresFiction: false,
    requiresNonfiction: true,
    exactMatches: [
      'biography', 'autobiography', 'memoir', 'memoirs',
      'life story', 'personal narrative', 'oral history',
      'letters', 'diaries', 'journals', 'personal history',
      'personal memoirs' // Add this common variant
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
    excludeIfPresent: [] // Removed exclusions - biography/memoir is clear enough
  },
  
  'Anime': {
    requiresFiction: false,  // Can be fiction or nonfiction (manga, artbooks, guides)
    requiresNonfiction: false,
    exactMatches: [
      'anime', 'manga', 'japanese comics', 'light novel',
      'light novels', 'manhwa', 'manhua', 'japanese animation',
      'anime & manga', 'comics & graphic novels / manga'
    ],
    strongKeywords: [
      'shonen', 'shojo', 'shoujo', 'seinen', 'josei', 'isekai',
      'mecha', 'otaku', 'mangaka', 'japanese manga',
      'anime series', 'anime adaptation', 'visual novel',
      'kodansha', 'shueisha', 'viz media', 'tokyo pop',
      'one piece', 'naruto', 'dragon ball', 'attack on titan',
      'my hero academia', 'demon slayer'
    ],
    weakKeywords: [
      'japanese culture', 'tokyo', 'japan', 'japanese art',
      'illustration', 'graphic novel'
    ],
    excludeIfPresent: ['japanese history', 'travel guide japan', 'japanese language learning', 'japanese textbook']
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
      'Fantasy', 'Science Fiction', 'Dystopian', 'Mystery / Thriller', 
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
      'Cookbooks', 'Biography / Memoir', 'Anime'
    ]
  }
};

class MultiGenreCategoryService {
  constructor() {
    console.log('[MultiGenreCategoryService] Service initialized');
    console.log('[MultiGenreCategoryService] Allowed genres:', ALLOWED_GENRES);
  }

  /**
   * Get default genre based on category type
   * This ensures we ALWAYS have at least one genre
   */
  getDefaultGenre(categoryType) {
    return categoryType === 'Nonfiction' ? 'Nonfiction' : 'Contemporary Fiction';
  }

  /**
   * Main categorization method
   */
  categorizeBook(apiGenres = [], title = '', description = '', authors = []) {
    console.log('\n=== Multi-Genre Categorization Starting ===');
    console.log('Title:', title);
    console.log('Raw API Genres:', apiGenres);
    console.log('Authors:', authors);
    
    // Normalize input
    const normalizedApiGenres = this.normalizeGenres(apiGenres);
    console.log('Normalized Genres:', normalizedApiGenres);
    
    const allText = `${title} ${description} ${normalizedApiGenres.join(' ')}`.toLowerCase();
    
    // Step 1: Determine Fiction/Nonfiction
    const categoryType = this.determineCategoryType(normalizedApiGenres, allText);
    console.log('\nCategory Type Determined:', categoryType);
    
    // Step 2: Find all applicable genres
    const genreResults = this.findGenres(normalizedApiGenres, allText, categoryType, title);
    
    // Step 3: ENSURE we have at least one genre
    if (genreResults.genres.length === 0) {
      const defaultGenre = this.getDefaultGenre(categoryType);
      genreResults.genres = [defaultGenre];
      genreResults.reasons[defaultGenre] = [`Default ${categoryType.toLowerCase()} category (no specific genre matched)`];
      console.log(`No specific genres found, using default: ${defaultGenre}`);
    }
    
    // Step 4: Log reasoning
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
   * Normalize genres from API (handle objects, arrays, comma-separated, etc.)
   */
  normalizeGenres(apiGenres) {
    if (!apiGenres) return [];
    if (!Array.isArray(apiGenres)) return [String(apiGenres)];
    
    const normalized = [];
    
    apiGenres.forEach(genre => {
      if (typeof genre === 'object' && genre.name) {
        normalized.push(genre.name);
      } else {
        const genreStr = String(genre);
        // Split comma-separated genres
        // e.g., "Fiction, science fiction, action & adventure" becomes multiple genres
        if (genreStr.includes(',')) {
          const parts = genreStr.split(',').map(p => p.trim());
          normalized.push(...parts);
        } else {
          normalized.push(genreStr);
        }
      }
    });
    
    // Remove empty strings and clean up
    return normalized.filter(Boolean).map(g => g.trim());
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
    const genreScores = [];
    const genreReasons = {};
    
    // Check each possible genre
    for (const [genreName, rules] of Object.entries(GENRE_RULES)) {
      const reasons = [];
      let score = 0;
      
      // Check category type requirements
      if (rules.requiresFiction && categoryType !== 'Fiction') continue;
      if (rules.requiresNonfiction && categoryType !== 'Nonfiction') continue;
      
      // Special handling for Children's Fiction - ONLY match if API explicitly says children
      if (genreName === "Children's Fiction") {
        // Only check exact matches from API genres, not from description or title
        let childrenMatchFound = false;
        for (const exactMatch of rules.exactMatches) {
          const searchTerm = exactMatch.toLowerCase();
          if (apiGenres.some(g => {
            const genreLower = g.toLowerCase();
            // Must be an exact match or contain the term as a whole word
            return genreLower === searchTerm || 
                   genreLower.includes('children') || 
                   genreLower.includes('kids') || 
                   genreLower.includes('juvenile');
          })) {
            score += 100;
            reasons.push(`Children's genre from API: "${exactMatch}"`);
            childrenMatchFound = true;
            break; // One match is enough
          }
        }
        
        // If no children's genre from API, skip this genre entirely
        if (!childrenMatchFound) {
          continue;
        }
        
        // Check exclusions (YA books shouldn't be marked as children's)
        let excluded = false;
        for (const excludeWord of rules.excludeIfPresent) {
          if (apiGenres.some(g => g.toLowerCase().includes(excludeWord))) {
            excluded = true;
            reasons.push(`EXCLUDED: Found "${excludeWord}" - likely Young Adult`);
            console.log(`    [EXCLUSION] Children's Fiction excluded - found YA/Teen indicator`);
            break;
          }
        }
        
        if (!excluded && score > 0) {
          genreScores.push({
            genre: genreName,
            score: score,
            reasons: reasons
          });
          console.log(`  [CHILDREN'S MATCH] ${genreName}: Score = ${score}`);
        }
        continue; // Skip the rest of the normal processing for this genre
      }
      
      // Normal processing for all other genres
      // Check for exact matches (highest priority)
      let exactMatchFound = false;
      for (const exactMatch of rules.exactMatches) {
        const searchTerm = exactMatch.toLowerCase();
        if (apiGenres.some(g => g.toLowerCase() === searchTerm) ||
            apiGenres.some(g => g.toLowerCase().includes(searchTerm))) {
          score += 100;
          reasons.push(`Exact match from API: "${exactMatch}"`);
          exactMatchFound = true;
        }
      }
      
      // If we found an exact match, log it prominently
      if (exactMatchFound && score >= 100) {
        console.log(`  [EXACT MATCH] ${genreName}: Score = ${score}`);
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
          console.log(`    [EXCLUSION] ${genreName} excluded due to: "${excludeWord}"`);
          break;
        }
      }
      
      // Store genre with score if not excluded and has minimum score
      if (!excluded && score > 0) {
        genreScores.push({
          genre: genreName,
          score: score,
          reasons: reasons
        });
        if (!exactMatchFound) {
          console.log(`  ${genreName}: Score = ${score}`);
        }
      } else if (excluded) {
        console.log(`  ${genreName}: EXCLUDED (would have scored ${score})`);
      }
    }
    
    // Sort by score (highest first)
    genreScores.sort((a, b) => b.score - a.score);
    
    // Apply intelligent filtering
    const selectedGenres = this.selectTopGenres(genreScores, categoryType);
    
    // Build final results
    const finalGenres = [];
    const finalReasons = {};
    
    selectedGenres.forEach(item => {
      finalGenres.push(item.genre);
      finalReasons[item.genre] = item.reasons;
    });
    
    // Note: Default genre handling is now done in categorizeBook() method
    // to ensure we ALWAYS have at least one genre
    
    return {
      genres: finalGenres,
      reasons: finalReasons
    };
  }
  
  /**
   * Intelligently select top genres based on scores
   * Rules:
   * 1. Maximum 3 genres (usually 1-2)
   * 2. If top score is very high (>= 100), only include others if they're also high
   * 3. If scores are close, include multiple
   * 4. Minimum score threshold of 10 to be considered
   */
  selectTopGenres(genreScores, categoryType) {
    if (genreScores.length === 0) return [];
    
    const selected = [];
    const MIN_SCORE_THRESHOLD = 10; // Minimum score to be considered
    const MAX_GENRES = 3; // Maximum genres to assign
    
    // Always include the top scoring genre if it meets minimum threshold
    const topGenre = genreScores[0];
    if (topGenre.score >= MIN_SCORE_THRESHOLD) {
      selected.push(topGenre);
      console.log(`\nSelected primary genre: ${topGenre.genre} (score: ${topGenre.score})`);
      
      // Determine if we should include more genres
      for (let i = 1; i < genreScores.length && selected.length < MAX_GENRES; i++) {
        const candidate = genreScores[i];
        
        // Skip if below minimum threshold
        if (candidate.score < MIN_SCORE_THRESHOLD) {
          console.log(`  Skipping ${candidate.genre} - below minimum threshold (score: ${candidate.score})`);
          break;
        }
        
        // Calculate score ratio
        const scoreRatio = candidate.score / topGenre.score;
        
        // Include if:
        // 1. Score is at least 50% of top score (closely related)
        // 2. Has exact match (score >= 100)
        // 3. Score difference is less than 20 points for strong matches
        if (scoreRatio >= 0.5 || candidate.score >= 100 || (topGenre.score - candidate.score) < 20) {
          selected.push(candidate);
          console.log(`  Selected additional genre: ${candidate.genre} (score: ${candidate.score}, ratio: ${scoreRatio.toFixed(2)})`);
        } else {
          console.log(`  Skipping ${candidate.genre} - score too low relative to primary (score: ${candidate.score}, ratio: ${scoreRatio.toFixed(2)})`);
        }
      }
    }
    
    // Special case: Young Adult often pairs with another genre
    // If we have YA and one other genre, that's fine
    if (selected.length === 2 && selected.some(g => g.genre === 'Young Adult')) {
      console.log('  Keeping both genres (Young Adult pairs well with other genres)');
    }
    
    // Special case: Science Fiction and Dystopian often go together
    const hasSciFi = selected.some(g => g.genre === 'Science Fiction');
    const hasDystopian = selected.some(g => g.genre === 'Dystopian');
    if (hasSciFi && hasDystopian) {
      console.log('  Keeping both Science Fiction and Dystopian (common pairing)');
    }
    
    // Limit to maximum of 2 genres unless third is very strong
    if (selected.length > 2) {
      const thirdGenre = selected[2];
      if (thirdGenre.score < 50 && thirdGenre.score < topGenre.score * 0.3) {
        console.log(`  Removing third genre ${thirdGenre.genre} - not strong enough`);
        selected.pop();
      }
    }
    
    console.log(`Final selection: ${selected.map(g => g.genre).join(', ')}\n`);
    
    return selected;
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
