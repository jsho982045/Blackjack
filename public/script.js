document.addEventListener("DOMContentLoaded", function() {
    // Existing elements and variables
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
    const playButton = document.getElementById("play-button");
    const homeScreen = document.getElementById("home-screen");
    const homeScreenCards = document.querySelectorAll('.home-screen-card');
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const loginButton = document.getElementById('login-button');
    const showLoginLink = document.getElementById('show-login');
    const showRegisterLink = document.getElementById('show-register');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    document.querySelector(".table").style.display = "none"; // Hide game table initially

    homeScreenCards.forEach((card, index) => {
        const isRedBack = index % 2 === 0; // Alternate card back colors
        const backImage = isRedBack ? 'cardBack1.PNG' : 'cardBackBlack.PNG';
        card.style.backgroundImage = `url('${backImage}')`; // Set the back image
    });

    function startAnimation() {
        homeScreenCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('reveal');
                const front = document.createElement('div');
                front.className = 'front';
                front.textContent = card.getAttribute("data-letter");

                const back = document.createElement('div');
                back.className = 'back';
                back.style.backgroundImage = card.style.backgroundImage; // Use the same image set initially

                card.appendChild(front);
                card.appendChild(back);
            }, index * 200);
        });

        setTimeout(() => {
            playButton.style.display = "block";
            loginButton.style.display = "block";
            setTimeout(() => {
                playButton.classList.add('show');
                loginButton.classList.add('show');
            }, 50); // Slight delay to trigger the transition
        }, homeScreenCards.length * 200 + 1000); // Add an extra 1 second delay after the last card flips
    }

    playButton.addEventListener("click", function() {
        homeScreen.style.display = "none"; // Hide home screen
        document.querySelector(".table").style.display = "block"; // Show game table
    });

    loginButton.addEventListener('click', () => {
        authModal.style.display = 'block';
    });
    
    closeAuthModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Login link clicked'); // Debugging log
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    showRegisterLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Register link clicked'); // Debugging log
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    // User registration form submission
    document.getElementById('register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Register form submitted');

        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            console.log('Passwords do not match');
            return;
        }
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            console.log('Registration response:', result);
            if (response.ok) {
                alert('Registration successful');
                authModal.style.display = 'none';
            } else {
                alert(`Error: ${result.error}`);
                console.log(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Error registering user');
        }
    });

    // User login form submission
    document.getElementById('login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
    
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
    
            const result = await response.json();
            if (response.ok) {
                alert('Login successful');
                document.getElementById('wallet').textContent = `Wallet: $${result.walletBalance.toFixed(2)}`;
                authModal.style.display = 'none';
                document.getElementById('home-screen').style.display = 'none';
                document.querySelector('.table').style.display = 'block';
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in');
        }
    });
    

    // Start the animation
    startAnimation();

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

        dealerScoreElement.style.display = 'block';
        playerScoreElement.style.display = 'block';
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
        if (playerScore === 21 && playerCards.length === 2) {  // Checks for Blackjack immediately after dealing
            messageElement.textContent = "Blackjack! You win!";
            showPopup("Blackjack! You win!");
            updateWallet(currentBet * 1.5);  // Assuming Blackjack pays 3 to 2
            revealDealerCard();
            endGame();
        } else if (playerScore > 21) {
            showPopup("You busted! Dealer wins!");
            updateWallet(-currentBet);
            revealDealerCard();
            endGame();
        } else if (dealerScore === 21) {
            showPopup("Dealer has Blackjack! Dealer wins!");
            updateWallet(-currentBet);
            revealDealerCard();
            endGame();
        } else if (dealerScore > 21) {
            showPopup("Dealer busted! You win!");
            updateWallet(currentBet);
            revealDealerCard();
            endGame();
        }
    }

    function sweepCards() {
        let allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            card.style.transition = 'transform 0.5s ease-in-out';
            card.style.transform = 'translateX(-100vw)'; // Sweep to the left
        });

        setTimeout(() => {
            resetGame(); // Clears the table and resets the game state
        }, 500);
    }

    document.getElementById("close-button").addEventListener("click", function() {
        document.getElementById("popup").style.display = "none";
        sweepCards();
    });

    function endGame() {
        // Setup the game for reset but do not clear cards here
        hitButton.disabled = true;
        standButton.disabled = true;
        hitButton.style.display = 'none';
        standButton.style.display = 'none';
        document.getElementById("confirm-bet-button").style.display = 'none';
        document.getElementById("clear-bet-button").style.display = 'none';
    }

    function resetGame() {
        // Clear the cards from the game area
        dealerCardsElement.innerHTML = '';
        playerCardsElement.innerHTML = '';

        // Hide scores and reset interaction elements
        dealerScoreElement.style.display = 'none';
        playerScoreElement.style.display = 'none';

        // Re-enable the chips for a new betting round
        chipsContainer.querySelectorAll(".pokerchip").forEach(chip => {
            chip.draggable = true;
        });
        // Update the message for the user
        messageElement.textContent = "Place your bets for the next round!";
        removeChipsFromDropZone();

        // Reset game state variables
        currentBet = 0;
        betAmountElement.textContent = `Bet: $${currentBet}`;
        dealerCards = [];
        playerCards = [];
        dealerScore = 0;
        playerScore = 0;
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

    function updateWallet(amount) {
        const walletElement = document.getElementById('wallet');
        let currentBalance = parseFloat(walletElement.textContent.replace('Wallet: $', ''));
        currentBalance += amount;
        walletElement.textContent = `Wallet: $${currentBalance.toFixed(2)}`;

        if (currentBalance < 0) {
            walletElement.style.color = 'red';
        } else {
            walletElement.style.color = '#00ff00';
        }
    }

    function updateWalletOnServer(username, newBalance) {
        fetch('/update-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, newBalance })
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error updating wallet on server:', error));
    }
    

    function determineWinner() {
        const finalDealerScore = calculateScore(dealerCards);
        let currentBalance = parseFloat(document.getElementById('wallet').textContent.replace('Wallet: $', ''));
        let updatedBalance = 0;
    
        if (finalDealerScore > playerScore && finalDealerScore <= 21) {
            messageElement.textContent = "Sorry, you lost. Try again!";
            showPopup("Sorry, you lost. Try again!");
            updatedBalance = currentBalance - currentBet;
        } else if (finalDealerScore === playerScore) {
            messageElement.textContent = "It's a tie!";
            showPopup("It's a tie!");
            updatedBalance = currentBalance;  // No change in balance
        } else {
            messageElement.textContent = "Congratulations! You win!";
            showPopup("Congratulations! You win!");
            updatedBalance = currentBalance + currentBet;
        }
    
        document.getElementById('wallet').textContent = `Wallet: $${updatedBalance.toFixed(2)}`;
        updateWalletOnServer("test", updatedBalance);  // Assuming "test" is the username, replace with dynamic username as needed
    
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
            case 1:
                return "#dad2ba";
            case 5:
                return "#bc2943";
            case 10:
                return "#009b93";
            case 25:
                return "#00794e";
            case 50:
                return "#7b5a94";
            case 100:
                return "#231f20";
            default:
                return "white";
        }
    }
});


