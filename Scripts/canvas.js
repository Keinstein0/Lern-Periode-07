import {getUsers, getLabels} from "./requests.js";


// Utility

/**
 * Generates a unique color based on the member's ID.
 */
function getInitialsBackgroundColor(memberId) {
    // A simple hash function: sum the character codes of the ID
    let hash = 0;
    for (let i = 0; i < memberId.length; i++) {
        hash = memberId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use the hash result to pick a color from the array
    const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[colorIndex];
}


/**
 * Renders the initials avatar or the custom avatar.
 * Assumes a member object is passed in.
 */
function renderMemberAvatar(member) {
    const avatarElement = document.createElement('div');
    avatarElement.classList.add('avatar-container');
    
    // 1. Check for custom avatar (as covered in the previous answer)
    if (member.avatarHash) {
        // Create an <img> tag for the custom picture
        const img = document.createElement('img');
        img.src = `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/50.png`;
        img.alt = member.fullName;
        img.classList.add('custom-avatar'); 
        return img;

    } else {
        // 2. Render the initials avatar
        avatarElement.textContent = member.initials;
        avatarElement.style.backgroundColor = getInitialsBackgroundColor(member.id);
        return avatarElement;
    }
}

// Tool Selection

const TOOL_SETTINGS = ["eraser-settings","pencil-settings","title-settings","checklist-settings"];

const toolList = document.getElementById("tool-list");
const toolListContainer = document.getElementById("tool-list-container")
const aside = document.getElementById("aside")
const tools = toolList.children;
let active = 0;
tools[0].classList.add("tool-active");

let scale = 1.0;
let panX = 0;
let panY = 0;

let drawnImage = null;

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


            if (i === 4){
                isDrawing = false;
                scale = 1.0;
                panX = 0;
                panY = 0;

                captureLayers();
                canvasContainer.addEventListener("wheel", scrollCanvas);
                applyPanZoom();
            }
            else{
                if (active == 4){
                    canvasContainer.removeEventListener("wheel", scrollCanvas);
                    applyPanZoom();
                }
            }

            active = i;
            tools[active].classList.add("tool-active");
            console.log(active)

            stopDrawing();
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

    if (active === 4){
        //captureLayers();
        canvasContainer.addEventListener("mousemove", moveCanvas)
    }

    isDrawing = true;
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

    checklistCtx.beginPath();
    checklistCtx.strokeStyle = "#155a00ff"; 
    checklistCtx.lineWidth = slider.value;
    checklistCtx.lineJoin = 'round';
    checklistCtx.lineCap = 'round';


    checklistCtx.moveTo(lastX, lastY);

    checklistCtx.lineTo(currentX, currentY);
    checklistCtx.stroke();

      // 5. Update the last position for the next movement
    lastX = currentX;
    lastY = currentY;
}

/**
* @param {MouseEvent} e
*/
function moveCanvas(e){
    if (!isDrawing) return;


    const currentX = e.offsetX + canvasLeft;
    const currentY = e.offsetY + canvasTop;

    // 2. Calculate the difference (delta) since the last mousemove event
    const dx = currentX - lastX;
    const dy = currentY - lastY;

    // 3. Update global pan offsets by the delta
    panX += dx;
    panY += dy;

    // 4. Redraw/Re-transform the canvases with the new offsets
    applyPanZoom();

    // 5. Update lastX and lastY for the *next* mousemove event
    lastX = currentX;
    lastY = currentY;
}

/**
* @param {WheelEvent} e
*/
function scrollCanvas(e) {
    // Prevent the default browser scroll action
    console.log("scrolling")
    e.preventDefault(); 
    
    const zoomFactor = 1.1; 
    
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor; 

    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    
    panX = mouseX - (mouseX - panX) * delta;
    panY = mouseY - (mouseY - panY) * delta;

    scale *= delta;

    applyPanZoom();
}

const popup = document.getElementById("popup");

/**
* @param {MouseEvent} e
*/
async function summonUser(e){
    const x = e.clientX + canvasLeft;
    const y = e.clientY + canvasTop;

    popup.innerHTML = "<p class=\"popup-title\">Personen Hinzufügen</p>";

    const users = await getUsers();
    console.log(users);
    users.forEach((user) => {
        const userElement = document.createElement("div");
        userElement.classList.add("popup-user");

        const pfp = renderMemberAvatar(user);

        const name = document.createElement("p");
        name.textContent = user.username;

        userElement.appendChild(pfp);
        userElement.appendChild(name);

        popup.appendChild(userElement);
    });


}

document.addEventListener("click", summonUser);

function stopDrawing() {
      isDrawing = false;
      canvasContainer.removeEventListener('mousemove', drawPencil);
      canvasContainer.removeEventListener('mousemove', drawEraser);
      canvasContainer.removeEventListener('mouseup', stopDrawing);
      canvasContainer.removeEventListener("mousemove", drawTitle);
      canvasContainer.removeEventListener("mousemove", drawChecklist);
      canvasContainer.removeEventListener("mousemove", moveCanvas);
    }
canvasContainer.addEventListener("mousedown", startDrawing)




// Utility
function captureCanvas(canvas) {
    return new Promise((resolve, reject) => {
        const imgDataUrl = canvas.toDataURL();
        const img = new Image();
        
        img.onload = () => {
            resolve(img); // Resolve the promise when the image is successfully loaded
        };
        
        img.onerror = (e) => {
            reject(new Error("Failed to load image from canvas data URL."));
        };
        
        img.src = imgDataUrl;
    });
}

let designImage = null;
let titleImage = null;
let checklistImage = null;

async function captureLayers() {
    if(isDrawing) return;

    try {
        const [dImg, tImg, cImg] = await Promise.all([
            captureCanvas(designCanvas),
            captureCanvas(titleCanvas),
            captureCanvas(checklistCanvas)
        ]);

        // 3. Assign the loaded images to the global variables
        designImage = dImg;
        titleImage = tImg;
        checklistImage = cImg;

        // 4. Now that ALL images are loaded, perform the initial drawing
        applyPanZoom();
        
    } catch (error) {
        console.error("Error capturing canvas layers:", error);
    }

    console.log("clearing I")
    if(isDrawing) return;

    /*designCtx.clearRect(0, 0, designCanvas.width, designCanvas.height);
    titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
    checklistCtx.clearRect(0, 0, checklistCanvas.width, checklistCanvas.height);*/
}


const PAN_ZOOM_CONTEXTS = [designCtx, titleCtx, checklistCtx];
function applyPanZoom() {
    if (!designImage || !titleImage || !checklistImage) return;

    // A. Clear all canvases
    console.log("clearing II")
    PAN_ZOOM_CONTEXTS.forEach(ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    console.log(panX, panY, scale)
    
    // --- Design Layer ---
    designCtx.save();
    designCtx.translate(panX, panY); 
    designCtx.scale(scale, scale);  
    designCtx.drawImage(designImage, 0, 0);
    designCtx.restore();

    // --- Title Layer ---
    titleCtx.save();
    titleCtx.translate(panX, panY); 
    titleCtx.scale(scale, scale);  
    titleCtx.drawImage(titleImage, 0, 0);
    titleCtx.restore();

    // --- Checklist Layer ---
    checklistCtx.save();
    checklistCtx.translate(panX, panY); 
    checklistCtx.scale(scale, scale);  
    checklistCtx.drawImage(checklistImage, 0, 0);
    checklistCtx.restore();
}


// A simple array of colors to rotate through
const AVATAR_COLORS = [
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#3f51b5', // Indigo
    '#03a9f4', // Light Blue
    '#009688', // Teal
    '#8bc34a', // Light Green
    '#ff9800', // Orange
    '#607d8b'  // Blue Grey
];

