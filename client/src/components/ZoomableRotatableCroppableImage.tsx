import React from 'react';
import ReactCrop from 'react-image-crop';
import { Image as ChakraImage } from "@chakra-ui/react";

const ZoomableRotatableCroppableImage = ({ 
  src, 
  alt, 
  zoomLevel, 
  rotationAngle, 
  enableCrop,
  crop,
  onCropChange,
  onCropComplete,
  ...props 
}) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <ReactCrop
        crop={enableCrop ? crop : undefined}
        onChange={onCropChange}
        onComplete={onCropComplete}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ChakraImage
          src={src}
          alt={alt}
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
            transformOrigin: 'center center',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          {...props}
        />
      </ReactCrop>
    </div>
  );
};

export default ZoomableRotatableCroppableImage;