// Tool Selection

const TOOL_SETTINGS = ["eraser-settings","pencil-settings","title-settings","checklist-settings"];

const toolList = document.getElementById("tool-list");
const toolListContainer = document.getElementById("tool-list-container")
const aside = document.getElementById("aside")
const tools = toolList.children;
let active = 0;
tools[0].classList.add("tool-active");

// Hide all tool settings
TOOL_SETTINGS.forEach(id => {
    const setting = document.getElementById(id)
    if (setting === null){return}

    setting.hidden = true;
})

console.log(tools)

toolListContainer.addEventListener("mouseover", (evt) => {
    stopDrawing();
})

aside.addEventListener("mouseover", (evt) => {
    stopDrawing();
})

function toggleSettings(index, onlyOff = false){

    const setting = document.getElementById(TOOL_SETTINGS[index])
    if (setting === null){
        return
    }


    setting.hidden = !setting.hidden;

    if(onlyOff) {
        setting.hidden = true;
    }
}

for(let i = 0; i < tools.length; i++){
    tools[i].addEventListener("click", () => {
        if (!(i===active)){
            tools[active].classList.remove("tool-active");
            toggleSettings(active, true)
            active = i;
            tools[active].classList.add("tool-active");
            console.log(active)
        }
        else{
            toggleSettings(i)
        }
    });
}


// Canvas
const designCanvas = document.getElementById("design-canvas");
const titleCanvas = document.getElementById("title-canvas");
const checklistCanvas = document.getElementById("checklist-canvas");
const animationCanvas = document.getElementById("animation-canvas");

const designCtx = designCanvas.getContext("2d");
const titleCtx = titleCanvas.getContext("2d");
const checklistCtx = checklistCanvas.getContext("2d");
const animationCtx = animationCanvas.getContext("2d")

const allCanvases = [designCanvas, titleCanvas, checklistCanvas, animationCanvas];
allCanvases.forEach(canvas => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    canvas.width = viewportWidth * 0.8;
    canvas.height = viewportHeight;
});

const canvasContainer = document.getElementById("canvas-container");

let isDrawing = false;

let lastX = 0;
let lastY = 0;

const canvasRect = designCanvas.getBoundingClientRect();
const canvasLeft = canvasRect.left;
const canvasTop = canvasRect.top;


/**
* @param {MouseEvent} e
*/
function startDrawing(e){
    isDrawing = true;

    lastX = e.clientX - canvasLeft;
    lastY = e.clientY - canvasTop;

    console.log(active)
    if (active === 0){
        canvasContainer.addEventListener("mousemove", drawEraser);
    }

    if (active === 1){
        canvasContainer.addEventListener("mousemove", drawPencil);
    }

    if (active === 2){
        canvasContainer.addEventListener("mousemove", drawTitle)
    }

    if (active === 3){
        canvasContainer.addEventListener("mousemove", drawChecklist)
    }
    

    canvasContainer.addEventListener("mouseup", stopDrawing);
}

/**
* @param {MouseEvent} e
*/
function drawPencil(e) {
    if (!isDrawing) return;

    const currentX = e.clientX - canvasLeft;
    const currentY = e.clientY - canvasTop;

    // Get settings
    const slider = document.getElementById("pencil-slider");
    const color = document.getElementById("pencil-color")

    designCtx.beginPath();
    designCtx.strokeStyle = color.value; 
    designCtx.lineWidth = slider.value;         
    designCtx.lineJoin = 'round';   
    designCtx.lineCap = 'round';    


    designCtx.moveTo(lastX, lastY);

    designCtx.lineTo(currentX, currentY);
    designCtx.stroke();

      // 5. Update the last position for the next movement
    lastX = currentX;
    lastY = currentY;
}

/**
* @param {MouseEvent} e
*/
function drawEraser(e) {
    if (!isDrawing) return;

    const currentX = e.clientX - canvasLeft;
    const currentY = e.clientY - canvasTop;

    // Get settings
    const slider = document.getElementById("eraser-slider");

    const ERASE_CONTEXT = [designCtx, titleCtx, checklistCtx]

    ERASE_CONTEXT.forEach(ctx => {
        ctx.globalCompositeOperation = "destination-out";

        ctx.beginPath();
        ctx.lineWidth = slider.value*4; 
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
        ctx.lineJoin = 'round';   
        ctx.lineCap = 'round';    


        ctx.moveTo(lastX, lastY);

        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.globalCompositeOperation = "source-over";
    });


      // 5. Update the last position for the next movement
    lastX = currentX;
    lastY = currentY;
}

/**
* @param {MouseEvent} e
*/
function drawTitle(e) {
    if (!isDrawing) return;

    const currentX = e.clientX - canvasLeft;
    const currentY = e.clientY - canvasTop;

    // Get settings TODO: Implement
    const slider = document.getElementById("title-slider");

    titleCtx.beginPath();
    titleCtx.strokeStyle = "#00075aff"; 
    titleCtx.lineWidth = slider.value;
    titleCtx.lineJoin = 'round';
    titleCtx.lineCap = 'round';


    titleCtx.moveTo(lastX, lastY);

    titleCtx.lineTo(currentX, currentY);
    titleCtx.stroke();

      // 5. Update the last position for the next movement
    lastX = currentX;
    lastY = currentY;
}

/**
* @param {MouseEvent} e
*/
function drawChecklist(e) {
    if (!isDrawing) return;

    const currentX = e.clientX - canvasLeft;
    const currentY = e.clientY - canvasTop;

    // Get settings TODO: Implement
    const slider = document.getElementById("checklist-slider");

    titleCtx.beginPath();
    titleCtx.strokeStyle = "#155a00ff"; 
    titleCtx.lineWidth = slider.value;
    titleCtx.lineJoin = 'round';
    titleCtx.lineCap = 'round';


    titleCtx.moveTo(lastX, lastY);

    titleCtx.lineTo(currentX, currentY);
    titleCtx.stroke();

      // 5. Update the last position for the next movement
    lastX = currentX;
    lastY = currentY;
}


function stopDrawing() {
      isDrawing = false;
      canvasContainer.removeEventListener('mousemove', drawPencil);
      canvasContainer.removeEventListener('mousemove', drawEraser);
      canvasContainer.removeEventListener('mouseup', stopDrawing);
      canvasContainer.removeEventListener("mousemove", drawTitle);
      canvasContainer.removeEventListener("mousemove", drawChecklist);
    }
    
canvasContainer.addEventListener("mousedown", startDrawing)