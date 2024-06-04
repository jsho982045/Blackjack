document.addEventListener("DOMContentLoaded", function() {
    const dealButton = document.getElementById("deal-button");
    const hitButton = document.getElementById("hit-button");
    const standButton = document.getElementById("stand-button");
    const dealerCardsElement = document.getElementById("dealer-cards");
    const playerCardsElement = document.getElementById("player-cards");
    const dealerScoreElement = document.getElementById("dealer-score");
    const playerScoreElement = document.getElementById("player-score");
    const messageElement = document.getElementById("message");
    const chipsContainer = document.getElementById("chips");
    const dropZone = document.getElementById("chip-drop-zone");
    const betAmountElement = document.getElementById("bet-amount");

    let dealerCards = [];
    let playerCards = [];
    let deckId;
    let dealerScore = 0;
    let playerScore = 0;
    let currentBet = 0;

    function createDeck() {
        return fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
            .then(response => response.json())
            .then(data => {
                deckId = data.deck_id;
                dealerCards = [];
                playerCards = [];
                return deckId;
            });
    }

    function drawCards(count) {
        return fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`)
            .then(response => response.json())
            .then(data => data.cards);
    }

    function getCardValue(card) {
        if (card.value === "ACE") {
            return 11;
        } else if (["KING", "QUEEN", "JACK"].includes(card.value)) {
            return 10;
        } else {
            return parseInt(card.value);
        }
    }

    function updateScores() {
        dealerScore = calculateScore(dealerCards);
        playerScore = calculateScore(playerCards);
        dealerScoreElement.textContent = `Score: ${dealerScore}`;
        playerScoreElement.textContent = `Score: ${playerScore}`;
    }

    function calculateScore(cards) {
        let score = 0;
        let hasAce = false;
        for (let card of cards) {
            score += getCardValue(card);
            if (card.value === "ACE") {
                hasAce = true;
            }
        }
        if (hasAce && score > 21) {
            score -= 10;
        }
        return score;
    }

    function renderCards() {
        dealerCardsElement.innerHTML = dealerCards.map(card => getCardHTML(card)).join("");
        playerCardsElement.innerHTML = playerCards.map(card => getCardHTML(card)).join("");
    }

    function getCardHTML(card) {
        return `<div class="card" style="background-image: url('${card.image}');"></div>`;
    }

    function checkForEndGame() {
        if (playerScore === 21) {
            messageElement.textContent = "Blackjack! You win!";
            endGame();
        } else if (playerScore > 21) {
            messageElement.textContent = "You busted! Dealer wins!";
            endGame();
        } else if (dealerScore === 21) {
            messageElement.textContent = "Dealer has Blackjack! Dealer wins!";
            endGame();
        } else if (dealerScore > 21) {
            messageElement.textContent = "Dealer busted! You win!";
            endGame();
        }
    }

    function endGame() {
        hitButton.disabled = true;
        standButton.disabled = true;
        dealButton.disabled = false;
        removeChipsFromDropZone();
    }

    function removeChipsFromDropZone() {
        dropZone.innerHTML = '';
        currentBet = 0;
        betAmountElement.textContent = `Bet: $${currentBet}`;
    }

    dealButton.addEventListener("click", function() {
        createDeck().then(() => {
            drawCards(4).then(cards => {
                dealerCards = [cards[0], cards[1]];
                playerCards = [cards[2], cards[3]];
                updateScores();
                renderCards();
                messageElement.textContent = "";
                hitButton.disabled = false;
                standButton.disabled = false;
                dealButton.disabled = true;
                checkForEndGame();
            });
        });
    });

    hitButton.addEventListener("click", function() {
        drawCards(1).then(cards => {
            playerCards.push(cards[0]);
            updateScores();
            renderCards();
            checkForEndGame();
        });
    });

    standButton.addEventListener("click", function() {
        function dealerPlay() {
            if (dealerScore < 17) {
                drawCards(1).then(cards => {
                    dealerCards.push(cards[0]);
                    updateScores();
                    renderCards();
                    if (dealerScore < 17) {
                        dealerPlay();
                    } else {
                        determineWinner();
                    }
                });
            } else {
                determineWinner();
            }
        }
        dealerPlay();
    });

    function determineWinner() {
        if (dealerScore > playerScore && dealerScore <= 21) {
            messageElement.textContent = "Dealer wins!";
            removeChipsFromDropZone(); // Remove chips if the player loses
        } else if (dealerScore === playerScore) {
            messageElement.textContent = "It's a tie!";
        } else {
            messageElement.textContent = "You win!";
            // Handle win logic, e.g., doubling the bet
        }
        betAmountElement.textContent = `Bet: $${currentBet}`;
        endGame();
    }

    // Make chips draggable
    chipsContainer.addEventListener("dragstart", function(e) {
        if (e.target.classList.contains("pokerchip")) {
            e.dataTransfer.setData("text/plain", e.target.dataset.value);
            setTimeout(() => {
                e.target.style.visibility = "hidden";
            }, 0);
        }
    });

    chipsContainer.addEventListener("dragend", function(e) {
        if (e.target.classList.contains("pokerchip")) {
            e.target.style.visibility = "visible";
        }
    });

    dropZone.addEventListener("dragover", function(e) {
        e.preventDefault();
    });

    dropZone.addEventListener("drop", function(e) {
        e.preventDefault();
        const chipValue = parseInt(e.dataTransfer.getData("text/plain"));
        currentBet += chipValue;
        betAmountElement.textContent = `Bet: $${currentBet}`;

        const chipElement = document.createElement("div");
        chipElement.classList.add("pokerchip");
        chipElement.dataset.value = chipValue;
        chipElement.style.width = "20px";
        chipElement.style.height = "20px";
        chipElement.style.fontSize = "12px";
        chipElement.style.lineHeight = "20px";
        chipElement.style.backgroundImage = e.target.style.backgroundImage;
        dropZone.appendChild(chipElement);
    });

    function getChipColor(value) {
        switch (value) {
            case 5:
                return "red";
            case 10:
                return "blue";
            case 25:
                return "green";
            case 50:
                return "black";
            case 100:
                return "yellow";
            default:
                return "gray";
        }
    }
});


   
