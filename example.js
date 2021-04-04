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
 }
 
 strokeStyleSelect.onchange = function () {
    cursor.strokeStyle = strokeStyleSelect.value;
 }

// initialization
cursor.fillStyle = fillStyleSelect.value;
context.lineWidth = 2.0;

setFont();
drawBackground();
saveDrawingSurface();