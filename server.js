const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage } = require('./src/utils/messages');
const {
  addUser,
  removeUser,
  updateUserCards,
  getUser,
  getUsersInRoom
} = require('./src/utils/users');
const {
  dispatchCards,
  getRemainingCards,
  getCurrentDeck
} = require('./src/utils/cards');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const public_dir_path = path.join(__dirname, '/public');

app.use('/', express.static(public_dir_path));

io.on('connection', socket => {
  console.log('New Websocket connection');

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      ...options
    });

    if (error) {
      return callback(error);
    }

    socket.join('main');

    socket.emit(
      'message',
      generateMessage({
        username: 'Admin',
        text: 'Welcome!'
      })
    );

    socket.broadcast.to('main').emit(
      'message',
      generateMessage({
        username: 'Admin',
        text: `${user.username} has joined!`
      })
    );
    io.to('main').emit('roomData', {
      room: 'main',
      users: getUsersInRoom('main'),
      remaining_cards: getRemainingCards(),
      current_deck: getCurrentDeck()
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      callback('Profanity is not allowed!');
    }

    const user = getUser(socket.id);
    io.to('main').emit(
      'message',
      generateMessage({
        username: user.username,
        text: message
      })
    );
    callback();
  });

  socket.on('requestHand', (username, callback) => {
    const user = getUser(socket.id);

    // Create hand for user from current deck pile
    const cards = dispatchCards();
    updateUserCards(user.id, cards);

    // Prepare hands to show
    const formatted_cards = cards.map(card => {
      return (
        "<span class='mini " +
        card.slice(-1) +
        "'>" +
        card.slice(0, -1) +
        card.slice(-1) +
        '</span>'
      );
    });

    io.to('main').emit(
      'requestHandMessage',
      generateMessage({
        username: user.username,
        text: `New hand: ${formatted_cards.join(' ')}`
      })
    );
    io.to('main').emit('roomData', {
      room: 'main',
      users: getUsersInRoom('main'),
      remaining_cards: getRemainingCards(),
      current_deck: getCurrentDeck()
    });
    callback();
  });

  socket.on('disconnect', () => {
    const removedUser = removeUser(socket.id);
    if (removedUser) {
      io.to('main').emit(
        'message',
        generateMessage({
          username: 'Admin',
          text: `${removedUser.username} has left the chat!`
        })
      );
      io.to('main').emit('roomData', {
        room: 'main',
        users: getUsersInRoom(),
        remaining_cards: getRemainingCards(),
        current_deck: getCurrentDeck()
      });
    }
  });
});

server.listen(port);
