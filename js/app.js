// Clean app logic (moved from app-clean.js)
async function loadData(){
  // Try to fetch the canonical JSON first
  try{
    const res = await fetch('data/messages.json', { cache: 'no-store' });
    if(res && res.ok) return await res.json();
  }catch(e){/* fetch may fail on file:// in some browsers */}

  // Fallback: look for embedded JSON in the page (works on file://)
  const embedded = document.getElementById('embedded-messages');
  if(embedded){
    try{ return JSON.parse(embedded.textContent); }catch(e){}
  }

  // Final fallback: empty structure
  return { games:{}, discord:{}, reddit:{}, outlook:{} };
}

function makeMessageEl(m){
  const div = document.createElement('div');
  div.className = 'message';
  if(m.phishing) div.classList.add('phishing');
  div.innerHTML = `<div class="meta">${m.user}</div><div class="body">${m.text.replace(/\n/g,'<br>')}</div><button class="flag" data-id="${m.id}">Marquer</button>`;
  return div;
}

function renderChatPreview(app, messages){
  const preview = document.createElement('div');
  preview.className = 'chat-preview';
  preview.innerHTML = `<div class="help">Aperçu du chat — cliquez pour ouvrir et trier les messages</div>`;
  const feed = document.createElement('div'); feed.className='chat-feed';
  messages.slice(0,4).forEach(m=>feed.appendChild(makeMessageEl(m)));
  preview.appendChild(feed);
  const openBtn = document.createElement('button'); openBtn.className='btn primary'; openBtn.textContent='Ouvrir le chat';
  openBtn.addEventListener('click', ()=>openChatFull(app,messages));
  preview.appendChild(openBtn);
  return preview.outerHTML;
}

function openChatFull(app, messages){
  if(app === 'minecraft' || app === 'roblox'){
    const winTitle = app === 'roblox' ? 'Roblox' : 'Minecraft';
    openAppWindow(winTitle, `<div></div>`);
    const content = document.getElementById('app-content');
    content.classList.add(app === 'roblox' ? 'bg-roblox' : 'bg-minecraft');
    return;
  }
  const html = `<div><div class="help">Trier les messages: cliquez sur un message puis choisissez "Phishing" ou "Normal".</div><div id="full-feed" class="chat-feed"></div><div class="controls"><button id="check-btn" class="btn primary">Vérifier</button><button id="close-btn" class="btn">Fermer</button></div></div>`;
  openAppWindow(app+' — Chat', html);
  const feed = document.getElementById('full-feed');
  messages.forEach(m=> feed.appendChild(makeMessageEl(m)));
  document.getElementById('close-btn').addEventListener('click', closeAppWindow);
  document.getElementById('check-btn').addEventListener('click', ()=>{
    openAppWindow('Résultat', `<div class="help">Vérification terminée.</div><div class="controls"><button class="btn" onclick="closeAppWindow()">Fermer</button></div>`);
  });
}

// Checks the per-message answers in the expanded chat and shows the matching
// result popup. Each .mc-message carries data-phishing (1 = phishing).
function checkChatAnswers(gameName, messagesArr){
  const chat = document.querySelector('.mc-chat');
  if(!chat) return;
  const msgs = chat.querySelectorAll('.mc-message');
  let categorized = 0, good = 0;
  msgs.forEach(div => {
    const isPhishing = div.dataset.phishing === '1';
    const checked = div.querySelector('input[type="radio"]:checked');
    if(checked){
      categorized++;
      if((checked.value === 'phishing') === isPhishing) good++;
    }
  });
  const total = msgs.length;
  if(categorized === 0){
    if(typeof showChatNoAnswerAlert === 'function') showChatNoAnswerAlert();
    return;
  }
  if(good === total){
    if(typeof showChatAllGoodAlert === 'function') showChatAllGoodAlert(gameName, messagesArr);
  } else {
    if(typeof showChatPartialAlert === 'function') showChatPartialAlert(gameName, good, total);
  }
}

function addDiscordHotspots(content, hotspots){
  const buttons = hotspots.map(({ name, area, onClick }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'discord-hotspot';
    button.setAttribute('aria-label', name);
    button.style.left = area.left;
    button.style.top = area.top;
    button.style.width = area.width;
    button.style.height = area.height;
    button.addEventListener('click', () => {
      buttons.forEach(item => item.remove());
      onClick();
    });
    content.appendChild(button);
    return button;
  });
}

// Generic flag tools: draggable 🚩 source, 🗑️ trash and "Envoyer" validation button.
// config: { sourcePos, trashPos, reportPos, reportClass, onSubmit(correctCount, targets) }
function addFlagTools(content, config){
  if(content.querySelector('.discord-flag-source')) return;

  const trash = document.createElement('div');
  trash.className = 'discord-trash-target';
  trash.textContent = '🗑️';
  trash.setAttribute('role', 'img');
  trash.setAttribute('aria-label', 'Corbeille : déposez un drapeau ici pour le supprimer');
  trash.title = 'Déposez un drapeau ici pour le supprimer';
  content.appendChild(trash);

  const reportButton = document.createElement('button');
  reportButton.type = 'button';
  reportButton.className = config.reportClass;
  reportButton.textContent = 'Envoyer';
  reportButton.setAttribute('aria-label', 'Envoyer');
  reportButton.addEventListener('click', () => {
    const targets = Array.from(content.querySelectorAll('.discord-phishing-target'));
    if(!targets.length) return;
    const flags = Array.from(content.querySelectorAll('.discord-draggable-flag'));
    const correctCount = targets.filter(target => {
      const targetBounds = target.getBoundingClientRect();
      return flags.some(flag => {
        const bounds = flag.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        return centerX >= targetBounds.left && centerX <= targetBounds.right && centerY >= targetBounds.top && centerY <= targetBounds.bottom;
      });
    }).length;
    config.onSubmit(correctCount, targets);
  });
  content.appendChild(reportButton);

  const source = document.createElement('button');
  source.type = 'button';
  source.className = 'discord-flag-source';
  source.textContent = '🚩';
  source.setAttribute('aria-label', 'Créer un drapeau rouge à placer');
  source.title = 'Cliquez pour créer un drapeau, puis faites-le glisser';
  source.addEventListener('click', () => {
    const flag = document.createElement('span');
    flag.className = 'discord-draggable-flag';
    flag.textContent = '🚩';
    flag.setAttribute('role', 'img');
    flag.setAttribute('aria-label', 'Drapeau rouge déplaçable');
    const sourceBounds = source.getBoundingClientRect();
    const contentBounds = content.getBoundingClientRect();
    Object.assign(flag.style, {
      left: `${sourceBounds.left - contentBounds.left}px`,
      top: `${sourceBounds.top - contentBounds.top}px`
    });

    flag.addEventListener('pointerdown', event => {
      event.preventDefault();
      const bounds = content.getBoundingClientRect();
      const moveFlag = moveEvent => {
        const x = Math.max(0, Math.min(bounds.width - flag.offsetWidth, moveEvent.clientX - bounds.left - flag.offsetWidth / 2));
        const y = Math.max(0, Math.min(bounds.height - flag.offsetHeight, moveEvent.clientY - bounds.top - flag.offsetHeight / 2));
        flag.style.left = `${(x / bounds.width) * 100}%`;
        flag.style.top = `${(y / bounds.height) * 100}%`;
      };
      flag.setPointerCapture(event.pointerId);
      flag.addEventListener('pointermove', moveFlag);
      flag.addEventListener('pointerup', () => {
        flag.removeEventListener('pointermove', moveFlag);
        const flagBounds = flag.getBoundingClientRect();
        const trashBounds = trash.getBoundingClientRect();
        const overlapsTrash = flagBounds.left < trashBounds.right && flagBounds.right > trashBounds.left && flagBounds.top < trashBounds.bottom && flagBounds.bottom > trashBounds.top;
        if(overlapsTrash) flag.remove();
      }, { once: true });
      moveFlag(event);
    });
    content.appendChild(flag);
  });
  content.appendChild(source);

  if(config.imageAnchors){
    // Positionne les outils par rapport à l'image de fond (mode "cover" centré).
    // Les outils sont regroupés dans une rangée flexible afin que la distance
    // entre chaque outil reste identique, peu importe leur taille respective.
    const { imageWidth, imageHeight, x, y, gap } = config.imageAnchors;
    const row = document.createElement('div');
    Object.assign(row.style, {
      position: 'absolute',
      zIndex: '3',
      display: 'flex',
      alignItems: 'center',
      gap: `${gap != null ? gap : 24}px`,
      pointerEvents: 'none',
      transform: 'translateY(-50%)'
    });
    [reportButton, source, trash].forEach(el => {
      el.style.position = 'relative';
      el.style.left = '';
      el.style.top = '';
      el.style.transform = '';
      el.style.pointerEvents = 'auto';
      row.appendChild(el);
    });
    content.appendChild(row);
    const positionTools = () => {
      const scale = Math.max(content.clientWidth / imageWidth, content.clientHeight / imageHeight);
      const offsetX = (content.clientWidth - imageWidth * scale) / 2;
      const offsetY = (content.clientHeight - imageHeight * scale) / 2;
      row.style.left = `${offsetX + x * scale}px`;
      row.style.top = `${offsetY + y * scale}px`;
    };
    positionTools();
    new ResizeObserver(positionTools).observe(content);
  } else {
    Object.assign(trash.style, config.trashPos);
    Object.assign(reportButton.style, config.reportPos);
    Object.assign(source.style, config.sourcePos);
  }
}

function addDiscordFlagTools(content){
  addFlagTools(content, {
    sourcePos: { left: '6%', top: '70%' },
    trashPos: { left: '6%', top: '81%' },
    reportPos: { left: '12%', top: '74%' },
    reportClass: 'discord-report-button',
    onSubmit: (correctCount, targets) => {
      if(targets[0].dataset.targetScreen === 'rewards') showDiscordRewardsSuccessAlert(correctCount);
      else if(correctCount) showDiscordSuccessAlert();
    }
  });
}

function addRedditFlagTools(content, config){
  addFlagTools(content, {
    imageAnchors: {
      imageWidth: (config && config.width) || 1433,
      imageHeight: (config && config.height) || 1098,
      // Rangée placée à droite du bouton « Partager » (bord gauche à x=690),
      // de gauche à droite : Envoyer, Drapeau, Corbeille — espacement égal (gap).
      x: 690,
      y: 921,
      gap: 26
    },
    reportClass: 'reddit-report-button',
    onSubmit: (correctCount, targets) => showRedditSuccessAlert(correctCount, targets.length)
  });
}

function addOutlookFlagTools(content, config){
  const trash = document.createElement('div');
  trash.className = 'outlook-trash-target';
  trash.textContent = '🗑️';
  trash.setAttribute('role', 'img');
  trash.setAttribute('aria-label', 'Corbeille : déposez un drapeau ici pour le supprimer');
  trash.title = 'Déposez un drapeau ici pour le supprimer';

  const reportButton = document.createElement('button');
  reportButton.type = 'button';
  reportButton.className = 'outlook-report-button';
  reportButton.textContent = 'Envoyer';
  reportButton.setAttribute('aria-label', 'Envoyer');
  reportButton.addEventListener('click', () => {
    const targets = Array.from(content.querySelectorAll('.discord-phishing-target'));
    if(!targets.length) return;
    const flags = Array.from(content.querySelectorAll('.discord-draggable-flag'));
    const correctCount = targets.filter(target => {
      const targetBounds = target.getBoundingClientRect();
      return flags.some(flag => {
        const bounds = flag.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        return centerX >= targetBounds.left && centerX <= targetBounds.right && centerY >= targetBounds.top && centerY <= targetBounds.bottom;
      });
    }).length;
    config.onSubmit(correctCount, targets);
  });

  const source = document.createElement('button');
  source.type = 'button';
  source.className = 'outlook-flag-source';
  source.textContent = '🚩';
  source.setAttribute('aria-label', 'Créer un drapeau rouge à placer');
  source.title = 'Cliquez pour créer un drapeau, puis faites-le glisser';
  source.addEventListener('click', () => {
    const flag = document.createElement('span');
    flag.className = 'discord-draggable-flag';
    flag.textContent = '🚩';
    flag.setAttribute('role', 'img');
    flag.setAttribute('aria-label', 'Drapeau rouge déplaçable');
    const sourceBounds = source.getBoundingClientRect();
    const contentBounds = content.getBoundingClientRect();
    Object.assign(flag.style, {
      left: `${sourceBounds.left - contentBounds.left}px`,
      top: `${sourceBounds.top - contentBounds.top}px`
    });

    flag.addEventListener('pointerdown', event => {
      event.preventDefault();
      const bounds = content.getBoundingClientRect();
      const moveFlag = moveEvent => {
        const x = Math.max(0, Math.min(bounds.width - flag.offsetWidth, moveEvent.clientX - bounds.left - flag.offsetWidth / 2));
        const y = Math.max(0, Math.min(bounds.height - flag.offsetHeight, moveEvent.clientY - bounds.top - flag.offsetHeight / 2));
        flag.style.left = `${(x / bounds.width) * 100}%`;
        flag.style.top = `${(y / bounds.height) * 100}%`;
      };
      flag.setPointerCapture(event.pointerId);
      flag.addEventListener('pointermove', moveFlag);
      flag.addEventListener('pointerup', () => {
        flag.removeEventListener('pointermove', moveFlag);
        const flagBounds = flag.getBoundingClientRect();
        const trashBounds = trash.getBoundingClientRect();
        const overlapsTrash = flagBounds.left < trashBounds.right && flagBounds.right > trashBounds.left && flagBounds.top < trashBounds.bottom && flagBounds.bottom > trashBounds.top;
        if(overlapsTrash) flag.remove();
      }, { once: true });
      moveFlag(event);
    });
    content.appendChild(flag);
  });

  // Layout: red flag 🚩 and trash 🗑️ on the same row, separated by a gap G.
  // The green "Envoyer" button sits below, at the same vertical distance G
  // from the icons row (so vertical distance == horizontal distance).
  const G = (config && config.gap) || 64;
  const col = document.createElement('div');
  Object.assign(col.style, {
    position: 'absolute',
    zIndex: '3',
    right: '6%',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: `${G}px`,
    pointerEvents: 'none'
  });
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: `${G}px`,
    pointerEvents: 'none'
  });
  [source, trash].forEach(el => {
    el.style.pointerEvents = 'auto';
    row.appendChild(el);
  });
  reportButton.style.pointerEvents = 'auto';
  col.appendChild(row);
  col.appendChild(reportButton);
  content.appendChild(col);
}

function addPhishingTargets(content, imageWidth, imageHeight, boxes, targetScreen){
  const targets = boxes.map(() => {
    const target = document.createElement('div');
    target.className = 'discord-phishing-target';
    target.dataset.targetScreen = targetScreen;
    content.appendChild(target);
    return target;
  });
  const positionTargets = () => {
    const scale = Math.max(content.clientWidth / imageWidth, content.clientHeight / imageHeight);
    const offsetX = (content.clientWidth - imageWidth * scale) / 2;
    const offsetY = (content.clientHeight - imageHeight * scale) / 2;
    targets.forEach((target, index) => {
      const [x, y, width, height] = boxes[index];
      Object.assign(target.style, {
        left: `${offsetX + x * scale}px`, top: `${offsetY + y * scale}px`,
        width: `${width * scale}px`, height: `${height * scale}px`
      });
    });
  };
  positionTargets();
  new ResizeObserver(positionTargets).observe(content);
}

// Screen-relative variant: boxes are [xPct, yPct, wPct, hPct] expressed as a
// percentage of the content (screen) dimensions, so the overlays stay pinned
// to the screen regardless of how the background image is positioned/scaled.
function addScreenRelativeTargets(content, boxes, targetScreen){
  const targets = boxes.map(() => {
    const target = document.createElement('div');
    target.className = 'discord-phishing-target';
    target.dataset.targetScreen = targetScreen;
    content.appendChild(target);
    return target;
  });
  const positionTargets = () => {
    const W = content.clientWidth, H = content.clientHeight;
    targets.forEach((target, index) => {
      const [x, y, w, h] = boxes[index];
      Object.assign(target.style, {
        left: `${(x / 100) * W}px`,
        top: `${(y / 100) * H}px`,
        width: `${(w / 100) * W}px`,
        height: `${(h / 100) * H}px`
      });
    });
  };
  positionTargets();
  new ResizeObserver(positionTargets).observe(content);
}

function clearPlacedDiscordFlags(content){
  content.querySelectorAll('.discord-draggable-flag').forEach(flag => flag.remove());
}

function showDiscordStart(content){
  clearPlacedDiscordFlags(content);
  content.querySelectorAll('.discord-phishing-target').forEach(element => element.remove());
  content.classList.remove('bg-discord--rewards', 'bg-discord--private-message');
  content.classList.add('bg-discord');
  content.style.backgroundImage = '';
  addDiscordHotspots(content, [
    {
      name: 'Ouvrir le salon #récompenses', area: { left: '5%', top: '44%', width: '35%', height: '9%' },
      onClick: () => showDiscordRewards(content)
    },
    {
      name: 'Ouvrir les messages privés Discord', area: { left: '0', top: '3%', width: '10%', height: '12%' },
      onClick: () => showDiscordPrivateMessage(content)
    }
  ]);
  addDiscordFlagTools(content);
}

function showDiscordRewards(content){
  clearPlacedDiscordFlags(content);
  content.querySelectorAll('.discord-phishing-target').forEach(element => element.remove());
  content.classList.remove('bg-discord--private-message');
  content.classList.add('bg-discord--rewards');
  content.style.backgroundImage = "url('assets/images/apps/Roblox_message_auto.png')";
  addPhishingTargets(content, 1903, 1017, [
    [669, 202, 635, 130],
    [669, 344, 731, 166],
    [669, 524, 679, 166],
    [669, 715, 570, 167]
  ], 'rewards');
  addDiscordHotspots(content, [{
    name: 'Ouvrir le salon #clips-vidéos-et-moments-forts', area: { left: '5%', top: '39%', width: '35%', height: '9%' },
    onClick: () => showDiscordStart(content)
  }, {
    name: 'Ouvrir les messages privés Discord', area: { left: '0', top: '3%', width: '10%', height: '12%' },
    onClick: () => showDiscordPrivateMessage(content)
  }]);
}

function showDiscordPrivateMessage(content){
  clearPlacedDiscordFlags(content);
  content.querySelectorAll('.discord-phishing-target').forEach(element => element.remove());
  content.classList.remove('bg-discord--rewards');
  content.classList.add('bg-discord--private-message');
  content.style.backgroundImage = "url('assets/images/apps/Discord_message_privee.png')";
  const target = document.createElement('div');
  target.className = 'discord-phishing-target';
  target.dataset.targetScreen = 'private';
  target.setAttribute('aria-label', 'Message d’AnonymeGentil à identifier');
  content.appendChild(target);
  const positionTarget = () => {
    const scale = Math.max(content.clientWidth / 1716, content.clientHeight / 916);
    const offsetY = (content.clientHeight - 916 * scale) / 2;
    Object.assign(target.style, {
      left: `${523 * scale}px`, top: `${offsetY + 500 * scale}px`,
      width: `${735 * scale}px`, height: `${225 * scale}px`
    });
  };
  positionTarget();
  new ResizeObserver(positionTarget).observe(content);
  addDiscordHotspots(content, [{
    name: 'Ouvrir le serveur CéR', area: { left: '0', top: '10%', width: '6%', height: '10%' },
    onClick: () => showDiscordStart(content)
  }]);
}

function renderDiscord(data){
  openAppWindow('Discord', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.remove('bg-minecraft','bg-fortnite','bg-roblox','bg-discord','bg-discord--rewards','bg-discord--private-message','bg-reddit');
  showDiscordStart(content);
  showDiscordInstructions();
}

function renderReddit(data){
  openAppWindow('Reddit', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.remove('bg-minecraft','bg-fortnite','bg-roblox','bg-discord','bg-discord--rewards','bg-discord--private-message','bg-reddit');
  content.classList.add('bg-reddit');
  content.style.backgroundImage = '';

  // Point-and-click configuration (background image + target zones), with safe defaults
  const config = (data && data.image && data.boxes) ? data : {
    image: 'assets/images/apps/Reddit_background_image.png',
    width: 1433,
    height: 1098,
    boxes: [
      [90, 212, 800, 84],     // Indice 1 : titre « [CADEAU] ROBUX À GAGNER »
      [92, 338, 1300, 112],   // Indice 2 : les deux premières lignes du message (tirage au sort)
      [92, 626, 1256, 124],   // Indice 3 : paragraphe avec le lien d'inscription scoplidrop.com
      [92, 770, 1256, 88]     // Indice 4 : dernier paragraphe avec le lien vers le serveur Discord
    ]
  };
  addPhishingTargets(content, config.width || 1433, config.height || 1098, config.boxes, 'reddit');
  addRedditFlagTools(content, config);
  showRedditInstructions();
}

function renderOutlook(data){
  openAppWindow('Outlook', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.remove('bg-minecraft','bg-fortnite','bg-roblox','bg-discord','bg-discord--rewards','bg-discord--private-message','bg-reddit');
  content.classList.add('bg-outlook');
  content.style.backgroundImage = '';

  // Point-and-click configuration (background image + target zones), with safe
  // defaults. Boxes are [xPct, yPct, wPct, hPct] relative to the screen dimensions.
  const config = (data && data.image && data.boxes) ? data : {
    image: 'assets/images/apps/Outlook_Background.png',
    boxes: [
      [1.47, 15.11, 26.41, 4.14],   // Indice 1 : objet du courriel
      [7.13, 25.67, 14.00, 6.63],   // Indice 2 : expéditeur / destinataire
      [7.13, 41.41, 49.14, 6.63],   // Indice 3 : paragraphe « Canada/Québec »
      [7.13, 50.52, 49.14, 12.84]   // Indice 4 : « veuillez le réinitialiser via » + bouton
    ]
  };
  addScreenRelativeTargets(content, config.boxes, 'outlook');
  addOutlookFlagTools(content, {
    gap: 64,
    onSubmit: (correctCount, targets) => showOutlookSuccessAlert(correctCount, targets.length)
  });
  showOutlookInstructions();
}

window.addEventListener('DOMContentLoaded', ()=>{
  const icons = document.querySelectorAll('.icon');
  icons.forEach(btn=> btn.addEventListener('click', async ()=>{
    const data = await loadData();
    const app = btn.dataset.app;
    if(app === 'minecraft' || app === 'fortnite' || app === 'roblox'){
        const isFortnite = app === 'fortnite';
        const isRoblox = app === 'roblox';
        const title = isRoblox ? 'Roblox' : (isFortnite ? 'Fortnite' : 'Minecraft');
        const bgClass = isRoblox ? 'bg-roblox' : (isFortnite ? 'bg-fortnite' : 'bg-minecraft');

      // Load messages from data.games so Minecraft and Fortnite are independent and editable via messages.json
      const messagesArr = (data && data.games && data.games[app]) ? data.games[app] : [];

      function buildChatHtml(messagesArr){
        let html = '<div style="position:relative;width:100%;height:100%"><div class="mc-chat" role="log" aria-label="'+title+' chat" tabindex="0">';
        messagesArr.forEach((m, idx)=>{
          const namePrefix = isFortnite ? 'ft-' : 'mc-';
          // Build the visible text while avoiding duplicate link text: if the message text
          // already contains the hrefText, replace that substring with a span. Otherwise
          // append the span after the text. This ensures a single visible occurrence.
          let displayText = m.text || '';
          if(m.href){
            const hrefText = m.hrefText || m.href;
            if(displayText.includes(hrefText)){
              displayText = displayText.replace(hrefText, '<span class="mc-discord-text" data-href="'+m.href+'">'+hrefText+'</span>');
            } else {
              displayText = displayText + ' <span class="mc-discord-text" data-href="'+m.href+'">'+hrefText+'</span>';
            }
          }

          html += '<div class="mc-message" data-phishing="'+(m.phishing ? 1 : 0)+'">';
          html += '<div class="mc-left"><span class="user">'+(m.user||'')+'</span> <span class="text">'+displayText+'</span></div>';
          html += '<div class="mc-right">';
          html += '<div class="mc-ask">QUEL TYPE DE MESSAGE ?</div>';
          html += '<label class="mc-yes"><input type="radio" name="'+namePrefix+'type-'+idx+'" value="normal"><span class="mc-emoji">✅</span><span class="mc-label">Normal</span></label>';
          html += '<label class="mc-no"><input type="radio" name="'+namePrefix+'type-'+idx+'" value="phishing"><span class="mc-emoji">❌</span><span class="mc-label">Hameçonnage</span></label>';
          html += '</div></div>';
        });
        html += '<button type="button" class="mc-send-btn" id="mc-send-btn">Envoyer</button>';
        html += '</div></div>';
        return html;
      }

      const chatHtml = buildChatHtml(messagesArr);
      openAppWindow(title, chatHtml);
      const content = document.getElementById('app-content');
      content.classList.remove('bg-minecraft','bg-fortnite','bg-roblox','bg-discord','bg-discord--rewards','bg-discord--private-message','bg-reddit');
      content.classList.add(bgClass);

      function convertSpansToAnchors(container){
        const spans = Array.from(container.querySelectorAll('.mc-discord-text'));
        spans.forEach(s=>{
          const href = s.getAttribute('data-href');
          const a = document.createElement('a');
          a.className = 'mc-discord-link';
          a.href = 'blank.html';
          a.setAttribute('data-real-href', href);
          a.textContent = s.textContent;
          s.parentNode.replaceChild(a, s);
        });
      }
      function convertAnchorsToSpans(container){
        const anchors = Array.from(container.querySelectorAll('.mc-discord-link'));
        anchors.forEach(a=>{
          const span = document.createElement('span');
          span.className = 'mc-discord-text';
          span.setAttribute('data-href', a.getAttribute('data-real-href') || '');
          span.textContent = a.textContent;
          a.parentNode.replaceChild(span, a);
        });
      }

      const chat = document.querySelector('.mc-chat');
      if(chat){
        chat.addEventListener('click', e=>{
          const a = e.target.closest('a');
          if(a){
            const href = a.getAttribute('data-real-href') || a.getAttribute('href') || '';
            if(href.includes('discord.gg')){
              e.preventDefault();
              if(typeof showLinkAlert === 'function') showLinkAlert();
              return;
            }
            if(href.includes('freevbucks.lol')){
              e.preventDefault();
              if(typeof showVbucksAlert === 'function') showVbucksAlert();
              return;
            }
            if(href.includes('roblox-zombie.net')){
              e.preventDefault();
              if(typeof showRobloxAlert === 'function') showRobloxAlert();
              return;
            }
            if(href.includes('roblox.com/tower-of-hell') || href.includes('roblox.com/tower-of-hell/')){
              e.preventDefault();
              if(typeof showRobloxLegitAlert === 'function') showRobloxLegitAlert();
              return;
            }
            return;
          }
          if(e.target.closest('.mc-right') || e.target.closest('.mc-send-btn')) return;
          const expanding = !chat.classList.contains('mc-chat--expanded');
          chat.classList.toggle('mc-chat--expanded');
          if(expanding){
            convertSpansToAnchors(chat);
            chat.focus();
            chat.scrollTop = 0;
          } else convertAnchorsToSpans(chat);
        });
      }

      const sendBtn = document.getElementById('mc-send-btn');
      if(sendBtn){
        sendBtn.addEventListener('click', () => checkChatAnswers(title, messagesArr));
      }
    } else if(app==='discord') renderDiscord(data.discord);
    else if(app==='reddit') renderReddit(data.reddit);
    else if(app==='outlook') renderOutlook(data.outlook);
  }));
});