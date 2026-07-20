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
	      (
          SELECT name FROM users WHERE id = (
            SELECT user_id
            FROM chat_members
            WHERE user_id != ? AND chat_id = chats.id
          )
        ) AS recipient_name,
        (
          SELECT color FROM users WHERE id = (
            SELECT user_id
            FROM chat_members
            WHERE user_id != ? AND chat_id = chats.id
		      )
	      ) AS recipient_color,
        messages.text,
        messages.time,
        messages.status
      FROM chats
        JOIN chat_members ON chats.id = chat_members.chat_id
        LEFT JOIN messages ON chats.last_message_id = messages.id
      WHERE chat_members.user_id = ?
`,
      [user_id, user_id, user_id]
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
