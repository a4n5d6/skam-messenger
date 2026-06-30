const express = require('express');

const router = express.Router();

const { getDatabase } = require("../db/db.js");


const isAuth = (req, res, next) => {  
  if (req.session.userID) {    
    next();  
  } else {    
    // res.redirect('/reg'); 
    req.session.destroy((err) => {
      if (err) {
        console.error('Ошибка при выходе:', err);
        return res.redirect('/');
      }
      res.clearCookie('connect.sid'); 
      res.redirect('/reg');
    });
  }
}

async function getUserChats(user_id) { // функция получает чаты поьзоватля
  try {
    const sqlString = "SELECT * FROM chats JOIN chat_members ON chats.id == chat_members.chat_id WHERE chat_members.user_id == ?";
    const params = [user_id];
    const db = await getDatabase();
    const chats = await db.all(sqlString, params);

    for (const chat of chats) {
      const recipientID = await db.get(
        "SELECT user_id FROM chat_members WHERE user_id != ? AND chat_id = ?",
        [user_id, chat.id]
      );  // {user_id: 2}
      const recipientInfo = await db.get(
        "SELECT name, color FROM users WHERE id = ?",
        [recipientID["user_id"]]
      );
      chat["recipient_name"] = recipientInfo["name"];
      chat["recipient_color"] = recipientInfo["color"];
    }
    return chats;  // chats = [{}, {}, ...];
  } catch (error) {
    console.log('index.js - функция getChats - ошибка получения пользовательских чатов', error);
  }
}

router.get("/reg", (req, res) => {
  res.render("registration", {
    title: "Регистрация"
  });
});


router.get("/log", (req, res) => {
  res.render("log_in", {
    title: "Вход"
  });
});


router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка при выходе:', err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid'); 
    res.redirect('/reg');
  });
});


router.get('/', isAuth, async (req, res) => {
  // const messageSend = "У вас новое сообщение. Перезагрузите страницу!";
  // db.collection("chats").where("members", "array-contains", req.session.userID).onSnapshot(documentSnapshot => {
  //   // res.send(messageSend);
  //   res.set('Content-Type', 'application/json');
  //   res.set('Cache-Control', 'no-cache'); 
  //   res.send({ message: messageSend });
  // }, err => {
  //   console.log(err);
  // });
  const userID = req.session.userID;
  const userСhats = await getUserChats(userID);
  res.render('home', {
    title: 'Главная страница',
    userID: userID,
    userСhats: userСhats
  });
});


module.exports = router;
