import logo from './logo.svg';
import './App.css';
import Main_page from "./pages/main_page";
import MainPage from "./pages/main_page";
import {
    BrowserRouter,
    createBrowserRouter, Route,
    RouterProvider, Routes, useSearchParams,
} from "react-router-dom";
import MainMenu from "./components/menu";
import {useEffect, useState} from "react";
import {get_layout, isMobile} from "./api_comm";
import {NotePage} from "./pages/note";
import {MobileMenu} from "./components/MobileMenu";
import {LoginComponent} from "./components/login";


function App() {
    const [fileLayout, setFileLayout] = useState([])
    const [mobileW, setMobileW] = useState(false)
    const [sharedUrl, setSharedUrl] = useState(false)
    const [loginNeeded, setLoginNeeded] = useState(false)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const shared = urlParams.get('shared');
        const logged = localStorage.getItem("token");
        if (shared == "true") {
            setSharedUrl(true)
        } else {
            load_layout()

        }
        if(logged == null){
            setLoginNeeded(true)
        }

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
        <div className="App" style={{display: mobileW ? "" : "flex"}}>
            {!loginNeeded || sharedUrl ? (
                <BrowserRouter>

                    {!sharedUrl && (mobileW ? (
                        <MobileMenu>
                            <MainMenu mobile={mobileW} layout={fileLayout}>
                            </MainMenu>
                        </MobileMenu>
                    ) : (<MainMenu mobile={mobileW} layout={fileLayout}></MainMenu>))}


                    <Routes>
                        <Route path="/" element={<MainPage layout={fileLayout}/>}/>
                        <Route path="/note" element={<NotePage shared={sharedUrl}/>}/>
                    </Routes>

                </BrowserRouter>


            ) : (<LoginComponent/>)}
        </div>
    );
}

export default App;
