const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const Users = require('./src/entities/Users');

const { generateMessage } = require('./src/utils/messages');
const {
  dispatchCards,
  getRemainingCards,
  getCurrentDeck
} = require('./src/utils/cards');
const { getUser } = require('./src/entities/Users');
const {
  queueGamePlayer,
  getGameRoom,
  removePlayerGameRoom,
  emitGameRoomEvents
} = require('./src/utils/gameRooms')(io, Users);

const port = process.env.PORT;
const public_dir_path = path.join(__dirname, '/public');

app.use('/', express.static(public_dir_path));

io.on('connection', socket => {
  console.log('New Websocket connection');

  socket.on('join', (options, callback) => {
    const { error, user } = Users.addUser({
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
      users: Users.getUsersInRoom('main'),
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

    const user = Users.getUser(socket.id);
    io.to('main').emit(
      'message',
      generateMessage({
        username: user.username,
        text: message
      })
    );
    callback();
  });

  socket.on('newPlayer', callback => {
    const { error, result } = queueGamePlayer(socket.id);

    if (error) {
      return callback(error);
    }
  });

  socket.on('playerEnterLobby', callback => {
    const user = getUser(socket.id);

    if (user.current_room == -1) {
       return callback('You are not in a game');
    }

    io.to(socket.id).emit(
      'message',
      generateMessage({
        username: 'Admin',
        text: `Your current room: <b>${getGameRoom(user.current_gameroom).gameroom_name}</b>`
      })
    );
  });

  socket.on('requestHand', () => {
    const user = Users.getUser(socket.id);

    // Create hand for user from current deck pile
    const cards = dispatchCards();

    user.current_hand = cards;
    Users.updateUser(user);

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

    io.emit(
      'requestHandMessage',
      generateMessage({
        username: user.username,
        text: `New hand: ${formatted_cards.join(' ')}`
      })
    );
    io.to('main').emit('roomData', {
      room: 'main',
      users: Users.getUsersInRoom('main'),
      remaining_cards: getRemainingCards(),
      current_deck: getCurrentDeck()
    });
  });

  socket.on('disconnect', () => {
    const removedUser = Users.removeUser(socket.id);
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
        users: Users.getUsersInRoom(),
        remaining_cards: getRemainingCards(),
        current_deck: getCurrentDeck()
      });

      removePlayerGameRoom(removedUser);
    }
  });
});

server.listen(port);
