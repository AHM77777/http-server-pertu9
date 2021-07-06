let io = null;
let users = null;
let cards = null;

playersQueue = [],
  gameRooms = [];

processingQueue = false;

const queueGamePlayer = user_id => {
  if (playersQueue.find(player => player === user_id)) {
    return {
      error: 'You already in queue'
    };
  } else {
    const user = users.getUser(user_id);
    if (user.current_gameroom != -1) {
      return {
        error: 'You are already in a room'
      };
    }

    playersQueue.push(user_id);
    processQueue();

    return {
      result: 'Added to queue'
    };
  }
}

const processQueue = () => {
  if (processingQueue) {
    return true;
  } else {
    processingQueue = true;

    // Hold on queue for a bit more to wait for as many people as possible.
    setTimeout(() => {
      for (let player of playersQueue) {
        const user = users.getUser(player);
        if (gameRooms.length < 1) {
          createRoom();
          gameRooms[0].gameroom_name += '0';
          gameRooms[0].players.push(player);
          gameRooms[0].current_deck = cards.generateDeck();
          user.current_gameroom = 0;
        } else {
          let added = false;

          for (let [index, room] of gameRooms.entries()) {
            if (room.players.length < 4) {
              room.players.push(player);
              room.current_deck = cards.generateDeck();
              user.current_gameroom = index;
              added = true;

              break;
            } else if (room.players.length == 4) {
              continue;
            }
          }

          if (!added) {
            createRoom();
            const currentRoom = gameRooms[gameRooms.length - 1];
            currentRoom.gameroom_name += (gameRooms.length - 1).toString();
            currentRoom.players.push(player);
            currentRoom.current_deck = cards.generateDeck();
            user.current_gameroom = (gameRooms.length - 1);
          }
        }

        emitGameRoomEvents.playerAdded(player);
        emitGameRoomEvents.updateRoomData({
          users: users.getUsersInRoom('main'),
          gamerooms: getGameRoomsList()
        });
        users.updateUser(user);
        playersQueue.splice(playersQueue.findIndex(play_id => play_id === player), 1);
      }

      processingQueue = false;
      if (playersQueue.length > 0) {
        processQueue();
      }
    }, 2000);
  }
}

const removePlayerGameRoom = player => {
  const room_players = gameRooms[player.current_gameroom].players;
  room_players.splice(room_players.findIndex(play_id => play_id === player.id), 1);

  player.current_gameroom = -1;

  return player;
}

const getLobbyData = room_id => {
  const lobby = getGameRoom(room_id);
  const playersData = getPlayersData(lobby);
  const gameDeck = cards.getDeck(lobby.current_deck);

  // Prepare cards for printing
  const table_cards = gameDeck.table_cards.map(card => {
    return cards.createCard(card.slice(-1), card.slice(0, -1), false);
  });

  return {
    room_name: lobby.gameroom_name,
    players_data: playersData,
    table_cards: table_cards,
    current_cards: gameDeck.current_cards,
    current_round: lobby.current_round,
    current_turn: lobby.current_turn,
    next_turn: lobby.next_turn
  };
}

const emitGameRoomEvents = {
  playerAdded: function (user_id) {
    io.to(user_id).emit('playerProcessed', {
      username: 'Admin',
      text: 'You were added to a room!'
    });
  },
  updateRoomData: function (data, room_info = { room_name: 'main', room_event: 'updateMainRoom' }) {
    io.to(room_info.room_name).emit(room_info.room_event, {
      room: room_info.room_name,
      ...data
    });
  }
}

const createRoom = () => {
  gameRooms.push({
    gameroom_name: 'room_',
    players: [],
    current_deck: -1,
    current_round: -1,
    current_turn: '',
    next_turn: '',
    in_progress: false
  });
}

const getGameRoomsList = () => {
  /**
   * @NOTE: This is the only way I could copy the object to avoid passing it by reference.
   * Might change it later for a better approach.*/
  const rooms = JSON.parse(JSON.stringify(gameRooms));
  /****/

  return rooms.map(room => {
    room.players = getPlayersData(room).map(player => {
      return player.username;
    });

    return room;
  });
}

const getGameRoom = room_id => {
  return gameRooms.find((r, i) => i === room_id);
}

const getPlayersData = room => {
  return room.players.map(player => {
    return users.getUser(player);
  })
}

module.exports = function (importedIo, importedUsers, importedCards) {
  io = importedIo;
  users = importedUsers;
  cards = importedCards;

  return {
    queueGamePlayer,
    getGameRoomsList,
    getGameRoom,
    removePlayerGameRoom,
    getLobbyData,
    emitGameRoomEvents
  };
}
