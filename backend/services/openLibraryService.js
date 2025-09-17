const axios = require('axios');

class OpenLibraryService {
  constructor() {
    // Use the Books API endpoint which is much more efficient and less rate-limited
    this.booksApiURL = 'https://openlibrary.org/api/books';
  }

  /**
   * Search for a book by ISBN using the Books API
   * This API is more efficient and has better rate limits than the individual book endpoints
   * @param {string} isbn - ISBN-10 or ISBN-13
   * @returns {Object} Book subjects data or null
   */
  async searchByISBN(isbn) {
    try {
      // Clean ISBN (remove dashes and spaces)
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      console.log(`Fetching Open Library data for ISBN: ${cleanISBN}`);
      
      // Use the Books API with ISBN as the bibkey
      // This API is specifically designed for this use case and has better rate limits
      const response = await axios.get(this.booksApiURL, {
        params: {
          bibkeys: `ISBN:${cleanISBN}`,
          jscmd: 'data',
          format: 'json'
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'MyLibrary/1.0 (Personal Library Management)'
        }
      });
      
      // The response is an object with ISBN as key
      const bookKey = `ISBN:${cleanISBN}`;
      const bookData = response.data[bookKey];
      
      if (!bookData) {
        console.log('No data found in Open Library for this ISBN');
        return null;
      }

      // Extract subjects from the response
      const subjects = [];
      const subjectPlaces = [];
      const subjectPeople = [];
      
      // Process subjects array
      if (bookData.subjects && Array.isArray(bookData.subjects)) {
        bookData.subjects.forEach(subject => {
          if (subject.name) {
            subjects.push(subject.name);
          }
        });
      }
      
      // Process subject places
      if (bookData.subject_places && Array.isArray(bookData.subject_places)) {
        bookData.subject_places.forEach(place => {
          if (place.name) {
            subjectPlaces.push(place.name);
          }
        });
      }
      
      // Process subject people
      if (bookData.subject_people && Array.isArray(bookData.subject_people)) {
        bookData.subject_people.forEach(person => {
          if (person.name) {
            subjectPeople.push(person.name);
          }
        });
      }
      
      // Return processed subject data
      return {
        subjects: [...new Set(subjects)], // Remove duplicates
        subject_places: subjectPlaces,
        subject_people: subjectPeople,
        subject_times: [], // This field is not in the Books API response
        // Include additional metadata that might be useful
        title: bookData.title,
        authors: bookData.authors ? bookData.authors.map(a => a.name) : [],
        publishers: bookData.publishers ? bookData.publishers.map(p => p.name) : [],
        publish_date: bookData.publish_date
      };
      
    } catch (error) {
      // Fail silently - we still have Google data
      if (error.response?.status === 429) {
        console.log(`Open Library rate limit exceeded for ISBN ${isbn}. Using Google Books data only.`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`Open Library request timeout for ISBN ${isbn}. Using Google Books data only.`);
      } else {
        console.log(`Open Library fetch failed for ISBN ${isbn}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Batch search for multiple ISBNs (more efficient)
   * @param {Array<string>} isbns - Array of ISBNs
   * @returns {Object} Map of ISBN to book data
   */
  async searchByISBNBatch(isbns) {
    try {
      if (!isbns || isbns.length === 0) {
        return {};
      }
      
      // Clean ISBNs and create bibkeys
      const bibkeys = isbns
        .map(isbn => `ISBN:${isbn.replace(/[-\s]/g, '')}`)
        .join(',');
      
      console.log(`Fetching Open Library data for ${isbns.length} ISBNs in batch`);
      
      const response = await axios.get(this.booksApiURL, {
        params: {
          bibkeys: bibkeys,
          jscmd: 'data',
          format: 'json'
        },
        timeout: 10000, // Longer timeout for batch requests
        headers: {
          'User-Agent': 'MyLibrary/1.0 (Personal Library Management)'
        }
      });
      
      const results = {};
      
      // Process each book in the response
      for (const [key, bookData] of Object.entries(response.data)) {
        // Extract ISBN from the key (format: "ISBN:123456789")
        const isbn = key.replace('ISBN:', '');
        
        if (!bookData) {
          results[isbn] = null;
          continue;
        }
        
        const subjects = [];
        const subjectPlaces = [];
        const subjectPeople = [];
        
        // Process subjects
        if (bookData.subjects && Array.isArray(bookData.subjects)) {
          bookData.subjects.forEach(subject => {
            if (subject.name) {
              subjects.push(subject.name);
            }
          });
        }
        
        // Process subject places
        if (bookData.subject_places && Array.isArray(bookData.subject_places)) {
          bookData.subject_places.forEach(place => {
            if (place.name) {
              subjectPlaces.push(place.name);
            }
          });
        }
        
        // Process subject people
        if (bookData.subject_people && Array.isArray(bookData.subject_people)) {
          bookData.subject_people.forEach(person => {
            if (person.name) {
              subjectPeople.push(person.name);
            }
          });
        }
        
        results[isbn] = {
          subjects: [...new Set(subjects)],
          subject_places: subjectPlaces,
          subject_people: subjectPeople,
          subject_times: [],
          title: bookData.title,
          authors: bookData.authors ? bookData.authors.map(a => a.name) : [],
          publishers: bookData.publishers ? bookData.publishers.map(p => p.name) : [],
          publish_date: bookData.publish_date
        };
      }
      
      return results;
      
    } catch (error) {
      console.log(`Open Library batch fetch failed:`, error.message);
      return {};
    }
  }
}

module.exports = new OpenLibraryService();
