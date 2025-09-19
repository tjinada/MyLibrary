const express = require('express');
const router = express.Router();

// Diagnostic endpoint to check service configuration
router.get('/config', (req, res) => {
  const config = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      USE_BISAC_MAPPING: process.env.USE_BISAC_MAPPING,
      USE_OPEN_LIBRARY: process.env.USE_OPEN_LIBRARY,
      GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY ? 'SET' : 'NOT SET',
    },
    server: {
      hostname: require('os').hostname(),
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
    },
    paths: {
      cwd: process.cwd(),
      dirname: __dirname,
      improvedCategoryServiceExists: require('fs').existsSync(require('path').join(__dirname, '../services/improvedCategoryService.js')),
      simpleCategoryServiceExists: require('fs').existsSync(require('path').join(__dirname, '../services/simpleCategoryMappingService.js')),
    },
    services: {
      bookMetadataService: 'Loaded',
      categorization: process.env.USE_BISAC_MAPPING !== 'false' ? 'BISAC' : 'ImprovedCategoryService (should be single category)',
    },
    expectedBehavior: {
      bisacEnabled: process.env.USE_BISAC_MAPPING !== 'false' ? 'Multiple genres possible' : 'Single category only',
      categoryFields: process.env.USE_BISAC_MAPPING !== 'false' ? 'genres (array), bisacCategories' : 'genres (single item array), primaryCategory, categoryType',
    }
  };

  res.json(config);
});

// Test categorization endpoint
router.post('/test-categorization', async (req, res) => {
  const { subjects, title, description } = req.body;
  
  try {
    // Load services fresh to ensure we're testing current configuration
    delete require.cache[require.resolve('../services/bookMetadataService')];
    delete require.cache[require.resolve('../services/improvedCategoryService')];
    
    const bookMetadataService = require('../services/bookMetadataService');
    const improvedCategoryService = require('../services/improvedCategoryService');
    
    console.log('\n=== Test Categorization Request ===');
    console.log('Subjects:', subjects);
    console.log('Title:', title);
    console.log('Description:', description);
    
    // Test improved category service directly
    const category = improvedCategoryService.categorizeBook(
      subjects || [],
      title || '',
      description || ''
    );
    
    const result = {
      configuration: {
        USE_BISAC_MAPPING: process.env.USE_BISAC_MAPPING,
        service: process.env.USE_BISAC_MAPPING !== 'false' ? 'BISAC' : 'ImprovedCategoryService',
      },
      directServiceTest: {
        category: category,
        categoryType: improvedCategoryService.getParentCategory(category),
      },
      warning: null
    };
    
    // Add warning if multiple categories detected
    if (Array.isArray(category)) {
      result.warning = 'ERROR: Service returned array instead of single category. Wrong service is being used!';
    }
    
    console.log('Test Result:', result);
    console.log('=== End Test ===\n');
    
    res.json(result);
  } catch (error) {
    console.error('Test categorization error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Check loaded modules
router.get('/loaded-modules', (req, res) => {
  const loadedModules = Object.keys(require.cache)
    .filter(path => path.includes('services') && !path.includes('node_modules'))
    .map(path => {
      const parts = path.split(/[\/\\]/);
      return parts[parts.length - 1];
    });
    
  res.json({
    serviceModules: loadedModules,
    categorySeviceLoaded: {
      improved: loadedModules.includes('improvedCategoryService.js'),
      simple: loadedModules.includes('simpleCategoryMappingService.js'),
    },
    warning: loadedModules.includes('simpleCategoryMappingService.js') ? 
      'Simple category service is loaded - this should not be used!' : null
  });
});

module.exports = router;
