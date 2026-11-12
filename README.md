# Jeu éducatif — Reconnaître l’hameçonnage

Application éducative en français pour apprendre à reconnaître les offres trompeuses, les expéditeurs imités, les demandes d’identifiants, les téléchargements suspects et les messages qui suscitent l’urgence.

## Démarrage

Ouvrez `index.html` dans un navigateur. Aucune installation ni connexion Internet n’est nécessaire. Les images et les logos sont stockés localement.

L’application essaie de charger `data/messages.json`. Si le navigateur bloque ce chargement en `file://`, elle utilise la copie intégrée dans le script `embedded-messages` de `index.html`. Ces deux sources doivent rester identiques.

## Les six applications

### Roblox, Fortnite et Minecraft

Chaque jeu présente dix messages dans un ordre fixe : cinq légitimes et cinq d’hameçonnage. Un clic sur le clavardage l’agrandit. Classez chaque message comme **Normal** ou **Hameçonnage** ; le bouton **Valider** est activé seulement quand tous les messages ont une réponse.

En cas d’erreur, le résultat indique le nombre de bonnes réponses et permet de corriger les choix. Après une réussite, les choix deviennent des statuts **✅ Normal** ou **❌ Hameçonnage**. Les boutons **?** affichent les explications associées aux messages suspects et au message contenant un lien officiel.

Les liens du clavardage ne naviguent pas vers les sites présentés. Seul le lien V-Bucks de Fortnite ouvre une illustration locale de page frauduleuse. `blank.html` reste la destination locale de secours des liens simulés.

### Discord

Le menu **Communauté** permet de passer entre Roblox, Fortnite et Minecraft. Chaque communauté contient quatre messages dans un ordre fixe, dont un message légitime avec un lien officiel. Roblox et Fortnite ont chacun un message d’hameçonnage ; Minecraft en a deux.

Faites glisser directement le drapeau rouge sur les messages suspects. Déposez un drapeau dans la corbeille pour le supprimer. Cliquez sur **Valider** pour obtenir une rétroaction et les explications. Les drapeaux sur les messages légitimes empêchent la réussite. Les drapeaux sont conservés lors du changement de communauté, jusqu’à la fermeture de l’exercice.

### Outlook

Les flèches à droite de la bande bleue permettent de parcourir cinq faux courriels : Roblox, Microsoft, YouTube, Postes Canada et Google. Les drapeaux sont conservés pendant la navigation, jusqu’à la fermeture de l’exercice.

Chaque courriel comporte quatre zones à analyser : l’objet, l’expéditeur, un passage suspect et le bouton avec son adresse de destination, L’adresse apparaît au-dessus du bouton au survol ou au focus clavier, puis disparaît quand il n’est plus survolé ni ciblé au clavier. Aucun site externe n’est ouvert.

Placez les drapeaux sur les indices, puis cliquez sur **Valider**. En cas d’erreur, le résultat précise le nombre d’indices repérés et, s’il y en a, le nombre de drapeaux mal placés. La réussite exige de couvrir toutes les zones suspectes du courriel sans signaler d’autres éléments.

Les explications distinguent les domaines officiels des imitations. Elles rappellent que les logos et les liens officiels présents dans un courriel ne prouvent pas son authenticité. Dans le courriel de l’ami, une adresse Gmail légitime ne garantit pas l’identité de l’expéditeur.

### SMS

L’icône **SMS**, sous Outlook sur le bureau, ouvre une simulation de téléphone avec trois conversations : faux concours Minecraft envoyé par un ami, fausse récompense iPhone et faux ami demandant un code TikTok.

Les flèches permettent de changer de conversation sans perdre les drapeaux. Faites glisser les drapeaux sur les passages suspects, retirez les erreurs avec la corbeille et appuyez sur **Valider**. Le concours contient deux passages à signaler, l’iPhone quatre et la demande de code TikTok un seul.

Les adresses restent visibles dans les SMS, sans action au clic ni navigation externe. Les explications rappellent les risques de vol d’identifiants, de renseignements bancaires et de codes personnels.

## Structure et personnalisation

### Outil URL sur le bureau

Le bouton **Comprendre les adresses Web**, en haut à droite du bureau, ouvre une fenêtre modale avec une adresse décomposée, des exemples trompeurs et un analyseur. Il est masqué lorsqu’un exercice est ouvert.

L’analyseur utilise le parseur `URL` du navigateur et une copie locale de la [Public Suffix List](https://publicsuffix.org/learn/), incluant les règles ICANN et les services d’hébergement privés. Il gère les extensions composées (`co.uk`), les règles génériques, les exceptions et les noms internationalisés. Il distingue les IP et les noms locaux. Il ne fait aucune requête vers l’adresse saisie et ne vérifie ni l’existence ni la fiabilité d’un site.

Les règles locales dans `js/public-suffix-list.js` sont datées et distribuées sous licence MPL 2.0. Pour les actualiser depuis la source officielle : `python3 scripts/update-public-suffix-list.py`. Une liste déjà téléchargée peut aussi être fournie avec `--source /chemin/public_suffix_list.dat`. L’application elle-même reste entièrement hors ligne.

Validation de l’outil : `node tests/url-guide.test.cjs`.

### Domaines officiels

Le bouton **Domaines officiels**, entre l’aide sur les adresses Web et le quiz, ouvre une fenêtre dédiée à la liste des domaines de référence : Roblox, Fortnite / Epic Games, Minecraft, Google et Microsoft. Cette liste n’est plus affichée dans la fenêtre de compréhension. Le bouton reste visible et disponible lorsqu’un exercice est ouvert. Fermer cette fenêtre permet de retrouver l’exercice en cours.

### Quiz sur les adresses Web

Sous le bouton **Domaines officiels**, une icône ouvre un quiz de dix questions, une à la fois. Chaque URL propose quatre choix pour son domaine principal avec extension. Cinq adresses utilisent des domaines officiels et cinq imitent les plateformes présentées.

Un choix est définitif pour la question : la bonne réponse est surlignée immédiatement, « BRAVO ! » apparaît si le choix est correct et une courte explication accompagne la correction. Le bouton **Suivant** est activé après la réponse. Un résultat sur 10 et un bouton pour recommencer sont affichés à la fin. Fermer et rouvrir la fenêtre conserve la progression jusqu’au rechargement de la page. L’aide de compréhension et le quiz sont masqués lorsqu’un exercice est ouvert ; les domaines officiels restent accessibles.

Les questions se trouvent dans `js/url-quiz.js`. Validation : `node tests/url-quiz.test.cjs` ; les réponses sont également comparées à l’analyseur et aux règles de suffixes locales. Les adresses du quiz ne sont jamais ouvertes.

| Élément | Rôle |
| --- | --- |
| `index.html` | Bureau, chargement des scripts et copie intégrée des données. |
| `js/app.js` | Rendu des exercices, navigation, validation et déplacement des drapeaux. |
| `js/ui.js` | Fenêtres et rétroactions explicatives. |
| `js/url-guide.js` | Fenêtre pédagogique URL et extraction du domaine. |
| `js/url-quiz.js` | Dix questions, correction immédiate et progression du quiz URL. |
| `js/public-suffix-list.js` | Copie locale des règles de suffixes, avec provenance et licence. |
| `styles/styles.css` | Présentation des six applications. |
| `data/messages.json` | Messages, communautés Discord et courriels Outlook. |
| `assets/images/` | Arrière-plans, logos et illustration V-Bucks. |
| `blank.html` | Page locale de secours pour les liens simulés du clavardage. |

- **Messages des jeux** : modifiez `games`, notamment `user`, `text`, `phishing`, `href`, `hrefText` et le type d’`explanation`. Les textes explicatifs sont dans `js/ui.js`.
- **Discord** : modifiez `discord.communities`. Les messages définissent les zones à signaler via `phishing`. Les explications sont dans `clues` ou dans des groupes `explanations` associés aux messages.
- **Outlook** : modifiez les entrées de `outlook.emails` : objet, expéditeur, paragraphes, bouton, URL, signature, logo et quatre explications `clues`. Le champ `clueField: "intro"` place la troisième cible sur l’introduction plutôt que sur le paragraphe `threat`.
- **SMS** : modifiez `sms.conversations`. Chaque segment de `parts` contient un texte et un indicateur `suspect`, ainsi qu’un `href` pour les liens simulés. Les explications se trouvent dans `clues` et `additionalExplanation`.
- **Données locales** : répercutez chaque modification de `data/messages.json` dans `embedded-messages` pour conserver le même contenu avec ou sans serveur.

L’application utilise HTML, CSS et JavaScript sans dépendance externe. Les interfaces Discord et Outlook peuvent nécessiter un défilement sur les petits écrans.
