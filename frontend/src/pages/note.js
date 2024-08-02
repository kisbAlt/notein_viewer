import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {get_note} from "../api_comm";

const MULTIPLIER = 2

export function NotePage(props) {
    const [searchParams, setSearchParams] = useSearchParams();
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
        "db_file": ""
    })
    const [zoomVal, setZoomVal] = useState(100)
    const [drawen, setDrawen] = useState("")
    const navigate = useNavigate();
    useEffect(() => {

    }, []);

    useEffect(() => {
        let note_id = searchParams.get("id")
        if (note_id != drawen) {
            setDrawen(note_id)
            draw(note_id)
        }
    }, [searchParams]);

    async function draw(note_id) {
        document.getElementById("pages").innerHTML = "";
        let json = await get_note(note_id)

        setNoteData(json.message.data)

        for (let i = 0; i < json.message.pages.length; i++) {
            if (json.message.pages[i].source == 0) {
                continue
            }
            let canvas = document.createElement('canvas');

            let parent_w = document.getElementById("pages").getBoundingClientRect().width

            let parent_h = document.getElementById("pages").style.height
            canvas.id = json.message.pages[i].id;
            if (json.message.pages[i].paper_theme.orientation == "VERTICAL") {
                canvas.width = json.message.pages[i].paper_spec.width * MULTIPLIER;
                canvas.height = json.message.pages[i].paper_spec.height * MULTIPLIER;
            }else if (json.message.pages[i].paper_theme.orientation == "HORIZONTAL") {
                canvas.width = json.message.pages[i].paper_spec.height * MULTIPLIER;
                canvas.height = json.message.pages[i].paper_spec.width * MULTIPLIER;
            }
            canvas.className = "canvas_page"

            if (parent_w < json.message.pages[i].paper_spec.width * MULTIPLIER) {
                let scale_size = (parent_w - (parent_w * (10 / 360))) / (canvas.width/MULTIPLIER)

                canvas.style.width = `${canvas.width/MULTIPLIER * scale_size}px`;
                canvas.style.height = `${canvas.height/MULTIPLIER * scale_size}px`;

            } else {

            }


            canvas.style.border = "1px solid black"
            let clrs = [0, 0, 0, 0]
            if ("baseTheme" in json.message.pages[i].paper_theme) {
                clrs = json.message.pages[i].paper_theme.baseTheme.argb

            }

            if (json.message.pages[i].paper_spec.name == "PDF") {
                for (let j = 0; j < json.message.pdf_images.length; j++) {
                    if (json.message.pages[i].paper_theme.pdfInfo.pdfPath.includes
                        (json.message.pdf_images[j].pdf) &&
                        json.message.pages[i].paper_theme.pageNum == json.message.pdf_images[j].page) {
                        console.log("includes")
                        let base_image = new Image();
                        let img_w = canvas.width
                        let img_h = canvas.height
                        base_image.onload = function () {
                            let ctx = canvas.getContext("2d");
                            ctx.drawImage(base_image, 0,
                                0, img_w, img_h);
                        }
                        base_image.src = process.env.REACT_APP_LOCAL_URL + json.message.pdf_images[j].filename;
                    }
                }

            }else {
                canvas.style.backgroundColor = `rgba(${clrs[1]}, ${clrs[2]}, ${clrs[3]}, ${clrs[0]})`
            }

            let parent = document.getElementById("pages");
            parent.appendChild(canvas);
        }
        for (let j = 0; j < json.message.strokes.length; j++) {
            let stroke_width = json.message.strokes[j].json_stroke.width;
            let points = json.message.strokes[j].json_stroke.points


            let canvas = document.getElementById(json.message.strokes[j].page_id);
            let ctx = canvas.getContext("2d");

            ctx.beginPath()

            ctx.strokeStyle = `rgba(${json.message.strokes[j].json_stroke.rgba[1]},
                ${json.message.strokes[j].json_stroke.rgba[2]},${json.message.strokes[j].json_stroke.rgba[3]},
                ${json.message.strokes[j].json_stroke.rgba[0]})`;


            ctx.moveTo(points[0].x * MULTIPLIER, points[0].y * MULTIPLIER)
            for (let i = 1; i < points.length - 1; i++) {
                // ctx.lineTo(points[i].x * multiplier, points[i].y * multiplier);
                // ctx.stroke()
                ctx.lineWidth = stroke_width * points[i].p
                var xc = (points[i].x + points[i + 1].x) / 2;
                var yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x * MULTIPLIER, points[i].y * MULTIPLIER, xc * MULTIPLIER, yc * MULTIPLIER);
                ctx.stroke();
            }
        }

        for (let i = 0; i < json.message.shapes.length; i++) {
            // # TYPES:
            //         # ID 7: line (2 points)
            // # ID 7: line (2 points)
            // # ID 3: quadrangle (4 points)
            // # ID 6: round (4 points)
            // # ID 0: 3-pint curve (3 points)
            // # ID 19: dotted_line (2 points)
            // # ID 20: wavy line (2 points)
            // # ID 21: arrow (pointing to y coord) (2 points)
            // # ID 22: 2-way arrow (2 points)
            // # ID 24: curly brackets (2 points)
            // # ID 23: 2d coordinate system (4 points)
            // # ID 1: triangle (3 points)
            // # ID 9: hexagon (6 points)
            // # ID 8: ellipse (4 points)
            // # ID 18: ? (4 points)
            // # ID 10: heart (4 points)
            // # ID 13: tringular box (4 points)
            // # ID 12: pyramid box (4 points)
            // # ID 14: cylinder (4 points)
            // # ID 15: cone (4 points)
            // # ID 16: ball (4 points)
            // # ID 17: ball_cut (4 points)
            let canvas = document.getElementById(json.message.shapes[i].page_id);
            let ctx = canvas.getContext("2d");
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
                    ctx.setLineDash([20, 15]);
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
                    var amplitude = 6;
                    var frequency = 6;
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
                    let canvas = document.getElementById(json.message.images[i].page_id);
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(base_image, json.message.images[i].bounds.left,
                        json.message.images[i].bounds.top, img_w, img_h);
                }
                base_image.src = process.env.REACT_APP_LOCAL_URL + json.message.images[i].path;
            }
        }
    }

    function convertDate(epoch) {
        let d = new Date(epoch);
        //d.setUTCSeconds(epoch);
        return d.toISOString().replace("T", " ").substring(0, 16);
    }

    function changeZoom(zoom) {
        setZoomVal(zoom)
        let pages = document.getElementById("pages")
        pages.style.scale = zoom/100
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
            overflowX: "hidden"
        }}>
            <div style={{display: "flex", width: "100%", zIndex: 10}}>
                <p className="cbutton" onClick={() => {
                    navigate(`/?parent=${noteData.parent_id}`)
                }}
                   style={{backgroundColor: "forestgreen"}}>Back to folder</p>
                <p style={{
                    textAlign: "center",
                    fontSize: "xx-large",
                    marginTop: "5px",
                    marginBottom: "8px",
                    marginLeft: "auto",
                    marginRight: 'auto'
                }}>{noteData.title}</p>

                <p style={{marginTop: "auto", marginBottom: "auto"}}>{zoomVal}%</p>
                <div style={{marginTop: "auto", marginBottom: "auto"}} className="slidecontainer">
                    <input onChange={(v) => {changeZoom(v.target.value)}}
                        type="range" min="1" max="500" value={zoomVal} className="slider" id="myRange"/>

                </div>

            </div>
            <div style={{color: "lightgray", marginBottom: "15px",zIndex: 10}}>Created:
                <span style={{color: "goldenrod", marginLeft: "5px"}}>{convertDate(noteData.creation_time)}</span>, Last
                opened:
                <span style={{color: "goldenrod", marginLeft: "5px"}}>{convertDate(noteData.last_opened)}</span>,
                Last modification:
                <span style={{color: "goldenrod", marginLeft: "5px"}}>{convertDate(noteData.last_modification)}</span>
            </div>
            <div id={"pages"} style={{zIndex: 5, width: "100%", marginLeft: "auto", marginRight: "auto", scale: zoomVal/100}}>

            </div>
        </div>
    );
}

function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = 25; // length of head in pixels
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


