const socket = io();

socket.emit('joinTestCards');

// Templates
const templates = {
  cardsTemplate: document.querySelector('#cards-template').innerHTML
};

socket.on('printCards', ({table_cards, hand_cards}) => {
  const tableCards = Mustache.render(templates.cardsTemplate, { table_cards, hand_cards });
  document.querySelector('#table-cards').innerHTML = tableCards;

  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('is-flipped');
    });
  });
});