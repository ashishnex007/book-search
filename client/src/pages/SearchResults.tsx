import React, {useEffect, useRef, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from 'jspdf';

import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import "react-image-crop/dist/ReactCrop.css";

import { ArrowBackIcon, ArrowForwardIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Input, InputGroup, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Divider, Image as Imagex, Text, HStack,  useDisclosure, Tooltip} from "@chakra-ui/react";
import { useDebounceEffect } from "../assets/constants/useDebounceEffect";
import { canvasPreview } from "../assets/constants/canvasPreview";
import ZoomableRotatableImage from "../components/ZoomRotatableImage";

interface BookResult {
    id: number;
    title: string;
    author: string;
    description: string;
    thumbnail: string;
    source: string;
    matches: number;
    matchedPages: string[]; // Array of image URLs for matched pages
}

interface BookPage {
  id: number;
  pagetitle: string;
  image: string;
  txt_file: string;
}

const SearchResults : React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    //@ts-ignore
    const { book, searchTerm, allBooks, currentBookIndex} = location.state as { book: BookResult; searchTerm: string, allBooks: BookResult[], currentBookIndex: number};
    const { isOpen, onOpen, onClose } = useDisclosure();

    // * page controls
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [currentBookPage, setCurrentBookPage] = useState(1);
    const [bookPages, setBookPages] = useState<BookPage[]>([]);
    
    // * zoom controls
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotationAngle, setRotationAngle] = useState(0);

    // * crop controls
    const [enableCrop, setEnableCrop] = useState(false);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // * book controls
    const [currentBook, setCurrentBook] = useState<BookResult>(book);
    const [currentBookIdx, setCurrentBookIdx] = useState<number>(currentBookIndex);

    useDebounceEffect(
      async () => {
        if ( completedCrop?.width && completedCrop?.height && imgRef.current && canvasRef.current ) {
          canvasPreview( imgRef.current, canvasRef.current, completedCrop )
        } }, 100, [completedCrop]
    );

    const handleZoomChange = (newZoom: number) => {
      setZoomLevel(newZoom);
    };

    const ZoomPreview: React.FC<{ zoomLevel: number }> = ({ zoomLevel }) => {
        const previewSize = 120;
        const zoomBoxSize = previewSize / zoomLevel;
        return (
          <Box position="relative" width={`${previewSize}px`} height={`${previewSize}px`} border="1px solid gray">
            <Imagex
              src={`http://127.0.0.1:8000${currentPageImage}`}
              alt="Preview"
              objectFit="contain"
              width="100%"
              height="100%"
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width={`${zoomBoxSize}px`}
              height={`${zoomBoxSize}px`}
              border="2px solid red"
              pointerEvents="none"
            />
          </Box>
        );
    };

    // ! FIX THIS
    const handleCropComplete = (crop: PixelCrop) => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.src = `http://127.0.0.1:8000${currentPageImage}`;
        image.onload = () => {
          canvas.width = crop.width;
          canvas.height = crop.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              image,
              crop.x,
              crop.y,
              crop.width,
              crop.height,
              0,
              0,
              crop.width,
              crop.height
            );
            const croppedImageUrl = canvas.toDataURL("image/jpeg");
            setCroppedImage(croppedImageUrl);
          }
        };
      }
    }

    const downloadCurrentPage = async(format: string) => {
      const imageUrl = `http://127.0.0.1:8000${currentPageImage}`;
      const textUrl = `http://127.0.0.1:8000${currentPageText}`;

      if (format === 'image') {
        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `page-${currentPageImage}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          });
      } else if (format === 'pdf') { // * whole book
        const pdf = new jsPDF();

        for(let i = 0; i < bookPages.length; i++){
          const image = new Image();
          const page = bookPages[i];
          image.crossOrigin = "anonymous";

          image.src = `http://127.0.0.1:8000${page.image}`;

          await new Promise((resolve) => {
            image.onload = resolve;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          ctx?.drawImage(image, 0, 0, image.width, image.height);

          // Convert the canvas to a data URL with reduced quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());

          if (i < bookPages.length - 1) {
            pdf.addPage();
          }
        }
        pdf.save('book.pdf');
      } else if (format === 'text') {
        fetch(textUrl)
        .then(response => response.text())
        .then(data => {
            const textUrl = window.URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
            const link = document.createElement('a');
            link.href = textUrl;
            link.download = `page-download-${currentPageText}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(textUrl);
        })
        .catch(error => {
            console.error('Error fetching the file:', error);
        });
      }
    };

    useEffect(() => {
      const fetchBookPages = async () => {
        try {
          const response = await axios.get<BookPage[]>(`http://127.0.0.1:8000/api/book/${currentBook.id}/pages/`);
          setBookPages(response.data);
          const firstMatchedPageTitle = currentBook.matchedPages[0].split('/').pop()?.split('_')[1] || '';
          const initialPageIndex = response.data.findIndex((page) => page.pagetitle.includes(firstMatchedPageTitle));
          setCurrentBookPage(initialPageIndex !== -1 ? initialPageIndex + 1 : 1);
        } catch (error) {
          console.error("Error fetching book pages:", error);
        }
      };
  
      fetchBookPages();
    }, [currentBook.id, currentBook.matchedPages]);

    const handlePreviousBook = () => {
      if (currentBookIdx > 0) {
        const newIndex = currentBookIdx - 1;
        setCurrentBookIdx(newIndex);
        setCurrentBook(allBooks[newIndex]);
        setCurrentMatchIndex(0);
      }
    };
  
    const handleNextBook = () => {
      if (currentBookIdx < allBooks.length - 1) {
        const newIndex = currentBookIdx + 1;
        setCurrentBookIdx(newIndex);
        setCurrentBook(allBooks[newIndex]);
        setCurrentMatchIndex(0);
      }
    };

    const handleMatchedPageChange = (newIndex: number) => {
      if (newIndex >= 0 && newIndex < book.matchedPages.length) {
        setCurrentMatchIndex(newIndex);
        const matchedPageTitle = book.matchedPages[newIndex].split('/').pop()?.split('_')[1] || '';
        const bookPageIndex = bookPages.findIndex(page => page.pagetitle.includes(matchedPageTitle));
        if (bookPageIndex !== -1) {
          setCurrentBookPage(bookPageIndex + 1);
        }
      }
    };
  
    const handleBookPageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= bookPages.length) {
        setCurrentBookPage(newPage);
        const matchedPageIndex = book.matchedPages.findIndex(matchedPage => 
          matchedPage.includes(bookPages[newPage - 1].pagetitle)
        );
        if (matchedPageIndex !== -1) {
          setCurrentMatchIndex(matchedPageIndex);
        }
      }
    };

  const currentPageImage = bookPages[currentBookPage - 1]?.image || '';
  const currentPageText = bookPages[currentBookPage - 1]?.txt_file || '';
  const isCurrentPageMatched = book.matchedPages.some(matchedPage => matchedPage.includes(bookPages[currentBookPage - 1]?.pagetitle || ''));

  return (
    <div>
      <div className="h-screen flex">
        <div className="w-1/5 flex flex-col">
          <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate("/search")}>
            <h1>Go back to search</h1>
          </Button>
          <Accordion defaultIndex={[0]} allowMultiple>
              <AccordionItem>
                  <AccordionButton>
                      <Box as='span' flex='1' textAlign='left'>
                          Zoom and Navigate
                      </Box>
                      <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                      <div className="flex justify-evenly">
                          <ZoomPreview zoomLevel={zoomLevel} />
                          <Slider
                              aria-label='zoom-slider'
                              defaultValue={0}
                              min={1}
                              max={10}
                              step={0.1}
                              orientation='vertical'
                              minH='32'
                              onChange={handleZoomChange}
                          >
                            <SliderTrack>
                                <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                          </Slider>
                          <div className="flex flex-col justify-evenly">
                            <Tooltip label='Rotate Left'>
                              <Button onClick={()=> {setRotationAngle(rotationAngle - 90)}}>
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-rotate-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5" /><path d="M18.37 7.16l0 .01" /><path d="M13 19.94l0 .01" /><path d="M16.84 18.37l0 .01" /><path d="M19.37 15.1l0 .01" /><path d="M19.94 11l0 .01" /></svg>
                              </Button>
                            </Tooltip>
                            <Tooltip label='Rotate Right'>
                              <Button onClick={()=> {setRotationAngle(rotationAngle + 90)}}>
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-rotate-clockwise-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 4.55a8 8 0 0 1 6 14.9m0 -4.45v5h5" /><path d="M5.63 7.16l0 .01" /><path d="M4.06 11l0 .01" /><path d="M4.63 15.1l0 .01" /><path d="M7.16 18.37l0 .01" /><path d="M11 19.94l0 .01" /></svg>
                              </Button>
                            </Tooltip>
                            <Tooltip label='Reset'>
                              <Button onClick={()=> {setRotationAngle(0)}}>
                                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-restore"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3.06 13a9 9 0 1 0 .49 -4.087" /><path d="M3 4.001v5h5" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>                              </Button>
                            </Tooltip>
                          </div>
                      </div>
                  </AccordionPanel>
              </AccordionItem>
              <Divider />
              <AccordionItem>
                  <AccordionButton>
                      <Box as='span' flex='1' textAlign='left'>
                          Pages
                      </Box>
                      <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text>Matches in the page</Text>

                    <HStack justifyContent="space-between" className="py-4">
                      <Button
                        onClick={() => handleMatchedPageChange(currentMatchIndex - 1)}
                        isDisabled={currentMatchIndex === 0}
                      >
                          <ArrowBackIcon />
                      </Button>

                      <InputGroup size="sm" className="flex justify-center gap-x-4">
                        <Input
                          value={currentMatchIndex + 1}
                          onChange={(e) => handleMatchedPageChange(Number(e.target.value) - 1)}
                          width="3rem"
                        />
                        <Input value={book.matchedPages.length} isReadOnly width="3rem" ml={-1} />
                      </InputGroup>

                      <Button
                        onClick={() => handleMatchedPageChange(currentMatchIndex + 1)}
                        isDisabled={currentMatchIndex === book.matchedPages.length - 1}
                      >
                        <ArrowForwardIcon />
                      </Button>
                    </HStack>

                    <Text mt={4}>Pages in the book</Text>

                    <HStack justifyContent="space-between" className="py-4">
                      <Button 
                        onClick={() => handleBookPageChange(currentBookPage - 1)} 
                        isDisabled={currentBookPage === 1}
                      >
                        <ArrowBackIcon />
                      </Button>

                      <InputGroup size="sm" className="flex justify-center gap-x-4">
                        <Input 
                          value={currentBookPage}
                          onChange={(e) => handleBookPageChange(Number(e.target.value))}
                          width="3rem"
                        />
                        <Input value={bookPages.length} isReadOnly width="3rem" ml={-1} />
                      </InputGroup>

                      <Button 
                        onClick={() => handleBookPageChange(currentBookPage + 1)} 
                        isDisabled={currentBookPage === bookPages.length}
                      >
                        <ArrowForwardIcon />
                      </Button>
                    </HStack>
                  </AccordionPanel>
              </AccordionItem>
          </Accordion>
        </div>
        
        <div className="w-4/5 flex flex-col">
          <div className="h-16 flex items-center justify-between px-4">

            <div>
              <Text fontWeight="bold">{currentBook.title}</Text>
              <Text>{currentBook.description}</Text>
            </div>

            <HStack>
              <Button leftIcon={<ArrowBackIcon />} onClick={handlePreviousBook} isDisabled={currentBookIdx === 0}>
                Previous Book
              </Button>
              <Button rightIcon={<ArrowForwardIcon />} onClick={handleNextBook} isDisabled={currentBookIdx === allBooks.length - 1}>
                Next Book
              </Button>
              <Button onClick={() => setEnableCrop(!enableCrop)} colorScheme={`${enableCrop ? "teal" : "gray"}`} color={`${enableCrop ? "white" : "black"}`}>
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-crop"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 5v10a1 1 0 0 0 1 1h10" /><path d="M5 8h10a1 1 0 0 1 1 1v10" /></svg>
              </Button>
              <Button onClick={onOpen}>
                <DownloadIcon />

                <Modal isOpen={isOpen} onClose={onClose}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Download as</ModalHeader>
                    <ModalCloseButton />

                    <ModalBody className="flex justify-evenly">
                      <Button onClick={()=> downloadCurrentPage('image')}>Image (.jpg)</Button>
                      <Button onClick={()=> downloadCurrentPage('pdf')}>PDF (.pdf)</Button>
                      <Button onClick={()=> downloadCurrentPage('text')}>Text (.txt)</Button>
                    </ModalBody>

                    <ModalFooter>
                      <Button colorScheme='blue' mr={3} onClick={onClose}>
                        Close
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

              </Button>
            </HStack>
          </div>

          {/* {// *  main content} */}

          {!!completedCrop && (
            <>
                <div>
                    <canvas
                        hidden
                        ref={canvasRef}
                        style={{
                            width: completedCrop.width,
                            height: completedCrop.height,
                        }}
                    />
                </div>
            </>
          )}

          <div className="flex-1 overflow-y-auto p-4 bg-stone-200">
            {/* <ReactCrop
              crop={enableCrop ? crop : undefined }
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(crop) => {
                setCompletedCrop(crop);
                handleCropComplete(crop);
              }}
              className="max-w-full max-h-full"
            > */}
              <ZoomableRotatableImage
                src={`http://127.0.0.1:8000${currentPageImage}`}
                alt={`Page ${currentBookPage}`}
                zoomLevel={zoomLevel}
                rotationAngle={rotationAngle}
                crossOrigin="anonymous"
              />
            {/* </ReactCrop>             */}

            <Button
              position="absolute"
              left="350px"
              top="50%"
              transform="translateY(-100%)"
              onClick={() => handleMatchedPageChange(currentMatchIndex - 1)}
              isDisabled={currentMatchIndex === 0}
            >
              <ChevronLeftIcon />
            </Button>

            <Button
              position="absolute"
              right="30px"
              top="50%"
              transform="translateY(-100%)"
              onClick={() => handleMatchedPageChange(currentMatchIndex + 1)}
              isDisabled={currentMatchIndex === book.matchedPages.length - 1}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          {isCurrentPageMatched && (
              <Text color="green.500" position="absolute" bottom="20px" fontWeight="bold" mt={2}>
                This page contains a match for your search term.
              </Text>
          )}

          {croppedImage && (
            <Modal isOpen={true} onClose={() => setCroppedImage(null)}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Cropped Image</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Imagex src={croppedImage} alt="Cropped" />
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = croppedImage;
                      link.download = `cropped-page-${currentPageImage}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setCroppedImage(null);
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={() => setCroppedImage(null)}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResults;
