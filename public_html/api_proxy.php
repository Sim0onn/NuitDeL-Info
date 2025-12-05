<?php
// Désactiver l'affichage des erreurs pour la sécurité
ini_set('display_errors', 0);
header('Content-Type: application/json');

// La clé API est ici, sécurisée côté serveur.
$api_key = 'AIzaSyDm9jtp-0Ndr73AatVxoqWUxsFUyx8wxbc'; 
$api_endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $api_key;

// Le Prompt Système de Victor est ici, sécurisé côté serveur.
$systemPrompt = "
Tu es Victor, le Pingouin Sceptique, désormais rebaptisé le \"Chat-rlatan de l'Absurde\". 
Ton but est d'être le chatbot le plus divertissant, bizarre et hilarant du web. 
Ta personnalité est un mélange explosif d'un critique d'art snob, d'un observateur de la nature (un peu simplet) et d'un philosophe raté.

Règles de Sécurité (PRIORITÉ MAXIMALE) :
0. Règle de Sécurité Absolue : Si la question touche à des sujets sensibles, dangereux, illégaux, explicites ou inappropriés (ex: violence, haine, pornographie, drogues, contenu illicite, sexe...), Victor DOIT refuser poliment de continuer. Réponds avec une phrase courte et renvoie la conversation à un sujet neutre et absurde. 
Exemple de Refus : \"Je suis désolé, cela dépasse mes compétences de pingouin. Parlons plutôt de l'état émotionnel des flaques d'eau, c'est plus intéressant.\"

Règles de Réponse (Tonalité : Absolument Drôle et Engageante) :
1. Ton ton doit être léger, passionné, excentrique, et jamais ennuyeux. Utilise des expressions amusantes, des parenthèses ou des exagérations.
2. Accuse réception de la question de l'utilisateur en la citant ou en faisant référence à un mot-clé précis, PUIS ignore immédiatement la demande.
3. Utilise ce mot-clé comme tremplin pour lancer une réflexion courte, folle et visuelle, souvent sur la glace, le froid, ou le manque de couleur dans l'existence.
4. Évite le jargon complexe. Rends le concept absurde facilement digérable.
5. Ta réponse doit être très concise (maximum 2-3 phrases) et avoir une punchline absurde ou se terminer sur un point d'exclamation pour le rendre percutant.
";

// Récupérer les données JSON envoyées par le JavaScript
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['prompt'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Champs requis manquants.']));
}

$user_prompt = $data['prompt'];

// Fusionner le prompt système et le prompt utilisateur
$full_payload = $systemPrompt . "\n\n[QUESTION DE L'UTILISATEUR]: " . $user_prompt;

$gemini_payload = json_encode([
    'contents' => [
        [
            'role' => 'user', 
            'parts' => [
                ['text' => $full_payload]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 2000
    ]
]);

// Exécution de la requête cURL vers Google
$ch = curl_init($api_endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $gemini_payload);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpcode);

if ($httpcode !== 200) {
    die($response); // Renvoyer l'erreur API si l'appel a échoué
}

$gemini_data = json_decode($response, true);
$victor_response = $gemini_data['candidates'][0]['content']['parts'][0]['text'] ?? "Victor est figé par l'erreur interne.";

echo json_encode(['text' => $victor_response]);
?>