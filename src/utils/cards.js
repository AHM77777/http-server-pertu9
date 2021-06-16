const deck = [];

numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
suits = ['♣', '♦', '♥', '♠'];

const generateDeck = () => {
  suits.forEach(suit => {
    numbers.forEach(face => {
      deck.push(face + suit);
    });
  });
};

const dispatchCards = () => {
  if (!deck.length) {
    generateDeck();
  } else if (deck.length < 5) {
    refillDeck();
  }

  return new Array(5)
    .fill()
    .map(() => deck.splice(parseInt(Math.random() * deck.length), 1)[0]);
};

const refillDeck = () => {
  deck.cards = [];
  deck.cards = generateDeck();
};

const getRemainingCards = () => deck.length;

const getCurrentDeck = () => deck;

module.exports = {
  dispatchCards,
  getRemainingCards,
  getCurrentDeck
};
