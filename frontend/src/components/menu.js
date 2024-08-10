import {useState} from "react";
import {DocumentIcon, FolderIcon, RefreshIcon} from "./icons";
import {useNavigate} from "react-router-dom";
import {get_refresh} from "../api_comm";


function MainMenu(props) {
    const [showedParents, setShowedParents] = useState([""])

    const navigate = useNavigate();

    function removeElement(itemId) {
        let rmve = remove_childrens(itemId)
        rmve.push(itemId)
        setShowedParents(
            showedParents.filter(p => !rmve.includes(p))
        );
    }

    function remove_childrens(itemId) {
        let toRemove = []
        for (let i = 0; i < props.layout.length; i++) {
            if (props.layout[i].parent_id == itemId && props.layout[i].folder) {
                if (showedParents.includes(props.layout[i].id)) {

                    toRemove.push(props.layout[i].id)
                    let inner = remove_childrens(props.layout[i].id)

                    toRemove.push(...inner)
                }
            }
        }
        return toRemove
    }


    return (
        <div style={{
            width: props.mobile ? ("100vw") : ("calc(30% - 30px)"),
            height: 'calc(100vh - 30px)',
            maxWidth: "300px",
            backgroundColor: "#141529",
            margin: '15px',
            borderRadius: "20px",
            marginLeft: "auto",
            marginRight: "auto",
            overflowY: "hidden",
        }}>
            <p style={{fontSize: "x-large"}}>Notein Viewer</p>
            <div onClick={() => {
                get_refresh().then(r => navigate("/"))

            }}
                style={{display: "flex", cursor: "pointer", width: "fit-content", marginLeft: "auto",
                marginRight: "auto", marginTop: "25px"}}>
                <p style={{marginTop: "auto", marginBottom: "auto", marginRight: "10px"}}>Refresh</p>
                <RefreshIcon style={{marginTop: "auto", marginBottom: "auto"}} size={25}/>
            </div>
            <hr style={{width: "85%", marginTop: "20px"}}/>
            <div style={{overflow: "scroll", height: "calc(100% - 145px)", marginLeft: "auto", marginRight: "auto"}}>
                {props.layout.map((item, i) => {
                    return (!showedParents.includes(item.parent_id) || item.in_trash) ? ("") : (
                        <div className={"menu-element"} key={i} onClick={() => {
                            if (item.folder) {
                                if (showedParents.includes(item.id)) {
                                    removeElement(item.id)
                                } else {
                                    setShowedParents(showedParents => [...showedParents, item.id]);
                                }
                            } else {
                                navigate(`/note?id=${item.id}`)
                            }
                        }} style={{
                            display: "flex",
                            width: "80",
                            borderRadius: "10px",
                            paddingLeft: "10px",
                            marginLeft: `${10 + item.level * 15}px`,
                            marginRight: "auto",
                            cursor: "pointer",
                            fontSize: `${20 - item.level * 3}px`,
                            height: "min-content",
                            marginTop: "0px",
                            marginBottom: "0px",
                        }}>
                            <div style={{marginTop: "auto", marginBottom: "auto", marginRight: "20px"}}>
                                {item.folder ? (<FolderIcon size={30 - item.level * 5}/>) :
                                    (<DocumentIcon size={30 - item.level * 5}/>)}
                            </div>
                            <p>{item.title}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default MainMenu;
