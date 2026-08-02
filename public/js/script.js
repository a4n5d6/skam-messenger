const socket = io();
const chatContainers = document.querySelectorAll(".chat-container");
const messageContainer = document.querySelector(".messages");
const userID = +document.body.dataset.userId;
const messageTextContainer = document.querySelector(".message-text-container");
const textInfo = document.querySelector(".text-info");
const enterMessage = document.querySelector(".enter-message");
const publicUserInfo = document.querySelector(".pub-user-info");
const modalWindow = document.querySelector(".modal-window-user-info");
const myModalWindow = document.querySelector(".modal-window-myuser-info");
const myAccountBtn = document.querySelector(".myInfoBtn");
const closeModalWindow = document.querySelector(".close-modal-window");
const recipientInfo = document.querySelector(".recipient-info");
const myInfo = document.querySelector(".my-info");
const butLogout = document.querySelector(".butLogout");
const closeMyModalWindow = document.querySelector(".close-mymodal-window");
const audioSendMessage = document.querySelector("#audioSendMess");
const searchRecipient = document.querySelector("#search-recipient");
const findedUser = document.querySelector(".finded-user");
const findedUserInfo = document.querySelector(".finded-user-info");
const buttonAdd = document.querySelector(".button-add");
const buttonDel = document.querySelector(".button-del");
const userChats = document.querySelector(".user-chats");
const typingSpan =  document.querySelector(".typing");
const eye = document.querySelector(".eye-button");
const inpPas = document.querySelector(".password");
const messageMenu = document.getElementById("message-menu");
const btnDelete = document.getElementById("btn-delete");


// eye.addEventListener("click", () => {
//     if (inpPas.getAttribute("type") === "password") {
//         inpPas.setAttribute("type", "text");
//     } else {
//         inpPas.setAttribute("type", "password");
//     }
// });

document.addEventListener("click", () => {
    messageMenu.classList.add('hidden');
});

function appendMessage(message) {
    const time = message.time.slice(10, 16);
    const div = document.createElement("div");
    div.id = `message-${message.id}`;
    div.classList.add("message-container");
    if (userID == message.sender_id) {
        div.classList.add("recipient");
    };

    div.innerHTML = `
        <p>${message.text}</p>
        <span>${time}</span>
    `;//Формируем структуру  сообщения
    
    div.addEventListener('contextmenu', (event) => {
        messageMenu.classList.remove('hidden');
        event.preventDefault(); 
        localStorage.setItem("messageId", div.id);
    });
    messageContainer.appendChild(div);
}


btnDelete.addEventListener("click", async () => {
    const messageId = localStorage.getItem("messageId");
    const chatID = localStorage.getItem("chatID");
    if (!messageId) return;
    const response = await fetch("api/del-message", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({messageId: messageId, chatID: chatID})
    });

    const result = await response.json();

    if (response.ok) {
        if (result.success) {
            // document.querySelector(messageId).remove();
            console.log(messageId, result)
            localStorage.removeItem("messageId");
        }
    }

});


socket.on("delete-message", (data) => {
    const messageId = data.messageId; // id сообщения, которое нужно удалить
    const chat_ID = data.chatID; // id чата, из которого нужно удалить сообщение
    const chatID = +localStorage.getItem("chatID"); // id открытого на странице чата
    
    if (chat_ID === chatID) {
        // если сообщение нужно удалить из текущего чата
        messageContainer.querySelector(`#${messageId}`).remove();
    } else {
        messageContainer.querySelector(`#${messageId}`).remove();
    }
    
        // message - объект сообщения
        // console.log(message, chatID);
    //     const chatContainer = document.getElementById(chatID);
    //     chatContainer.querySelector(".last-message-time").textContent = message["time"].slice(11, 16);
    //     chatContainer.querySelector(".last-message-text").textContent = message["text"];
    //     // message["chat_id"] - id чата, куда пришло новое сообщение
    //     // chatID - id выбранного чата
    //     appendMessage(message);
    // } else {
    //     const chatContainer = document.getElementById(message["chat_id"]);
    //     chatContainer.querySelector(".last-message-time").textContent = message["time"].slice(11, 16);
    //     chatContainer.querySelector(".last-message-text").textContent = message["text"];
    //     // Программа  получает новое сообщения, но сообщение приходит в другой чат
    // }
});


function selectChat(chatContainer) {
    // Переменная chatContainer - это html узел или элемент
    socket.emit("join-chat", chatContainer.id);
    chatContainer.addEventListener("click", async () => {
        publicUserInfo.classList.remove("hidden");
        messageTextContainer.classList.remove("hidden");
        const response = await fetch("api/get-chat-messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id: chatContainer.id})
            // По клику на чат открываем сообщения чата
        });
 
        const result = await response.json();
        
        if (response.ok) {

            console.log(result);
            messageContainer.innerHTML = "";
            result.messages.forEach(message => appendMessage(message));
            localStorage.setItem("chatID", chatContainer.id);
            // В локальном хранилище находим id чата 
        }
    });
}


function nowTime() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}





if (butLogout) {
    butLogout.addEventListener("click", () => {
        location.reload()
    });
}


if (publicUserInfo) {
    publicUserInfo.addEventListener("click", async () => {
        modalWindow.classList.remove("hidden");
        const chatID = localStorage.getItem("chatID");
        const response = await fetch("api/get-user-info", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chatID: chatID})
        });
        const result = await response.json();
        console.log(result);
        recipientInfo.innerHTML = `
        <span class="name">${result.name}</span>
        <span class="userName">${result.username}</span>
        <span class="last_seen">${formatTime(result.last_seen)}</span>
        <span class="status">${result.status}</span>
        `;
    });
}


if (myAccountBtn) {
    myAccountBtn.addEventListener("click", async () => {
        myModalWindow.classList.remove("hidden");
        const response = await fetch("api/get-my-user-info", {
            method: "POST",
            headers: {"Content-Type": "application/json"}
        });
        const result = await response.json(); // Добавить условие для проверки результата
        if (result.success === true) {
            myInfo.innerHTML = `
                <span class="name">${result.userInfo.name}</span>
                <span class="userName">${result.userInfo.username}</span>
                <span class="email">${result.userInfo.email}</span>
                <span class="createdAccount">${result.userInfo.created_at}</span>
            `;
        } else {
            alert(result.message);
        }
    });
}


if (closeModalWindow) {
    closeModalWindow.addEventListener("click",() => {
        modalWindow.classList.add("hidden");
        recipientInfo.innerHTML = "";
    });
}


if (closeMyModalWindow) {
    closeMyModalWindow.addEventListener("click",() => {
        myModalWindow.classList.add("hidden");
        console.log("OK");
    });
}


chatContainers.forEach(chatContainer => {
    selectChat(chatContainer);
});


if (textInfo) {
  textInfo.addEventListener("keydown", async (e) => { 
    if (e.key === "Enter") { 
      const time = nowTime();
      const response = await fetch("api/send-message", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message_text: textInfo.value, 
          chat_ID: localStorage.getItem("chatID"),
          user_ID: userID,
          time: time
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (result.success) {
          const messageData = result['message_data'];
          // messageData = { id, chat_id, sender_id, text, time }
          // изменить время последнего сообщения в чате
          textInfo.value = "";
          audioSendMessage.play();
        }
      }
    }
  });
}


if (enterMessage) {
    enterMessage.addEventListener("click", async () => {
        const response = await fetch("api/send-message", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message_text: textInfo.value, 
                chat_ID: localStorage.getItem("chatID"), 
                user_ID: userID}) //Отправляем на сервер текст сообщения
            });
            
            const result = await response.json();
            
            if (response.ok) {
                textInfo.value = "";
                audioSendMessage.play();
            }
    });
}


socket.on("new-message", (message) => {
    // message - объект сообщения
    const chatID = +localStorage.getItem("chatID");
    console.log(message, chatID);
    if (message["chat_id"] === chatID) {
        const chatContainer = document.getElementById(chatID);
        chatContainer.querySelector(".last-message-time").textContent = message["time"].slice(11, 16);
        chatContainer.querySelector(".last-message-text").textContent = message["text"];
        // message["chat_id"] - id чата, куда пришло новое сообщение
        // chatID - id выбранного чата
        appendMessage(message);
    } else {
        const chatContainer = document.getElementById(message["chat_id"]);
        chatContainer.querySelector(".last-message-time").textContent = message["time"].slice(11, 16);
        chatContainer.querySelector(".last-message-text").textContent = message["text"];
        // Программа  получает новое сообщения, но сообщение приходит в другой чат
    }
});


socket.on("chat-created", (data) => {
    //data - it"s object by my chat, include chat id
    const recipientID = data["members"].find(memberId => memberId !== userID);
    console.log(recipientID, userID);
    const chatTitle = data["members_details"]["member_names"][recipientID];
    const firstLetter = chatTitle.charAt(0);

    const recipientColor = data["members_details"]["member_colors"][recipientID];

    const chatDiv = document.createElement("div");
    chatDiv.id = data["chat_id"];
    chatDiv.classList.add("chat-container");
    chatDiv.innerHTML = `
        <div class="chat-avatar" style="background-color: ${recipientColor}">${firstLetter}</div>
        <div class="chat-info">
            <div class="chat-info-row">
                <div class="chat-title">${chatTitle}</div>
                <div class="last-message-time"></div>
            </div>
            <div class="last-message-text"></div>
        </div>
    `;
    userChats.prepend(chatDiv);
    selectChat(chatDiv);
});


if (searchRecipient) {
    searchRecipient.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const inputValue  = searchRecipient.value;
            const response = await fetch("/api/find-recipient", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({inputValue: inputValue})
            });
            const result = await response.json();
            if (result.success === true) {
                if (result.recpUsername) {
                    console.log(result)
                    const recipientUserName = result.recpUsername.username;
                    const recipientid = result.recpUsername.id;
                    findedUserInfo.textContent = `${recipientUserName}`;
                    findedUser.classList.remove("hidden");
                    console.log(recipientid);
                    buttonAdd.addEventListener("click", async () => {
                        const response = await fetch("/api/add-recipient", {
                            method: "POST" ,
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({"recipientID": recipientid})
                        });
                        const result = await response.json();
                            if (response.ok) {
                            console.log(result);
                        }

                    });
                    buttonDel.addEventListener("click", async () => {
                        
                    });
                } else {
                    console.log("Вы не подходите по критериям, поэтому с вами никто общаться не будет...")
                }
            } else {
                console.log(result.message)
            }


    }});
}

//Индикатор того, что пользователь печатает
textInfo.addEventListener("input", () => { // Я печатаю
    const chatID = localStorage.getItem("chatID");
    socket.emit("typing", {userID, chatID});
});

let typingTimer;

socket.on("user_typing", (data) => {
    typingSpan.classList.remove("hidden");
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        typingSpan.classList.add("hidden");
    }, 1200);
});


buttonAdd.addEventListener("click", () => {
    searchRecipient.value = "";
    findedUser.innerHTML = "";
});
