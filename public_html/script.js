// =================================================================
// Configuration DOM et Points d'Accès
// =================================================================
const PROXY_ENDPOINT = 'api_proxy.php'; // 🚨 NOUVEAU : Cible le fichier PHP sur le serveur Hostinger

// Sélection des Éléments DOM
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const mainContainer = document.querySelector('.main-container');

// Variables Globales pour l'Adaptation de Position
const PENGUIN_BASE_TOP_PERCENT = 25;
const USER_BOTTOM_ANCHOR_PERCENT = 85;
const VERTICAL_GAP = 30;


// =================================================================
// Fonctions de Gestion de l'Interface
// =================================================================

function createMessage(text, isPenguin) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isPenguin ? 'penguin-message' : 'user-message');
    messageDiv.style.position = 'absolute';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('speech-bubble');
    bubbleDiv.textContent = text;

    messageDiv.appendChild(bubbleDiv);
    mainContainer.appendChild(messageDiv);
}


function adjustBubblePositions() {
    const messages = mainContainer.querySelectorAll('.message');
    
    // Si la fonction est appelée avant que les deux bulles ne soient là (ou pour le message initial)
    const userBubble = mainContainer.querySelector('.user-message');
    if (!userBubble) return; 

    const penguinBubble = mainContainer.querySelector('.penguin-message');
    const containerHeight = mainContainer.offsetHeight;

    // --- 1. Positionnement de l'utilisateur (ANCRA PAR LE BAS) ---
    const userHeight = userBubble.offsetHeight;
    const userBottomPx = USER_BOTTOM_ANCHOR_PERCENT * containerHeight / 100;
    const userTopPx = userBottomPx - userHeight; 

    userBubble.style.top = `${userTopPx}px`;
    userBubble.style.right = '5%';
    userBubble.style.left = 'auto'; 

    // --- 2. Positionnement de Victor (Adaptatif, UNIQUEMENT s'il est là) ---
    if (penguinBubble) {
        const penguinHeight = penguinBubble.offsetHeight;
        
        const penguinBottomTarget = userTopPx - VERTICAL_GAP;
        const calculatedPenguinTopPx = penguinBottomTarget - penguinHeight;

        const minPenguinTop = PENGUIN_BASE_TOP_PERCENT * containerHeight / 100;

        const finalPenguinTop = Math.max(minPenguinTop, calculatedPenguinTopPx);

        penguinBubble.style.top = `${finalPenguinTop}px`;
        penguinBubble.style.left = '25%';
        penguinBubble.style.right = 'auto';
    }
}


// =================================================================
// Fonction d'Appel API (Appelle le Proxy PHP)
// =================================================================

async function callChatbotAPI(prompt) {
    // Le prompt système est géré par le proxy PHP. On n'envoie que le texte de l'utilisateur.
    const body = JSON.stringify({
        prompt: prompt 
    });

    const config = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    };

    try {
        const response = await fetch(PROXY_ENDPOINT, config);
        const data = await response.json();

        if (!response.ok) {
             throw new Error(`Erreur serveur: ${data.error || response.statusText}`);
        }

        // Le proxy nous renvoie le texte propre de Victor
        return data.text; 
        
    } catch (error) {
        console.error("Erreur d'appel API proxy:", error);
        throw error;
    }
}


// =================================================================
// Fonction Principale de Chat
// =================================================================

async function handleSendMessage() {
    const userText = userInput.value.trim();
    if (userText === "") return;

    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = '...';
    
    // Nettoyage de l'interface
    const oldMessages = mainContainer.querySelectorAll('.message');
    oldMessages.forEach(msg => msg.remove());
    
    // 1. Afficher message utilisateur
    createMessage(userText, false); 
    adjustBubblePositions(); 
    userInput.value = '';

    try {
        // 2. Appel API (via le proxy PHP)
        const responseText = await callChatbotAPI(userText);
        
        // 3. Afficher la réponse de Victor
        createMessage(responseText, true); 
        adjustBubblePositions(); 
        
    } catch (error) {
        createMessage("Une erreur cosmique a empêché ma pensée d'arriver jusqu'à vous.", true);
        adjustBubblePositions();
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'Envoyer';
        userInput.focus();
    }
}

// =================================================================
// Écouteurs d'Événements
// =================================================================
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});