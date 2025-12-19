import {getList, getCurrentUser, getCards} from "./requests.js";


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



console.log("Rendering aside")

const title = document.getElementById("aside-list-name")
const usernameobj = document.getElementById("aside-currentuser-user");
const userpfp = document.getElementById("aside-currentuser-img");

const cardContainer = document.getElementById("aside-card-container");


cardContainer.innerHTML = "";

async function addStatics(){
    const listName = await getList();
    title.textContent = listName;

    const [username, userimgurl] = await getCurrentUser();
    usernameobj.textContent = username
    console.log(userimgurl)
    userpfp.src = userimgurl
}


async function addCards(){
    const cards = await getCards();

    cards.forEach((card) => {
        console.log(card)


        const newCard = document.createElement("div")
        newCard.classList.add("aside-card");

        const newCardLabelContainer = document.createElement("div");
        newCardLabelContainer.classList.add("aside-label-container");

        card.labels.forEach((label) => {
            const newLabel = document.createElement("div");
            newLabel.classList.add("aside-label")

            newLabel.style.backgroundColor = trelloLabelColors[label.color];
            newCardLabelContainer.appendChild(newLabel)
        })
        newCard.appendChild(newCardLabelContainer)

        const cardTitle = document.createElement("h2");
        cardTitle.classList.add("aside-card-title")
        cardTitle.textContent = card.name;

        newCard.appendChild(cardTitle);


        const cardMemberContainer = document.createElement("div");
        cardMemberContainer.classList.add("aside-members-container");

        card.members.forEach((member) => {
            const publicAvatarUrl = member.avatarHash 
                ? `https://trello-members.s3.amazonaws.com/${member.id}/${member.avatarHash}/50.png` 
                : null;

            const cardMember = document.createElement("img");
            cardMember.classList.add("aside-member");
            cardMember.src = publicAvatarUrl;

            cardMemberContainer.appendChild(cardMember);
        })

        newCard.appendChild(cardMemberContainer);







        cardContainer.appendChild(newCard)
    })



}
/*

        <div id="aside-card-container">
            <div class="aside-card">
                <div class="aside-label-container">
                    <div class="aside-label"></div>
                </div>
                    <h2 class="aside-card-title">CardTitle</h2>
                    <div class="aside-members-container">
                        <img class="aside-member" src="Assets/Img/user.png">
                        <img class="aside-member" src="Assets/Img/user.png">
                        <img class="aside-member" src="Assets/Img/user.png">
                        <img class="aside-member" src="Assets/Img/user.png">
                    </div>
            </div>
        </div>

*/

await addStatics();
await addCards();













