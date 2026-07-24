const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/db.js');


const isAuth = (req, res, next) => {
  if (req.session.userID) {
    next();
  } else {
    req.session.destroy((err) => {
      if (err) {
        console.error('Ошибка при выходе:', err);
        return res.redirect('/');
      }
      res.clearCookie('connect.sid'); 
      res.redirect('/reg');
    });
  }
};


async function getUserChats(user_id) { // функция получает чаты поьзоватля
  try {
    const db = await getDatabase();
    const chats = await db.all(
      `SELECT 
      chats.id, 
      chats.type, 
      chats.created_at, 
      users.name AS recipient_name, 
      users.color AS recipient_color, 
      messages.text,
      messages.time,
      messages.status
  FROM chats
  JOIN chat_members cm1 ON chats.id = cm1.chat_id AND cm1.user_id = ?
  LEFT JOIN chat_members cm2 ON chats.id = cm2.chat_id AND cm2.user_id != ?
  LEFT JOIN users ON cm2.user_id = users.id
  LEFT JOIN messages ON chats.last_message_id = messages.id;
`,
      [user_id, user_id]
    );
    console.log(chats)
    return chats;
  } catch (error) {
    console.log('index.js - функция getChats - ошибка получения пользовательских чатов', error);
  }
}


router.get('/reg', (req, res) => {
  res.render('registration', {
    title: 'Регистрация'
  });
});


router.get('/log', (req, res) => {
  res.render('log_in', {
    title: 'Вход'
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
  const userID = req.session.userID;
  const userСhats = await getUserChats(userID);
  res.render('home', {
    title: 'Главная страница',
    userID: userID,
    userСhats: userСhats
  });
});


module.exports = router;
