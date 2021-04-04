const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const sizeSelect = document.getElementById('sizeSelect');
const strokeStyleSelect = document.getElementById('strokeStyleSelect');
const fillStyleSelect = document.getElementById('fillStyleSelect');

const GRID_STROKE_STYLE = 'lightgray';
const GRID_HORIZONTAL_SPACING = 10;
const GRID_VERTICAL_SPACING = 10;
let drawingSurfaceImageData;
let cursor = new TextCursor();
let paragraph;

// functions
function drawBackground(){
    const STEP_Y = 12;
    let i = canvas.height;

    context.strokeStyle = 'lightgray';
    context.lineWidth = 0.5;

    while(i > 4*STEP_Y){
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(context.canvas.width, i);
        context.stroke();
        i -= STEP_Y;
    }
    context.strokeStyle = 'rgba(100,0,0,0.3)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(36,0);
    context.lineTo(36,context.canvas.height);
    context.stroke();
}

function windowToCanvas(canvas, x, y) {
    const bbox = canvas.getBoundingClientRect();
    return { x: x - bbox.left * (canvas.width  / bbox.width),
             y: y - bbox.top  * (canvas.height / bbox.height)
           };
}

function saveDrawingSurface() {
    drawingSurfaceImageData = context.getImageData(0, 0,
                            canvas.width,
                            canvas.height);
}

function setFont(){
    context.font = sizeSelect.value + 'px ' + fontSelect.value;
}

// controls
fontSelect.onchange = setFont;

sizeSelect.onchange = setFont;

fillStyleSelect.onchange = function () {
    cursor.fillStyle = fillStyleSelect.value;
    canvas.fillStyle = fillStyleSelect.value;
 }
 
strokeStyleSelect.onchange = function () {
    canvas.strokeStyle = strokeStyleSelect.value;
}

// event handler

canvas.onmousedown = function (e) {
    const loc = windowToCanvas(canvas, e.clientX, e.clientY);
    let fontHeight;
 
    if(paragraph) paragraph.clearCursor();
    saveDrawingSurface();
    
    if (paragraph && paragraph.isPointInside(loc)) {
       paragraph.moveCursorCloseTo(loc.x, loc.y);
    } else {
       fontHeight = context.measureText('W').width,
       fontHeight += fontHeight/6;
 
       paragraph = new Paragraph(
            context, 
            loc.x, 
            loc.y - fontHeight,
            drawingSurfaceImageData,
            cursor
        );
 
       paragraph.addLine(new TextLine(loc.x, loc.y));
    }
};

// Key event handlers............................................

document.onkeydown = function (e) {
    if (e.keyCode === 8 || e.keyCode === 13) e.preventDefault();
    
    if (e.keyCode === 8) {  // backspace
       paragraph.backspace();
    }
    else if (e.keyCode === 13) { // enter
       paragraph.newLine();
    }
}
    
document.onkeypress = function (e) {
    const key = String.fromCharCode(e.which);

    // Only process if user is editing text
    // and they aren't holding down the CTRL
    // or META keys.

    if (e.keyCode !== 8 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); // no further browser processing
        context.fillStyle = fillStyleSelect.value;
        context.strokeStyle = strokeStyleSelect.value;
        paragraph.insert(key);
    }
 }
 

// initialization
cursor.fillStyle = fillStyleSelect.value;
context.lineWidth = 2.0;

setFont();
drawBackground();
saveDrawingSurface();