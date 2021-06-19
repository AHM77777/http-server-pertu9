class Users {
  constructor() {
    this.users = [];
    this.user_schema = {
      id: '',
      username: '',
      ingame: false,
      current_gameroom: -1,
      current_hand: []
    };
  }

  addUser = ({ id, username }) => {
    // Clean the data
    username = username.trim().toLowerCase();
  
    // Validate data
    if (!username) {
      return {
        error: 'Username required!'
      };
    }
  
    // Check fo existing user
    const existingUser = this.users.find(user => {
      return user.username === username;
    });
  
    // Validate username
    if (existingUser) {
      return {
        error: 'Username is already taken'
      };
    }
  
    // Store user
    const user = {
      ...this.user_schema,
      id,
      username
    };

    this.users.push(user);
    return { user };
  }

  updateUser = (user) => {
    const userIndex = this.users.findIndex(u => u.id === user.id);
    this.users[userIndex] = user;
  }

  removeUser = id => {
    const index = this.users.findIndex(user => user.id === id);
  
    if (index !== -1) {
      return this.users.splice(index, 1)[0];
    }
  }

  getUser = id => {
    return this.users.find(user => user.id == id);
  }

  getUsersInRoom = () => this.users;
}

module.exports = new Users();
