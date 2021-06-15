const socket = io();

// Elements
const $chatForm = document.querySelector('#card');
const $chatFormInput = $chatForm.querySelector('input');
const $chatFormSubmit = $chatForm.querySelector('button');
const $requestHandButton = document.querySelector('#request-hand');
const $messages = document.querySelector('#card-log');

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
});

socket.on('roomData', ({ room, users, remaining_cards }) => {
  const html = Mustache.render(templates.sidebar, {
    room,
    users,
    remaining_cards
  });
  document.querySelector('#sidebar').innerHTML = html;
});

$chatForm.addEventListener('submit', e => {
  e.preventDefault();

  if (!$chatFormInput.value) {
    return console.log('Please add a message');
  }

  lockButton($chatFormSubmit);
  socket.emit('sendMessage', e.target.elements.message.value, error => {
    unlockButton($chatFormSubmit);
    $chatFormInput.value = '';
    $chatFormInput.focus();

    if (error) {
      return console.log(error);
    }
  });
});

$requestHandButton.addEventListener('click', e => {
  lockButton($requestHandButton);
  socket.emit('requestHand', { username }, error => {
    if (error) {
      return console.log(error);
    }
  });
});

// Register new user
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

socket.on('unlockButton', { username }, error => {
  if (error) {
    return false;
  }

  unlockButton($requestHandButton);
});

const lockButton = button => button.setAttribute('disabled', true);

const unlockButton = button => button.removeAttribute('disabled', true);

const addMessage = (template, params = {}) => {
  $messages.insertAdjacentHTML('beforeend', Mustache.render(template, params));
  autoScroll();
};
