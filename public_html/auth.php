<?php
// auth.php
session_start();
require 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // --- INSCRIPTION ---
    if (isset($_POST['action']) && $_POST['action'] == 'register') {
        $pseudo = htmlspecialchars($_POST['pseudo']);
        $email = htmlspecialchars($_POST['email']);
        $pass = $_POST['password'];

        // 1. Vérifier si le pseudo ou mail existe déjà
        $check = $pdo->prepare("SELECT id FROM users WHERE pseudo = ? OR email = ?");
        $check->execute([$pseudo, $email]);

        if ($check->rowCount() > 0) {
            header("Location: index.php?error=exists&view=register");
            exit();
        } else {
            // 2. Créer le compte
            $hashed_pass = password_hash($pass, PASSWORD_DEFAULT);
            $insert = $pdo->prepare("INSERT INTO users (pseudo, email, password) VALUES (?, ?, ?)");
            
            if ($insert->execute([$pseudo, $email, $hashed_pass])) {
                header("Location: index.php?success=created&view=login");
                exit();
            }
        }
    }

    // --- CONNEXION ---
    if (isset($_POST['action']) && $_POST['action'] == 'login') {
        $pseudo = htmlspecialchars($_POST['pseudo']);
        $pass = $_POST['password'];

        // 1. Chercher l'utilisateur
        $stmt = $pdo->prepare("SELECT * FROM users WHERE pseudo = ?");
        $stmt->execute([$pseudo]);
        $user = $stmt->fetch();

        // 2. Vérifier le mot de passe
        if ($user && password_verify($pass, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['pseudo'] = $user['pseudo'];
            header("Location: index.html");
            exit();
        } else {
            header("Location: index.php?error=wrong&view=login");
            exit();
        }
    }
}
?>