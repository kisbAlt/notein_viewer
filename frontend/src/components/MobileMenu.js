import {MenuIcon} from "./icons";
import {useState} from "react";


export function MobileMenu(props) {
    const [showMenu, setShowMenu] = useState(false)


    return (
        <div style={{height: "min-content", overflow: "auto"}}>
            <div style={{height: "70px", width: "100vw", backgroundColor: "#141529"}}>
                <p style={{marginTop: "10px", marginBottom: 0, fontSize: "xx-large"}}>Notein-Viewer</p>
                <div onClick={() => {
                    if (showMenu) {
                        setShowMenu(false)
                    } else {
                        setShowMenu(true)
                    }
                }}
                     style={{
                         width: "fit-content", height: "fit-content",
                         position: "absolute", top: "5px", right: "10px", cursor: "pointer"
                     }}>
                    <MenuIcon size={60}/>
                </div>
            </div>
            {showMenu && <div style={{
                position: "absolute", backgroundColor: "#141529", zIndex: "100",
                width: "100vw", height: "100vh"
            }}>
                {props.children}
            </div>}
        </div>
    )
}