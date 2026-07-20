const express = require('express');
const session = require("express-session");
const exphbs = require('express-handlebars');
const path = require('path');

const http = require('http');
const socketIO = require('socket.io');

const PORT = 3000;
const app = express();

const server = http.createServer(app);
const io = socketIO(server);


const renderChatContainerHelper = function(userСhat) {  // внести изменения
  const firstLetter = userСhat.recipient_name.at(0);
  const html = `
    <div id="${userСhat.id}" class="chat-container">
      <div class="chat-avatar" style="background-color: ${userСhat.recipient_color}">${firstLetter}</div>
      <div class="chat-info">
        <div class="chat-info-row">
          <div class="chat-title">${userСhat.recipient_name}</div>
          <div class="last-message-time">${userСhat.time}</div>
        </div>
        <div class="last-message-text"></div>
      </div>
    </div>
  `;
  return html;
};


app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    renderChatContainerHelper: renderChatContainerHelper
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.set('io', io);
// позволяет использовать объект io в любом другом файле программы

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionOptions = {
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 60 * 60 * 24 * 5 * 1000,
    secure: false 
  }
}
const sessionMiddleware = session(sessionOptions);
app.use(sessionMiddleware);

app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));


app.use((req, res) => {
  res.status(404).render('404');
});


io.engine.use(sessionMiddleware);
io.on('connection', (socket) => {
  const session = socket.request.session;
  if (session && session.userID) {
    const userID = session.userID;
    socket.join(`user_${userID}`);
    console.log(`Пользователь ${userID} (socket: ${socket.id}) подключил личный канал`);
  } else {
    socket.disconnect();
  }

  socket.on("join-chat", (chatID) => {
    socket.join(chatID);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatID).emit("user_typing", data);
  });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
