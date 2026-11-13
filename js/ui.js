/* Application windows and exercise feedback. */
function openAppWindow(title, htmlContent){
  const win = document.getElementById('app-window');
  const content = document.getElementById('app-content');

  // Full reset so switching apps never keeps a previous app's background image,
  // inline background, or leftover overlays (instructions/success/alerts).
  Array.from(content.classList).forEach(cls => {
    if(cls.startsWith('bg-')) content.classList.remove(cls);
  });
  content.style.backgroundImage = '';
  win.querySelectorAll('.link-alert-overlay, .chat-url-preview').forEach(el => el.remove());

  document.getElementById('app-title').textContent = title;
  content.innerHTML = htmlContent;
  win.setAttribute('aria-hidden','false');
  document.getElementById('url-guide-button').hidden = true;
  document.getElementById('url-quiz-button').hidden = true;
  document.getElementById('official-domains-button').hidden = false;
  content.focus();
}
function showMinecraftExplanation(kind){
  const clues = {
    coins: [
      'Une promesse de 5 000 Minecoins gratuits, trop belle pour être vraie.',
      'Une demande de connexion avec votre compte Microsoft pour recevoir un cadeau.',
      'Une adresse trompeuse : microsoft.com.minecoins.net appartient au domaine minecoins.net, et non à microsoft.com. Cette offre cherche à récupérer vos identifiants sur une fausse page de connexion.'
    ],
    ban: [
      'Une menace de bannissement définitif qui fait peur.',
      'Un délai de 30 minutes qui crée un sentiment d’urgence et pousse à agir sans réfléchir.',
      'Une adresse non officielle : minecraft-verification.net tente d’imiter le site officiel minecraft.net.'
    ],
    friend: [
      'Une invitation amicale qui cherche à gagner votre confiance.',
      'Une promesse de récompenses pour vous attirer sur un serveur.',
      'Une demande de connexion Microsoft sur minecraft-serveur-secret.com, une adresse non officielle. La présence du mot « minecraft » dans une adresse ne garantit pas qu’elle est officielle.'
    ],
    skin: [
      'Une offre trop belle pour être vraie : un skin ultra rare gratuit.',
      'Une limite de 24 heures qui crée un sentiment d’urgence.',
      'Une demande d’identifiants Microsoft sur une adresse non officielle : www.minecraft.skins.net appartient au domaine skins.net, et non à minecraft.net.'
    ]
  };
  if(!['official', 'officialSupport'].includes(kind) && !clues[kind]) return;
  const existing = document.getElementById('minecraft-explanation-alert');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'minecraft-explanation-alert';
  const title = ['official', 'officialSupport'].includes(kind) ? 'Ceci est un message légitime' : "Ceci est de l'hameçonnage";
  const body = kind === 'official'
    ? '<p>Ce message partage un lien vers <strong>www.minecraft.net</strong>, le site officiel de Minecraft. Il ne demande ni identifiants ni mot de passe et ne promet aucune récompense en échange d’une connexion.</p>'
    : kind === 'officialSupport'
      ? '<p>Ce message conseille d’activer la double identification et partage un lien vers <strong>support.microsoft.com</strong>. Le domaine principal est <strong>microsoft.com</strong>, une adresse officielle de Microsoft. Il ne demande ni de transmettre un code ni de se connecter sur un site qui imite Microsoft.</p>'
    : `<p>Plusieurs indices nous indiquent qu'il s'agit d'hameçonnage :</p><ul>${clues[kind].map(clue => `<li>${escapeHtml(clue).replace(/\b(?:[a-z0-9-]+\.)+(?:com|net)\b/gi, url => `<strong>${url}</strong>`)}</li>`).join('')}</ul>`;
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="minecraft-explanation-title"><div class="title" id="minecraft-explanation-title">${title}</div><div class="body">${body}<p>Le site officiel de Minecraft est <strong>minecraft.net</strong>. Comme Minecraft appartient à Microsoft, une autre adresse officielle est <strong>microsoft.com</strong>.</p></div><div class="controls"><button class="btn primary" id="close-minecraft-explanation">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-minecraft-explanation').addEventListener('click', () => overlay.remove());
}

function showDiscordCommunityResult(community, success){
  const existing = document.getElementById('discord-community-result');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'discord-community-result';
  const title = success ? 'Bravo !' : 'Certains drapeaux sont à revoir';
  const count = community.messages.filter(message => message.phishing).length;
  const detected = count === 1 ? 'le message d’hameçonnage' : 'les messages d’hameçonnage';
  const hint = count === 1 ? '1 seul message est de l’hameçonnage' : `${count} messages sont de l’hameçonnage`;
  const renderClues = clues => `<ul>${clues.map(clue => `<li>${escapeHtml(clue).replace(/\b(?:[a-z0-9-]+\.)+(?:com|net)\b/gi, url => `<strong>${url}</strong>`)}</li>`).join('')}</ul>`;
  const explanation = community.explanations
    ? community.explanations.map(item => `<section><h3>${escapeHtml(item.title)}</h3>${renderClues(item.clues)}</section>`).join('')
    : renderClues(community.clues);
  const body = success
    ? `<p>Vous avez correctement identifié ${detected} de la communauté ${escapeHtml(community.name)}.</p>${explanation}`
    : `<p>Placez un drapeau sur chaque message suspect et retirez ceux placés sur les messages légitimes, puis réessayez.</p><p><strong>Indice :</strong> ${hint} !</p>`;
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="discord-community-result-title"><div class="title" id="discord-community-result-title">${title}</div><div class="body">${body}</div><div class="controls"><button class="btn primary">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  const close = overlay.querySelector('button');
  const previousFocus = document.activeElement;
  close.addEventListener('click', () => { overlay.remove(); previousFocus.focus(); });
  close.focus();
}

function showDiscordInstructions(){
  const existing = document.getElementById('discord-instructions-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'discord-instructions-overlay';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="discord-instructions-title"><div class="title" id="discord-instructions-title">Démineur version hameçonnage</div><div class="body"><p>Identifier les tentatives d'hameçonnage dans chaque page. Pour ce faire, placer un drapeau rouge sur le(s) message(s) d'hameçonnage 🚩</p></div><div class="controls"><button class="btn primary" id="close-discord-instructions">Commencer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-discord-instructions').addEventListener('click', () => overlay.remove());
}

function showSmsPopup(title, body, buttonText = 'Fermer'){
  const existing = document.getElementById('sms-popup');
  if(existing) existing.remove();
  const previousFocus = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'sms-popup';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="sms-popup-title"><div class="title" id="sms-popup-title">${escapeHtml(title)}</div><div class="body">${body}</div><div class="controls"><button class="btn primary">${escapeHtml(buttonText)}</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  const close = overlay.querySelector('button');
  close.addEventListener('click', () => { overlay.remove(); previousFocus.focus(); });
  close.focus();
}

function showSmsInstructions(){
  showSmsPopup('Trouver tous les indices d’hameçonnage dans chacun des SMS',
    '<p>Pour chacun des SMS, repère les indices d’hameçonnage en faisant glisser un drapeau rouge sur chacun d’entre eux. Appuie ensuite sur Valider.</p><p>Utilise les flèches en haut pour passer au SMS précédent ou suivant. Dépose un drapeau dans la corbeille pour le retirer.</p>',
    'Commencer');
}

function showSmsResult(conversation, correctCount, totalCount, incorrectFlags){
  const success = correctCount === totalCount && incorrectFlags === 0;
  const format = text => escapeHtml(text).replace(/\bTON\b/g, '<strong>TON</strong>').replace(/\b(?:[a-z0-9-]+\.)+(?:com|net)\b/gi, url => `<span class="sms-explanation-url">${url}</span>`);
  const body = success
    ? `<p>${totalCount === 1 ? 'Tu as identifié l’indice d’hameçonnage.' : 'Tu as identifié tous les indices d’hameçonnage.'}</p><p class="clues-heading"><span role="img" aria-label="Indice">🔎</span> <strong>Les indices :</strong></p><ul>${conversation.clues.map(clue => `<li>${format(clue)}</li>`).join('')}</ul>${conversation.explanationNote ? `<p>${format(conversation.explanationNote)}</p>` : ''}${conversation.additionalExplanation ? `<p class="reminder-heading"><span class="reminder-warning" role="img" aria-label="Attention">!</span> <strong>À se rappeler :</strong></p><ul>${conversation.additionalExplanation.map(text => `<li>${format(text)}</li>`).join('')}</ul>` : ''}`
    : `<p>Tu as correctement repéré <strong>${correctCount}</strong> ${correctCount === 1 ? 'indice' : 'indices'} sur ${totalCount}.</p>${incorrectFlags > 0 ? `<p><strong>${incorrectFlags}</strong> ${incorrectFlags === 1 ? 'drapeau est mal placé' : 'drapeaux sont mal placés'}.</p>` : ''}<p>Relis le SMS et ajuste tes drapeaux.</p><p><strong>Indice :</strong> ${totalCount === 1 ? 'un seul passage suspect est à identifier.' : `${totalCount} passages suspects sont à identifier.`}</p>`;
  showSmsPopup(success ? 'Bravo !' : 'Certains indices sont à revoir', body);
}

function showOutlookInstructions(){
  const existing = document.getElementById('outlook-instructions-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'outlook-instructions-overlay';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="outlook-instructions-title"><div class="title" id="outlook-instructions-title">Trouver tous les indices d'hameçonnage dans chacun des courriels</div><div class="body"><p>Pour chacun des courriels, repérez les indices d’hameçonnage en faisant glisser un drapeau rouge sur chacun d'entre-eux. Cliquez ensuite sur Valider.</p></div><div class="controls"><button class="btn primary" id="close-outlook-instructions">Commencer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-outlook-instructions').addEventListener('click', () => overlay.remove());
}

function showOutlookSuccessAlert(correctCount, totalCount, incorrectFlags = 0, email){
  const existing = document.getElementById('outlook-success-overlay');
  if(existing) existing.remove();
  const success = correctCount === totalCount && incorrectFlags === 0;
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'outlook-success-overlay';
  const title = success ? 'Bravo !' : 'Certains indices sont à revoir';
  const reminders = [...(email.additionalExplanation || [])];
  if(email.href){
    reminders.push(email.logo
      ? 'Un logo officiel peut être copié : sa présence ne prouve pas l’authenticité du courriel.'
      : 'Un nom familier ne prouve pas l’identité de l’expéditeur. Confirmez la demande avec votre ami par un autre moyen avant de vous connecter.',
      'La présence d’adresses officielles à l’intérieur du courriel ne garantit pas non plus que tout le message est légitime.',
      'Pour vérifier votre compte, ouvrez vous-même le site officiel plutôt que de suivre le bouton du courriel.');
  }

  const message = success
    ? `<p>${totalCount === 1 ? "Vous avez identifié l’indice d’hameçonnage." : "Vous avez identifié les quatre indices d’hameçonnage."}</p><p class="clues-heading"><span role="img" aria-label="Indice">🔎</span> <strong>Les indices :</strong></p><ul>${email.clues.map(clue => `<li>${escapeHtml(clue).replace(/\bTON\b/g, '<strong>TON</strong>').replace(/\b(?:[a-z0-9-]+\.)+(?:com|net|example|ca|ggmail)\b/gi, url => `<span class="outlook-explanation-url">${url}</span>`)}</li>`).join('')}</ul>${reminders.length ? `<p class="reminder-heading"><span class="reminder-warning" role="img" aria-label="Attention">!</span> <strong>À se rappeler :</strong></p><ul>${reminders.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : ''}`
    : `<p>Vous avez correctement repéré <strong>${correctCount}</strong> ${correctCount === 1 ? 'indice' : 'indices'} sur ${totalCount}.</p>${incorrectFlags > 0 ? `<p><strong>${incorrectFlags}</strong> ${incorrectFlags === 1 ? 'drapeau a été placé incorrectement' : 'drapeaux ont été placés incorrectement'}.</p>` : ''}<p>${escapeHtml(email.validationHint || 'Examinez l’objet, l’expéditeur, le texte du courriel et l’adresse du bouton, puis ajustez vos drapeaux.')} Retirez aussi les drapeaux placés en dehors des indices suspects.</p><p><strong>Indice :</strong> ${totalCount === 1 ? 'un seul élément suspect est à identifier.' : 'quatre éléments suspects sont à identifier.'}</p>`;
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="outlook-success-title"><div class="title" id="outlook-success-title">${title}</div><div class="body">${message}</div><div class="controls"><button class="btn primary">Fermer</button></div></div>`;
  const previousFocus = document.activeElement;
  document.getElementById('app-window').appendChild(overlay);
  const close = overlay.querySelector('button');
  close.addEventListener('click', () => { overlay.remove(); previousFocus.focus(); });
  close.focus();
}

function showFortniteImageAlert(){
  const existing = document.getElementById('fortnite-image-alert');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'fortnite-image-alert';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-label="Exemple de page frauduleuse V-Bucks"><img src="assets/images/apps/Vbuck-gen.png" alt="Exemple de générateur frauduleux de V-Bucks" style="max-width:100%;max-height:60vh;object-fit:contain"><div class="controls"><button class="btn primary" id="close-fortnite-image">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-fortnite-image').addEventListener('click', () => overlay.remove());
}

function showFortniteLegitAlert(){
  const existing = document.getElementById('fortnite-explanation-alert');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'fortnite-explanation-alert';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="fortnite-explanation-title"><div class="title" id="fortnite-explanation-title">Ceci est un message légitime</div><div class="body"><p>Ce message partage un lien vers <strong>www.fortnite.com</strong>, le site officiel de Fortnite. Il ne demande ni identifiants ni mot de passe et ne promet aucune récompense en échange d’une connexion.</p></div><div class="controls"><button class="btn primary" id="close-fortnite-explanation">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-fortnite-explanation').addEventListener('click', () => overlay.remove());
}

function showFortnitePhishingExplanation(kind){
  const clues = {
    vbucks: [
      'Une promesse de 5 000 V-Bucks gratuits, trop belle pour être vraie.',
      'Une demande de connexion pour recevoir une récompense.',
      'Une adresse non officielle : vbucks-cadeau.net n’est ni fortnite.com ni epicgames.com, les deux adresses officielles. Cette offre cherche à vous attirer vers une fausse page de connexion pour voler votre compte.'
    ],
    ban: [
      'Une menace de bannissement définitif qui fait peur.',
      'Un délai de 30 minutes qui crée un sentiment d’urgence et pousse à agir sans réfléchir.',
      'Une adresse trompeuse : epicgames.com.verification-compte.net appartient au domaine verification-compte.net, et non à epicgames.com. Les deux adresses officielles sont fortnite.com et epicgames.com.'
    ],
    friend: [
      'Une invitation amicale qui cherche à gagner votre confiance.',
      'Une promesse de prix pour vous inciter à rejoindre un tournoi.',
      'Une demande de connexion sur fortnite-tournoi-prive.com, une adresse non officielle. La présence du mot « fortnite » dans une adresse ne garantit pas qu’elle est officielle. Les deux adresses officielles sont fortnite.com et epicgames.com.'
    ],
    skin: [
      'Une offre de costume ultra rare gratuit pour attirer votre attention.',
      'Une limite d’une heure qui crée un sentiment d’urgence.',
      'Une demande de connexion sur fortnite.com.costumes-gratuits.net, une adresse non officielle qui cherche à récupérer vos identifiants. Le domaine principal est costumes-gratuits.net : « fortnite.com » est ici un sous-domaine trompeur. Les deux adresses officielles sont fortnite.com et epicgames.com.'
    ],
    security: [
      'Un message qui fait peur en évoquant une connexion suspecte et la perte de vos objets.',
      'Une demande de vérification immédiate du mot de passe qui crée un sentiment d’urgence.',
      'Une adresse trompeuse : security.epicgames.com.protection-joueur.net appartient au domaine protection-joueur.net, et non à epicgames.com. Les deux adresses officielles sont fortnite.com et epicgames.com.'
    ]
  };
  if(!clues[kind]) return;
  const existing = document.getElementById('fortnite-explanation-alert');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'fortnite-explanation-alert';
  const items = clues[kind].map(clue => `<li>${escapeHtml(clue).replace(/\b(?:[a-z0-9-]+\.)+(?:com|net)\b/gi, url => `<strong>${url}</strong>`)}</li>`).join('');
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="fortnite-explanation-title"><div class="title" id="fortnite-explanation-title">Ceci est de l'hameçonnage</div><div class="body"><p>Plusieurs indices nous indiquent qu'il s'agit d'hameçonnage :</p><ul>${items}</ul></div><div class="controls"><button class="btn primary" id="close-fortnite-explanation">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-fortnite-explanation').addEventListener('click', () => overlay.remove());
}

function showRobloxPhishingExplanation(kind){
  const clues = {
    robux: [
      'Une promesse de 5 000 Robux gratuits, trop belle pour être vraie.',
      'Une demande de connexion pour récupérer un cadeau.',
      'Une adresse non officielle : robux-gratuits.net n’est pas le site officiel roblox.com. Cette offre sert à vous attirer vers une fausse page de connexion pour voler votre compte.'
    ],
    friend: [
      'Une invitation amicale qui cherche à gagner votre confiance.',
      'Une demande de connexion sur un autre site pour rejoindre un jeu.',
      'Une adresse non officielle : roblox-jeu-secret.net imite Roblox. La présence du mot « roblox » dans une adresse ne garantit pas qu’elle est officielle.'
    ],
    security: [
      'Un message qui fait peur en évoquant un pirate et le vol de vos Robux.',
      'Une demande de vérification immédiate de votre mot de passe qui crée un sentiment d’urgence.',
      'Une adresse trompeuse : security.roblox.com.protection-compte.net appartient au domaine protection-compte.net, et non à roblox.com.'
    ],
    ban: [
      'Une menace de suppression définitive du compte qui fait peur.',
      'Un délai de 30 minutes qui crée un sentiment d’urgence et pousse à agir sans réfléchir.',
      'Une adresse trompeuse : roblox.com.verification-urgence.com appartient au domaine verification-urgence.com, et non à roblox.com.'
    ],
    item: [
      'Une offre d’objet ultra rare gratuit pour attirer votre attention.',
      'Une limite de 24 heures qui crée un sentiment d’urgence.',
      'Une demande de connexion sur roblox-objets-rares.com, une adresse non officielle qui cherche à récupérer vos identifiants.'
    ]
  };
  if(!clues[kind]) return;
  const existing = document.getElementById('roblox-phish-alert');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'roblox-phish-alert';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="roblox-phish-title"><div class="title" id="roblox-phish-title">Ceci est de l'hameçonnage</div><div class="body"><p>Plusieurs indices nous indiquent qu'il s'agit d'hameçonnage :</p><ul>${clues[kind].map(clue => `<li>${escapeHtml(clue).replace(/\b(?:[a-z0-9-]+\.)+(?:com|net)\b/gi, url => `<strong>${url}</strong>`)}</li>`).join('')}</ul></div><div class="controls"><button class="btn primary" id="close-roblox-alert">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-roblox-alert').addEventListener('click', () => overlay.remove());
}

function showRobloxLegitAlert(){
  const existing = document.getElementById('roblox-legit-alert');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
  const win = document.getElementById('app-window');
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'roblox-legit-alert';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true"><div class="title">Ceci est un message légitime</div><div class="body"><p>Il s'agit d'un jeu menant vers un lien officiel de <strong>roblox.com</strong></p></div><div class="controls"><button class="btn primary" id="close-roblox-legit">Fermer</button></div></div>`;
  win.appendChild(overlay);
  document.getElementById('close-roblox-legit').addEventListener('click', ()=>{
    const el = document.getElementById('roblox-legit-alert'); if(el && el.parentNode) el.parentNode.removeChild(el);
  });
}

function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showChatNoAnswerAlert(){
  const existing = document.getElementById('chat-result-overlay');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'chat-result-overlay';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="chat-result-title"><div class="title" id="chat-result-title">Aucun message catégorisé</div><div class="body"><p>Vous devez catégorisé tous les messages pour savoir lesquels sont normaux et les autres de l'hameçonnage.</p></div><div class="controls"><button class="btn primary" id="close-chat-result">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-chat-result').addEventListener('click', () => overlay.remove());
}

function showChatPartialAlert(good, total, phishingCount = 5){
  const existing = document.getElementById('chat-result-overlay');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'chat-result-overlay';
  const title = 'Certaines réponses sont à revoir';
  overlay.classList.add('chat-result');
  const message = `Vous avez correctement catégorisé <strong>${good} messages sur ${total}</strong>. Relisez les messages et ajustez vos choix avant de réessayer.`;
  const hint = `<strong>Indice:</strong> ${phishingCount} ${phishingCount === 1 ? "message est" : "messages sont"} de l’hameçonnage !`;
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="chat-result-title"><div class="title" id="chat-result-title">${title}</div><div class="body"><p>${message}</p><p>${hint}</p></div><div class="controls"><button class="btn primary" id="close-chat-result">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-chat-result').addEventListener('click', () => overlay.remove());
}

function showChatAllGoodAlert(){
  const existing = document.getElementById('chat-result-overlay');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'chat-result-overlay';
  const resultContent = '<div class="title" id="chat-result-title">Bravo !</div><div class="body"><p>Vous avez catégorisé correctement tous les messages.</p></div>';
  overlay.classList.add('chat-result');
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="chat-result-title">${resultContent}<div class="controls"><button class="btn primary" id="close-chat-result">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-chat-result').addEventListener('click', () => overlay.remove());
}

function closeAppWindow(){
  const win = document.getElementById('app-window');
  win.setAttribute('aria-hidden','true');
  document.getElementById('url-guide-button').hidden = false;
  document.getElementById('url-quiz-button').hidden = false;
  document.getElementById('official-domains-button').hidden = false;
  win.querySelectorAll('.chat-url-preview').forEach(el => el.remove());
  const content = document.getElementById('app-content');
  // remove any app-specific background classes and inline background overrides
  Array.from(content.classList).filter(cls => cls.startsWith('bg-')).forEach(cls => content.classList.remove(cls));
  content.style.backgroundImage = '';
}
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('close-window').addEventListener('click', closeAppWindow);
  document.addEventListener('keydown', e=>{
    const win = document.getElementById('app-window');
    if(e.key==='Escape' && !document.querySelector('dialog[open]') && win.getAttribute('aria-hidden')==='false') closeAppWindow();
  });
});
