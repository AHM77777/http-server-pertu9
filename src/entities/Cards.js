class Cards {
  constructor() {
    this.numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
    this.suits = ['♣', '♦', '♥', '♠'];
    this.decks = [];
    this.deck_schema = {
      current_cards: [],
      dropped_cards: []
    };
  }

  generateDeck = () => {
    let deck = this.deck_schema;
  
    this.suits.forEach(suit => {
      this.numbers.forEach(face => {
        deck.current_cards.push(face + suit);
      });
    });

    this.decks.push(deck);

    return this.decks.length - 1;
  }

  dispatchCards = deck_id => {
    let deck = getDeck(deck_id);

    if (deck.length < 5) {
      deck = refillDeck(deck);
      this.decks[deck_id] = deck;
    }
  
    return new Array(5)
      .fill()
      .map(() => deck.splice(parseInt(Math.random() * deck.length), 1)[0]);
  }

  refillDeck = deck => {
    deck.cards = deck.dropped_cards.concat(deck.cards);
    deck.dropped_cards = [];
    return deck;
  }

  getDeck = deck_id => this.decks[deck_id];
}

module.exports = new Cards();
