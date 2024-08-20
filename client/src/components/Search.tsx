import { useState } from "react";
import axios from "axios";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Input, InputGroup, InputLeftElement, Select, Flex, RadioGroup, Stack, Radio, Switch } from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";

interface BookDetails {
  id: number;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  source: string;
};

interface SearchResult {
  id: number;
  pagetitle: string;
  image: string;
  txt_file: string;
  book: BookDetails;
}

interface BookResult extends BookDetails {
  matches: number;
  matchedPages: string[];
}

interface SearchProps {
  onSearchResults: (results: BookResult[], searchTerm: string) => void;
}

const Search: React.FC<SearchProps> = ({ onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookType, setBookType] = useState("all");
  const [sort, setSort] = useState("date");
  const [searchType, setSearchType] = useState("normal");
  const [allWords, setAllWords] = useState(true); //* reduce_type = "and"
  const [exactMatch, setExactMatch] = useState(true); //* exact_match = "on"

  const handleSearch = async() => {
    try {
      const response = await axios.get<SearchResult[]>(`http://127.0.0.1:8000/api/search/?q=${searchTerm}&reduce_type=${allWords?"and":"or"}&exact_match=${allWords?"on":"off"}`);
      
      const bookMap = new Map<number, BookResult>();
      
      response.data.forEach(result => {
        const { book, image } = result;
        
        if (!bookMap.has(book.id)) {
          bookMap.set(book.id, {
            ...book,
            title: book.title.replace(/<\/?tit>/g, ''),
            author: book.author.replace(/<\/?auth>/g, ''),
            description: book.description.replace(/<\/?desc>/g, ''),
            matches: 1,
            matchedPages: [image]
          });
        } else {
          const existingBook = bookMap.get(book.id);
          if (existingBook) {
            existingBook.matches += 1;
            if (!existingBook.matchedPages.includes(image)) {
              existingBook.matchedPages.push(image);
            }
          }
        }
      });

      let bookResults = Array.from(bookMap.values());

      // * filter the results
      if(bookType !== "all"){
        bookResults = bookResults.filter(book => book.source === bookType);
      }

      // * sort the results
      if(sort === "alpha"){
        bookResults = bookResults.sort((a, b) => a.title.localeCompare(b.title));
      }else if(sort === "matches"){
        bookResults = bookResults.sort((a, b) => b.matches - a.matches);
      }else{ // * based on date
        //@ts-ignore
        bookResults = bookResults.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      // New API call to get highlighted images
      const highlightedImagesResponse = await axios.post('http://127.0.0.1:8000/api/matched_images/', {
        record_id: 1, // Adjust if needed
        q: searchTerm,
        reduce_type: allWords ? "and" : "or",
        exact_match: allWords ? "on" : "off"
      });

      console.log(highlightedImagesResponse.data.diction);
      const highlightedImagesArray = Object.values(highlightedImagesResponse.data.diction);
      console.log(highlightedImagesArray);

      // Add highlighted images to book results
      bookResults = bookResults.map(book => ({
        ...book,
        highlightedImages: highlightedImagesArray
      }));

      console.log(bookResults[0]?.highlightedImages);

      onSearchResults(bookResults, searchTerm);
    } catch (error) {
      console.error("Error in search:", error);
    }
  };

  return (
    <Box borderBottom="2px" borderColor="slate.300">
      <Accordion allowMultiple>
        <AccordionItem>
          <Flex justifyContent="center" alignItems="center" mb={4}>
            <Select
              value={bookType}
              onChange={(e) => setBookType(e.target.value)}
              width="10rem"
              mr={4}
            >
              <option value="all">All</option>
              <option value="review">Review</option>
              <option value="debate">Debate</option>
              <option value="resume">Resume</option>
            </Select>
            <InputGroup width="40rem" mr={4}>
              <InputLeftElement pointerEvents="none">
                <FaSearch />
              </InputLeftElement>
              <Input
                placeholder="Enter a keyword to search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Button colorScheme="teal" size="lg" onClick={handleSearch} mr={4}>
              Search
            </Button>

            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              width="17rem"
              mr={4}
            >
              <option value="date">Sort by: Date</option>
              <option value="alpha">Sort by: Alphabetical</option>
              <option value="macthes">Sort by: Matches</option>
            </Select>

            <AccordionButton
              as={Button}
              rightIcon={<AccordionIcon />}
              variant="outline"
              width="auto"
            >
              Search Options
            </AccordionButton>
          </Flex>
          <AccordionPanel pb={4}>
            <div className="flex justify-evenly">
              <div className="flex gap-x-2">
                  <h1>All Words</h1>
                  <Switch
                    size='md'
                    isChecked={allWords}
                    onChange={() => setAllWords(!allWords)}
                  />
              </div>
              <div className="flex gap-x-2">
                  <h1>Exact Match</h1>
                  <Switch
                    size='md'
                    isChecked={exactMatch}
                    onChange={() => setExactMatch(!exactMatch)}
                  />
              </div>
              <div className="flex gap-x-8">
                  <h1>Search Type</h1>
                  <RadioGroup onChange={setSearchType} value={searchType}>
                      <Stack direction='row'>
                          <Radio value='normal'>Normal</Radio>
                          <Radio value='multilingual'>Multilingual</Radio>
                          <Radio value='fuzzy'>Fuzzy</Radio>
                      </Stack>
                  </RadioGroup>
              </div>
              <div className="flex gap-x-4">
                <div className="flex items-center gap-x-2">
                  <h1>From</h1>
                  <input type="date" />
                </div>
                <div className="flex items-center gap-x-2">
                  <h1>To</h1>
                  <input type="date" />
                </div>
              </div>
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

export default Search;