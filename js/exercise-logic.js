/* Shared, DOM-independent exercise rules. */
function escapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function evaluateChatAnswers(messages, answers){
  const total = messages.length;
  let categorized = 0, good = 0;
  messages.forEach((message, index) => {
    const answer = answers[index];
    if(answer !== 'normal' && answer !== 'phishing') return;
    categorized++;
    if((answer === 'phishing') === message.phishing) good++;
  });
  return { total, categorized, good,
    phishingCount: messages.filter(message => message.phishing).length,
    complete: total > 0 && categorized === total,
    success: total > 0 && good === total };
}

function scoreFlagPlacements(targets, flags){
  const containsCenter = (target, flag) => {
    const x = flag.left + flag.width / 2, y = flag.top + flag.height / 2;
    return x >= target.left && x <= target.right && y >= target.top && y <= target.bottom;
  };
  const correctCount = targets.filter(target => flags.some(flag => containsCenter(target, flag))).length;
  const incorrectCount = flags.filter(flag => !targets.some(target => containsCenter(target, flag))).length;
  return { correctCount, incorrectCount, total: targets.length,
    success: targets.length > 0 && correctCount === targets.length && incorrectCount === 0 };
}

function buildGameChatHtml(title, messages){
  const namePrefix = title === 'Fortnite' ? 'ft-' : 'mc-';
  const rows = messages.map((message, index) => {
    const text = String(message.text || '');
    let displayText = escapeHtml(text);
    if(message.href){
      const label = String(message.hrefText || message.href);
      const link = `<span class="mc-discord-text" data-href="${escapeHtml(message.href)}">${escapeHtml(label)}</span>`;
      const position = text.indexOf(label);
      displayText = position < 0 ? `${displayText} ${link}`
        : escapeHtml(text.slice(0, position)) + link + escapeHtml(text.slice(position + label.length));
    }
    return `<div class="mc-message" data-phishing="${message.phishing ? 1 : 0}"><div class="mc-left"><span class="user">${escapeHtml(message.user || '')}</span> <span class="text">${displayText}</span></div><div class="mc-right"><div class="mc-ask">QUEL TYPE DE MESSAGE ?</div><label class="mc-yes"><input type="radio" name="${namePrefix}type-${index}" value="normal"><span class="mc-emoji">✅</span><span class="mc-label">Normal</span></label><label class="mc-no"><input type="radio" name="${namePrefix}type-${index}" value="phishing"><span class="mc-emoji">❌</span><span class="mc-label">Hameçonnage</span></label></div></div>`;
  }).join('');
  return `<div style="position:relative;width:100%;height:100%"><div class="mc-chat" role="log" aria-label="${escapeHtml(title)} chat" tabindex="0">${rows}<button type="button" class="mc-send-btn" id="mc-send-btn" disabled>Valider</button></div></div>`;
}
