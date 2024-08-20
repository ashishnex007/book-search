import { Image as ChakraImage } from "@chakra-ui/react";

const ZoomableRotatableImage = ({ src, alt, zoomLevel, rotationAngle, ...props }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'scroll'
    }}>
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
    </div>
  );
};

export default ZoomableRotatableImage;