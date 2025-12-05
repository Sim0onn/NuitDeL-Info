import { startFlowerGame } from './flowerGame.js';


// --- Scène ---
const scene = new THREE.Scene();

// --- Caméra ---
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- Redimensionnement ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lumière ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 5, 5);
scene.add(light);

// Lumière ambiante pour que tout soit bien éclairé
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // intensité 0.7
scene.add(ambientLight);


// --- Variables pour les flocons ---
let particleSystem;
const particleCount = 15000; // Nombre de flocons (ajuste ce nombre)
const snowRange = 80;        // La zone où les flocons apparaissent
const fallSpeed = 0.05;      // Vitesse de chute

// --- Variables pour la Résistance au Froid ---
const MAX_RESISTANCE = 100;
let currentResistance = MAX_RESISTANCE;
let lastMoveTime = Date.now(); // Pour suivre l'inactivité

// ---------------------------------- Map --------------------------------
// Taille du canvas pour la texture
const size = 256; // plus petit pour répéter facilement
const canvas = document.createElement('canvas');
canvas.width = canvas.height = size;
const ctx = canvas.getContext('2d');

// Fond blanc
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, size, size);

// Palette de bleus clairs
const colors = ['#b3e0ff', '#99ccff', '#cce6ff', '#e6f7ff'];

// Ajouter des taches bleues aléatoires
for(let i=0; i<500; i++){
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 8;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

const mapSize = 200;
// Créer la texture
const iceTexture = new THREE.CanvasTexture(canvas);
iceTexture.wrapS = iceTexture.wrapT = THREE.RepeatWrapping;
iceTexture.repeat.set(mapSize/3, mapSize/3); // répéter plusieurs fois pour couvrir toute la map

// Matériau du sol
const planeMaterial = new THREE.MeshStandardMaterial({
    map: iceTexture,
    roughness: 0.3,
    metalness: 0.1
});

const planeGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI/2;
scene.add(plane);

createSnow();

//================================== FIN MAP ====================================

// --- Texture du perso ---
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('models/Main_char/textures/Main_char.png');

// --- Variables de joueur ---
let player, playerPos = { x: 0, z: 0 };



// --- Render Perso ---
const objLoader = new THREE.OBJLoader();
objLoader.setPath('models/Main_char/source/');
objLoader.load('Main_char.obj', function(object){

    object.traverse(function(child){
        if(child.isMesh){
            child.material.map = texture;
        }
    });

    object.scale.set(0.1, 0.1, 0.1);

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    object.position.y += size.y / 2;

    player = object;
    scene.add(player);
});

let targetPos = { x: 0, z: 0 };
const moveSpeed = 0.1;

document.addEventListener('keydown', (event) => {
    if(!player) return;

    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)){
        event.preventDefault();
    }

    let moveX = 0, moveZ = 0;

    switch(event.key){
        case 'ArrowUp': moveZ = -1; break;
        case 'ArrowDown': moveZ = 1; break;
        case 'ArrowLeft': moveX = -1; break;
        case 'ArrowRight': moveX = 1; break;
    }

    targetPos.x = Math.max(-40, Math.min(40, targetPos.x + moveX));
    targetPos.z = Math.max(-40, Math.min(10, targetPos.z + moveZ));

    if(moveX !== 0 || moveZ !== 0){
        player.rotation.y = Math.atan2(moveX, moveZ);
    }
});

const cameraHeight = 10;

function updateCamera(){
    if(!player) return;

    camera.position.x = player.position.x;
    camera.position.y = cameraHeight;
    camera.position.z = player.position.z + 10;

    camera.lookAt(player.position.x, 0, player.position.z);
}


// --------------- DECORS ------------------

function loadDecorWithPalette(path, objFile, paletteFile, scale, posX, posZ) {
    const paletteTexture = new THREE.TextureLoader().load(path + paletteFile);

    const objLoader = new THREE.OBJLoader();
    objLoader.setPath(path);
    objLoader.load(objFile, function(object) {

        object.traverse(function(child) {
            if(child.isMesh){
                child.material = new THREE.MeshStandardMaterial({
                    map: paletteTexture,
                    color: 0xffffff,
                    roughness: 0.6,
                    metalness: 0.1,
                    side: THREE.DoubleSide
                });
                child.material.needsUpdate = true;
            }
        });

        // Redimensionner
        object.scale.set(scale, scale, scale);

        // Centrer horizontalement mais placer le bas au sol
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.x -= center.x;
        object.position.z -= center.z;
        object.position.y = -box.min.y; // bas au niveau y = 0

        if(objFile === 'Log.obj'){
            object.rotation.z = Math.PI / 2; // tourne de 90° horizontalement
            object.position.y = 0.7; // bas au niveau y = 0

        }

        // Positionner sur la map
        object.position.x += posX;
        object.position.z += posZ;

        scene.add(object);
    });
}

for (let z = -40; z <= 10; z += 5) {
    loadDecorWithPalette('models/Spruce/', 'Spruce.obj', 'TexturePalette.png', 2, -40, z);
}
for (let z = -40; z <= 10; z += 5) {
    loadDecorWithPalette('models/Spruce/', 'Spruce.obj', 'TexturePalette.png', 2, 40, z);
}
for (let x = -40; x <= 40; x += 5) {
    loadDecorWithPalette('models/Spruce/', 'Spruce.obj', 'TexturePalette.png', 2, x, 10);
}
for (let x = -40; x <= 40; x += 5) {
    loadDecorWithPalette('models/Spruce/', 'Spruce.obj', 'TexturePalette.png', 2, x, -40);
}

const flowerPositions = [
    { x: -5, z: -16 },
    { x: -28, z: -36 },
    { x: -26, z: -9 },
    { x: 27, z: -22 },
];

const flowerObjects = [];
flowerPositions.forEach(({x, z}) => {
    loadDecorWithPalette('models/flowerB/', 'FlowerB.obj', 'TexturePalette.png', 2, x, z);
    flowerObjects.push({ x, z });
});

// size x -z
loadDecorWithPalette('models/flowerW/', 'FlowerW.obj', 'TexturePalette.png', 2, -5, -14);
loadDecorWithPalette('models/flowerW/', 'FlowerW.obj', 'TexturePalette.png', 2, -3, -16);
loadDecorWithPalette('models/flowerW/', 'FlowerW.obj', 'TexturePalette.png', 2, -5, -18);
loadDecorWithPalette('models/flowerW/', 'FlowerW.obj', 'TexturePalette.png', 2, -7, -16);
loadDecorWithPalette('models/log/', 'Log.obj', 'TexturePalette.png', 2, -7.5, -22);


const extraTrees = [
    [-33, -42],
    [-31, -43],
    [-29, -44],
    [-26, -42],
    // [-24, -38],
    // [-23, -36],
    // [-30, -33],
    [-33, -37],
    // [-28, -32],
    [-26, -39],
    [-34, -36],
    [-35, -40]
];

extraTrees.forEach(([x, z]) => {
    loadDecorWithPalette(
        'models/Spruce/',
        'Spruce.obj',
        'TexturePalette.png',
        2 + (Math.random() * 0.3 - 0.15), // légère variation d’échelle
        x + (Math.random() * 1.2 - 0.6), // décalage subtil
        z + (Math.random() * 1.2 - 0.6)
    );
});

loadDecorWithPalette('models/rock/', 'Rock.obj', 'TexturePalette.png', 2, 30, -30);
loadDecorWithPalette('models/Reed/', 'Reed.obj', 'TexturePalette.png', 2, -29, -11);
loadDecorWithPalette('models/Reed/', 'Reed.obj', 'TexturePalette.png', 2, -31, -9);
loadDecorWithPalette('models/Reed/', 'Reed.obj', 'TexturePalette.png', 2, -29, -7);

// --- Ajouter le snowman ---
function loadSnowman(path, objFile, mtlFile, scale, posX, posZ, rotationDeg = 0) {
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path);
    mtlLoader.load(mtlFile, function(materials) {

        materials.preload();

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        objLoader.load(objFile, function(object) {

            // Scale
            object.scale.set(scale, scale, scale);

            // Centrer et placer au sol
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.z -= center.z;
            object.position.y = 1.2;

            // Position finale sur la map
            object.position.x += posX;
            object.position.z += posZ;

            // Rotation
            object.rotation.y = THREE.MathUtils.degToRad(rotationDeg);

            scene.add(object);
        });
    });
}

// Exemple : placer le snowman au centre
loadSnowman('models/snowman/', 'snowman.obj', 'snowman.mtl', 0.6, 10, -30, 270);



// --- Ajouter Santa ---
function loadSanta(path, objFile, mtlFile, scale, posX, posZ, rotationDeg = 0) {
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path);
    mtlLoader.load(mtlFile, function(materials) {

        materials.preload();

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        objLoader.load(objFile, function(object) {

            // Redimensionner
            object.scale.set(scale, scale, scale);

            // Centrer horizontalement et placer au sol
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.z -= center.z;
            object.position.y = -box.min.y;

            // Position finale
            object.position.x += posX;
            object.position.z += posZ;

            // Rotation
            object.rotation.y = THREE.MathUtils.degToRad(rotationDeg);

            scene.add(object);
        });
    });
}

// Exemple : placer Santa près du traîneau et du snowman
loadSanta('models/santa/', 'santa.obj', 'santa.mtl', 3, 7, -30, 0);



// ---------------------------------- FIN DECORS ----------------------------------

// ----- ANIMAUX -----

function loadAnimal(path, objFile, mtlFile, textureFile, scale, posX, posZ, rotationDeg = 0) {

    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path);
    mtlLoader.load(mtlFile, function(materials) {

        materials.preload();

        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        objLoader.load(objFile, function(object) {

            // appliquer texture
            if (textureFile) {
                const tex = new THREE.TextureLoader().load(path + textureFile);
                object.traverse(child => {
                    if(child.isMesh){
                        child.material.map = tex;
                        child.material.needsUpdate = true;
                    }
                });
            }

            // scale
            object.scale.set(scale, scale, scale);

            // placer au sol
            const box = new THREE.Box3().setFromObject(object);
            object.position.y = -box.min.y;

            // position
            object.position.x = posX;
            object.position.z = posZ;

            // rotation
            object.rotation.y = THREE.MathUtils.degToRad(rotationDeg);

            scene.add(object);
        });
    });
}


loadAnimal('models/animals/assets/', 'deer.obj', 'deer.mtl', 'Texture.png', 2, -30, -39, 210);

loadAnimal('models/animals/assets/', 'horse.obj', 'horse.mtl', 'Texture.png', 2, 32, -24, 120);

loadAnimal('models/animals/assets/', 'pinguin.obj', 'pinguin.mtl', 'Texture.png', 2, -29, -9, 270);

loadAnimal('models/animals/assets/', 'kitty.obj', 'kitty.mtl', 'Texture.png', 10, -5, -20, 180);

//------------------------------ FIN ANIMAUX ----------------------------------


//--- ouverture dialogues ---

const flowerModals = [
    { x: -5, z: -16, modalId: 'flowerModal1' },
    { x: -28, z: -36, modalId: 'flowerModal2' },
    { x: -26, z: -9, modalId: 'flowerModal3' },
    { x: 27, z: -22, modalId: 'flowerModal4' }
];

let modalOpen = false;

function checkPlayerOnFlower() {
    if (!player) return;

    flowerModals.forEach(({ x, z, modalId }) => {
        const distance = Math.sqrt(
            Math.pow(player.position.x - x, 2) +
            Math.pow(player.position.z - z, 2)
        );

        if (distance < 2 && !modalOpen) {
            const modalEl = document.getElementById(modalId);
            modalEl.style.display = 'flex';
            modalOpen = true;

            // Fermer le modal
            const closeBtn = modalEl.querySelector('.closeModal');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modalEl.style.display = 'none';
                    modalOpen = false;

                    // Nettoyer le contenu du chat Victor si c'est modal3
                    if(modalId === 'flowerModal3'){
                        const mainContainer = modalEl.querySelector('.main-container');
                        if(mainContainer){
                            const messages = mainContainer.querySelectorAll('.message');
                            messages.forEach(msg => msg.remove());
                        }
                        const userInput = modalEl.querySelector('#user-input');
                        if(userInput) userInput.value = '';
                    }
                };
            }

            // Injecter le mini-jeu ou Victor selon le modal
            if (modalId === 'flowerModal2') {
                startFlowerGame(modalId);
            } 
            else if(modalId === 'flowerModal3'){
                // Initialiser Victor dans le modal3
                const userInput = modalEl.querySelector('#user-input');
                if(userInput) userInput.focus();
            }
        }
    });
}



// Fermer tous les modals
flowerModals.forEach(({ modalId }) => {
    const closeBtn = document.querySelector(`#${modalId} .closeModal`);
    closeBtn.addEventListener('click', () => {
        document.getElementById(modalId).style.display = 'none';
        modalOpen = false;
    });
});




function createSnow() {
    // 1. Géométrie : définir les positions
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Position X et Z aléatoire sur la map
        positions[i] = (Math.random() - 0.5) * snowRange;
        // Position Y (Hauteur) - Flocons commencent haut
        positions[i + 1] = Math.random() * snowRange;
        // Position Z
        positions[i + 2] = (Math.random() - 0.5) * snowRange;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 2. Matériau : définir l'apparence
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2, // Taille du flocon (ajuster si besoin)
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending, // Pour un effet plus lumineux
    });
    

    // 3. Création du système
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}


function initializeResistanceBar() {
    const barHTML = `
        <style>
            /* ------------------------------------------------ */
            /* CONTENEUR FIXE (La base en bas de l'écran) */
            /* ------------------------------------------------ */
            .status-bar-container {
                position: absolute;
                bottom: 5px; 
                left: 50%;
                transform: translateX(-50%);
                width: 320px; /* Légèrement plus large pour l'impact */
                z-index: 9999;
                font-family: 'Arial', sans-serif;
            }

            /* Étiquette du statut */
            .status-bar-label {
                    color: #FFFFFF; /* 🚨 Changement : Blanc pur pour plus de contraste */
                    font-size: 14px; /* 🚨 Changement : Légèrement plus grand */
                    font-weight: 900; /* 🚨 Changement : Ultra-épais (Bold Max) */
                    margin-bottom: 4px;
                    text-align: center;
                    /* Ombre portée plus nette et plus forte pour contraster avec le fond */
                    text-shadow: 0px 0px 4px #000, /* Ombre de diffusion pour l'épaisseur */
                         1px 1px 5px rgba(0, 0, 0, 1); /* Ombre forte pour le relief */
}

            /* ------------------------------------------------ */
            /* CADRE EXTÉRIEUR (Le fond sombre) */
            /* ------------------------------------------------ */
            .status-bar-outer {
                width: 100%;
                height: 22px; /* Légèrement plus épais */
                
                /* Effet 3D et relief */
                background-color: #333; 
                border: 1px solid #1a1a1a;
                border-radius: 6px;
                box-shadow: 
                    inset 0 0 5px rgba(0, 0, 0, 0.5), /* Ombre interne pour l'effet de creux */
                    0 4px 8px rgba(0, 0, 0, 0.3);     /* Ombre externe */
                overflow: hidden; 
            }

            /* ------------------------------------------------ */
            /* BARRE INTERNE (La résistance elle-même) */
            /* ------------------------------------------------ */
            #resistance-bar {
                height: 100%;
                width: 100%; 
                
                /* 🚨 CORRECTION : Retirer le dégradé fixe ici pour laisser JS prendre le contrôle ! */
                /* background: linear-gradient(to top, #4CAF50, #7CFC00); */ 
                
                /* Ajouter une couleur de base pour l'initialisation */
                background-color: #00FF00;
                
                /* Effet de brillance/reflet sur le dessus (maintenu) */
                box-shadow: 
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                
                transition: width 0.3s ease-out, background-color 0.3s ease-out; 
                border-radius: 4px;
                transform: scaleX(1); 
                transform-origin: left;
            }
        </style>
        <div class="status-bar-container">
            <div class="status-bar-label">Résistance au Froid :</div>
            <div class="status-bar-outer">
                <div id="resistance-bar" class="status-bar-inner"></div>
            </div>
        </div>
    `;
    
    // Injecter le HTML/CSS dans le corps du document
    document.body.insertAdjacentHTML('beforeend', barHTML);
}

function updateResistanceBar(change) {
    const resistanceBar = document.getElementById('resistance-bar');
    if (!resistanceBar) return;

    // 1. Calcul de la nouvelle valeur de la Résistance (entre 0 et 100)
    currentResistance = Math.max(0, Math.min(MAX_RESISTANCE, currentResistance + change));
    
    // Mettre à jour la largeur de la barre (position de la barre)
    resistanceBar.style.width = `${currentResistance}%`;

    // 2. 🚨 CORRECTION DU CALCUL DE COULEUR (HSL) 🚨
    // Multiplier la Résistance par 1.2 donne une valeur entre 0 (pour Résistance 0) et 120 (pour Résistance 100).
    // HSL(120, 80%, 50%) est VERT, HSL(0, 80%, 50%) est ROUGE.
    let hueValue = currentResistance * 1.2; 
    
    // On veut 120° quand c'est plein (vert) et 0° quand c'est vide (rouge).
    // Nous devons inverser la valeur de teinte pour que 0% de Résistance = 0° Hue (Rouge)
    // et 100% de Résistance = 120° Hue (Vert).

    // C'est déjà le bon sens de multiplication (0*1.2 = 0° (Rouge), 100*1.2 = 120° (Vert)).
    // Assurons-nous simplement que la valeur ne dépasse pas 120.
    hueValue = Math.min(120, hueValue); 
    
    // Appliquer la couleur HSL
    let color = `hsl(${hueValue}, 80%, 50%)`; 
    resistanceBar.style.backgroundColor = color;
}

// 🚨 Appelez cette fonction une fois pour initialiser la barre au démarrage 
initializeResistanceBar();

// --- Animation ---
function animate() {
    requestAnimationFrame(animate);

    if (player) {
        
        // Logique de mouvement (inchangée)
        player.position.x += (targetPos.x - player.position.x) * moveSpeed;
        player.position.z += (targetPos.z - player.position.z) * moveSpeed;

        const distance = Math.sqrt(
            Math.pow(targetPos.x - player.position.x, 2) +
            Math.pow(targetPos.z - player.position.z, 2)
        );
        const jumpHeight = 0.5;
        player.position.y = (player.geometryBoundingY || 0) + jumpHeight * Math.sin(distance * Math.PI);
        
        // -----------------------------------------------------
        // 🚨 LOGIQUE DE RÉSISTANCE AU FROID 🚨
        // -----------------------------------------------------
        
        if (distance > 0.001) { // Le joueur bouge
            // Augmentation du gain pour une remontée plus rapide (0.2)
            updateResistanceBar(0.2); 
            // Mise à jour du temps de dernier mouvement
            lastMoveTime = Date.now(); 

        } else {
            // Le joueur est immobile : LA RÉSISTANCE CHUTE PLUS VITE
            const timeElapsedSinceMove = (Date.now() - lastMoveTime) / 1000;
            
            if (timeElapsedSinceMove > 1 && currentResistance > 0) {
                // Chute rapide : -0.15 (comme convenu pour une descente visible)
                updateResistanceBar(-0.15); 
            }
        }
    }

    updateCamera();

    renderer.render(scene, camera);
    checkPlayerOnFlower();
}


// --- Overlay touches directionnelles (injection automatique) ---
(function createControlsOverlay(){
    // créer conteneur
    const overlay = document.createElement('div');
    overlay.id = 'controls-overlay';

    // structure : up, left, right, down (tu peux modifier les symboles)
    overlay.innerHTML = `
        <div class="arrow up">▲</div>
        <div class="arrow left">◀</div>
        <div class="arrow right">▶</div>
        <div class="arrow down">▼</div>
    `;

    document.body.appendChild(overlay);

    const keyMap = {
        'ArrowUp':   overlay.querySelector('.up'),
        'ArrowDown': overlay.querySelector('.down'),
        'ArrowLeft': overlay.querySelector('.left'),
        'ArrowRight':overlay.querySelector('.right')
    };

    // gérer keydown / keyup pour mettre la classe active
    const activeKeys = new Set();

    document.addEventListener('keydown', (e) => {
        const el = keyMap[e.key];
        if (!el) return;
        if (!activeKeys.has(e.key)) {
            activeKeys.add(e.key);
            el.classList.add('active');
            // remonter un peu l'opacité globale pour signaler l'interaction
            overlay.style.opacity = '0.85';
        }
    });

    document.addEventListener('keyup', (e) => {
        const el = keyMap[e.key];
        if (!el) return;
        activeKeys.delete(e.key);
        el.classList.remove('active');
        // si aucune touche active, revenir à l'opacité discrète
        if (activeKeys.size === 0) {
            overlay.style.opacity = '0.25';
        }
    });

    // nettoyage au cas où la fenêtre perde le focus (évite touches coincées)
    window.addEventListener('blur', () => {
        activeKeys.forEach(k => {
            const el = keyMap[k];
            if (el) el.classList.remove('active');
        });
        activeKeys.clear();
        overlay.style.opacity = '0.25';
    });

    // Optionnel : si tu veux aussi gérer le highlight quand le personnage se déplace
    // (par exemple si tu utilises targetPos et move par interpolation), appelle :
    // document.dispatchEvent(new CustomEvent('controls-highlight', { detail: { key: 'ArrowUp' } }));
    document.addEventListener('controls-highlight', (ev) => {
        const key = ev?.detail?.key;
        const el = keyMap[key];
        if (!el) return;
        el.classList.add('active');
        setTimeout(()=> el.classList.remove('active'), 200);
    });
})();











animate();

