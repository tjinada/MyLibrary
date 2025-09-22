import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

/**
 * Generates a composite cover image from multiple book covers
 * Creates a 2x2 grid layout similar to book series collections
 */
const CompositeImageGenerator = ({ 
  bookCovers = [], 
  width = 400, 
  height = 600,
  onImageGenerated,
  gap = 4, // Gap between images in pixels
  backgroundColor = '#f5f5f5'
}) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  useEffect(() => {
    if (bookCovers.length > 0) {
      generateCompositeImage();
    }
  }, [bookCovers]);

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for external images
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        // Return a placeholder or null on error
        resolve(null);
      };
      img.src = src;
    });
  };

  const generateCompositeImage = async () => {
    if (!canvasRef.current || bookCovers.length === 0) return;

    setLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas and set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    try {
      // Load all images
      const imagePromises = bookCovers.slice(0, 4).map(cover => loadImage(cover));
      const loadedImages = await Promise.all(imagePromises);
      
      // Filter out failed images
      const validImages = loadedImages.filter(img => img !== null);
      
      if (validImages.length === 0) {
        console.error('No valid images to create composite');
        setLoading(false);
        return;
      }
      
      // Calculate grid dimensions based on number of images
      let gridCols, gridRows;
      if (validImages.length === 1) {
        gridCols = 1;
        gridRows = 1;
      } else if (validImages.length === 2) {
        gridCols = 2;
        gridRows = 1;
      } else if (validImages.length === 3) {
        gridCols = 2;
        gridRows = 2;
      } else {
        gridCols = 2;
        gridRows = 2;
      }
      
      // Calculate individual cell dimensions
      const cellWidth = (width - gap * (gridCols - 1)) / gridCols;
      const cellHeight = (height - gap * (gridRows - 1)) / gridRows;
      
      // Draw images in grid
      validImages.forEach((img, index) => {
        if (!img) return;
        
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        
        const x = col * (cellWidth + gap);
        const y = row * (cellHeight + gap);
        
        // Calculate scaling to maintain aspect ratio and cover the cell
        const imgAspect = img.width / img.height;
        const cellAspect = cellWidth / cellHeight;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        
        if (imgAspect > cellAspect) {
          // Image is wider than cell - crop horizontally
          sourceWidth = img.height * cellAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller than cell - crop vertically
          sourceHeight = img.width / cellAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Add a subtle shadow/border effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw the image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
          x, y, cellWidth, cellHeight // Destination rectangle
        );
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Add a subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = gap / 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      });
      
      // Add overall border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setGeneratedUrl(dataUrl);
      
      // Notify parent component
      if (onImageGenerated) {
        onImageGenerated(dataUrl);
      }
    } catch (error) {
      console.error('Error generating composite image:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadComposite = () => {
    if (!generatedUrl) return;
    
    const link = document.createElement('a');
    link.download = 'collection-cover.jpg';
    link.href = generatedUrl;
    link.click();
  };

  return (
    <Box sx={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: loading ? 'none' : 'block',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default CompositeImageGenerator;
