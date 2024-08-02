export async function get_layout() {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + "layout")
    resp = await resp.json();
    return resp.message

}

export async function get_note(noteid) {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + `get_note?nte_id=${noteid}`)
    resp = await resp.json();
    return resp

}

export function isMobile() {
    if (window.innerWidth >= 1024 && window.innerHeight >= 768) {
        return false
    }
    return true
}


export async function get_refresh() {
    var resp = await fetch(process.env.REACT_APP_LOCAL_URL + `refresh`)
    resp = await resp.json();
    return resp

}
