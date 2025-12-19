import {getUsers, getLabels, postCard, postChecklist, getTextOnImage} from "./requests.js";


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


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

const overlay = document.getElementById("overlay");
overlay.style.visibility = "hidden";

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
    tools[i].addEventListener("click", async (e) => {
        if (!(i===active)){
            tools[active].classList.remove("tool-active");
            toggleSettings(active, true)


            if (i === 4){
                isDrawing = false;

                captureLayers();
                canvasContainer.addEventListener("wheel", scrollCanvas);
                //applyPanZoom();
            }
            else{
                if (active == 4){
                    canvasContainer.removeEventListener("wheel", scrollCanvas);
                    
                    const markers = markerContainer.children;
                    for (let j = 0; j < markers.length; j++){ // Use 'j' to avoid 'i'
                        const marker = markers[j];
                        if (marker.classList.contains("user")){
                            marker.xOrigin = (marker.xOrigin * scale) + panX;
                            marker.yOrigin = (marker.yOrigin * scale) + panY;
                            marker.scaleOrigin = marker.scaleOrigin * scale;
                        }

                        if (marker.classList.contains("label")){
                            marker.xOrigin = (marker.xOrigin * scale) + panX;
                            marker.yOrigin = (marker.yOrigin * scale) + panY;
                            marker.scaleOrigin = marker.scaleOrigin * scale;
                        }
                    }


                    applyPanZoom();
                    await captureLayers();
                    
                    scale = 1.0;
                    panX = 0;
                    panY = 0;

                    applyPanZoom();
                }
            }
            if (i === 5){
                e.stopPropagation();
                canvasContainer.addEventListener("click", summonUser);
            }
            else{
                if (active === 5){
                    canvasContainer.removeEventListener("click", summonUser)
                }
            }

            if (i === 6){
                e.stopPropagation();
                canvasContainer.addEventListener("click", summonLabel);
            }
            else{
                if (active === 6){
                    canvasContainer.removeEventListener("click", summonLabel)
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

    if (active === 7){
        canvasContainer.addEventListener("mousemove", selectCanvas)
        canvasContainer.addEventListener("mouseup", lockSelectionCanvas)
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

/**
 * @param {MouseEvent} e
 */
function selectCanvas(e){
    if (!isDrawing) {return}

    const currentX = e.clientX - canvasLeft;
    const currentY = e.clientY - canvasTop;


    animationCtx.clearRect(0,0, animationCanvas.width, animationCanvas.height);
    animationCtx.fillStyle = "red";
    animationCtx.fillRect(lastX, lastY, currentX-lastX, currentY-lastY)
}

const popup = document.getElementById("popup");
const markerContainer = document.getElementById("marker-container");
popup.hidden = true;
let popupActive = false;
let userSize = 50;

/**
* @param {MouseEvent} e
*/
async function summonUser(e){
    if(popupActive){
        return
    }
    
    
    const x = e.clientX + canvasLeft;
    const y = e.clientY + canvasTop;

    popup.innerHTML = "<p class=\"popup-title\">Personen Hinzufügen</p>";

    const users = await getUsers();
    users.forEach((user) => {
        const userElement = document.createElement("div");
        userElement.classList.add("popup-user");

        const pfp = renderMemberAvatar(user);

        userElement.addEventListener("click", async (e) => {
            pfp.classList.add("user")
            pfp.style.left = x-10 + "px";
            pfp.style.top = y-10 + "px";
            pfp.style.width = userSize + "px";

            pfp.xOrigin = x - 10;
            pfp.yOrigin = y - 10;
            pfp.scaleOrigin = userSize;

            pfp.id = user.id;

            pfp.addEventListener("click", () => {
                //console.log("Delet" + active)
                if (active === 0){
                    markerContainer.removeChild(pfp)
                }
            });

            markerContainer.appendChild(pfp);
            e.stopPropagation();
            console.log(pfp)
            popupActive = false;
            popup.hidden = true;
        })


        const name = document.createElement("p");
        name.textContent = user.username;

        userElement.appendChild(pfp);
        userElement.appendChild(name);

        popup.appendChild(userElement);
    });

    popup.style.left = x-10 + "px";
    popup.style.top = y-10 + "px";
    popup.hidden = false;
    popupActive = true;
}


let labelSize = 20;
async function summonLabel(e){
    if(popupActive){
        return
    }
    
    
    const x = e.clientX + canvasLeft;
    const y = e.clientY + canvasTop;

    popup.innerHTML = "<p class=\"popup-title\">Labels Hinzufügen</p>";

    const labels = await getLabels();
    console.log(labels)
    labels.forEach((label) => {
        if (label.name === ""){
            return;
        }


        const labelElement = document.createElement("div");
        labelElement.classList.add("popup-label");

        const title = document.createElement("h4");
        title.textContent = label.name;
        title.style.backgroundColor = trelloLabelColors[label.color];
        

        labelElement.addEventListener("click", async (e) => {
            title.classList.add("label")
            title.style.left = x-10 + "px";
            title.style.top = y-10 + "px";
            title.style.fontSize = labelSize + "px";

            title.xOrigin = x - 10;
            title.yOrigin = y - 10;
            title.scaleOrigin = labelSize;

            title.id = label.id;

            title.addEventListener("click", () => {
                //console.log("Delet" + active)
                if (active === 0){
                    markerContainer.removeChild(title)
                }
            });

            markerContainer.appendChild(title);
            e.stopPropagation();
            console.log(title)
            popupActive = false;
            popup.hidden = true;
        })

        labelElement.appendChild(title);
        popup.appendChild(labelElement);
    });

    popup.style.left = x-10 + "px";
    popup.style.top = y-10 + "px";
    popup.hidden = false;
    popupActive = true;
}

/**
 * @param {MouseEvent} e
 */
async function lockSelectionCanvas(e){
    animationCtx.clearRect(0,0, animationCanvas.width, animationCanvas.height);

    const xStart = lastX;
    const yStart = lastY;

    const xEnd = e.clientX - canvasLeft;
    const yEnd = e.clientY - canvasTop;

    const selectionWidth = Math.abs(xEnd - xStart);
    const selectionHeight = Math.abs(yEnd - yStart);

    const sx = Math.min(xStart, xEnd);
    const sy = Math.min(yStart, yEnd);

    // Create a temporary canvas for Title
    const tempTitleCanvas = document.createElement('canvas');
    // Use the calculated dimensions
    tempTitleCanvas.width = selectionWidth;
    tempTitleCanvas.height = selectionHeight;

    const tempTitleContext = tempTitleCanvas.getContext('2d');

    tempTitleContext.drawImage(
        titleCanvas,
        sx, sy, selectionWidth, selectionHeight,
        0, 0, selectionWidth, selectionHeight 
    );

    const base64ImageStringTitle = tempTitleCanvas.toDataURL('image/png');

        // Create a temporary canvas
    const tempCheckCanvas = document.createElement('canvas');
    // Use the calculated dimensions
    tempCheckCanvas.width = selectionWidth;
    tempCheckCanvas.height = selectionHeight;

    const tempCheckContext = tempCheckCanvas.getContext('2d');

    tempCheckContext.drawImage(
        checklistCanvas,
        sx, sy, selectionWidth, selectionHeight,
        0, 0, selectionWidth, selectionHeight 
    );

    const base64ImageStringCheck = tempCheckCanvas.toDataURL('image/png');
    
    let title = await getTextOnImage(base64ImageStringTitle);
    const checklist = await getTextOnImage(base64ImageStringCheck);


    const titleElement = document.getElementById("overlay-title");
    const listElement = document.getElementById("overlay-list");
    const memberElement = document.getElementById("overlay-member");
    const labelElement = document.getElementById("overlay-label");


    const confirmElement = document.getElementById("overlay-button-confirm");
    const discardElement = document.getElementById("overlay-button-discard");


    if (title == ""){
        title = "Card Title"
    }


    titleElement.textContent = title;
    listElement.innerHTML = "";
    memberElement.innerHTML = "";
    labelElement.innerHTML = "";

    let checklistItems = []

    if (checklist){
        const lines = checklist.split("\n");
        lines.forEach(line => {
            const trimmed = line.replace(/^[\s-]|[\s-]$/g, '');
            const item = document.createElement("li");
            item.textContent = trimmed;
            listElement.appendChild(item)
            checklistItems.push(trimmed);
        })
    }
    
    // Get all tags and people

    let userIDs = []
    let labelIDs = []


    const markers = markerContainer.children;
    for (let i = 0; i < markers.length; i++){
        const marker = markers[i];

        const markerLeft = parseInt(marker.style.left) || 0;
        const markerTop = parseInt(marker.style.top) || 0;

        // 2. Correct Range Check (4 conditions, joined by &&)
        const isXInArea = markerLeft >= sx && markerLeft <= (sx + selectionWidth);
        const isYInArea = markerTop >= sy && markerTop <= (sy + selectionHeight);
        
        // Skip if the marker is NOT in both the X and Y ranges
        if (!(isXInArea && isYInArea)) continue; // Marker is outside the selection box

        if (marker.classList.contains("user")){
            const adaptedMarker = marker.cloneNode(true)
            adaptedMarker.classList.add("user-block")
            adaptedMarker.style.width = "50px"

            if (userIDs.includes(marker.id)) continue
            userIDs.push(marker.id)

            memberElement.appendChild(adaptedMarker);
        }

        if(marker.classList.contains("label")){
            const adaptedMarker = marker.cloneNode(true)
            adaptedMarker.classList.add("label-block")
            adaptedMarker.style.fontSize = "20px"

            if (labelIDs.includes(marker.id)) continue
            labelIDs.push(marker.id)

            labelElement.appendChild(adaptedMarker);
        }
    }


    discardElement.addEventListener("click", () => {
        overlay.style.visibility = "hidden";
    }, { once: true });

    confirmElement.addEventListener("click", async () => {
        overlay.style.visibility = "hidden";

        const id = await postCard(title, userIDs, labelIDs);
        await postChecklist(checklistItems, id)
    }, { once: true });



    overlay.style.visibility = "visible";
}

function stopDrawing() {
      isDrawing = false;
      canvasContainer.removeEventListener('mousemove', drawPencil);
      canvasContainer.removeEventListener('mousemove', drawEraser);
      canvasContainer.removeEventListener('mouseup', stopDrawing);
      canvasContainer.removeEventListener("mousemove", drawTitle);
      canvasContainer.removeEventListener("mousemove", drawChecklist);
      canvasContainer.removeEventListener("mousemove", moveCanvas);
      canvasContainer.removeEventListener("mousemove", selectCanvas);
      canvasContainer.removeEventListener("mouseup", lockSelectionCanvas);
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

    const markers = markerContainer.children;
    for (let i = 0; i < markers.length; i++){
        const marker = markers[i];
        if (marker.classList.contains("user")){
            // The origin position must be scaled, then panned
            marker.style.left = (marker.xOrigin * scale) + panX + "px";
            marker.style.top = (marker.yOrigin * scale) + panY + "px";
            marker.style.width = (marker.scaleOrigin * scale) + "px";
        }

        if(marker.classList.contains("label")){
            marker.style.left = (marker.xOrigin * scale) + panX + "px";
            marker.style.top = (marker.yOrigin * scale) + panY + "px";
            marker.style.fontSize = (marker.scaleOrigin * scale) + "px";
        }
    }




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

// Nahh i aint doing that by hand (GPT has carried here)
const trelloLabelColors = {
  // --- BLUE SHADES ---
  "blue": "#0079BF",
  "blue_light": "#BBD5EE",
  "blue_dark": "#055A8C",

  // --- GREEN SHADES ---
  "green": "#70B500",
  "green_light": "#C3E570",
  "green_dark": "#438400",

  // --- ORANGE SHADES ---
  "orange": "#FF9F1A",
  "orange_light": "#FFD380",
  "orange_dark": "#B36700",

  // --- RED SHADES ---
  "red": "#EB5A46",
  "red_light": "#FFAD99",
  "red_dark": "#B33E2B",

  // --- YELLOW SHADES ---
  "yellow": "#F2D600",
  "yellow_light": "#F8EC79",
  "yellow_dark": "#C5A800",

  // --- PURPLE SHADES ---
  "purple": "#C377E0",
  "purple_light": "#E9C0F4",
  "purple_dark": "#89609E",

  // --- PINK SHADES ---
  "pink": "#FF78CB",
  "pink_light": "#FFC7E0",
  "pink_dark": "#B34F8C",

  // --- SKY SHADES ---
  "sky": "#00C2E0",
  "sky_light": "#C3F0F7",
  "sky_dark": "#008DA6",

  // --- LIME SHADES ---
  "lime": "#51E898",
  "lime_light": "#C0F6D5",
  "lime_dark": "#36B373",

  // --- BLACK/GREY SHADES ---
  "black": "#344563", // Trello's "Black" or dark grey
  "black_light": "#B3BAC5",
  "black_dark": "#091E42",
  "grey": "#C4C9CC", // Often used as the default/uncolored label
};

