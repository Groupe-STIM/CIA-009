/* Minimal UI helpers */
function openAppWindow(title, htmlContent){
  const win = document.getElementById('app-window');
  const content = document.getElementById('app-content');

  // Full reset so switching apps never keeps a previous app's background image,
  // inline background, or leftover overlays (instructions/success/alerts).
  Array.from(content.classList).forEach(cls => {
    if(cls.startsWith('bg-')) content.classList.remove(cls);
  });
  content.style.backgroundImage = '';
  win.querySelectorAll('.link-alert-overlay').forEach(el => el.remove());

  document.getElementById('app-title').textContent = title;
  content.innerHTML = htmlContent;
  win.setAttribute('aria-hidden','false');
  content.focus();
}
function showLinkAlert(){
  // remove existing if present
  closeLinkAlert();
  const win = document.getElementById('app-window');
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'link-alert-overlay';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true"><div class="title">Ceci est un lien d'hameçonnage</div><div class="body"><p>Pour la vente ou concours de jetons virtuels, vous serez toujours demandé de passer par les sites web officiel.</p><p>Un serveur Discord n'est pas un site web officiel, mais un forum de discussion en ligne.</p></div><div class="controls"><button class="btn primary" id="close-link-alert">Fermer</button></div></div>`;
  win.appendChild(overlay);
  document.getElementById('close-link-alert').addEventListener('click', closeLinkAlert);
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

function showDiscordSuccessAlert(){
  const existing = document.getElementById('discord-success-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'discord-success-overlay';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="discord-success-title"><div class="title" id="discord-success-title">Tentative d'hameçonnage trouver !</div><div class="body"><p>Bravo, vous avez bien identifié la tentative d'hameçonnage.</p><p>En aucun cas, un modérateur Roblox peut demander de valider un compte.</p><p>Ceci est un cas classique d'hameçonnage menant vers une page web pouvant être identique à la page de connexion Roblox :</p><div style="margin-top:12px;text-align:center"><img src="assets/images/apps/Login_Roblox.png" alt="Exemple de page de connexion Roblox frauduleuse" style="max-width:100%;height:auto;border-radius:6px;border:1px solid rgba(0,0,0,0.08)"></div><p>Pour repérer qu'il s'agit d'une tentative d'hameçonnage, il faut regarder attentivement le lien vers la page web.</p></div><div class="controls"><button class="btn primary" id="close-discord-success">Continuer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-discord-success').addEventListener('click', () => overlay.remove());
  return;
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="discord-success-title"><div class="title" id="discord-success-title">Tentative d'hameçonnage trouver !</div><div class="body"><p>Bravo, vous avez bien identifié la tentative d'hameçonnage.</p><p>En aucun cas, un modérateur Roblox peut demander de valider un compte.</p><p>Ceci est un cas classique d'hameçonnage menant vers une page web pour voler un compte :</p><div style="margin-top:12px;text-align:center"><img src="assets/images/apps/robux_gratuit.png" alt="Exemple de page frauduleuse Robux" style="max-width:100%;height:auto;border-radius:6px;border:1px solid rgba(0,0,0,0.08)"></div></div><div class="controls"><button class="btn primary" id="close-discord-success">Continuer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-discord-success').addEventListener('click', () => overlay.remove());
}

function showDiscordRewardsSuccessAlert(correctCount){
  const existing = document.getElementById('discord-success-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'discord-success-overlay';
  if(correctCount === 0){
    overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="discord-success-title"><div class="title" id="discord-success-title">Aucun message d'hameçonnage?</div><div class="body"><p>Vous n'avez trouvé aucun message d'hameçonnage ? Il y en a plusieurs, essayer à nouveau !</p></div><div class="controls"><button class="btn primary" id="close-discord-success">Continuer</button></div></div>`;
    document.getElementById('app-window').appendChild(overlay);
    document.getElementById('close-discord-success').addEventListener('click', () => overlay.remove());
    return;
  }
  const message = correctCount === 4
    ? `<p>Bravo, vous avez trouvé tous les messages d'hameçonnage sur la page !</p><p>Il s'agit d'un message de récompense automatisé pour chaque nouvelle personne rejoignant ce forum Roblox. Celui-ci vous partage un lien pour réclamer votre récompense, mais en réalité il s'agit d'un lien pour voler les informations de votre compte Roblox. Voilà à quoi peut ressembler un tel site web :</p><div style="margin-top:12px;text-align:center"><img src="assets/images/apps/robux_gratuit.png" alt="Exemple de page frauduleuse Robux" style="max-width:100%;height:auto;border-radius:6px;border:1px solid rgba(0,0,0,0.08)"></div>`
    : `<p>Bravo, vous avez trouvé ${correctCount} message(s) d'hameçonnage sur la page ! Continuer jusqu'à temps que vous les trouver tous.</p>`;
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="discord-success-title"><div class="title" id="discord-success-title">Tentative d'hameçonnage trouver !</div><div class="body">${message}</div><div class="controls"><button class="btn primary" id="close-discord-success">Continuer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-discord-success').addEventListener('click', () => overlay.remove());
}

function showRedditInstructions(){
  const existing = document.getElementById('reddit-instructions-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'reddit-instructions-overlay';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="reddit-instructions-title"><div class="title" id="reddit-instructions-title">Trouver les indices d'hameçonnage sur Reddit</div><div class="body"><p>Identifier les tentatives d'hameçonnage sur cette publication Reddit. Pour ce faire, placer un drapeau rouge sur chaque élément qui doit soulever un doute 🚩</p></div><div class="controls"><button class="btn primary" id="close-reddit-instructions">Commencer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-reddit-instructions').addEventListener('click', () => overlay.remove());
}

function showRedditSuccessAlert(correctCount, totalCount){
  const existing = document.getElementById('reddit-success-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'reddit-success-overlay';

  let title;
  let message;
  if(correctCount === 0){
    title = `Aucun indice d'hameçonnage?`;
    message = `<p>Vous n'avez trouvé aucun indice d'hameçonnage ? Il y en a plusieurs, essayer à nouveau !</p>`;
  } else if(correctCount < totalCount){
    title = `Indice d'hameçonnage trouver !`;
    message = `<p>Bravo, vous avez trouvé ${correctCount} indice(s) d'hameçonnage sur la page ! Continuer jusqu'à temps que vous les trouver tous.</p>`;
  } else {
    title = `Tous les indices d'hameçonnage trouver !`;
    message = `<p>Bravo, vous avez trouvé tous les indices d'hameçonnage sur cette publication Reddit !</p>` +
      `<p>Le premier indice est le titre de la publication, indiquant les mots cadeau et robux pour attirer l'attention sur une offre alléchante.</p>` +
      `<p>Le deuxième indice est le message qui suit mentionnant le tirage au sort pour courrir la chance de gagner des robux gratuitement.</p>` +
      `<p>Le troisième indice est le paragraphe qui partage le lien vers la page d'inscription. Cette page web n'est aucunement une page officielle de roblox et désire récupérer des informations associer aux comptes Roblox.</p>` +
      `<p>Le dernier indice est de vous dirigez vers un serveur Discord non-officiel de Roblox.</p>`;
  }

  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="reddit-success-title"><div class="title" id="reddit-success-title">${title}</div><div class="body">${message}</div><div class="controls"><button class="btn primary" id="close-reddit-success">Continuer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-reddit-success').addEventListener('click', () => overlay.remove());
}

function showOutlookInstructions(){
  const existing = document.getElementById('outlook-instructions-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'outlook-instructions-overlay';
  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="outlook-instructions-title"><div class="title" id="outlook-instructions-title">Trouver les indices d'hameçonnage dans Outlook</div><div class="body"><p>Identifier les tentatives d'hameçonnage dans ce courriel Outlook. Pour ce faire, placer un drapeau rouge sur chaque élément qui doit soulever un doute 🚩</p></div><div class="controls"><button class="btn primary" id="close-outlook-instructions">Commencer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-outlook-instructions').addEventListener('click', () => overlay.remove());
}

function showOutlookSuccessAlert(correctCount, totalCount){
  const existing = document.getElementById('outlook-success-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'outlook-success-overlay';

  let title;
  let message;
  if(correctCount === 0){
    title = `Aucun indice d'hameçonnage?`;
    message = `<p>Vous n'avez trouvé aucun indice d'hameçonnage ? Il y en a plusieurs, essayer à nouveau !</p>`;
  } else if(correctCount < totalCount){
    title = `Indice d'hameçonnage trouver !`;
    message = `<p>Bravo, vous avez trouvé ${correctCount} indice(s) d'hameçonnage dans le courriel ! Continuer jusqu'à temps que vous les trouver tous.</p>`;
  } else {
    title = `Tous les indices d'hameçonnage trouver !`;
    message = `<p>Bravo, vous avez trouvé tous les indices d'hameçonnage dans ce courriel Outlook !</p>` +
      `<p>Le premier indice est l'objet du courriel, qui pousse à l'action avec un ton urgent.</p>` +
      `<p>Le deuxième indice est l'expéditeur : l'adresse <strong>no-reply@roblov.com</strong> imite roblox.com mais contient une coquille (roblov).</p>` +
      `<p>Le troisième indice est le paragraphe mentionnant « Canada/Québec », une tactique pour créer un sentiment de proximité.</p>` +
      `<p>Le dernier indice est le bouton « Réinitialiser e-mail » et le lien qui suit, qui mènent vers une page non officielle de Roblox.</p>`;
  }

  overlay.innerHTML = `<div class="link-alert" role="dialog" aria-modal="true" aria-labelledby="outlook-success-title"><div class="title" id="outlook-success-title">${title}</div><div class="body">${message}</div><div class="controls"><button class="btn primary" id="close-outlook-success">Continuer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-outlook-success').addEventListener('click', () => overlay.remove());
}

function showVbucksAlert(){
  // remove existing phish alert if present
  const existing = document.getElementById('phish-alert-overlay');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
  const win = document.getElementById('app-window');
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'phish-alert-overlay';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true"><div class="title">Ceci est un lien d'hameçonnage</div><div class="body"><p>Deux indices permettent de ce mettre en garde :</p><ol><li>De la monnaie virtuelle payante (V-Bucks) pouvant être générée gratuitement</li><li>Il s'agit d'un site web non-officiel de Fortnite</li></ol><p>Voilà un exemple de page web malicieuse. Après avoir sélectionné le nombre de V-Bucks désiré, le site web demande l'identifiant de votre compte et mot de passe.</p><div style="margin-top:12px;text-align:center"><img src="assets/images/apps/Vbuck-gen.png" alt="Exemple de générateur de V-Bucks" style="max-width:100%;height:auto;border-radius:6px;border:1px solid rgba(0,0,0,0.08)"></div></div><div class="controls"><button class="btn primary" id="close-phish-alert">Fermer</button></div></div>`;
  win.appendChild(overlay);
  document.getElementById('close-phish-alert').addEventListener('click', ()=>{
    const el = document.getElementById('phish-alert-overlay'); if(el && el.parentNode) el.parentNode.removeChild(el);
  });
}
function showRobloxAlert(){
  const existing = document.getElementById('roblox-phish-alert');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
  const win = document.getElementById('app-window');
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'roblox-phish-alert';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true"><div class="title">Ceci est un lien d'hameçonnage</div><div class="body"><p>Deux indices permettent de ce mettre en garde :</p><ol><li>Une demande de tester un jeu personnel.</li><li>Un site web non-officiel.</li></ol><p>Dans ce contexte, pour valider qu'il s'agit d'un jeu officiel Roblox, le lien doit vous dirigez vers roblox.com</p></div><div class="controls"><button class="btn primary" id="close-roblox-alert">Fermer</button></div></div>`;
  win.appendChild(overlay);
  document.getElementById('close-roblox-alert').addEventListener('click', ()=>{
    const el = document.getElementById('roblox-phish-alert'); if(el && el.parentNode) el.parentNode.removeChild(el);
  });
}
function showRobloxLegitAlert(){
  const existing = document.getElementById('roblox-legit-alert');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
  const win = document.getElementById('app-window');
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'roblox-legit-alert';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true"><div class="title">Ceci est un message légitime</div><div class="body"><p>Il s'agit d'un jeu menant vers un lien officiel de roblox.com</p></div><div class="controls"><button class="btn primary" id="close-roblox-legit">Fermer</button></div></div>`;
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

function showChatPartialAlert(gameName, good, total){
  const existing = document.getElementById('chat-result-overlay');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'chat-result-overlay';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="chat-result-title"><div class="title" id="chat-result-title">Résultat de détection d'hameçonnage sur ${escapeHtml(gameName)}</div><div class="body"><p>Bravo ! Vous avez bien identifiés ${good} messages. Continuer jusqu'à toutes bien les identifiés</p></div><div class="controls"><button class="btn primary" id="close-chat-result">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-chat-result').addEventListener('click', () => overlay.remove());
}

function showChatAllGoodAlert(gameName, messagesArr){
  const existing = document.getElementById('chat-result-overlay');
  if(existing) existing.remove();
  const phishing = (messagesArr || []).filter(m => m.phishing);
  let explanation = '';
  if(phishing.length){
    explanation = '<p>Voici les messages qui étaient de l\'hameçonnage :</p><ul style="margin:6px 0;padding-left:20px">';
    phishing.forEach(m => {
      const reason = m.href
        ? `Il partageait un lien vers un site web non officiel (${escapeHtml(m.hrefText || m.href)}) dans le but de voler vos informations.`
        : 'Il tentait de vous tromper afin d\'obtenir vos informations personnelles.';
      explanation += `<li><strong>${escapeHtml(m.user)}</strong> : ${reason}</li>`;
    });
    explanation += '</ul>';
  }
  const overlay = document.createElement('div');
  overlay.className = 'link-alert-overlay';
  overlay.id = 'chat-result-overlay';
  overlay.innerHTML = `<div class="link-alert" role="alertdialog" aria-modal="true" aria-labelledby="chat-result-title"><div class="title" id="chat-result-title">Résultat de détection d'hameçonnage sur ${escapeHtml(gameName)}</div><div class="body"><p>Bravo ! Vous avez bien identifiés tous les messages !</p>${explanation}</div><div class="controls"><button class="btn primary" id="close-chat-result">Fermer</button></div></div>`;
  document.getElementById('app-window').appendChild(overlay);
  document.getElementById('close-chat-result').addEventListener('click', () => overlay.remove());
}

function closeLinkAlert(){
  const existing = document.getElementById('link-alert-overlay');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
function closeAppWindow(){
  const win = document.getElementById('app-window');
  win.setAttribute('aria-hidden','true');
  const content = document.getElementById('app-content');
  // remove any app-specific background classes and inline background overrides
  content.classList.remove('bg-minecraft','bg-fortnite','bg-roblox','bg-discord','bg-discord--rewards','bg-discord--private-message','bg-reddit');
  content.style.backgroundImage = '';
}
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('close-window').addEventListener('click', closeAppWindow);
  document.addEventListener('keydown', e=>{
    const win = document.getElementById('app-window');
    if(e.key==='Escape' && win.getAttribute('aria-hidden')==='false') closeAppWindow();
  });
});
