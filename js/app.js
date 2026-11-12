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
  return { games:{}, discord:{}, outlook:{}, sms:{} };
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
    if(['Roblox', 'Fortnite', 'Minecraft'].includes(gameName)) completeGameChat(chat, gameName, messagesArr);
    if(typeof showChatAllGoodAlert === 'function') showChatAllGoodAlert();
  } else {
    if(typeof showChatPartialAlert === 'function') showChatPartialAlert(good, total);
  }
}

function completeGameChat(chat, gameName, messagesArr){
  chat.dataset.completed = 'true';
  chat.querySelectorAll('.mc-message').forEach((message, index) => {
    const right = message.querySelector('.mc-right');
    right.replaceChildren();
    const label = document.createElement('span');
    label.className = 'mc-result-label';
    const isPhishing = message.dataset.phishing === '1';
    const category = isPhishing ? 'Hameçonnage' : 'Normal';
    const emoji = document.createElement('span');
    emoji.className = 'mc-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = isPhishing ? '❌' : '✅';
    label.append(emoji, document.createTextNode(' ' + category));
    right.appendChild(label);
    const data = messagesArr && messagesArr[index];
    const explanation = gameName === 'Fortnite'
      ? (data && data.explanation === 'official' ? showFortniteLegitAlert
        : data && data.explanation ? () => showFortnitePhishingExplanation(data.explanation) : null)
      : gameName === 'Roblox'
      ? (data && data.explanation ? () => showRobloxPhishingExplanation(data.explanation)
        : data && data.id === 26 ? showRobloxLegitAlert : null)
      : gameName === 'Minecraft' && data && data.explanation
        ? () => showMinecraftExplanation(data.explanation) : null;
    if(explanation){
      const help = document.createElement('button');
      help.type = 'button';
      help.className = 'mc-result-help';
      help.textContent = '?';
      help.setAttribute('aria-label', `Pourquoi le message ${index + 1} est-il ${category.toLowerCase()} ?`);
      help.addEventListener('click', explanation);
      right.appendChild(help);
    }
  });
  chat.querySelectorAll('.mc-discord-link').forEach(link => {
    if(gameName === 'Fortnite' && link.getAttribute('data-real-href') === 'https://vbucks-cadeau.net') return;
    const text = document.createElement('span');
    text.className = 'mc-completed-link';
    text.setAttribute('data-href', link.getAttribute('data-real-href') || '');
    text.tabIndex = 0;
    text.textContent = link.textContent;
    link.replaceWith(text);
  });
  const sendButton = chat.querySelector('.mc-send-btn');
  if(sendButton) sendButton.remove();
}

function addChatUrlPreview(chat){
  const win = document.getElementById('app-window');
  const preview = document.createElement('div');
  preview.id = 'chat-url-preview';
  preview.className = 'chat-url-preview';
  preview.setAttribute('role', 'tooltip');
  preview.hidden = true;
  win.appendChild(preview);
  let activeLink = null;
  const hide = () => {
    preview.hidden = true;
    if(activeLink) activeLink.removeAttribute('aria-describedby');
    activeLink = null;
  };
  const findLink = target => target.closest('.mc-discord-link, .mc-discord-text, .mc-completed-link');
  const show = link => {
    const href = link.getAttribute('data-real-href') || link.getAttribute('data-href');
    if(!href) return;
    hide();
    activeLink = link;
    preview.textContent = href;
    preview.hidden = false;
    link.setAttribute('aria-describedby', preview.id);
    const bounds = link.getBoundingClientRect();
    const windowBounds = win.getBoundingClientRect();
    const left = Math.max(12, Math.min(bounds.left - windowBounds.left, win.clientWidth - preview.offsetWidth - 12));
    const above = bounds.top - windowBounds.top - preview.offsetHeight - 8;
    const top = above >= 12 ? above : Math.min(bounds.bottom - windowBounds.top + 8, win.clientHeight - preview.offsetHeight - 12);
    preview.style.left = `${left}px`;
    preview.style.top = `${Math.max(12, top)}px`;
  };
  chat.querySelectorAll('.mc-discord-text').forEach(link => { link.tabIndex = 0; });
  chat.addEventListener('pointerover', event => {
    const link = findLink(event.target);
    if(link) show(link);
  });
  chat.addEventListener('pointerout', event => {
    if(activeLink && !activeLink.contains(event.relatedTarget)) hide();
  });
  chat.addEventListener('focusin', event => {
    const link = findLink(event.target);
    if(link) show(link);
  });
  chat.addEventListener('focusout', hide);
  chat.addEventListener('scroll', hide);
  chat.addEventListener('click', hide);
}

// Generic flag tools: draggable 🚩 source, 🗑️ trash and "Valider" validation button.
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
  reportButton.textContent = 'Valider';
  reportButton.setAttribute('aria-label', 'Valider');
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
  source.title = 'Faites glisser le drapeau sur un message';
  source.style.touchAction = 'none';
  const createFlag = initialEvent => {
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

    const startDrag = event => {
      if(event.button !== 0) return;
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
      const cleanup = () => {
        flag.removeEventListener('pointermove', moveFlag);
        flag.removeEventListener('pointerup', finishDrag);
        flag.removeEventListener('pointercancel', cancelDrag);
      };
      const cancelDrag = () => {
        cleanup();
        if(initialEvent) flag.remove();
      };
      const finishDrag = () => {
        cleanup();
        const flagBounds = flag.getBoundingClientRect();
        const trashBounds = trash.getBoundingClientRect();
        const overlapsTrash = flagBounds.left < trashBounds.right && flagBounds.right > trashBounds.left && flagBounds.top < trashBounds.bottom && flagBounds.bottom > trashBounds.top;
        if(overlapsTrash) flag.remove();
      };
      flag.addEventListener('pointerup', finishDrag);
      flag.addEventListener('pointercancel', cancelDrag);
      moveFlag(event);
    };
    flag.addEventListener('pointerdown', startDrag);
    content.appendChild(flag);
    if(initialEvent) startDrag(initialEvent);
  };
  source.addEventListener('pointerdown', event => {
    if(event.button === 0) createFlag(event);
  });
  source.addEventListener('click', event => {
    if(event.detail === 0) createFlag();
  });
  content.appendChild(source);

  Object.assign(trash.style, config.trashPos);
  Object.assign(reportButton.style, config.reportPos);
  Object.assign(source.style, config.sourcePos);
}

function renderDiscord(data){
  openAppWindow('Discord', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.add('bg-discord-communities');
  const communities = data.communities;
  const views = new Map();
  const showCommunity = key => {
    if(!views.has(key)){
      const community = communities[key];
      const stage = document.createElement('section');
      stage.className = 'discord-community-stage';
      stage.setAttribute('aria-label', `Communauté ${community.name}`);
      const heading = document.createElement('div');
      heading.className = 'discord-community-heading';
      heading.textContent = `Communauté ${community.name}`;
      stage.appendChild(heading);
      const select = document.createElement('select');
      select.className = 'discord-community-select';
      select.setAttribute('aria-label', 'Changer de communauté');
      Object.entries(communities).forEach(([value, item]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = `Communauté ${item.name}`;
        select.appendChild(option);
      });
      select.value = key;
      select.addEventListener('change', () => showCommunity(select.value));
      stage.appendChild(select);
      const feed = document.createElement('div');
      feed.className = 'discord-community-feed';
      feed.innerHTML = '<h2># général</h2>';
      community.messages.forEach(message => {
        const row = document.createElement('article');
        row.className = 'discord-community-message';
        const author = document.createElement('strong');
        author.textContent = message.user;
        const text = document.createElement('p');
        text.textContent = message.text;
        row.append(author, text);
        if(message.href){
          const url = document.createElement('span');
          url.className = 'discord-community-url';
          url.textContent = message.href;
          row.appendChild(url);
        }
        if(message.phishing){
          const target = document.createElement('div');
          target.className = 'discord-phishing-target';
          Object.assign(target.style, { inset: '0' });
          row.appendChild(target);
        }
        feed.appendChild(row);
      });
      stage.appendChild(feed);
      const channels = document.createElement('div');
      channels.className = 'discord-community-channels';
      channels.innerHTML = '<p>Salons textuels</p><strong># général</strong><p>🚩 Faites glisser le drapeau directement sur le message suspect.</p><p>🗑️ Déposez un drapeau dans la corbeille pour le retirer.</p>';
      stage.appendChild(channels);
      addFlagTools(stage, {
        sourcePos: { left: '8%', top: '70%' },
        trashPos: { left: '17%', top: '70%' },
        reportPos: { left: '7%', top: '76%' },
        reportClass: 'discord-report-button',
        onSubmit: (correctCount, targets) => {
          const flags = Array.from(stage.querySelectorAll('.discord-draggable-flag'));
          const allFlagsCorrect = flags.every(flag => {
            const rect = flag.getBoundingClientRect();
            return targets.some(target => {
              const box = target.getBoundingClientRect();
              const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
              return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
            });
          });
          showDiscordCommunityResult(community, correctCount === targets.length && allFlagsCorrect);
        }
      });
      views.set(key, stage);
    }
    content.replaceChildren(views.get(key));
    const select = content.querySelector('select');
    select.value = key;
    select.focus();
  };
  showCommunity('roblox');
  showDiscordInstructions();
}

function renderSms(data){
  openAppWindow('SMS — Reconnaître l’hameçonnage', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.add('bg-sms');
  const views = new Map();
  const showConversation = index => {
    if(index < 0 || index >= data.conversations.length) return;
    if(!views.has(index)){
      const conversation = data.conversations[index];
      const stage = document.createElement('section');
      stage.className = 'sms-stage';
      stage.innerHTML = `<header class="sms-navigation"><span>${escapeHtml(conversation.title)}</span><nav class="sms-navigation-controls" aria-label="Navigation entre les SMS"><span aria-live="polite">${index + 1}/${data.conversations.length}</span><button type="button" class="sms-previous" aria-label="SMS précédent" ${index === 0 ? 'disabled' : ''}>←</button><button type="button" class="sms-next" aria-label="SMS suivant" ${index === data.conversations.length - 1 ? 'disabled' : ''}>→</button></nav></header><div class="sms-phone"><div class="sms-status">9:41 <span>▰ ▰</span></div><header class="sms-contact"><span class="sms-avatar" aria-hidden="true">${escapeHtml(conversation.name.charAt(0))}</span><h2>${escapeHtml(conversation.name)}</h2><span>SMS</span></header><div class="sms-thread"><p class="sms-timestamp">Aujourd’hui · 9:41</p><div class="sms-bubble"></div></div><div class="sms-compose" aria-hidden="true">Message texte <span>↑</span></div></div><aside class="sms-help"><h2>Repère les indices</h2><p>Fais glisser un drapeau sur chaque passage suspect, puis appuie sur Valider.</p><p>Dépose un drapeau dans la corbeille pour le retirer.</p></aside>`;
      stage.querySelector('.sms-previous').addEventListener('click', () => showConversation(index - 1));
      stage.querySelector('.sms-next').addEventListener('click', () => showConversation(index + 1));
      const bubble = stage.querySelector('.sms-bubble');
      conversation.parts.forEach(part => {
        const paragraph = document.createElement('div');
        paragraph.className = 'sms-part';
        let targetHost = paragraph;
        if(part.href){
          const link = document.createElement('span');
          link.className = 'sms-link';
          link.textContent = part.text;
          paragraph.appendChild(link);
        } else if(part.suspectText && part.text.includes(part.suspectText)){
          const start = part.text.indexOf(part.suspectText);
          targetHost = document.createElement('span');
          targetHost.className = 'sms-target-fragment';
          targetHost.textContent = part.suspectText;
          paragraph.append(document.createTextNode(part.text.slice(0, start)), targetHost,
            document.createTextNode(part.text.slice(start + part.suspectText.length)));
        } else paragraph.textContent = part.text;
        if(part.suspect){
          const target = document.createElement('span');
          target.className = 'discord-phishing-target';
          target.style.inset = '0';
          targetHost.appendChild(target);
        }
        bubble.appendChild(paragraph);
      });
      addFlagTools(stage, {
        sourcePos: { left: '65%', top: '51%' },
        trashPos: { left: '80%', top: '51%' },
        reportPos: { left: '68%', top: '60%' },
        reportClass: 'discord-report-button',
        onSubmit: (correctCount, targets) => {
          const incorrectFlags = Array.from(stage.querySelectorAll('.discord-draggable-flag')).filter(flag => {
            const rect = flag.getBoundingClientRect();
            const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
            return !targets.some(target => {
              const box = target.getBoundingClientRect();
              return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
            });
          }).length;
          showSmsResult(conversation, correctCount, targets.length, incorrectFlags);
        }
      });
      views.set(index, stage);
    }
    content.replaceChildren(views.get(index));
    content.scrollTop = 0;
  };
  showConversation(0);
}

function renderOutlook(data){
  openAppWindow('Outlook', '<div></div>');
  const content = document.getElementById('app-content');
  content.classList.add('bg-outlook-exercise');
  const emails = data.emails;
  const views = new Map();
  const showEmail = index => {
    if(index < 0 || index >= emails.length) return;
    if(!views.has(index)) views.set(index, createOutlookEmail(emails[index], index, emails.length, showEmail));
    content.replaceChildren(views.get(index));
    content.scrollTop = 0;
  };
  showEmail(0);
  showOutlookInstructions();
}

function createOutlookEmail(data, index, total, showEmail){
  const content = document.getElementById('app-content');
  content.classList.add('bg-outlook-exercise');
  const stage = document.createElement('section');
  stage.className = 'outlook-exercise-stage';
  stage.setAttribute('aria-label', 'Courriel Outlook à analyser');
  stage.innerHTML = `<header class="outlook-exercise-header"><span>▦ &nbsp; Outlook</span><nav class="outlook-email-navigation" aria-label="Navigation entre les courriels"><span aria-live="polite">${index + 1} / ${total}</span><button type="button" class="outlook-email-previous" aria-label="Courriel précédent" ${index === 0 ? 'disabled' : ''}>←</button><button type="button" class="outlook-email-next" aria-label="Courriel suivant" ${index === total - 1 ? 'disabled' : ''}>→</button></nav></header><div class="outlook-exercise-toolbar">Supprimer &nbsp; | &nbsp; Archiver &nbsp; | &nbsp; Signaler &nbsp; | &nbsp; Répondre &nbsp; | &nbsp; Transférer</div><h1 class="outlook-clue">${escapeHtml(data.subject)}${data.onlyActionClue ? '' : '<span class="discord-phishing-target"></span>'}</h1><div class="outlook-exercise-mail"><div class="outlook-sender-row">${data.logo ? `<img class="outlook-sender-logo" src="${escapeHtml(data.logo)}" alt="${escapeHtml(data.logoAlt)}" width="44" height="44">` : `<span class="outlook-sender-avatar" aria-hidden="true">${escapeHtml(data.initials || data.senderName.charAt(0))}</span>`}<div class="outlook-exercise-sender outlook-clue"><strong>${escapeHtml(data.senderName)}</strong><br>&lt;${escapeHtml(data.sender)}&gt;${data.onlyActionClue ? '' : '<div class="discord-phishing-target"></div>'}</div></div><p>À : Vous</p><p>${escapeHtml(data.greeting || 'Bonjour,')}</p><p${data.clueField === 'intro' ? ' class="outlook-clue"' : ''}>${escapeHtml(data.intro).replace(/100 \$/g, '<strong>100 $</strong>')}${data.clueField === 'intro' ? '<span class="discord-phishing-target"></span>' : ''}</p>${data.threat ? `<p class="outlook-clue outlook-exercise-threat">${escapeHtml(data.threat).replace(/\bimmédiatement\b/g, '<strong><u>immédiatement</u></strong>')}${data.actionPrompt ? ` ${escapeHtml(data.actionPrompt)}` : ''}<span class="discord-phishing-target"></span></p>` : ''}${!data.threat && data.actionPrompt ? `<p>${escapeHtml(data.actionPrompt)}</p>` : ''}${data.href ? `<div class="outlook-exercise-action outlook-clue"><button type="button" class="outlook-inspect-link" aria-expanded="false" aria-controls="outlook-link-destination">${escapeHtml(data.buttonText)}</button><div class="outlook-link-destination" id="outlook-link-destination" hidden>${escapeHtml(data.href)}</div><span class="discord-phishing-target"></span></div>` : `<p class="outlook-clue">${escapeHtml(data.actionText)}<span class="discord-phishing-target"></span></p>`}${data.closing ? `<p>${escapeHtml(data.closing)}</p>` : ''}${data.supportNote ? `<p>${escapeHtml(data.supportNote)}</p>` : ''}${data.officialUrl ? `<p>${data.contact ? `Pour toute question : <span class="outlook-official-url">${escapeHtml(data.contact)}</span><br>Ce message a été généré par ` : escapeHtml(data.officialLabel || 'Support officiel : ')}<span class="outlook-official-url">${escapeHtml(data.officialUrl)}</span>.</p>` : ''}${data.signature ? `<p>${escapeHtml(data.signature)}</p>` : ''}</div><aside class="outlook-exercise-help">Faites glisser un drapeau sur chaque indice suspect et valider en appuyant sur le bouton.</aside>`;
  stage.querySelector('.outlook-email-previous').addEventListener('click', () => showEmail(index - 1));
  stage.querySelector('.outlook-email-next').addEventListener('click', () => showEmail(index + 1));
  stage.querySelectorAll('.outlook-clue .discord-phishing-target').forEach(target => {
    Object.assign(target.style, { inset: '0' });
  });
  if(data.href){
    const inspect = stage.querySelector('.outlook-inspect-link');
    const destination = stage.querySelector('.outlook-link-destination');
    let hovering = false;
    const updateDestination = () => {
      const visible = hovering || inspect.matches(':focus-visible');
      destination.hidden = !visible;
      inspect.setAttribute('aria-expanded', String(visible));
    };
    inspect.addEventListener('pointerenter', () => { hovering = true; updateDestination(); });
    inspect.addEventListener('pointerleave', () => { hovering = false; updateDestination(); });
    inspect.addEventListener('focus', updateDestination);
    inspect.addEventListener('blur', updateDestination);
  }
  addFlagTools(stage, {
    sourcePos: { right: '18%', top: '50%' },
    trashPos: { right: '7%', top: '50%' },
    reportPos: { right: '9%', top: '57%' },
    reportClass: 'discord-report-button',
    onSubmit: (correctCount, targets) => {
      const flags = Array.from(stage.querySelectorAll('.discord-draggable-flag'));
      const incorrectFlags = flags.filter(flag => {
        const rect = flag.getBoundingClientRect();
        const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
        return !targets.some(target => {
          const box = target.getBoundingClientRect();
          return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
        });
      }).length;
      showOutlookSuccessAlert(correctCount, targets.length, incorrectFlags, data);
    }
  });
  return stage;
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

      // Copy the selected game’s fixed message order from messages.json.
      const messagesArr = (data && data.games && data.games[app]) ? [...data.games[app]] : [];

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
        html += '<button type="button" class="mc-send-btn" id="mc-send-btn" disabled>Valider</button>';
        html += '</div></div>';
        return html;
      }

      const chatHtml = buildChatHtml(messagesArr);
      openAppWindow(title, chatHtml);
      const content = document.getElementById('app-content');
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
          span.tabIndex = 0;
          span.setAttribute('data-href', a.getAttribute('data-real-href') || '');
          span.textContent = a.textContent;
          a.parentNode.replaceChild(span, a);
        });
      }

      const chat = document.querySelector('.mc-chat');
      if(chat){
        addChatUrlPreview(chat);
        chat.addEventListener('click', e=>{
          const a = e.target.closest('a');
          if(a){
            if(isFortnite && a.getAttribute('data-real-href') === 'https://vbucks-cadeau.net'){
              e.preventDefault();
              showFortniteImageAlert();
              return;
            }
            e.preventDefault();
            return;
          }
          if(e.target.closest('.mc-right') || e.target.closest('.mc-send-btn') || e.target.closest('.mc-completed-link')) return;
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
        if(chat){
          const updateSendButton = () => {
            const messages = Array.from(chat.querySelectorAll('.mc-message'));
            sendBtn.disabled = messages.length === 0 || messages.some(message => !message.querySelector('input[type="radio"]:checked'));
          };
          chat.addEventListener('change', updateSendButton);
          updateSendButton();
        }
        sendBtn.addEventListener('click', () => checkChatAnswers(title, messagesArr));
      }
    } else if(app==='discord') renderDiscord(data.discord);
    else if(app==='outlook') renderOutlook(data.outlook);
    else if(app==='sms') renderSms(data.sms);
  }));
});
