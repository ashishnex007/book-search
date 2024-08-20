import React, {useEffect, useRef, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from 'jspdf';

import { CropperRef, Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

import { ArrowBackIcon, ArrowForwardIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Input, InputGroup, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Divider, Image as Imagex, Text, HStack,  useDisclosure, Tooltip} from "@chakra-ui/react";
import ZoomableRotatableImage from "../components/ZoomRotatableImage";

interface BookResult {
  id: number;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  source: string;
  matches: number;
  matchedPages: string[]; 
  highlightedImages?: {
    [key: string]: {
      image_url: string;
      text_url: string;
      text_filename: string;
    }
  };
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
    const { isOpen: isCropOpen, onOpen: onCropOpen, onClose: onCropClose } = useDisclosure();

    // * page controls
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [currentBookPage, setCurrentBookPage] = useState(1);
    const [bookPages, setBookPages] = useState<BookPage[]>([]);
    
    // * zoom controls
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotationAngle, setRotationAngle] = useState(0);

    const cropperRef = useRef<CropperRef>(null);

    // * highlighted images
    const [highlightedImages, setHighlightedImages] = useState<BookResult['highlightedImages']>({});
    const [highlightedImageIndex, setHighlightedImageIndex] = useState<number>(0);
    const [countHighlightedImages, setCountHighlightedImages] = useState<number>(0);

    // * book controls
    const [currentBook, setCurrentBook] = useState<BookResult>(book);
    const [currentBookIdx, setCurrentBookIdx] = useState<number>(currentBookIndex);

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

    const downloadCroppedImage = () => {
      if (cropperRef.current) {
        const canvas = cropperRef.current.getCanvas();
        if (canvas) {
          const croppedImage = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = croppedImage;
          link.download = 'cropped-image.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    };

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
          setHighlightedImages(currentBook.highlightedImages || {});
          if(currentBook.highlightedImages){
            setCountHighlightedImages(Object.keys(currentBook.highlightedImages).length);
            setHighlightedImageIndex(0);
          }
          const firstMatchedPageTitle = currentBook.matchedPages[0].split('/').pop()?.split('_')[1] || '';
          const initialPageIndex = response.data.findIndex((page) => page.pagetitle.includes(firstMatchedPageTitle));
          setCurrentBookPage(initialPageIndex !== -1 ? initialPageIndex + 1 : 1);
          setCurrentMatchIndex(0);
        } catch (error) {
          console.error("Error fetching book pages:", error);
        }
      };
  
      fetchBookPages();
    }, [currentBook.id, currentBook.matchedPages, currentBook.highlightedImages]);

    const handleMatchedPageChange = (newIndex: number) => {
      if (newIndex >= 0 && newIndex < currentBook.matchedPages.length) {
        setCurrentMatchIndex(newIndex);
        const matchedPageTitle = currentBook.matchedPages[newIndex].split('/').pop()?.split('_')[1] || '';
        const bookPageIndex = bookPages.findIndex(page => page.pagetitle.includes(matchedPageTitle));
        if (bookPageIndex !== -1) {
          setCurrentBookPage(bookPageIndex + 1);
        }
        // Update highlighted image index if this page has a highlighted version
        const highlightedImageIndex = Object.values(highlightedImages || {}).findIndex(
          img => img.image_url.includes(matchedPageTitle)
        );
        setHighlightedImageIndex(highlightedImageIndex !== -1 ? highlightedImageIndex : -1);
      }
    };
  
    const handleBookPageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= bookPages.length) {
        setCurrentBookPage(newPage);
        const currentPageTitle = bookPages[newPage - 1].pagetitle;
        // Check if this page is a matched page
        const matchedPageIndex = currentBook.matchedPages.findIndex(matchedPage => 
          matchedPage.includes(currentPageTitle)
        );
        if (matchedPageIndex !== -1) {
          setCurrentMatchIndex(matchedPageIndex);
        }
        // Check if this page has a highlighted version
        const highlightedImageIndex = Object.values(highlightedImages || {}).findIndex(
          img => img.image_url.includes(currentPageTitle)
        );
        setHighlightedImageIndex(highlightedImageIndex !== -1 ? highlightedImageIndex : -1);
      }
    };

    const currentPageImage = highlightedImageIndex !== -1 
      ? Object.values(highlightedImages || {})[highlightedImageIndex]?.image_url 
      : bookPages[currentBookPage - 1]?.image || '';
    const currentPageText = highlightedImageIndex !== -1
      ? Object.values(highlightedImages || {})[highlightedImageIndex]?.text_url
      : bookPages[currentBookPage - 1]?.txt_file || '';
    const isCurrentPageMatched = currentBook.matchedPages.some(matchedPage => matchedPage.includes(bookPages[currentBookPage - 1]?.pagetitle || ''));

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

              <Button colorScheme="teal" color="white" onClick={onCropOpen}>
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-crop"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 5v10a1 1 0 0 0 1 1h10" /><path d="M5 8h10a1 1 0 0 1 1 1v10" /></svg>
              </Button>

              <Modal
                isCentered
                onClose={onCropClose}
                isOpen={isCropOpen}
                motionPreset='slideInBottom'
                size='xl'
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Crop</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <div className="h-screen">
                      <Cropper ref={cropperRef} src={`http://127.0.0.1:8000${currentPageImage}`} />
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={onCropClose}>
                      Close
                    </Button>
                    <Button variant='ghost' onClick={downloadCroppedImage}>Download</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Button onClick={onOpen}>
                <DownloadIcon />

                <Modal isOpen={isOpen} onClose={onClose}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Download as</ModalHeader>
                    <ModalCloseButton />

                    <ModalBody className="flex justify-evenly">
                      <Tooltip label='Download this page as JPEG'>
                        <Button onClick={()=> downloadCurrentPage('image')}>Image (.jpg)</Button>
                      </Tooltip>
                      <Tooltip label='Download entire book as PDF'>
                        <Button onClick={()=> downloadCurrentPage('pdf')}>PDF (.pdf)</Button>
                      </Tooltip>
                      <Tooltip label='Download this page as Text file'>
                        <Button onClick={()=> downloadCurrentPage('text')}>Text (.txt)</Button>
                      </Tooltip>
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

          <div className="flex-1 overflow-y-auto p-4 bg-stone-200">
              <ZoomableRotatableImage
                src={`http://127.0.0.1:8000${currentPageImage}`}
                alt={`Page ${currentBookPage}`}
                zoomLevel={zoomLevel}
                rotationAngle={rotationAngle}
                crossOrigin="anonymous"
              />

            <Button
              position="absolute"
              left="350px"
              top="50%"
              transform="translateY(-100%)"
              onClick={() => handleMatchedPageChange(highlightedImageIndex  - 1)}
              isDisabled={highlightedImageIndex  === 0}
            >
              <ChevronLeftIcon />
            </Button>

            <Button
              position="absolute"
              right="30px"
              top="50%"
              transform="translateY(-100%)"
              onClick={() => handleMatchedPageChange(highlightedImageIndex  + 1)}
              isDisabled={highlightedImageIndex  === countHighlightedImages - 1}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          {isCurrentPageMatched && (
              <Text color="green.500" position="absolute" bottom="20px" fontWeight="bold" mt={2}>
                This page contains a match for your search term.
              </Text>
          )}

        </div>
      </div>
    </div>
  )
}

export default SearchResults;