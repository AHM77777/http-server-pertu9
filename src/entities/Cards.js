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

  createCard(symbol, number, isFlipped = true) {
    const isNumber = !isNaN(number) || number === "A";
    const fixedSize = number === "A" ? 1 : number;
    return `
      <div class="card card-${symbol} ${isFlipped ? "flipped" : ""
      }" number="${number}">
          <div class="card-front">
              <div class="card-corner top-left">
                  <div>${number}</div>
                  <div>${symbol}</div>
              </div>
              <div class="symbols">
                  ${isNumber
        ? `${new Array(parseInt(fixedSize))
          .fill(symbol)
          .map(
            (cardSymbol) => `
                          <div>${cardSymbol}</div>
                      `
          )
          .join("")}`
        : ""
      }
              </div>
              <div class="card-corner bottom-right">
                  <div>${symbol}</div>
                  <div>${number}</div>
              </div>
          </div>
          <div class="card-back">
          </div>
      </div>`;
  }

  getRandomCards = (deck, amount) => {
    return new Array(amount)
      .fill()
      .map(() => deck.current_cards.splice(parseInt(Math.random() * deck.current_cards.length), 1)[0]);
  }

  getDeck = deck_id => this.decks[deck_id];
}

module.exports = new Cards();
