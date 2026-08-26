const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/db.js');


router.post('/get-chat-messages', async (req, res) => {
    const chatId = req.body.id;
    try {
        const sqlString = 'SELECT * FROM messages WHERE chat_id = ? ORDER BY time ASC;';
        const params = [chatId];
        const db = await getDatabase();
        const messages = await db.all(sqlString, params);
        res.json({ success: true, messages });
    } catch {
        console.log(error);
        res.json({ success: false, message: "Сообщения не загрузились (((" });

    }
});


router.post('/send-message', async (req, res) => {
    const messageText = req.body.message_text;
    const chat_ID = req.body.chat_ID;
    const currentUser_ID = req.body.user_ID; // это отправитель
    const time = req.body.time;
    const db = await getDatabase();
    try {
        await db.exec('BEGIN TRANSACTION');
        const result = await db.run(
            'INSERT INTO messages ("id", "chat_id", "sender_id", "text", "time", "status") VALUES (NULL, ?, ?, ?, ?, "send")',
            [chat_ID, currentUser_ID, messageText, time]
        );
        const newID = result.lastID;
        const messageData = await db.get(
            'SELECT * FROM messages WHERE id = ?',
            [newID]
        );
        await db.run('UPDATE chats SET last_message_id = ? WHERE id = ?', [
            newID,
            chat_ID,
        ]);
        await db.exec('COMMIT');
        const io = req.app.get('io');
        const members = await db.all(
            'SELECT user_id FROM chat_members WHERE chat_id = ?',
            [chat_ID]
        );
        members.forEach((member) => {
            io.to(`user_${member['user_id']}`).emit(
                'new-message',
                messageData
            );
        });
        console.log('Сообщение отправлено', members);
        res.json({
            success: true,
            message: 'Сообщение отправлено',
            message_data: messageData,
        });
    } catch {
        await db.exec('ROLLBACK');
        res.json({ success: false, message: 'Сообщение не отправлено' });
    }
});


router.post('/del-message', async (req, res) => {
    const messageId = req.body.messageId.slice(8, 10);
    const chat_ID = req.body.chatID;
    const db = await getDatabase();
    try {
        await db.exec('BEGIN TRANSACTION');
        await db.run(
            `
            UPDATE chats SET last_message_id = (
                SELECT id FROM messages WHERE chat_id = ? AND id <> ? ORDER BY time DESC LIMIT 1
            ) WHERE id = ?`,
            [+chat_ID, +messageId, +chat_ID]
        );
        await db.run('DELETE FROM messages WHERE id = ?', [+messageId]);
        const lastMessage = await db.get(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY time DESC LIMIT 1',
            [+chat_ID]
        );
        let last_message_text;
        let last_message_time;
        if (!lastMessage || lastMessage === null) {
            last_message_text = null;
            last_message_time = null;
        } else {
            last_message_text = lastMessage.text;
            last_message_time = lastMessage.time;
        }
        const io = req.app.get('io');
        const members = await db.all(
            'SELECT user_id FROM chat_members WHERE chat_id = ?',
            [+chat_ID]
        );
        members.forEach((member) => {
            io.to(`user_${member['user_id']}`).emit('delete-message', {
                messageId: req.body.messageId,
                chat_ID: chat_ID,
                lastMessageText: last_message_text,
                lastMessageTime: last_message_time,
            });
        });
        await db.exec('COMMIT');
        return res.json({ success: true });
    } catch (error) {
        console.log(messageId, chat_ID, error);
        await db.exec('ROLLBACK');
        return res.json({ success: false });
    }
});


router.post("/get-user-info", async (req, res) => {
    const userID = req.session.userID;
    const chatID = req.body.chatID;
    try {
        const db = await getDatabase();
        const recpInfo = await db.get("SELECT name, username, last_seen, status FROM users WHERE id = (SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id != ?)", [chatID, userID]);
        res.json( {success: true, data: recpInfo} );
    } catch (error) {
        res.json( {success: false, message: "Ошибка"} );
    }
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
});


// создание нового чата
router.post("/add-recipient", async (req, res) => {
    const recpID = req.body.recipientID;
    const user_ID = req.session.userID;
    const db = await getDatabase();

    try {
        await db.exec('BEGIN TRANSACTION');

        // Проверка существования чата между пользователями
        const a = await db.get(`
            SELECT 
                chat_members.chat_id 
            FROM 
                chat_members 
            JOIN 
                chats ON chat_members.chat_id = chats.id 
            WHERE 
                chat_members.user_id IN (?, ?) 
            GROUP BY 
                chat_members.chat_id 
            HAVING 
                COUNT(DISTINCT chat_members.user_id) = 2
        `, [user_ID, recpID]);

        console.log(a)
        if (a === undefined) {
            // Создание нового чата
            const result = await db.run(
                'INSERT INTO chats ("type", "created_at", "last_message_id") VALUES ("private", ?, NULL)', 
                ["2026-06-19 18:40:00"]
            );
            const newID = result.lastID;
            
            // Привязка участников к созданному чату
            await Promise.all([
                db.run('INSERT INTO chat_members ("chat_id", "user_id") VALUES (?, ?)', [newID, user_ID]),
                db.run('INSERT INTO chat_members ("chat_id", "user_id") VALUES (?, ?)', [newID, recpID])
            ]);

            // Получение данных собеседника
            const recpData = await db.get('SELECT name, color FROM users WHERE id = ?', [recpID]);
            
            await db.exec('COMMIT');
    
            // Подготовка данных для отправки через Socket.io
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
    
            // Уведомление участников о создании чата
            const members = [user_ID, recpID];
            members.forEach(memberID => {
                io.to(`user_${memberID}`).emit("chat-created", data);
            });

            return res.json({ success: true, data });
        } else {
            return res.json({ success: false, message: "Чат с таким пользователем уже есть"});
        }
    } catch (error) {
        await db.exec('ROLLBACK');
        return res.json({ success: false, error: error.message });
    }
});





// router.post("/del-recipient", (res, req) => {
    
// });




module.exports = router;
