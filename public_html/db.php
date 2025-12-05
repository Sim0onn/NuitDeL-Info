<?php
// db.php
$host = '193.203.168.243';
$dbname = 'u702679740_Pingu';
$username = 'u702679740_User_Maximator';
$password = 'M4xim@tor';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}
?>