import {DocumentIcon, FolderIcon} from "../components/icons";
import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";


function MainPage(props) {
    const [selectedItems, setSelectedItems] = useState([])
    const [searchParams, setSearchParams] = useSearchParams();
    const [folderData, setFolderData] = useState({
        "parent_id": ""
    })
    const navigate = useNavigate();
    useEffect(() => {
        let parent_id = searchParams.get("parent")
        if (props.layout != undefined) {
            if (parent_id == null) {
                parent_id = ""
            }
            filterAndSort(parent_id)
        }
    }, [props]);

    useEffect(() => {
        let parent_id = searchParams.get("parent")
        if (props.layout != undefined) {
            if (parent_id == null) {
                parent_id = ""
            }
            filterAndSort(parent_id)
        }
    }, [searchParams]);

    function filterAndSort(parent) {
        let filtered = []

        for (let i = 0; i < props.layout.length; i++) {
            if (props.layout[i].parent_id == parent && !props.layout[i].in_trash) {
                filtered.push(props.layout[i])
            }
             if (props.layout[i].id == parent) {
                setFolderData(props.layout[i])
            //
             }
        }
        setSelectedItems(filtered)
    }

    return (
        <div style={{width: "100%", height: '100vh', backgroundColor: "#1b1c30"}}>
            <p className={"cbutton"} onClick={() => {
                navigate(`/?parent=${folderData.parent_id}`)
            }}
               style={{backgroundColor: "slateblue", width: "fit-content"}}>Back</p>
            <div style={{
                display: "flex",
                flexFlow: "wrap",
                overflowY: "scroll",
                overflowX: "hidden",
                maxHeight: "95vh"
            }}>
                {selectedItems.map((item, i) =>
                    <div className={"menu-element"} key={i} style={{
                        textAlign: "center",
                        borderRadius: "10px",
                        marginLeft: `20px`,
                        marginRight: "auto",
                        cursor: "pointer",
                        fontSize: `20px`,
                        height: "100px",
                        minWidth: "200px",
                        maxWidth: "200px",
                        margin: "10px",
                        position: "relative",

                    }} onClick={() => {
                        if (item.folder) {
                            navigate(`?parent=${item.id}`)
                        } else {
                            navigate(`/note?id=${item.id}`)
                        }
                    }}>
                        <div style={{marginTop: "auto", marginBottom: "auto", marginRight: "auto"}}>
                            {item.folder ? (<FolderIcon size={50}/>) :
                                (<DocumentIcon size={40}/>)}
                        </div>
                        <p style={{
                            bottom: "0px",
                            textAlign: "center",
                            left: "0",
                            right: "0",
                            marginRight: "auto",
                            marginLeft: "auto",
                            marginTop: "auto",
                            top: "auto",
                            position: "absolute"
                        }}>{item.title.length > 20 ? (item.title.substring(0, 17) + "...") : (item.title)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainPage;
