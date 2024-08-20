import React, { useState, useEffect, useRef } from 'react';
import { Box, Image } from "@chakra-ui/react";

const EnhancedZoomPreview = ({ zoomLevel, imageSrc, onZoomRegionChange }) => {
  const previewSize = 120;
  const [zoomBoxPosition, setZoomBoxPosition] = useState({ x: 50, y: 50 });
  const previewRef = useRef(null);

  const zoomBoxSize = previewSize / zoomLevel;

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return; // Only move when primary mouse button is pressed

    const rect = previewRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / previewSize) * 100;
    let newY = ((e.clientY - rect.top) / previewSize) * 100;

    // Constrain the zoom box within the preview
    newX = Math.max(0, Math.min(100 - (zoomBoxSize / previewSize) * 100, newX));
    newY = Math.max(0, Math.min(100 - (zoomBoxSize / previewSize) * 100, newY));

    setZoomBoxPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    if (onZoomRegionChange) {
      onZoomRegionChange({
        x: zoomBoxPosition.x / 100,
        y: zoomBoxPosition.y / 100,
        width: zoomBoxSize / previewSize,
        height: zoomBoxSize / previewSize
      });
    }
  }, [zoomBoxPosition, zoomBoxSize, onZoomRegionChange]);

  return (
    <Box 
      ref={previewRef}
      position="relative" 
      width={`${previewSize}px`} 
      height={`${previewSize}px`} 
      border="1px solid gray"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseMove}
    >
      <Image
        src={imageSrc}
        alt="Preview"
        objectFit="contain"
        width="100%"
        height="100%"
      />
      <Box
        position="absolute"
        top={`${zoomBoxPosition.y}%`}
        left={`${zoomBoxPosition.x}%`}
        width={`${zoomBoxSize}px`}
        height={`${zoomBoxSize}px`}
        border="2px solid red"
        pointerEvents="none"
        transform="translate(-50%, -50%)"
      />
    </Box>
  );
};

export default EnhancedZoomPreview;