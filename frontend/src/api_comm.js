

export async function get_layout() {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + "layout", getHeaders())
    if(resp.status == 401){
        localStorage.clear()
    }
    resp = await resp.json();
    return resp.message

}

export async function get_note(noteid) {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + `get_note?nte_id=${noteid}`, getHeaders())
    if(resp.status == 401){
        localStorage.clear()
    }
    resp = await resp.json();
    return resp

}

export function isMobile() {
    if (window.innerWidth >= 1024 && window.innerHeight >= 768) {
        return false
    }
    return true
}
export function convertDate(epoch) {
    let d = new Date(epoch);
    //d.setUTCSeconds(epoch);
    return d.toISOString().replace("T", " ").substring(0, 16);
}

export async function get_refresh() {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + `refresh`, getHeaders())
    if(resp.status == 401){
        localStorage.clear()
    }
    resp = await resp.json();
    return resp

}

function getHeaders() {
    var myHeaders = new Headers();
    myHeaders.append("token", localStorage.getItem("token") ?? "0");
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    return requestOptions
}
