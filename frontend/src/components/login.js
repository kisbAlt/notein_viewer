import {useState} from "react";

export function LoginComponent(props) {
    const [keySet, setKeySet] = useState("")
    return (
        <div className={"horizontalc"} style={{marginTop: "10%"}}>
            <p style={{textAlign: "center", fontSize: "xx-large"}}>Log in</p>

            <input type="password" style={{
                width: "250px", height: "30px", border: "none", borderRadius: "5px",
                backgroundColor: "darkgray"
            }} placeholder={"Set key"}
                   content={keySet} onChange={(e) => {
                setKeySet(e.target.value)
            }}
                   id="pwd" name="pwd"/>
            <p className={"cbutton horizontalc"} style={{
                backgroundColor: "blueviolet",
                width: "fit-content"
            }} onClick={() => {
                localStorage.setItem("token", keySet)
                window.location.reload()
            }}>Save</p>
        </div>
    );
}