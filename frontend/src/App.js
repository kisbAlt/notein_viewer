import logo from './logo.svg';
import './App.css';
import Main_page from "./pages/main_page";
import MainPage from "./pages/main_page";
import {
    BrowserRouter,
    createBrowserRouter, Route,
    RouterProvider, Routes,
} from "react-router-dom";
import MainMenu from "./components/menu";
import {useEffect, useState} from "react";
import {get_layout, isMobile} from "./api_comm";
import {NotePage} from "./pages/note";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainPage></MainPage>,
    }, {
        path: "/note",
        element: <NotePage></NotePage>,
    },
]);

function App() {
    const [fileLayout, setFileLayout] = useState([])
    const [mobileW, setMobileW] = useState(false)
    useEffect(() => {
        load_layout()
        setMobileW(isMobile())
        window.addEventListener("resize", window_scaling);

        return () => {
            window.removeEventListener("resize", window_scaling)
        };
    }, []);

    async function load_layout() {
        let layout = await get_layout()
        setFileLayout(layout)
    }

    function sort_layout() {
        let lyout = fileLayout

    }

    function window_scaling() {
        setMobileW(isMobile())
    }


    return (
        <div className="App" style={{display: "flex"}}>
            <BrowserRouter>

                {!mobileW && <MainMenu layout={fileLayout}></MainMenu>}
                <Routes>
                    <Route path="/" element={<MainPage layout={fileLayout}/>}/>
                    <Route path="/note" element={<NotePage/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
