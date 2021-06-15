const users = [];

const addUser = ({ id, username }) => {
  // Clean the data
  username = username.trim().toLowerCase();

  // Validate data
  if (!username) {
    return {
      error: 'Username required!'
    };
  }

  // Check fo existing user
  const existingUser = users.find(user => {
    return user.username === username;
  });

  // Validate username
  if (existingUser) {
    return {
      error: 'Username is already taken'
    };
  }

  // Store user
  const user = { id, username, current_hand: [] };
  users.push(user);
  return { user };
};

const removeUser = id => {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

updateUserCards = (id, hand) => {
  const userIndex = users.findIndex(user => user.id === id);
  users[userIndex].current_hand = hand;
};

const getUser = id => {
  return users.find(user => user.id === id);
};

const getUsersInRoom = () => users;

module.exports = {
  addUser,
  removeUser,
  updateUserCards,
  getUser,
  getUsersInRoom
};
