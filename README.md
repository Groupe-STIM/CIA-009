# Jeu éducatif — Reconnaître l’hameçonnage

Application éducative en français pour apprendre à reconnaître les offres trompeuses, les expéditeurs imités, les demandes d’identifiants, les téléchargements suspects et les messages qui suscitent l’urgence.

## Démarrage

Ouvrez `index.html` dans un navigateur. Aucune installation ni connexion Internet n’est nécessaire. Les images et les logos sont stockés localement.

L’application essaie de charger `data/messages.json`. Si le navigateur bloque ce chargement en `file://`, elle utilise la copie intégrée dans le script `embedded-messages` de `index.html`. Ces deux sources doivent rester identiques.

## Les cinq applications

### Roblox, Fortnite et Minecraft

Chaque jeu présente dix messages dans un ordre fixe : cinq légitimes et cinq d’hameçonnage. Un clic sur le clavardage l’agrandit. Classez chaque message comme **Normal** ou **Hameçonnage** ; le bouton **Valider** est activé seulement quand tous les messages ont une réponse.

En cas d’erreur, le résultat indique le nombre de bonnes réponses et permet de corriger les choix. Après une réussite, les choix deviennent des statuts **✅ Normal** ou **❌ Hameçonnage**. Les boutons **?** affichent les explications associées aux messages suspects et au message contenant un lien officiel.

Les liens du clavardage ne naviguent pas vers les sites présentés. Seul le lien V-Bucks de Fortnite ouvre une illustration locale de page frauduleuse. `blank.html` reste la destination locale de secours des liens simulés.

### Discord

Le menu **Communauté** permet de passer entre Roblox, Fortnite et Minecraft. Chaque communauté contient quatre messages dans un ordre fixe, dont un message légitime avec un lien officiel. Roblox et Fortnite ont chacun un message d’hameçonnage ; Minecraft en a deux.

Faites glisser directement le drapeau rouge sur les messages suspects. Déposez un drapeau dans la corbeille pour le supprimer. Cliquez sur **Valider** pour obtenir une rétroaction et les explications. Les drapeaux sur les messages légitimes empêchent la réussite. Les drapeaux sont conservés lors du changement de communauté, jusqu’à la fermeture de l’exercice.

### Outlook

Les flèches à droite de la bande bleue permettent de parcourir six faux courriels : Roblox, Microsoft, YouTube, Postes Canada, Google et un ami qui demande des votes pour un concours Minecraft. Les drapeaux sont conservés pendant la navigation, jusqu’à la fermeture de l’exercice.

Chaque courriel comporte quatre zones à analyser : l’objet, l’expéditeur, un passage suspect et le bouton avec son adresse de destination. L’adresse apparaît au-dessus du bouton au survol ou au focus clavier, puis disparaît quand il n’est plus survolé ni ciblé au clavier. Aucun site externe n’est ouvert.

Placez les drapeaux sur les indices, puis cliquez sur **Valider**. En cas d’erreur, le résultat précise le nombre d’indices repérés et, s’il y en a, le nombre de drapeaux mal placés. La réussite exige de couvrir les quatre zones sans signaler d’autres éléments.

Les explications distinguent les domaines officiels des imitations. Elles rappellent que les logos et les liens officiels présents dans un courriel ne prouvent pas son authenticité. Dans le courriel de l’ami, une adresse Gmail légitime ne garantit pas l’identité de l’expéditeur.

## Structure et personnalisation

| Élément | Rôle |
| --- | --- |
| `index.html` | Bureau, chargement des scripts et copie intégrée des données. |
| `js/app.js` | Rendu des exercices, navigation, validation et déplacement des drapeaux. |
| `js/ui.js` | Fenêtres et rétroactions explicatives. |
| `styles/styles.css` | Présentation des cinq applications. |
| `data/messages.json` | Messages, communautés Discord et courriels Outlook. |
| `assets/images/` | Arrière-plans, logos et illustration V-Bucks. |
| `blank.html` | Page locale de secours pour les liens simulés du clavardage. |

- **Messages des jeux** : modifiez `games`, notamment `user`, `text`, `phishing`, `href`, `hrefText` et le type d’`explanation`. Les textes explicatifs sont dans `js/ui.js`.
- **Discord** : modifiez `discord.communities`. Les messages définissent les zones à signaler via `phishing`. Les explications sont dans `clues` ou dans des groupes `explanations` associés aux messages.
- **Outlook** : modifiez les entrées de `outlook.emails` : objet, expéditeur, paragraphes, bouton, URL, signature, logo et quatre explications `clues`. Le champ `clueField: "intro"` place la troisième cible sur l’introduction plutôt que sur le paragraphe `threat`.
- **Données locales** : répercutez chaque modification de `data/messages.json` dans `embedded-messages` pour conserver le même contenu avec ou sans serveur.

L’application utilise HTML, CSS et JavaScript sans dépendance externe. Les interfaces Discord et Outlook peuvent nécessiter un défilement sur les petits écrans.
