import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Rating,
  Skeleton,
} from '@mui/material';
import { MenuBook as BookIcon } from '@mui/icons-material';

const BookCard = ({ book, onClick }) => {
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const imageRef = useRef(null);
  const mountedRef = useRef(true);

  // Keep track of whether component is mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'to-read':
        return 'info';
      case 'reading':
        return 'primary';
      case 'read':
        return 'success';
      case 'loaned':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'read':
        return 'Read';
      case 'loaned':
        return 'Loaned';
      default:
        return status;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  // Get high quality cover URL
  const getHighQualityCover = (url) => {
    if (!url) return null;
    
    // Ensure HTTPS
    let cleanUrl = url;
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
    
    // If it's a Google Books URL, ensure we're getting high quality
    if (cleanUrl.includes('books.google.com') || cleanUrl.includes('googleapis.com')) {
      // Replace zoom parameter with zoom=0 for full resolution
      if (cleanUrl.includes('zoom=')) {
        cleanUrl = cleanUrl.replace(/zoom=\d+/, 'zoom=0');
      } else if (cleanUrl.includes('?')) {
        cleanUrl += '&zoom=0';
      } else {
        cleanUrl += '?zoom=0';
      }
    }
    
    return cleanUrl;
  };

  // Get all possible image URLs for this book (ordered by preference)
  const getImageUrls = () => {
    const urls = [];
    
    // 1. Primary cover image (high quality) - this should be the saved selection
    if (book.coverImage) {
      // Ensure the saved cover is properly formatted
      let savedCover = book.coverImage;
      
      // Ensure HTTPS
      if (savedCover.startsWith('http://')) {
        savedCover = savedCover.replace('http://', 'https://');
      }
      
      // Don't modify zoom parameter if it's already set (respect user's selection)
      urls.push(savedCover);
      
      // If the saved cover is from Google Books, also try with different zoom levels
      if (savedCover.includes('googleapis.com') || savedCover.includes('books.google.com')) {
        // Try the exact URL first, then alternatives
        if (!savedCover.includes('zoom=0')) {
          const highQualityUrl = savedCover.includes('zoom=') 
            ? savedCover.replace(/zoom=\d+/, 'zoom=0')
            : savedCover + (savedCover.includes('?') ? '&zoom=0' : '?zoom=0');
          urls.push(highQualityUrl);
        }
      }
    }
    
    // 2. Google Books direct API (high quality)
    if (book.googleBooksId) {
      urls.push(`https://books.google.com/books/content?id=${book.googleBooksId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`);
    }
    
    // 3. Open Library (Large)
    if (book.isbn) {
      urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
    }
    
    // 4. Google Books lower quality with zoom=1
    if (book.coverImage && book.coverImage.includes('googleapis.com')) {
      const lowerQualityUrl = book.coverImage.includes('zoom=') 
        ? book.coverImage.replace(/zoom=\d+/, 'zoom=1')
        : book.coverImage + (book.coverImage.includes('?') ? '&zoom=1' : '?zoom=1');
      urls.push(lowerQualityUrl);
    }
    
    // 5. Open Library (Medium)
    if (book.isbn) {
      urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`);
    }
    
    // 6. Google Books thumbnail
    if (book.googleBooksId) {
      urls.push(`https://books.google.com/books/content?id=${book.googleBooksId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`);
    }
    
    // 7. Open Library (Small) as last resort
    if (book.isbn) {
      urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`);
    }
    
    // 8. Try alternate ISBN formats (ISBN-13 to ISBN-10 or vice versa)
    if (book.isbn) {
      // If we have ISBN-13, try ISBN-10
      if (book.isbn.length === 13 && book.isbn.startsWith('978')) {
        const isbn10 = book.isbn.substring(3, 12); // Remove first 3 digits and last check digit
        urls.push(`https://covers.openlibrary.org/b/isbn/${isbn10}-M.jpg`);
      }
      // If we have ISBN-10, try ISBN-13 with 978 prefix
      else if (book.isbn.length === 10) {
        const isbn13 = '978' + book.isbn.substring(0, 9); // Add 978 prefix, remove check digit
        urls.push(`https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`);
      }
    }
    
    // 9. Try searching by title and author as absolute last resort
    if (book.title && book.authors && book.authors.length > 0) {
      const query = encodeURIComponent(`${book.title} ${book.authors[0]}`);
      // This is a hack - we'll try to get a Google Books search result thumbnail
      urls.push(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    }
    
    return urls.filter(Boolean);
  };

  // Load image with fallback logic
  useEffect(() => {
    // First, try the book's saved cover image
    if (book.coverImage) {
      console.log(`Loading cover for "${book.title}":`, book.coverImage);
    }
    
    const urls = getImageUrls();
    if (urls.length === 0) {
      setImageStatus('error');
      return;
    }

    let currentIndex = 0;
    let isCancelled = false;

    const tryLoadImage = (url) => {
      if (isCancelled || !mountedRef.current) return;
      
      console.log(`Trying to load image ${currentIndex + 1}/${urls.length}: ${url}`);

      // Special handling for Google Books API search (last resort)
      if (url.includes('googleapis.com/books/v1/volumes?q=')) {
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data.items && data.items.length > 0 && data.items[0].volumeInfo?.imageLinks?.thumbnail) {
              const thumbnailUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
              tryLoadImage(thumbnailUrl);
            } else {
              tryNextUrl();
            }
          })
          .catch(() => tryNextUrl());
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        if (!isCancelled && mountedRef.current) {
          // Check if the image is actually valid (not a 1x1 pixel or placeholder)
          if (img.width > 1 && img.height > 1) {
            console.log(`Successfully loaded image for "${book.title}"`);
            setCurrentImageUrl(url);
            setImageStatus('loaded');
          } else {
            console.log('Image too small, trying next...');
            tryNextUrl();
          }
        }
      };

      img.onerror = () => {
        if (isCancelled || !mountedRef.current) return;
        console.log(`Failed to load image, trying next...`);
        tryNextUrl();
      };

      const tryNextUrl = () => {
        currentIndex++;
        if (currentIndex < urls.length) {
          // Add a small delay between attempts to avoid rate limiting
          setTimeout(() => {
            tryLoadImage(urls[currentIndex]);
          }, 100);
        } else {
          // All URLs failed
          console.log(`All image sources failed for "${book.title}"`);
          setImageStatus('error');
        }
      };

      // Start loading
      img.src = url;
    };

    // Start with the first URL
    setImageStatus('loading');
    tryLoadImage(urls[0]);

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [book.coverImage, book.isbn, book.googleBooksId, book.title]); // Re-run if book data changes

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardActionArea 
        onClick={handleClick} 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Book Cover */}
        <Box sx={{ 
          position: 'relative',
          height: 280,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Loading skeleton */}
          {imageStatus === 'loading' && (
            <Skeleton 
              variant="rectangular" 
              animation="wave"
              sx={{ 
                position: 'absolute',
                width: '100%', 
                height: '100%',
              }} 
            />
          )}
          
          {/* Error/No image fallback - create a custom book cover */}
          {imageStatus === 'error' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                bgcolor: 'primary.light',
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                p: 2,
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {book.title}
              </Typography>
              <BookIcon 
                sx={{ 
                  fontSize: 60,
                  color: 'white',
                  opacity: 0.7,
                  my: 1,
                }} 
              />
              {book.authors && book.authors[0] && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    opacity: 0.9,
                    textAlign: 'center',
                    fontSize: '0.7rem',
                  }}
                >
                  {book.authors[0]}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Loaded image */}
          {imageStatus === 'loaded' && currentImageUrl && (
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt={book.title}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                backgroundColor: '#f5f5f5',
                padding: '8px',
              }}
              loading="lazy"
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            gutterBottom 
            variant="subtitle1" 
            component="h3"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '3em',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
            title={book.title}
          >
            {book.title}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1,
            }}
            title={book.authors?.join(', ')}
          >
            {book.authors?.join(', ') || 'Unknown Author'}
          </Typography>

          <Box sx={{ mt: 'auto', pt: 1 }}>
            {book.rating ? (
              <Rating 
                value={book.rating} 
                readOnly 
                size="small" 
                sx={{ mb: 1 }}
              />
            ) : null}
            
            <Chip 
              label={getStatusLabel(book.status)} 
              size="small" 
              color={getStatusColor(book.status)}
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BookCard;
