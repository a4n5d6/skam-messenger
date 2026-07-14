const express = require("express");
const router = express.Router();
const { getDatabase } = require("../db/db.js");


async function getMessages(documentID) {

}


router.post("/get-chat-messages", async (req, res) => {
  const chatId = req.body.id
  try {
    const sqlString = "SELECT * FROM messages WHERE chat_id = ? ORDER BY time ASC;"
    const params = [chatId];
    const db = await getDatabase();
    const messages = await db.all(sqlString, params);
    res.json({ success: true, messages });
  } catch {
    console.log(error)
  }
  
  //res.json({success: "OK", messages: messages});
});


router.post("/send-message", async (req, res) => {
    const messageText = req.body.message_text;
    const chat_ID = req.body.chat_ID;
    const currentUser_ID = req.body.user_ID;  // это отправитель
    const db = await getDatabase();
    try {
        await db.exec('BEGIN TRANSACTION');
        const result = await db.run(
            'INSERT INTO messages ("id", "chat_id", "sender_id", "text", "time", "status") VALUES (NULL, ?, ?, ?, ?, "send")',
            [chat_ID, currentUser_ID, messageText, "2026-06-26 18:52:35"]
        );
        const newID = result.lastID;
        const messageData = await db.get("SELECT * FROM messages WHERE id = ?", [newID]);
        await db.run("UPDATE chats SET last_message_id = ? WHERE id = ?", [newID, chat_ID]);
        await db.exec('COMMIT');
        const io = req.app.get("io");
        const members = await db.all("SELECT user_id FROM chat_members WHERE chat_id = ?", [chat_ID]);
        members.forEach(member => {
            io.to(`user_${member["user_id"]}`).emit("new-message", messageData);
        });
        console.log('Сообщение отправлено', members)
        res.json({ success: true, message: 'Сообщение отправлено', message_data: messageData });
    } catch {
        await db.exec('ROLLBACK');
        res.json({ success: false, message: 'Сообщение не отправлено' });
    }

    // const now = admin.firestore.Timestamp.now();
    // const data = {
    //     "sender_id": req.body["user_ID"],
    //     "message_time": now,
    //     "message_status":"sent" ,
    //     "message_text": req.body["message_text"]
    // }

    // await db.collection("chats").doc(req.body["chat_ID"]).collection("messages").add(data);
    // await db.collection("chats").doc(req.body["chat_ID"]).update({
    //     "last_message": {
    //     "sender_id": req.body["user_ID"],
    //     "last_message_text": req.body["message_text"],
    //     "last_message_time": now
    // }});
    // const chat = await db.collection("chats").doc(req.body["chat_ID"]).get();
    // const members = chat.data()["members"];

    // data["chat_id"] = req.body["chat_ID"];


   

    // res.json(data);
});


router.post("/get-user-info", async (req, res) => {
    const userID = req.session.userID;
    const chatID = req.body.chatID;
    const documentSnapshot = await db.collection("chats").doc(chatID).get();
    const members = documentSnapshot.get("members");
    const recipientID = members.find(memberId => memberId !== userID);
    const recipientData = (await db.collection("users").doc(recipientID).get()).data();
    const data = {
        "name": recipientData.name,
        "username": recipientData.username,
        "last_seen": recipientData.last_seen,
        "status": recipientData.status
    };
    res.json(data);
});


router.post("/get-my-user-info", async (req, res) => {
    const userID = req.session.userID;
    try {
        const sqlStr = "SELECT name, username, email, created_at, status FROM users WHERE id == ?"
        const params = [userID];
        const db = await getDatabase();
        const userInfo = await db.get(sqlStr, params);
        res.json({success: true, userInfo});
    } catch (error) {
        console.log('Ошибка получения данных пользователя', error);
        res.json({success: false, message: 'Настроение не то, поэтому данных не будет'});
    }
});


router.post("/reg", async (req, res) => {
    // получение информации от клиента
    const username = req.body.username;
    const name = req.body.regname;
    const email = req.body.email;
    const password = req.body.password;

    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const mdt = formatter.format(new Date()).replace(' ', ' ');

    const colors = [
        "#d309d3", "#17dbb1", "#08eb13",
        "#444242", "#0000FF", "#000080",
        "#FF00FF", "#800080", "#FF0000",
        "#FFFF00"
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];

    // регистрация
    try {
        const sqlString = 'INSERT INTO users VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [username, name, email, password, "offline", mdt, mdt, mdt, color];
        const db = await getDatabase();
        const user = await db.run(sqlString, params);
        console.log(user);
        res.redirect("/log");
    } catch (error) {
        console.log(error);
    }
});


router.post("/log", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const sqlString = "SELECT id, name, color FROM users WHERE email == ? AND password == ?";
        const params = [email, password];
        const db = await getDatabase();
        const user = await db.get(sqlString, params);
        console.log(user);
        if (user) {
            req.session.userID = user["id"];
            req.session.userName = user["name"];
            req.session.userColor = user["color"];
            req.session.save(() => {
                res.redirect("/");
            });
        } else {

        }
    } catch (error) {
        
    }
});


router.post("/find-recipient", async (req, res) => {
    const recipientUsername = req.body.inputValue; 
    const username = req.session.userName;
    try {
        const sqlStr = "SELECT id, username, name, color FROM users WHERE username = ? AND username != ?";
        const params = [recipientUsername, username];
        const db = await getDatabase();
        const recpUsername = await db.get(sqlStr, params);
        res.json({success: true, recpUsername});
    } catch (error) {
        console.log("Ошибка поиска собеседника", error)
        res.json({success: false, message: "Вся ясно, с тобой никто не хочет общаться..."})
    }





    // const querySnapshot = await db.collection("users").where("username", "==", recipientUsername).get();
    // if (querySnapshot.empty) {
    //     res.json({ success: false, message: "Пользователя не существует" }); 
    // } else {
    //     if (querySnapshot.docs[0].id == req.session.userID) {
    //         res.json({ success: false, message: "Нельзя создавать чат с самим собой" }); 
    //     } else {
    //         const snapshot = await db.collection("chats").where("members", "array-contains", req.session.userID).get();
    //         const result = snapshot.docs.find(doc => 
    //             doc.data().members.includes(querySnapshot.docs[0].id)
    //         );
    //         if (result) {
    //             res.json({ success: false, message: "Чат уже существует" }); 
    //         } else {
    //             res.json({
    //                 success: true,
    //                 message: "Пользователь найден",
    //                 recipientUser: {id: querySnapshot.docs[0].id, username: querySnapshot.docs[0].get("username") }
    //             });
    //         }
    //     }
    // }
});


// создание нового чата
router.post("/add-recipient", async (req, res) => {
    const recpID = req.body.recipientID;
    const user_ID = req.session.userID;
    const db = await getDatabase();
    try {
        await db.exec('BEGIN TRANSACTION');
        
        const result = await db.run('INSERT INTO chats ("type", "created_at", "last_message_id") VALUES ("private", ?, NULL)', ["2026-06-19 18:40:00"]);
        const newID = result.lastID; // id созданной записи в таблице chats
        
        await Promise.all([
            db.run('INSERT INTO chat_members ("chat_id", "user_id") VALUES (?, ?)', [newID, user_ID]), // добавить себя в таблицу chat_members
            db.run('INSERT INTO chat_members ("chat_id", "user_id") VALUES (?, ?)', [newID, recpID])  // добавить собеседника в таблицу chat_members
        ]);
        const recpData = await db.get('SELECT name, color FROM users WHERE id = ?', [recpID]);
        await db.exec('COMMIT');
        const io = req.app.get("io");
        const data = {
            'members': [user_ID, recpID],
            'members_details': {
                'member_names': {
                    [user_ID]: req.session.userName,
                    [recpID]: recpData.name,
                },
                'member_colors': {
                    [user_ID]: req.session.userColor,
                    [recpID]: recpData.color,
                }
            },
            chat_id: newID
        };
        const members = [user_ID, recpID];
        members.forEach(memberID => {//Список собеседников
            io.to(`user_${memberID}`).emit("chat-created", data);
        });
        return res.json({ success: true, data });
    } catch (error) {
        await db.exec('ROLLBACK');
        return res.json({ success: true, error: error.message });
    }

    // try {
    //     const sqlString = 'INSERT INTO chats ("type", "created_at", "last_message_id") VALUES ("private", ?, NULL)'
    //     const params = ["2026-06-19 18:40:00"];
    //     const createdChat = await db.run(sqlString, params); 
    //     const sqlSrt = "INSERT INTO chat_members ('chat_id', 'user_id') VALUES (?, ?);"
    //     const params2 = [createdChat.id, user_ID];
        
    //     res.json({success: true, chatID: ctreatedChat.id})
    // } catch (error) {
    //     console.log("Не получилось добавить шута твоего в чаты твои.", error);
    //     res.json({success: false, message: "Всё плохо, не получается добавить чат"})
    // }



    // console.log(req.body);
    // const recipientID = req.body["recipientID"];
    // const snapshot = await db.collection("users").doc(recipientID).get();
    // const recipientData = snapshot.data();
    // const recipientColor = recipientData["color"];
    // const recipientName = recipientData["name"];
    // const now = admin.firestore.Timestamp.now();
    // const data = {
    //     'chat_type': 'private',
    //     'created_at': now,
    //     'last_message': {
    //         'sender_id': '',
    //         'last_message_text': '',
    //         'last_message_time': now
    //     },
    //     'members': [req.session.userID, recipientID],
    //     'members_details': {
    //         'member_names': {
    //            [req.session.userID]: req.session.userName,
    //            [recipientID]: recipientName,
    //         },
    //         'member_colors': {
    //             [req.session.userID]: req.session.userColor,
    //             [recipientID]: recipientColor,
    //         }
    //     }
    // }


    // const newChat = await db.collection("chats").add(data);

    // data["chat_id"] = newChat.id;

    // 

    // const members = data["members"];
    // 

    // res.json({ success: true, message:"Chat created" });
});



router.post("/del-recipient", (res, req) => {
    
});


module.exports = router;
