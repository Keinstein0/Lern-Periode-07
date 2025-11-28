const params = new URLSearchParams(window.location.hash.substring(1));

const key = "d56c54e8470b5bd4c31ac8d303861fea";
const token = params.get("token");


sessionStorage.setItem("trelloAPItoken", token);



/***@returns {Promise<Array<Object>>}*/
async function getWorkspaces() {
    const WORKSPACE_URL = `https://api.trello.com/1/members/me/organizations?key=${key}&token=${token}`;
    
    try {
        const response = await fetch(WORKSPACE_URL);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorBody}`);
        }

        const workspacesArray = await response.json();
        return workspacesArray; 
        
    } catch (error) {
        console.error("Error in getWorkspaces:", error);
        throw error;
    }
}

/***@returns {Promise<Array<Object>>}*/
async function getBoard(id) {
    const BOARD_URL = `https://api.trello.com/1/boards/${id}?key=${key}&token=${token}&lists=open`;
    
    try {
        const response = await fetch(BOARD_URL);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorBody}`);
        }

        const boardArray = await response.json();
        return boardArray; 
        
    } catch (error) {
        console.error("Error in getWorkspaces:", error);
        throw error;
    }
}


let allWorkspaces = null;
async function loadWorkspaces() {
    try {
        allWorkspaces = await getWorkspaces();

        const workspaceContainer = document.getElementById("workspace-container")

        allWorkspaces.forEach(element => {
            
            const workspaceDiv = document.createElement("div");
            const workspaceHeader = document.createElement("h2");
            const boardContainter = document.createElement("div");
            const workspaceArrow = document.createElement("img");
            const headerWrapper = document.createElement("div");


            workspaceHeader.textContent = element.displayName;
            workspaceHeader.classList.add("workspaceTitle")
            workspaceArrow.src = "Assets/Img/white-up-arrow.png"
            workspaceArrow.classList.add("workspaceImg")
            workspaceDiv.classList.add("workspaceDiv")
            boardContainter.classList.add("boardContainer")
            headerWrapper.classList.add("headerWrapper")
            
            headerWrapper.addEventListener("click", function(event){
                const boardContainter = this.nextElementSibling;

                Array.from(boardContainter.children).forEach(child =>{
                    child.hidden = !child.hidden;
                    if(child.hidden){
                        workspaceHeader.classList.remove("workspaceTitleActive");
                        boardContainter.classList.remove("boardContainerActive");
                        workspaceArrow.src = "Assets/Img/white-up-arrow.png"
                    }
                    else{
                        workspaceHeader.classList.add("workspaceTitleActive");
                        boardContainter.classList.add("boardContainerActive");
                        workspaceArrow.src = "Assets/Img/white-down-arrow.png"
                    }


                })
            })

            element.idBoards.forEach(board => {
                loadBoards(boardContainter, board)
            })

            
            headerWrapper.appendChild(workspaceArrow);
            headerWrapper.appendChild(workspaceHeader);
            workspaceDiv.appendChild(headerWrapper);
            
            workspaceDiv.appendChild(boardContainter);
            
            workspaceContainer.appendChild(workspaceDiv);

            
        });
        


    } catch (error) {
        console.error("Data processing failed:", error.message);
    }
}

async function loadBoards(boardContainter, boardId){
    const board = await getBoard(boardId);

    const boardDiv = document.createElement("div");
    const boardHeader = document.createElement("h3");
    const listContainer = document.createElement("div");

    boardHeader.innerHTML = "<img src=\"Assets/Img/black-up-arrow.png\" class=\"boardHeaderArrow\"></img>" + board.name;
    boardDiv.classList.add("boardDiv");
    boardHeader.classList.add("boardHeader");
    listContainer.classList.add("listContainer")


    boardHeader.addEventListener("click", function(event){
        const listContainer = this.nextElementSibling;

        Array.from(listContainer.children).forEach(child =>{
            child.hidden = !child.hidden;
            if (child.hidden){
                listContainer.classList.remove("listContainerActive")
                boardHeader.innerHTML = "<img src=\"Assets/Img/black-up-arrow.png\" class=\"boardHeaderArrow\"></img>" + board.name;
            }
            else{
                listContainer.classList.add("listContainerActive")
                boardHeader.innerHTML = "<img src=\"Assets/Img/black-down-arrow.png\" class=\"boardHeaderArrow\"></img>" + board.name;
            }
        })
    })
    
    boardDiv.hidden = true;

    board.lists.forEach(list => {
        const listDiv = document.createElement("div");
        const listHeader = document.createElement("h4");

        listHeader.textContent = list.name;
        listDiv.classList.add("listDiv");
        listDiv.hidden = true;
        listDiv.addEventListener("click", () => {

            sessionStorage.setItem("boardId", board.id);
            sessionStorage.setItem("listId", list.id)

            window.location.href = "canvas.html"
        })

        listDiv.appendChild(listHeader);
        listContainer.appendChild(listDiv);
    })

    boardDiv.appendChild(boardHeader);
    boardDiv.appendChild(listContainer);
    boardContainter.appendChild(boardDiv);
}


// Kick off your main function
loadWorkspaces();

