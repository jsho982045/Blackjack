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

    hitButton.style.display = 'none';
    standButton.style.display = 'none';
    dealButton.style.display = 'inline-block';

    dealButton.addEventListener("click", dealCards);
    hitButton.addEventListener("click", hitCard);
    standButton.addEventListener("click", standCard);

    document.getElementById("confirm-bet-button").addEventListener("click", confirmBet);
    document.getElementById("clear-bet-button").addEventListener("click", clearBet);

    function confirmBet() {
        document.getElementById("hit-button").style.display = 'inline-block';
        document.getElementById("stand-button").style.display = 'inline-block';
        document.getElementById("confirm-bet-button").style.display = 'none';
        document.getElementById("clear-bet-button").style.display = 'none';
        document.getElementById("confirm-bet-button").disabled = true;
        document.getElementById("clear-bet-button").disabled = true;
        chipsContainer.querySelectorAll(".pokerchip").forEach(chip => {
            chip.draggable = false; // Prevent further dragging
        });
        dealCards(); // Automatically start the game
    }

    function clearBet() {
        currentBet = 0;
        betAmountElement.textContent = `Bet: $0`;
        dropZone.innerHTML = '';
        document.getElementById("confirm-bet-button").style.display = 'none';
        document.getElementById("clear-bet-button").style.display = 'none';
        chipsContainer.querySelectorAll(".pokerchip").forEach(chip => {
            chip.draggable = true; // Re-enable chip dragging
        });
    }
    

    function showPopup(message) {
        document.getElementById("popup-message").textContent = message;
        document.getElementById("popup").style.display = "flex";
    }
    
    document.getElementById("close-button").addEventListener("click", function() {
        document.getElementById("popup").style.display = "none";
    });
    
    document.getElementById("close-popup").addEventListener("click", function() {
        document.getElementById("popup").style.display = "none";
    });
    


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

    function updateScores(initial = false) {
        dealerScore = calculateScore(dealerCards, initial); // Calculate dealer score with hidden card if initial is true
        playerScore = calculateScore(playerCards);
        dealerScoreElement.textContent = `Score: ${initial ? getCardValue(dealerCards[0]) : dealerScore}`;
        playerScoreElement.textContent = `Score: ${playerScore}`;
    }

    function calculateScore(cards, hideSecondCard = false) {
        let score = 0;
        let hasAce = false;
        for (let i = 0; i < cards.length; i++) {
            if (hideSecondCard && i === 1) continue; // Skip the hidden card
            score += getCardValue(cards[i]);
            if (cards[i].value === "ACE") {
                hasAce = true;
            }
        }
        if (hasAce && score > 21) {
            score -= 10;
        }
        return score;
    }

    function renderCards(initial = false) {
        dealerCardsElement.innerHTML = dealerCards.map((card, index) => {
            if (initial && index === 1) {
                return `<div class="card back"></div>`;
            }
            return getCardHTML(card);
        }).join("");
        playerCardsElement.innerHTML = playerCards.map(card => getCardHTML(card)).join("");
    }

    function getCardHTML(card) {
        return `<div class="card" style="background-image: url('${card.image}');"></div>`;
    }

    function revealDealerCard() {
        renderCards(); // Re-render without hiding any cards
        dealerScoreElement.textContent = `Score: ${calculateScore(dealerCards)}`;
    }

    function checkForEndGame() {
        if (playerScore === 21) {
            messageElement.textContent = "Blackjack! You win!";
            revealDealerCard();
            endGame();
        } else if (playerScore > 21) {
            messageElement.textContent = "You busted! Dealer wins!";
            revealDealerCard();
            endGame();
        } else if (dealerScore === 21) {
            messageElement.textContent = "Dealer has Blackjack! Dealer wins!";
            revealDealerCard();
            endGame();
        } else if (dealerScore > 21) {
            messageElement.textContent = "Dealer busted! You win!";
            revealDealerCard();
            endGame();
        }
    }

    function endGame() {
        // Disable and hide the game action buttons
        hitButton.disabled = true;
        standButton.disabled = true;
        hitButton.style.display = 'none';
        standButton.style.display = 'none';
    
        // Hide the confirm and clear bet buttons (just in case they are still visible)
        document.getElementById("confirm-bet-button").style.display = 'none';
        document.getElementById("clear-bet-button").style.display = 'none';
    
        // Enable the chips to be draggable for the next round
        chipsContainer.querySelectorAll(".pokerchip").forEach(chip => {
            chip.draggable = true; // Re-enable for new betting round
        });
    
        // Set the message prompting the user to place their bets
        messageElement.textContent = "Place your bets for the next round!";
        removeChipsFromDropZone(); // Clear the bet amount and reset the drop zone
    }
    
    

    function removeChipsFromDropZone() {
        dropZone.innerHTML = '';
        currentBet = 0;
        betAmountElement.textContent = `Bet: $${currentBet}`;
    }

    function dealCards() {
        createDeck().then(() => {
            drawCards(4).then(cards => {
                dealerCards = [cards[0], cards[1]];
                playerCards = [cards[2], cards[3]];
                updateScores(true); // Pass true to indicate the initial render with one dealer card hidden
                renderCards(true); // Pass true to indicate the initial render with one dealer card hidden
                messageElement.textContent = "";
                hitButton.style.display = 'inline-block';
                hitButton.disabled = false; // Ensure it's enabled
                standButton.style.display = 'inline-block';
                standButton.disabled = false; // Ensure it's enabled
                dealButton.style.display = 'none';
                checkForEndGame();
            });
        });
    }

    function hitCard() {
        drawCards(1).then(cards => {
            playerCards.push(cards[0]);
            updateScores(true); // Update the scores with dealer's hidden card
            renderCards(true); // Render the updated cards with dealer's hidden card
            checkForEndGame(); // Check for end game conditions
        });
    }

    function standCard() {
        revealDealerCard(); // Reveal the dealer's hidden card
        function dealerPlay() {
            if (calculateScore(dealerCards) < 17) {
                drawCards(1).then(cards => {
                    dealerCards.push(cards[0]);
                    updateScores(); // Update scores without hiding any cards
                    renderCards(); // Render all cards, no hidden ones
                    if (calculateScore(dealerCards) < 17) {
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
    }

    function determineWinner() {
        const finalDealerScore = calculateScore(dealerCards);
        let message = "";
        if (finalDealerScore > playerScore && finalDealerScore <= 21) {
            message = "Sorry, you lost. Try again!";
            removeChipsFromDropZone(); // Remove chips if the player loses
        } else if (finalDealerScore === playerScore) {
            messageElement.textContent = "It's a tie!";
        } else {
            message = "Congratulations! You win!";
            // Handle win logic, e.g., doubling the bet
        }
        showPopup(message);
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

        document.getElementById("confirm-bet-button").disabled = false;
        document.getElementById("clear-bet-button").disabled = false;
        document.getElementById("confirm-bet-button").style.display = 'inline-block';
        document.getElementById("clear-bet-button").style.display = 'inline-block';
    
        const chipElement = document.createElement("div");
        chipElement.classList.add("pokerchip");
        chipElement.dataset.value = chipValue;
        chipElement.style.width = "20px";
        chipElement.style.height = "20px";
        chipElement.style.fontSize = "12px";
        chipElement.style.lineHeight = "20px";
    
        // Set background color of the chip based on its value
        const chipColor = getChipColor(chipValue);
        chipElement.style.backgroundColor = chipColor;
    
        dropZone.appendChild(chipElement);
    
        // Adjust position of chip inside drop zone
        chipElement.style.position = 'absolute';
        chipElement.style.left = `${e.offsetX - chipElement.offsetWidth / 2}px`; // Centering the chip
        chipElement.style.top = `${e.offsetY - chipElement.offsetHeight / 2}px`; // Centering the chip
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
            default:
                return "white";
        }
    }
});