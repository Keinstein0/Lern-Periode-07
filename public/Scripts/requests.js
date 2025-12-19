const KEY = "d56c54e8470b5bd4c31ac8d303861fea";
const TOKEN = sessionStorage.getItem("trelloAPItoken");
const BOARD = sessionStorage.getItem("boardId");
const LIST = sessionStorage.getItem("listId");

const IMAGE_PROCESSOR_URL = "http://localhost:5000/api"


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

export async function getTextOnImage(image){
    const body = {
        file : image,
        language : "eng",
        filetype : "jpg"
    }

    const rawResponse = await fetch(IMAGE_PROCESSOR_URL, {
        method : "POST",
        body : JSON.stringify(body),
        headers : {
            "Content-Type" : "application/json"
        }
    });

    const content = await rawResponse.json()
    if (content.IsErroredOnProcessing){
        return null
    }
    const text = content.ParsedResults[0].ParsedText;


    console.log(content);
    console.log(text)
    return text;
}


export async function postCard(name, members, labels){
    console.log("POSTING CARD...")
    const body = {
        "name" : name,
        "idMembers" : members,
        "idLabels" : labels
    }

    // Todo Update eh
    const url = `https://api.trello.com/1/cards?idList=${LIST}&key=${KEY}&token=${TOKEN}`
    const rawResponse = await fetch(url, {
        method : "POST",
        body : JSON.stringify(body),
        headers : {
            "Content-Type" : "application/json"
        }
    })

    const content = await rawResponse.json()
    if (content.IsErroredOnProcessing){
        return null
    }

    console.log(content)

    return content.id
}

export async function postChecklist(list, cardId) {
    // 1. Create the Checklist container
    const checklistUrl = `https://api.trello.com/1/checklists?idCard=${cardId}&name=Checklist&key=${KEY}&token=${TOKEN}`;
    
    const checklistResponse = await fetch(checklistUrl, { 
        method: "POST" 
    });

    if (!checklistResponse.ok) {
        console.error("Failed to create checklist container");
        return null;
    }

    const checklistData = await checklistResponse.json();
    const checklistId = checklistData.id;

    // 2. Add each item from your 'list' array to the new checklist
    // We use Promise.all to send these requests in parallel for better speed
    const itemPromises = list.map(itemName => {
        const itemUrl = `https://api.trello.com/1/checklists/${checklistId}/checkItems?name=${encodeURIComponent(itemName)}&key=${KEY}&token=${TOKEN}`;
        return fetch(itemUrl, { method: "POST" });
    });

    try {
        await Promise.all(itemPromises);
        console.log(`Successfully added ${list.length} items to checklist ${checklistId}`);
        return checklistId;
    } catch (error) {
        console.error("Error adding items to checklist:", error);
        return checklistId; // Returns the ID even if some items failed
    }
}

export async function getList(){
    const url = `https://api.trello.com/1/lists/${LIST}?key=${KEY}&token=${TOKEN}`;

    const rawResponse = await fetch(url, {
        method : "GET",
        headers : {
            "Content-Type" : "application/json"
        }
    })

    const content = await rawResponse.json()
    if (content.IsErroredOnProcessing){
        return null
    }

    return content.name;
}

export async function getCurrentUser() {
    const url = `https://api.trello.com/1/tokens/${TOKEN}/member?key=${KEY}&token=${TOKEN}`;

    const rawResponse = await fetch(url, {
        method : "GET",
        headers : {
            "Content-Type" : "application/json"
        }
    })

    const content = await rawResponse.json()
    if (content.IsErroredOnProcessing){
        return null
    }

    const publicAvatarUrl = content.avatarHash 
        ? `https://trello-members.s3.amazonaws.com/${content.id}/${content.avatarHash}/50.png` 
        : null;

    return [content.fullName,publicAvatarUrl]
}

export async function getCards(params) {
    const url = `https://api.trello.com/1/lists/${LIST}/cards?key=${KEY}&token=${TOKEN}&members=true&labels=all`;

    const rawResponse = await fetch(url, {
        method : "GET",
        headers : {
            "Content-Type" : "application/json"
        }
    })
    const content = await rawResponse.json()
    console.log(content)

    return content;
}