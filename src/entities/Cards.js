class Cards {
  constructor() {
    this.numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
    this.suits = ['♣', '♦', '♥', '♠'];
    this.decks = [];
    this.deck_schema = {
      current_cards: [],
      table_cards: [],
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
    console.log(this.dispatchCards(this.decks.length - 1));
    deck.table_cards = this.getRandomCards(deck, 5);

    return this.decks.length - 1;
  }

  dispatchCards = deck_id => {
    let deck = this.getDeck(deck_id);

    if (deck.length < 5) {
      deck = refillDeck(deck);
      this.decks[deck_id] = deck;
    }
  
    return this.getRandomCards(deck, 2);
  }

  refillDeck = deck => {
    deck.cards = deck.dropped_cards.concat(deck.cards);
    deck.dropped_cards = [];
    return deck;
  }

  getRandomCards = (deck, amount) => {
    return new Array(amount)
    .fill()
    .map(() => deck.current_cards.splice(parseInt(Math.random() * deck.current_cards.length), 1)[0]);
  }

  printCard = (value, suit) => {
    return `
    <div class="card__face card__face--back"></div>
    <div class="card__face card__face--front">
      <div class="num-box top suit">${value}</div>
      <div class="num-box bottom suit">${value}</div>
      <div class="suit main"></div>
    </div>
    `;
  }

  getDeck = deck_id => this.decks[deck_id];
}

module.exports = new Cards();
