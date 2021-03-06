document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  includeHTML();

  // Elements
  const $chatForm = document.querySelector('#chat');
  const $chatFormInput = $chatForm.querySelector('input');
  const $chatFormSubmit = $chatForm.querySelector('button');
  //const $requestHandButton = document.querySelector('#request-hand');
  const $joinGameButton = document.querySelector('#join-game');
  const $checkRoomButton = document.querySelector('#check-game');
  const $messages = document.querySelector('#chat-log');

  // Templates
  const templates = {
    message: document.querySelector('#message-template').innerHTML,
    requestHandMessage: document.querySelector('#request-hand-template')
      .innerHTML,
    sidebar: document.querySelector('#sidebar-template').innerHTML
  };

  // Options
  const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
  });

  const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far I have scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight >= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight;
    }
  };

  socket.on('message', data => {
    addMessage(templates.message, {
      username: data.username,
      message: data.text,
      ts: moment(data.createdAt).format('h:mm a')
    });
  });

  socket.on('requestHandMessage', data => {
    addMessage(templates.requestHandMessage, {
      username: data.username,
      hand: data.text,
      ts: moment(data.createdAt).format('h:mm a')
    });
    setTimeout(() => {
      unlockButton($requestHandButton);
    }, 3000);
  });

  socket.on('playerProcessed', data => {
    addMessage(templates.message, {
      username: data.username,
      message: data.text,
      ts: moment(data.createdAt).format('h:m a')
    });

    $joinGameButton.classList.add('game-joined');
    $joinGameButton.innerText = 'In Game';

    unlockButton($checkRoomButton);
  });

  socket.on('playerRemoved', data => {
    addMessage(templates.message, {
      username: data.username,
      message: data.text,
      ts: moment(data.createdAt).format('h:m a')
    });

    $joinGameButton.classList.remove('game-joined');
    $joinGameButton.innerText = 'Join Game';

    lockButton($checkRoomButton);
    unlockButton($joinGameButton);
  });

  socket.on('updateMainRoom', ({ room, users, gamerooms }) => {
    const html = Mustache.render(templates.sidebar, {
      room,
      users,
      gamerooms,
    });
    document.querySelector('#sidebar').innerHTML = html;
  });

  socket.on('gameRoom', data => {
    const html = Mustache.render(document.querySelector('#game-lobby-template').innerHTML, {
      table_cards: data.table_cards,
      players_data: data.players_data,
      room_name: data.room_name
    });
    document.querySelector('#game-room .modal-content').innerHTML = html;

    document.querySelectorAll('.card').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('flipped');
      });
    });

    document.querySelector('#withdraw').addEventListener('click', () => {
      socket.emit('playerWithdraw', error => {
        if (error) {
          alert(error);
        }
      })
    });
  });

  $chatForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!$chatFormInput.value) {
      return alert('Please add a message');
    }

    lockButton($chatFormSubmit);
    socket.emit('sendMessage', e.target.elements.message.value, error => {
      unlockButton($chatFormSubmit);
      $chatFormInput.value = '';
      $chatFormInput.focus();

      if (error) {
        return alert(error);
      }
    });
  });

  $joinGameButton.addEventListener('click', () => {
    socket.emit('newPlayer', error => {
      if (error) {
        alert(error);
      }
    });
    lockButton($joinGameButton);
  });

  // $requestHandButton.addEventListener('click', e => {
  //   lockButton($requestHandButton);
  //   socket.emit('requestHand', error => {
  //     if (error) {
  //       return console.log(error);
  //     }
  //   });
  // });

  // Register new user
  socket.emit('joinMain', { username, room }, error => {
    if (error) {
      alert(error);
      location.href = '/';
    }
  });

  // User open lobby
  $checkRoomButton.addEventListener('click', () => {
    socket.emit('joinGameRoom', error => {
      if (error) {
        alert(error);
      }
    });
  });

  const lockButton = button => button.setAttribute('disabled', true);

  const unlockButton = button => button.removeAttribute('disabled', true);

  const addMessage = (template, params = {}) => {
    $messages.insertAdjacentHTML('beforeend', Mustache.render(template, params));
    autoScroll();
  };
});
