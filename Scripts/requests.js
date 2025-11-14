const KEY = "d56c54e8470b5bd4c31ac8d303861fea";
const TOKEN = sessionStorage.getItem("trelloAPItoken");
const BOARD = sessionStorage.getItem("boardId");
const LIST = sessionStorage.getItem("listId");



let users = null;
let lastUserFetched = Date.now();

export async function getUsers(){
    if (Date.now() - lastUserFetched > 1000*60 || users == null){
        const url = `https://api.trello.com/1/boards/${BOARD}/members?key=${KEY}&token=${TOKEN}&fields=initials,avatarHash,fullName,username,id`

        try{
            const response = await fetch(url);

            if (!response.ok) {
                // Throw an error if the status code is not 2xx
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }

            const members = await response.json();
            return members
        }
        catch{
            console.error("\nAn error occurred during the Trello API request:");
            console.error(error);
            return null;
        }
    }
    else{
        return users
    }
}


let labels = null;
let lastLabelFetched = Date.now();

export async function getLabels(){
    if (Date.now() - lastLabelFetched > 1000*60 || labels == null){
        const url = `https://api.trello.com/1/boards/${BOARD}/labels?key=${KEY}&token=${TOKEN}`

        try{
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }

            const gotten = await response.json();
            return gotten
        }
        catch{
            console.error("\nAn error occurred during the Trello API request:");
            console.error(error);
            return null;
        }
    }
    else{
        return labels
    }
}

