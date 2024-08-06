import {Routes, Route} from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
// import Footer from "./components/Footer";
import SearchResults from "./pages/SearchResults";
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />}/>
        <Route path="/search" element={<Home />}/>
        <Route path="/view" element={<SearchResults />}/>
      </Routes>
      {/* <Footer /> */}
    </>
  )
}

export default App;
