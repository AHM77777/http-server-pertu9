const path = require('path');
const http = require('http');
const express = require('express');
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
  getGameRooms,
  removePlayerGameRoom,
  emitGameRoomEvents
} = require('./src/utils/gameRooms')(io, Users, Cards);

const port = process.env.PORT || 3000;
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
    emitGameRoomEvents.updateRoomData({
      users: Users.getUsersInRoom('main'),
      gamerooms: getGameRooms()
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
    const user = Users.getUser(socket.id);

    if (user.current_room == -1) {
       return callback('You are not in a game');
    }

    user.ingame = true;
    Users.updateUser(user);

    console.log(Users.getUser(socket.id));

    io.to(socket.id).emit(
      'message',
      generateMessage({
        username: 'Admin',
        text: `Your current room: <b>${getGameRoom(user.current_gameroom).gameroom_name}</b>`
      })
    );

 /*    // Create hand for user from current deck pile
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
    ); */
    emitGameRoomEvents.updateRoomData({
      users: Users.getUsersInRoom('main'),
      gamerooms: getGameRooms()
    });
  });

  // socket.on('requestHand', () => {
  //   const user = Users.getUser(socket.id);

  //   // Create hand for user from current deck pile
  //   const cards = dispatchCards();

  //   user.current_hand = cards;
  //   Users.updateUser(user);

  //   // Prepare hands to show
  //   const formatted_cards = cards.map(card => {
  //     return (
  //       "<span class='mini " +
  //       card.slice(-1) +
  //       "'>" +
  //       card.slice(0, -1) +
  //       card.slice(-1) +
  //       '</span>'
  //     );
  //   });

  //   io.emit(
  //     'requestHandMessage',
  //     generateMessage({
  //       username: user.username,
  //       text: `New hand: ${formatted_cards.join(' ')}`
  //     })
  //   );
  //   emitGameRoomEvents.updateRoomData({
  //     users: Users.getUsersInRoom('main'),
  //     gamerooms: getGameRooms(),
  //     remaining_cards: Cards.getDeck(deck_id).length
  //   });
  // });

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
          gamerooms: getGameRooms()
        });
      }
    }
  });
});

/**
 * GAME LOBBY:
 *   - Button will be available to allow the user enter the room (will replace Check Room and reuse all its assets).
 *   - Once users click this button (only available if they are in a room) a modal window will appear, here they will see:
 *    ~ A left sidebar with all players currently in the room, each will state relevant information for the game (i.e. amount of cards at hand, current game status, connection).
 *    ~ 1 Card shown at the center, dragged from the pile at the begining of the match.
 *    ~ 2 starting cards per player, up to the amouny requested (2 per round at most). They will also be able to see the cards of other players, but only flipped down.
 *    ~ A timer with the current game time, current player turn and turn time, also the current and remaining rounds will be displayed.
 *   - Once all 4 players are in a room and they connect to the lobby (they will be autoconnected after 5 seconds), the game will begin. From this point any user that leaves cannot enter the game, and no other user will be able to enter until the game ends (either normally or if all players leave).
 *      ;; If all but one players leave, he will be declared winner automatically.
 *   - Starting from the first user in the room, he will be able to do the following:
 *      ~ REQUEST: If their current hand is not what they want, they will be able to request more cards.
 *      ~ HOLD: If they are content with their hand, the turn can be skipped.
 *      ~ WITHDRAW: Forfeit the game. But can stay as spectator.
 *   
 */

server.listen(port);
