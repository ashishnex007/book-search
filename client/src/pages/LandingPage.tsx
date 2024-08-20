import { Button } from "@chakra-ui/react";
import hero from "../assets/images/6.jpg";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
  return (
    <div className="h-screen">
      <div></div>
      <div className="flex justify-evenly items-center h-[90vh]">
        <div className="">
            <h1 className="font-semibold text-4xl">Search Engine for</h1>
            <h1 className="font-semibold text-4xl">Punjab Vidhan Sabha</h1>
            <div className="py-4">
                <Button colorScheme='blue' onClick={()=>navigate("/search")}>Get started</Button>
            </div>
        </div>
        <div>
            <img src={hero} />
        </div>
      </div>
    </div>
  )
}

export default LandingPage;
