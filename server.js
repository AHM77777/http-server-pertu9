const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const Users = require('./src/entities/Users');
const Cards = require('./src/entities/Cards');

const { generateMessage } = require('./src/utils/messages');
const {
  queueGamePlayer,
  getGameRoom,
  getGameRoomsList,
  createRoom,
  getLobbyData,
  removePlayerGameRoom,
  emitGameRoomEvents
} = require('./src/utils/gameRooms')(io, Users, Cards);

const port = process.env.PORT || 4001;
const public_dir_path = path.join(__dirname, '/public');

app.use('/', express.static(public_dir_path));
app.use(cors());

io.on('connection', socket => {
  console.log('New Websocket connection');

  socket.on('joinMain', (options, callback) => {
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
    emitGameRoomEvents.updateRoomData({
      users: Users.getUsersInRoom('main'),
      gamerooms: getGameRoomsList()
    });

    callback();
  });

  socket.on('joinGameRoom', callback => {
    const user = Users.getUser(socket.id);

    if (user.current_gameroom == -1) {
      return callback('You are not in a game');
    }

    user.ingame = true;

    const gameRoom = getGameRoom(user.current_gameroom);
    socket.join(gameRoom.gameroom_name);

    // Dispatch cards to player
    user.current_hand = Cards.dispatchCards(gameRoom.current_deck);
    Users.updateUser(user);

    io.to(gameRoom.gameroom_name).emit('gameRoom', getLobbyData(user.current_gameroom));

    emitGameRoomEvents.updateRoomData({
      users: Users.getUsersInRoom('main'),
      gamerooms: getGameRoomsList()
    });
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

  socket.on('playerWithdraw', callback => {
    let user = Users.getUser(socket.id);
    user = removePlayerGameRoom(user);
    Users.updateUser(user);

    emitGameRoomEvents.playerRemoved(socket.id);
    emitGameRoomEvents.updateRoomData({
      users: Users.getUsersInRoom('main'),
      gamerooms: getGameRoomsList()
    });

    callback();
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

      if (removedUser.current_gameroom != -1) {
        removePlayerGameRoom(removedUser);
      }

      if (Users.users.length > 0) {
        emitGameRoomEvents.updateRoomData({
          users: Users.getUsersInRoom('main'),
          gamerooms: getGameRoomsList()
        });
      }
    }
  });
});

app.get('/get_table_cards', async (req, res) => {
  let gameroom = null;
  if (getGameRoomsList().length < 1) {
    createRoom();

    gameroom = getGameRoom(0);
    gameroom.gameroom_name += '0';
    gameroom.current_deck = Cards.generateDeck();
  }

  const deck = Cards.getDeck(0);

  res.set("Connection", "close");
  res.json({ table_cards: deck.table_cards });
});

app.get('/get_hand_cards', async (req, res) => {
  const user_cards = Cards.dispatchCards(0);
  console.log(user_cards);

  res.set("Connection", "close");
  res.json({ hand_cards: user_cards });
});

server.listen(port);

/**
 * IMPLEMENT CARDS GAME:
 *   1. INCLUDE LOGIC IN SERVER CODE.
 *   2. ENSURE IT GETS CREATED
 */