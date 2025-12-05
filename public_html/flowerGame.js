// flowerGame.js
export function startFlowerGame(modalId) {
    const modal = document.getElementById(modalId);
    const container = modal.querySelector('#flowerGameContainer');

    // Si le jeu a déjà été généré, on ne recrée pas tout
    if (container.dataset.gameStarted) return;
    container.dataset.gameStarted = "true";

    // Génération du HTML du mini-jeu
    container.innerHTML = `
        <div class="game-container">
            <div class="screen-zone">
                <div id="target-word-display" class="target-display">CIBLE: ???</div>
                <div class="input-display">
                    <span id="final-input"></span><span class="cursor">_</span>
                </div>
            </div>

            <div class="cycler-zone" id="char-cycler">A</div>

            <button id="btn-lock" class="btn-zone">VALIDER</button>
            <button id="btn-delete" class="btn-zone">EFFACER</button>
            
            <input type="hidden" id="real-input-value">
        </div>
    `;

    // --- CONFIGURATION ---
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
    const words = ["MONTAGNE", "PIXEL", "CODE", "MAGIE", "RUNE", "EPEE", "CHEMINEE", "DEMON"];
    const targetWord = words[Math.floor(Math.random() * words.length)];

    let currentIndex = 0, intervalId = null, currentValue = "", gameWon = false, currentSpeed = 300;

    const cyclerEl = container.querySelector('#char-cycler');
    const displayEl = container.querySelector('#final-input');
    const targetDisplayEl = container.querySelector('#target-word-display');
    const hiddenInput = container.querySelector('#real-input-value');
    const btnLock = container.querySelector('#btn-lock');
    const btnDelete = container.querySelector('#btn-delete');
    const cursorEl = container.querySelector('.cursor');

    targetDisplayEl.innerText = "CIBLE: " + targetWord;

    function startCycling() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if (!gameWon) {
                currentIndex = (currentIndex + 1) % chars.length;
                cyclerEl.innerText = chars[currentIndex];
            }
        }, currentSpeed);
    }

    function checkWin() {
        if (currentValue === targetWord) {
            gameWon = true;
            displayEl.innerText = "BRAVO !";
            displayEl.classList.add('win-message');
            cursorEl.style.display = 'none';
            targetDisplayEl.innerText = "SUCCÈS DÉVERROUILLÉ";
        }
    }

    btnLock.onclick = (e) => {
        e.preventDefault();
        if (gameWon) return;
        if(currentValue.length < 12) { 
            currentValue += chars[currentIndex];
            displayEl.innerText = currentValue;
            hiddenInput.value = currentValue;
            checkWin();
        }
    };

    btnDelete.onclick = (e) => {
        e.preventDefault();
        if (gameWon) return;
        currentValue = currentValue.slice(0, -1);
        displayEl.innerText = currentValue;
        hiddenInput.value = currentValue;
    };

    startCycling();
}
