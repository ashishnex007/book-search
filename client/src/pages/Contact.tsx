import Navbar from "../components/Navbar"

const Contact = () => {
  return (
    <>
        <Navbar />
        <div className="flex justify-center h-[90vh] items-center">
        <div className="flex w-[70vw] h-[70vh]">
            <div className="w-1/2 bg-slate-100">
                <h1 className="text-3xl p-4">Contact Details</h1>
            </div>
            <div className="w-1/2 bg-gray-200">
                <div className="flex flex-col p-4 pt-12">
                    <h1>Center for Visual Information Technology</h1>
                    <h1> International Institute of Information Technology</h1>
                    <h1>Gachibowli, Hyderabad</h1>
                    <h1> Telangana - 500032</h1>
                </div>
                <div className="p-4">
                    <h1>+91-40-6653-1255</h1>
                    <h1>+91-40-6653-1413</h1>
                    <h1>cvitocr [at] gmail [dot] com</h1>
                    <h1>Monday - Friday: 9 AM to 5 PM</h1>
                </div>
            </div>
        </div>
        </div>
    </>
  )
}

export default Contact
