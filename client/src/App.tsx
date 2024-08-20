import {Routes, Route} from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import Contact from "./pages/Contact";
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />}/>
        <Route path="/search" element={<Home />}/>
        <Route path="/view" element={<SearchResults />}/>
        <Route path="/contact" element={<Contact />} />
      </Routes>
      {/* <Footer /> */}
    </>
  )
}

export default App;
