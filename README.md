# Jeu éducatif — Reconnaître l'hameçonnage

## Objectif

Cette application est un **jeu éducatif** conçu pour sensibiliser les jeunes à la **détection de l'hameçonnage** (phishing). Elle les place dans des situations qui imitent leurs applications et jeux du quotidien, puis les invite à repérer les tentatives de vol d'identifiants ou d'informations personnelles.

L'objectif pédagogique est d'apprendre à reconnaître les signes courants d'une attaque :

- des **liens vers des sites non officiels** (ex. `freevbucks.lol`, `roblox-zombie.net`, serveurs Discord non officiels) ;
- de **fausses adresses d'expéditeur** qui imitent une marque (ex. `no-reply@roblov.com` au lieu de `roblox.com`) ;
- un **sentiment d'urgence** (« votre compte sera verrouillé », « confirmations de sécurité requises ») ;
- des **promesses trop belles pour être vraies** (V-Bucks, Robux ou jetons gratuits) ;
- des **tactiques de confiance** (mention d'une région comme « Canada/Québec ») ;
- des **boutons d'action** qui mènent vers de fausses pages de connexion.

Chaque exercice se termine par une rétroaction explicative pour comprendre *pourquoi* un élément était suspect.

## Démarrage rapide

Ouvrez simplement `index.html` dans un navigateur (double-cliquez le fichier). Aucune installation, aucun serveur et aucune connexion Internet ne sont requis : l'application fonctionne entièrement en local.

Si le navigateur bloque le chargement des données en `file://`, l'application utilise automatiquement les données intégrées dans la page (`index.html` > script `embedded-messages`).

## Structure du projet

| Élément | Rôle |
| --- | --- |
| `index.html` | Écran principal (bureau Windows avec icônes d'applications) et données intégrées de secours. |
| `styles/styles.css` | Mise en forme du bureau, des fenêtres d'application et des jeux. |
| `js/app.js` | Logique des applications (chat, jeux point-and-click, vérification des réponses). |
| `js/ui.js` | Aides d'interface (fenêtres modales, instructions, alertes de réussite). |
| `data/messages.json` | Données de démonstration (messages de chat, courriel Outlook, publications Reddit). |
| `assets/images/` | Arrière-plans, icônes et images des applications. |

## Les applications (jeux)

Le bureau propose six icônes, chacune ouvrant un exercice thématique.

### 1. Minecraft, Fortnite et Roblox — Le chat suspect

Un aperçu de conversation s'affiche. En cliquant sur le chat, la **fenêtre de conversation s'agrandit** (mode plein écran). Chaque message comporte deux options :

- ✅ **Normal**
- ❌ **Hameçonnage**

Une fois tous les messages catégorisés, un **bouton bleu « Envoyer »** apparaît en bas de la conversation. En le cliquant, l'application vérifie les réponses :

- Aucun message catégorisé → *« Aucun message catégorisé — Vous devez catégorisé tous les messages pour savoir lesquels sont normaux et les autres de l'hameçonnage. »*
- 1 à 7 bonnes réponses → *« Résultat de détection d'hameçonnage sur <Jeu> — Bravo ! Vous avez bien identifiés X messages. Continuer jusqu'à toutes bien les identifiés. »*
- Toutes les réponses correctes → message de réussite suivi d'une **explication des messages frauduleux** (lien non officiel, vol d'informations, etc.).

### 2. Discord — Repérer les messages piégés

Un salon Discord est simulé. L'utilisateur doit **placer un drapeau rouge 🚩** sur chaque message d'hameçonnage, puis cliquer sur **« Envoyer »** pour valider. Une **corbeille 🗑️** permet de retirer un drapeau mal placé. Des fenêtres d'instructions et de réussite accompagnent l'exercice.

### 3. Reddit — Analyser une publication

Une publication Reddit s'affiche en arrière-plan. Quatre zones suspectes sont détectables (titre, expéditeur, paragraphe avec « Canada/Québec », bouton de réinitialisation). L'utilisateur dépose des **drapeaux rouges** sur les indices, utilise la **corbeille** pour corriger, et valide avec le **bouton vert « Envoyer »** placé sur le côté droit de l'écran. Un récapitulatif explicatif s'affiche en fin de parcours.

### 4. Outlook — Le courriel piégé (jeu point-and-click)

Le courriel « Réinitialisation d'email Roblox » est présenté comme arrière-plan. Quatre zones sont à analyser :

1. **L'objet du courriel** (ton urgent) ;
2. **L'expéditeur / destinateur** (`no-reply@roblov.com`, une contrefaçon de roblox.com) ;
3. **Le paragraphe mentionnant « Canada/Québec »** (tactique de confiance) ;
4. **Le bouton « Réinitialiser e-mail » et son lien** (redirige vers une page non officielle).

Les outils (drapeau rouge 🚩, corbeille 🗑️ sur une même rangée, et le bouton vert **« Envoyer »** en dessous) sont disposés dans la partie droite, vide, de l'image. Comme pour Reddit, on place les drapeaux, on corrige avec la corbeille, et on valide.

## Mécaniques communes

- **Drapeau rouge 🚩** : créé puis déposé par glisser-déposer sur un élément suspect.
- **Corbeille 🗑️** : déposez un drapeau dessus pour l'effacer.
- **Bouton vert « Envoyer »** : vérifie les réponses et affiche la rétroaction.
- **Fenêtres d'instructions et de réussite** : guident et expliquent à chaque étape.

## Personnalisation

- **Modifier le contenu** : éditez `data/messages.json` (ou le bloc `embedded-messages` dans `index.html` si vous travaillez en `file://`). Les messages de chat possèdent un champ `phishing` (`true`/`false`) et, le cas échéant, un `href`/`hrefText` pour les liens.
- **Changer les arrière-plans** : remplacez les images dans `assets/images/apps/` (par exemple `Outlook_Background.png`, `Reddit_background_image.png`, etc.).
- **Ajuster les zones cliquables (Overlays)** : dans `data/messages.json` (section `reddit`/`outlook`), les `boxes` définissent la position et la taille des zones à analyser, exprimées en pourcentage de l'écran (`[xPct, yPct, largeurPct, hauteurPct]`).

## Notes techniques

- Application 100 % côté client (HTML, CSS, JavaScript vanilla). Aucune dépendance externe, aucun réseau.
- Conçue pour fonctionner sur laptop/chromebook et tablette (interface type « bureau »).
- Les textes et les interfaces sont en **français**.
