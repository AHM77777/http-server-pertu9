const generateMessage = data => {
  return {
    username: data.username,
    text: data.text,
    createdAt: new Date().getTime()
  };
};

module.exports = {
  generateMessage
};
