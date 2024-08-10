import {DocumentIcon, FolderIcon} from "../components/icons";
import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {convertDate} from "../api_comm";


function MainPage(props) {
    const [selectedItems, setSelectedItems] = useState([])
    const [searchParams, setSearchParams] = useSearchParams();
    const [folderData, setFolderData] = useState({
        "creation_time": 0,
        "favorite": false,
        "last_modification": 0,
        "last_opened": 0,
        "parent_id": "",
        "title": "",
        "tn_height": 0,
        "tn_path": "",
        "tn_width": 0,
        "total_pages": 0,
        "unbounded_note": false,
        "user_id": "",
        "using_own_pdf": false,
        "level": 0,
        "db_file": ""
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
                console.log(props.layout[i])
            }
        }
        setSelectedItems(filtered)
    }

    return (
        <div style={{width: "100%", height: '100%', backgroundColor: "#1b1c30"}}>
            <div style={{display: "flex"}}>

                <p className={"cbutton"} onClick={() => {
                    navigate(`/?parent=${folderData.parent_id}`)
                }}
                   style={{backgroundColor: "slateblue", width: "fit-content"}}>Back</p>
                <p style={{fontSize: "xx-large", margin: "auto"}}>{folderData.title}</p>
            </div>
            <div style={{color: "lightgray", marginBottom: "15px", zIndex: 10}}>Created:
                <span style={{color: "goldenrod", marginLeft: "5px"}}>{convertDate(folderData.creation_time)}</span>,
                Last modification:
                <span style={{color: "goldenrod", marginLeft: "5px"}}>{convertDate(folderData.last_modification)}</span>
                {folderData.favorite && <span
                    style={{
                        color: "yellowgreen",
                        marginLeft: "15px",
                        fontWeight: "bold",
                        borderRadius: "5px",
                        padding: "2px",
                        border: "1px solid royalblue"
                    }}>Favorite</span>}
            </div>
            <div style={{
                display: "flex",
                flexFlow: "wrap",
                overflowY: "scroll",
                overflowX: "hidden",
                maxHeight: "95vh",
                width: "fit-content",
                marginLeft: "auto",
                marginRight: "auto"
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
                        minWidth: "150px",
                        maxWidth: "150px",
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
