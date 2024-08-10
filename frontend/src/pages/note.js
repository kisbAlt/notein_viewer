import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import {convertDate, get_note} from "../api_comm";
import app from "../App";
import {ShareIcon} from "../components/icons";

const MULTIPLIER = 1
let HIGHLIGHTERS = [9, 2, 11]
let CONSTWIDTH = [9, 2, 11, 1]

export function NotePage(props) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showData, setShowData] = useState(true)
    const {search} = useLocation();
    const [templateBtnColor, setTemplateBtnColor] = useState("slateblue")
    const [noteData, setNoteData] = useState({
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
        "db_file": "",
        "id": ""
    })
    const [zoomVal, setZoomVal] = useState(100)
    const zoomValRef = useRef(100);
    const drawTemplateEnabled = useRef(true);

    const [mousePressed, setMousePressed] = useState(false)
    const [canvasTranslate, setCanvasTranslate] = useState([null, null])
    const [canvasTransForm, setCanvasTransForm] = useState([0, 0])
    const navigate = useNavigate();
    useEffect(() => {
        loadSaved()
    }, []);

    useEffect(() => {
        let note_id = searchParams.get("id")
        draw(note_id)


        window.addEventListener("mousedown", mouseDown);
        window.addEventListener("mouseup", mouseUp);
        window.addEventListener("wheel", mouseWheel);

        return () => {
            window.removeEventListener("mousedown", mouseDown)
            window.removeEventListener("mouseup", mouseUp)
            window.removeEventListener("wheel", mouseWheel)
        };
    }, [search]);

    function mouseUp(e) {
        setCanvasTranslate([null, null])
        setMousePressed(false)
    }

    function loadSaved() {
        let showtemplate = sessionStorage.getItem("showTemplate")
        if (showtemplate != null && showtemplate == "false") {
            drawTemplateEnabled.current = false
            setTemplateBtnColor("gray")
        }
        console.log(showtemplate)
    }

    function mouseDown(e) {
        setMousePressed(true)
    }

    function mouseWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
            if (e.deltaY > 0) {
                zoomValRef.current = zoomValRef.current + 10

                changeZoom(zoomValRef.current)
            } else {
                zoomValRef.current = zoomValRef.current - 10
                changeZoom(zoomValRef.current)
            }
        }
    }

    async function draw(note_id) {
        document.getElementById("pages").innerHTML = "";
        let json = await get_note(note_id)
        console.log("drawing note...")

        setNoteData(json.message.data)
        let canvases = {}
        for (let i = 0; i < json.message.pages.length; i++) {
            if (json.message.pages[i].source == 0) {
                continue
            }
            let canvas = document.createElement('canvas');
            canvas.style.marginRight = "auto"
            canvas.style.marginLeft = "auto"
            //canvas.style.imageRendering = "pixelated"

            let parent_w = document.getElementById("pages").getBoundingClientRect().width

            let parent_h = document.getElementById("pages").getBoundingClientRect().height
            canvas.id = json.message.pages[i].id;
            if (json.message.pages[i].paper_theme.orientation == "VERTICAL") {
                canvas.width = json.message.pages[i].paper_spec.width * MULTIPLIER;
                canvas.height = json.message.pages[i].paper_spec.height * MULTIPLIER;
            } else if (json.message.pages[i].paper_theme.orientation == "HORIZONTAL") {
                canvas.width = json.message.pages[i].paper_spec.height * MULTIPLIER;
                canvas.height = json.message.pages[i].paper_spec.width * MULTIPLIER;
            }
            canvas.className = "canvas_page"

            let scale_size = (parent_w - (parent_w * (10 / 360))) / (canvas.width / MULTIPLIER)

            if ((canvas.height / MULTIPLIER * scale_size) > parent_h) {
                scale_size = (parent_h / (canvas.height / MULTIPLIER))
            }
            canvas.style.width = `${canvas.width / MULTIPLIER * scale_size}px`;
            canvas.style.height = `${canvas.height / MULTIPLIER * scale_size}px`;
            // if (parent_w < json.message.pages[i].paper_spec.width * MULTIPLIER) {
            //
            // } else {
            //
            // }


            canvas.style.border = "1px solid black"
            let clrs = [0, 0, 0, 0]
            if ("baseTheme" in json.message.pages[i].paper_theme) {
                clrs = json.message.pages[i].paper_theme.baseTheme.argb

            }
            let ctx = canvas.getContext("2d");
            canvases[json.message.pages[i].id] = ctx
            //ctx.globalCompositeOperation = "destination-over";


            if (json.message.pages[i].paper_spec.name == "PDF") {
                for (let j = 0; j < json.message.pdf_images.length; j++) {
                    if (json.message.pages[i].paper_theme.pdfInfo.pdfPath.includes
                        (json.message.pdf_images[j].pdf) &&
                        json.message.pages[i].paper_theme.pageNum == json.message.pdf_images[j].page) {
                        let base_image = new Image();
                        let img_w = canvas.width
                        let img_h = canvas.height
                        base_image.onload = function () {
                            ctx.drawImage(base_image, 0,
                                0, img_w, img_h);
                        }
                        base_image.src = process.env.REACT_APP_LOCAL_URL + json.message.pdf_images[j].filename;
                    }
                }

            } else {
                canvas.style.backgroundColor = `rgba(${clrs[1]}, ${clrs[2]}, ${clrs[3]}, ${clrs[0]})`
            }
            if (drawTemplateEnabled.current) {
                drawTemplate(ctx, json.message.pages[i].paper_theme, json.message.pages[i].paper_spec)
            }
            let parent = document.getElementById("pages");
            parent.appendChild(canvas);
        }
        for (let j = 0; j < json.message.strokes.length; j++) {
            // aplh48(flat,round,tape), alph100(flat,ball)


            let stroke_width = json.message.strokes[j].json_stroke.width * MULTIPLIER;


            let points = json.message.strokes[j].json_stroke.points
            let highliter = HIGHLIGHTERS.includes(json.message.strokes[j].json_stroke.type)
            let constwidth = CONSTWIDTH.includes(json.message.strokes[j].json_stroke.type)

            let ctx = canvases[json.message.strokes[j].page_id];
            if (ctx == null) {
                continue
            }

            ctx.beginPath()

            let alpha = json.message.strokes[j].json_stroke.rgba[0] / 255
            if (highliter) {
                stroke_width = json.message.strokes[j].json_stroke.width * 2.2;
                ctx.globalCompositeOperation = "destination-over";
                alpha = 0.5
            } else {
                ctx.globalCompositeOperation = 'destination-over';
            }
            ctx.strokeStyle = `rgba(${json.message.strokes[j].json_stroke.rgba[1]},
                ${json.message.strokes[j].json_stroke.rgba[2]},${json.message.strokes[j].json_stroke.rgba[3]},
                ${alpha})`;

            if (json.message.strokes[j].json_stroke.type == 9) {
                ctx.lineCap = "square";
            } else {
                ctx.lineCap = "round";

            }


            ctx.moveTo(points[0].x * MULTIPLIER, points[0].y * MULTIPLIER)
            for (let i = 1; i < points.length - 2; i++) {
                ctx.lineWidth = stroke_width * ((constwidth) ? 1 : points[i].p)
                // ctx.lineTo(points[i].x * MULTIPLIER, points[i].y * MULTIPLIER);
                // ctx.stroke()

                var xc = (points[i].x + points[i + 1].x) / 2;
                var yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x * MULTIPLIER, points[i].y * MULTIPLIER, xc * MULTIPLIER, yc * MULTIPLIER);
            }
            let p_len = points.length - 3;
            if (p_len > 0) {
                ctx.lineWidth = stroke_width * ((constwidth) ? 1 : points[p_len].p)
                ctx.quadraticCurveTo(points[p_len].x * MULTIPLIER, points[p_len].y * MULTIPLIER,
                    points[p_len + 1].x * MULTIPLIER, points[p_len + 1].y * MULTIPLIER);
            }
            ctx.stroke();

        }


        for (let i = 0; i < json.message.shapes.length; i++) {
            let ctx = canvases[json.message.shapes[i].page_id];
            if (ctx == null) {
                continue
            }
            ctx.beginPath();


            ctx.lineWidth = json.message.shapes[i].width * MULTIPLIER
            ctx.strokeStyle = `rgba(${json.message.shapes[i].rgba[1]},
                ${json.message.shapes[i].rgba[2]},${json.message.shapes[i].rgba[3]},
                ${json.message.shapes[i].rgba[0]})`;
            ctx.fillStyle = `rgba(${json.message.shapes[i].rgba[1]},
                ${json.message.shapes[i].rgba[2]},${json.message.shapes[i].rgba[3]},
                0.${json.message.shapes[i].opacity_of_fill_color})`;
            let shape_points = json.message.shapes[i].points
            for (let j = 0; j < shape_points.length; j++) {
                shape_points[j].x = MULTIPLIER * shape_points[j].x;
                shape_points[j].y = MULTIPLIER * shape_points[j].y;
            }
            // DEBUG
            if (json.message.shapes[i].style != 2 && json.message.shapes[i].blend_mode == -1) {
                continue
            }
            switch (json.message.shapes[i].type) {

                case 7: {
                    ctx.moveTo(shape_points[0].x, shape_points[0].y);
                    ctx.lineTo(shape_points[1].x, shape_points[1].y);
                    ctx.stroke();
                    break
                }
                case 19: {
                    ctx.setLineDash([10 * MULTIPLIER, 7.5 * MULTIPLIER]);
                    ctx.moveTo(shape_points[0].x, shape_points[0].y);
                    ctx.lineTo(shape_points[1].x, shape_points[1].y);
                    ctx.stroke();
                    break
                }
                case 6: {
                    const radius = (shape_points[2].x - shape_points[0].x) / 2;
                    const centerX = (shape_points[2].x - radius);
                    const centerY = (shape_points[3].y - radius);
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.fill();
                    break
                }
                case 8: {
                    const w = (shape_points[1].x - shape_points[0].x);
                    const h = (shape_points[2].y - shape_points[1].y);
                    const centerX = (shape_points[1].x - w / 2);
                    const centerY = (shape_points[2].y - -h / 2);
                    drawEllipseByCenter(ctx, centerX, centerY, w, h)

                    break
                }
                case 9: {
                    const a = 2 * Math.PI / 6;
                    const r = (shape_points[1].x - shape_points[0].x) * 2;
                    let xPos = shape_points[0].x + r
                    let yPos = shape_points[0].y

                    for (var k = 0; k < 7; k++) {
                        ctx.lineTo(xPos + r * Math.cos(a * k), yPos + r * Math.sin(a * k));
                    }
                    ctx.stroke();
                    ctx.fill();
                    break
                }
                case 1: {
                    ctx.moveTo(shape_points[0].x, shape_points[0].y);
                    ctx.lineTo(shape_points[1].x, shape_points[1].y);
                    ctx.lineTo(shape_points[2].x, shape_points[2].y);
                    ctx.lineTo(shape_points[0].x, shape_points[0].y);
                    ctx.stroke();
                    ctx.fill();
                    break
                }
                case 3: {
                    ctx.moveTo(shape_points[0].x, shape_points[0].y);
                    ctx.lineTo(shape_points[1].x, shape_points[1].y);
                    ctx.lineTo(shape_points[2].x, shape_points[2].y);
                    ctx.lineTo(shape_points[3].x, shape_points[3].y);
                    ctx.lineTo(shape_points[0].x, shape_points[0].y);
                    ctx.stroke();
                    ctx.fill();
                    break
                }
                case 0: {
                    ctx.moveTo(shape_points[0].x, shape_points[0].y);
                    ctx.quadraticCurveTo(shape_points[1].x, shape_points[1].y, shape_points[2].x, shape_points[2].y);
                    ctx.stroke();
                    break
                }
                case 21: {
                    ctx.fillStyle = `rgba(${json.message.shapes[i].rgba[1]},
                    ${json.message.shapes[i].rgba[2]},${json.message.shapes[i].rgba[3]},
                    1)`;
                    drawArrow(ctx, shape_points[0].x, shape_points[0].y, shape_points[1].x, shape_points[1].y)
                    break
                }
                case 22: {
                    ctx.fillStyle = `rgba(${json.message.shapes[i].rgba[1]},
                    ${json.message.shapes[i].rgba[2]},${json.message.shapes[i].rgba[3]},
                    1)`;
                    drawArrow(ctx, shape_points[0].x, shape_points[0].y, shape_points[1].x, shape_points[1].y)
                    drawArrow(ctx, shape_points[1].x, shape_points[1].y, shape_points[0].x, shape_points[0].y)
                    break
                }
                case 23: {
                    let width = shape_points[1].x - shape_points[0].x;
                    let height = shape_points[2].y - shape_points[0].y;
                    ctx.fillStyle = `rgba(${json.message.shapes[i].rgba[1]},
                    ${json.message.shapes[i].rgba[2]},${json.message.shapes[i].rgba[3]},
                    1)`;
                    drawArrow(ctx, shape_points[0].x, shape_points[0].y + height / 2, shape_points[1].x, shape_points[0].y + height / 2)
                    drawArrow(ctx, shape_points[0].x + width / 2, shape_points[2].y, shape_points[0].x + width / 2, shape_points[0].y)
                    break
                }
                case 24: {
                    let width = shape_points[1].x - shape_points[0].x
                    let height = shape_points[1].y - shape_points[0].y
                    width = Math.sqrt(width * width)
                    height = Math.sqrt(height * height)

                    let length = Math.sqrt(width * width + height * height)

                    ctx.save()
                    ctx.lineWidth = json.message.shapes[i].width * 0.1
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    let angle = Math.atan2(width, height)
                    let degree = (angle * 180) / Math.PI

                    let correction = 50
                    ctx.translate(shape_points[1].x, shape_points[1].y)
                    if (shape_points[1].x < shape_points[0].x || shape_points[1].y > shape_points[0].y) {
                        let comp_x = correction * Math.cos(angle)
                        let comp_y = correction * Math.sin(angle)

                        ctx.translate(comp_x, comp_y)
                        ctx.rotate(angle + Math.PI)

                    } else {
                        let comp_x = correction * Math.cos(angle + Math.PI)
                        let comp_y = correction * Math.sin(angle + Math.PI)

                        ctx.translate(comp_x, comp_y)
                        ctx.rotate(angle)

                    }
                    let scale_w = length * (40 / 795)
                    ctx.scale(16, scale_w)

                    ctx.moveTo(1.000000, 19.000000);
                    ctx.bezierCurveTo(2.104600, 19.000000, 3.000000, 18.104600, 3.000000, 17.000000);
                    ctx.lineTo(3.000000, 13.325500);
                    ctx.bezierCurveTo(3.000000, 12.836300, 3.000000, 12.591700, 3.055300, 12.361500);
                    ctx.bezierCurveTo(3.104300, 12.157500, 3.185100, 11.962400, 3.294700, 11.783400);
                    ctx.bezierCurveTo(3.418400, 11.581600, 3.591400, 11.408600, 3.937300, 11.062700);
                    ctx.lineTo(5.000000, 10.000000);
                    ctx.lineTo(3.937300, 8.937300);
                    ctx.bezierCurveTo(3.591400, 8.591400, 3.418400, 8.418400, 3.294700, 8.216600);
                    ctx.bezierCurveTo(3.185100, 8.037600, 3.104300, 7.842540, 3.055300, 7.638460);
                    ctx.bezierCurveTo(3.000000, 7.408290, 3.000000, 7.163700, 3.000000, 6.674520);
                    ctx.lineTo(3.000000, 3.000000);
                    ctx.bezierCurveTo(3.000000, 1.895430, 2.104600, 1.000000, 1.000000, 1.000000);
                    ctx.stroke();
                    ctx.restore();
                    break
                }
                case 20: {
                    var width = shape_points[1].x - shape_points[0].x;


                    var x = shape_points[0].x;
                    var y = shape_points[0].y;
                    var amplitude = 3 * MULTIPLIER;
                    var frequency = 3 * MULTIPLIER;
                    ctx.moveTo(shape_points[0].x, shape_points[0].y)
                    //ctx.moveTo(x, y);
                    while (x < width) {
                        y = shape_points[0].y + amplitude * Math.sin(x / frequency);
                        ctx.lineTo(x, y);
                        x = x + 1;
                    }
                    ctx.stroke();
                    break
                }
                default: {
                    break
                }
            }
        }

        // displaying images
        for (let i = 0; i < json.message.images.length; i++) {
            if (json.message.images[i].path != "") {
                let base_image = new Image();
                let img_w = (json.message.images[i].bounds.right - json.message.images[i].bounds.left) * MULTIPLIER
                let img_h = (json.message.images[i].bounds.bottom - json.message.images[i].bounds.top) * MULTIPLIER
                base_image.onload = function () {
                    let ctx = canvases[json.message.images[i].page_id];

                    ctx.drawImage(base_image, json.message.images[i].bounds.left,
                        json.message.images[i].bounds.top, img_w, img_h);
                }
                base_image.src = process.env.REACT_APP_LOCAL_URL + json.message.images[i].path;
            }
        }

    }

    function panCanvas(event) {

        if (mousePressed) {

            if (canvasTranslate[0] == null) {

            } else {
                let pages = document.getElementById("pages")
                let translateX = canvasTransForm[0] + (canvasTranslate[0] - event.clientX)
                let translateY = canvasTransForm[1] + (canvasTranslate[1] - event.clientY)

                pages.style.transform = `translate(${translateX}px, ${translateY}px)`
                setCanvasTransForm([translateX, translateY])

            }
            setCanvasTranslate([event.clientX, event.clientY])
        }
    }


    function changeZoom(zoom) {
        setZoomVal(zoom)
        let pages = document.getElementById("pages")
        pages.style.scale = `${zoom / 100}`
        //pages.style.marginTop = `${(zoom-100)*15}px`
        // for (let i = 0; i < pages.length; i++) {
        //     pages[i].style.scale = zoom/100
        // }
    }

    return (
        <div style={{
            width: "100%",
            height: '100vh',
            backgroundColor: "#1b1c30",
            overflowY: "scroll",
            overflowX: "hidden",

        }}>
            {showData && (<div>

                <div style={{display: "flex", width: "100%", zIndex: 10, flexFlow: "wrap"}}>
                    <p className="cbutton horizontalc" onClick={() => {
                        navigate(`/?parent=${noteData.parent_id}`)
                    }}
                       style={{backgroundColor: "forestgreen", fontSize: "small"}}>Back to folder</p>
                    <div>
                        <p style={{
                            textAlign: "center",
                            fontSize: "xx-large",
                            marginTop: "5px",
                            marginBottom: "8px",
                            marginLeft: "auto",
                            marginRight: 'auto'
                        }}>{noteData.title}</p>
                        <div className={"horizontalc"}
                             style={{
                                 color: "lightgray", marginBottom: "15px", zIndex: 10, maxWidth: "95%",
                                 fontSize: "small"
                             }}>Created:
                            <span style={{
                                color: "goldenrod",
                                marginLeft: "5px"
                            }}>{convertDate(noteData.creation_time)}</span>,
                            Last
                            opened:
                            <span style={{
                                color: "goldenrod",
                                marginLeft: "5px"
                            }}>{convertDate(noteData.last_opened)}</span>,
                            Last modification:
                            <span
                                style={{
                                    color: "goldenrod",
                                    marginLeft: "5px"
                                }}>{convertDate(noteData.last_modification)}</span>
                        </div>

                    </div>
                    <div className={"horizontalc"}>
                        <p style={{marginTop: "auto", marginBottom: "auto"}}>{zoomVal}%</p>
                        <div style={{marginTop: "auto", marginBottom: "auto"}} className="slidecontainer">
                            <input onChange={(v) => {
                                changeZoom(v.target.value)
                            }}
                                   type="range" min="1" max="500" value={zoomVal} className="slider" id="myRange"/>

                        </div>
                        <p style={{color: "lightgray", margin: "0", fontSize: "small"}}>Shift+mousewheel to scale</p>
                        <div style={{display: "flex"}}>


                            <p onClick={() => {
                                if (drawTemplateEnabled.current) {
                                    sessionStorage.setItem("showTemplate", "false");
                                    setTemplateBtnColor("gray")
                                    drawTemplateEnabled.current = false
                                } else {
                                    sessionStorage.setItem("showTemplate", "true");
                                    setTemplateBtnColor("slateblue")
                                    drawTemplateEnabled.current = true
                                }
                                draw(noteData.id)
                            }}
                               style={{
                                   color: "lightgray", marginTop: "0", marginBottom: "0", fontSize: "small",
                                   backgroundColor: templateBtnColor, width: "min-content"
                               }} className={"cbutton horizontalc"}>
                                Template</p>
                            <div className={"cbutton"}
                                 style={{backgroundColor: "blueviolet",
                                     maxHeight: "30px", padding: "4px",
                                     overflow: "hidden"}} onClick={() => {
                                         navigator.clipboard.writeText(`${window.location.href}&shared=true`)
                            }}>
                                <ShareIcon size={35}/>
                            </div>
                        </div>
                    </div>

                </div>
            </div>)}
            <div id={"pages"}
                 onMouseMove={panCanvas}
                 onScroll={(e) => {
                     let scrollPos = document.getElementById("pages").scrollTop;
                     console.log(scrollPos)
                     if (showData && scrollPos > 5) {
                         setShowData(false)
                     } else if (!showData && scrollPos <= 5) {
                         setShowData(true)
                     }
                 }}
                 style={{
                     zIndex: 5,
                     width: "100%",
                     maxWidth: "100%",
                     overflowX: "scroll",
                     transformOrigin: "top",
                     minHeight: "100%",
                     height: "100vh",
                     marginLeft: "auto",
                     marginRight: "auto",
                     display: "flex",
                     flexDirection: "column",
                     scale: zoomVal / 100
                 }}>

            </div>
        </div>
    );
}

function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = 13 * MULTIPLIER; // length of head in pixels
    const angle = Math.atan2(toy - fromy, tox - fromx);

    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));

    ctx.lineTo(tox, toy);

    ctx.stroke();
    ctx.fill();
}

function drawEllipseByCenter(ctx, cx, cy, w, h) {
    drawEllipse(ctx, cx - w / 2.0, cy - h / 2.0, w, h);
}

function drawEllipse(ctx, x, y, w, h) {
    var kappa = .5522848,
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    //ctx.closePath(); // not used correctly, see comments (use to close off open path)
    ctx.stroke();
}


function drawTemplate(ctx, paperTheme, paperSpec) {
    if (ctx == undefined || paperTheme.paperStyle == undefined) {
        return
    }
    ctx.beginPath();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.reset()
    ctx.strokeStyle = `rgba(86, 86, 86, ${paperTheme.paperStyle.foregroundAlpha})`;
    ctx.fillStyle = `rgba(86, 86, 86, ${paperTheme.paperStyle.foregroundAlpha})`;
    //ctx.strokeStyle = `rgb(255, 255, 255)`;
    let lineW = 1;
    ctx.lineWidth = lineW;


    let pLeft = Math.floor(paperTheme.paperStyle.leftPadding) * MULTIPLIER
    let pTop = Math.floor(paperTheme.paperStyle.topPadding) * MULTIPLIER
    let pRight = (paperSpec.width - paperTheme.paperStyle.rightPadding) * MULTIPLIER
    let pBottom = (paperSpec.height - paperTheme.paperStyle.bottomPadding) * MULTIPLIER

    let itemSpace = paperTheme.paperStyle.requiredItemSpace;
    let templateWidth = pRight - pLeft
    let templateNumWidth = Math.floor(templateWidth / itemSpace)
    let unusedWidth = templateWidth - (templateNumWidth * itemSpace)

    let templateHeight = pBottom - pTop
    let templateNumHeight = Math.floor(templateHeight / itemSpace)
    let unusedHeight = templateHeight - (templateNumHeight * itemSpace)

    let templateStyle = paperTheme.paperStyle.type.split(".").pop()

    let verticalStyles = ["NewSquarePaperStyle", "NewDotPaperStyle"].includes(templateStyle)
    if (verticalStyles) {
        pLeft = pLeft + unusedWidth / 2
        pRight = pRight - unusedWidth / 2

        pTop = pTop + unusedHeight / 2
        pBottom = pBottom - unusedHeight / 2


    }
    let pLeftSave = pLeft;
    let pTopSave = pTop;
    while (verticalStyles && pLeft <= pRight) {
        if (templateStyle == "NewDotPaperStyle") {
            while (pTop <= pBottom) {
                ctx.fillRect(pLeft, pTop, 3 * lineW, 3 * lineW);
                pTop += itemSpace * MULTIPLIER
            }
            pTop = pTopSave
        } else {
            ctx.moveTo(pLeft, pTop);
            ctx.lineTo(pLeft, pBottom)

        }
        pLeft += itemSpace * MULTIPLIER
    }

    ctx.stroke()
    pLeft = pLeftSave
    pTop = pTopSave
    while (templateStyle != "NewDotPaperStyle" && pTop <= pBottom) {
        ctx.moveTo(pLeft, pTop);
        ctx.lineTo(pRight, pTop)
        pTop += itemSpace * MULTIPLIER
    }
    ctx.stroke()
}
