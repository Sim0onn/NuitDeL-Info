<?php session_start(); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portail d'Accès - RPG Style</title>
    <link href="https://fonts.googleapis.com/css2?family=Germania+One&family=VT323&display=swap" rel="stylesheet">
    <style>
        
        .alert {
            color: #e74c3c;
            background: rgba(0,0,0,0.5);
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid #e74c3c;
            font-size: 1.1rem;
        }
        .success {
            color: #2ecc71;
            border-color: #2ecc71;
        }
    </style>
    <style>
        body { background: #2c3e50; font-family: 'VT323', monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; user-select: none; }
        .wood-panel { position: relative; width: 350px; padding: 40px; background-color: #5D4037; border: 6px solid #3e2723; border-radius: 10px; text-align: center; box-shadow: 15px 15px 0px rgba(0,0,0,0.5); }
        .nail { position: absolute; width: 12px; height: 12px; background: #95a5a6; border-radius: 50%; box-shadow: 1px 2px 2px rgba(0,0,0,0.8); }
        .tl { top: 12px; left: 12px; } .tr { top: 12px; right: 12px; } .bl { bottom: 12px; left: 12px; } .br { bottom: 12px; right: 12px; }
        .retro-screen { background-color: #000; border: 4px solid #3e2723; padding: 15px; margin-bottom: 30px; }
        .screen-text { color: #2ecc71; font-family: 'VT323', monospace; font-size: 2rem; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
        .pixel-btn { background: #8d6e63; border: 4px solid; border-color: #d7ccc8 #3e2723 #3e2723 #d7ccc8; color: #3e2723; font-family: 'VT323', monospace; font-size: 1.5rem; font-weight: bold; width: 100%; padding: 10px; margin-bottom: 15px; cursor: pointer; }
        .pixel-btn:active { border-color: #3e2723 #d7ccc8 #d7ccc8 #3e2723; transform: translateY(2px); }
        .pixel-btn.primary { background: #27ae60; border-color: #2ecc71 #1e8449 #1e8449 #2ecc71; color: white; }
        .back-link { color: #d7ccc8; text-decoration: underline; cursor: pointer; font-size: 1.2rem; margin-top: 10px; display: inline-block; }
        .input-group { margin-bottom: 15px; text-align: left; }
        label { color: #d7ccc8; font-size: 1.2rem; display: block; margin-bottom: 5px; }
        input { width: 100%; box-sizing: border-box; background: #3e2723; border: 2px solid #2c1e19; padding: 10px; color: #2ecc71; font-family: 'VT323', monospace; font-size: 1.3rem; outline: none; }
        .view-section { display: none; animation: fadeIn 0.4s; }
        .view-section.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>

    <div class="wood-panel">
        <div class="nail tl"></div><div class="nail tr"></div>
        <div class="nail bl"></div><div class="nail br"></div>

        <div class="retro-screen">
            <h2 class="screen-text" id="screen-title">BIENVENUE</h2>
        </div>

        <?php if(isset($_GET['error'])): ?>
            <div class="alert">
                <?php 
                    if($_GET['error'] == 'exists') echo "Ce héros existe déjà !";
                    if($_GET['error'] == 'wrong') echo "Identifiants incorrects.";
                ?>
            </div>
        <?php endif; ?>
        <?php if(isset($_GET['success'])): ?>
            <div class="alert success">Compte forgé ! Connecte-toi.</div>
        <?php endif; ?>

        <div id="view-menu" class="view-section active">
            <button class="pixel-btn" onclick="switchView('login')">CONNEXION</button>
            <button class="pixel-btn" onclick="switchView('register')">INSCRIPTION</button>
        </div>

        <div id="view-login" class="view-section">
            <form action="auth.php" method="POST">
                <input type="hidden" name="action" value="login">
                
                <div class="input-group">
                    <label>Nom du Héros</label>
                    <input type="text" name="pseudo" placeholder="Pseudo..." required>
                </div>
                <div class="input-group">
                    <label>Mot de passe</label>
                    <input type="password" name="password" placeholder="******" required>
                </div>
                <button type="submit" class="pixel-btn primary">ENTRER</button>
            </form>
            <div class="back-link" onclick="switchView('menu')">< Retour</div>
        </div>

        <div id="view-register" class="view-section">
            <form action="auth.php" method="POST">
                <input type="hidden" name="action" value="register">

                <div class="input-group">
                    <label>Nouveau Pseudo</label>
                    <input type="text" name="pseudo" placeholder="Guerrier123..." required>
                </div>
                <div class="input-group">
                    <label>Email (Parchemin)</label>
                    <input type="email" name="email" placeholder="@..." required>
                </div>
                <div class="input-group">
                    <label>Créer Pass</label>
                    <input type="password" name="password" placeholder="Secret..." required>
                </div>
                <button type="submit" class="pixel-btn primary">FORGER COMPTE</button>
            </form>
            <div class="back-link" onclick="switchView('menu')">< Retour</div>
        </div>

    </div>

    <script>
        function switchView(viewName) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById('view-' + viewName).classList.add('active');

            const titleEl = document.getElementById('screen-title');
            if(viewName === 'menu') titleEl.innerText = "BIENVENUE";
            else if(viewName === 'login') titleEl.innerText = "IDENTIFICATION";
            else if(viewName === 'register') titleEl.innerText = "NOUVEAU JOUEUR";
        }

        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        if(viewParam) {
            switchView(viewParam);
        }
    </script>

</body>
<div id="hud-frame">
    <div class="hud-corner hud-tl"></div>
    <div class="hud-corner hud-tr"></div>
    <div class="hud-corner hud-bl"></div>
    <div class="hud-corner hud-br"></div>

    <div class="hud-side hud-top"></div>
    <div class="hud-side hud-bottom"></div>
    <div class="hud-side hud-left"></div>
    <div class="hud-side hud-right"></div>
</div>

</html>