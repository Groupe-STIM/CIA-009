/* Local URL parsing and the desktop-only learning dialog. No network requests. */
let urlGuideSuffixes;

function getUrlGuideSuffixes(){
  if(urlGuideSuffixes) return urlGuideSuffixes;
  const exact = new Set(), wildcard = new Set(), exceptions = new Set();
  PUBLIC_SUFFIX_RULES.forEach(rule => {
    const exception = rule.startsWith('!');
    const wild = rule.startsWith('*.');
    const raw = rule.slice(exception ? 1 : wild ? 2 : 0);
    // URL applies the same international-domain normalization as user input.
    const ascii = new URL('https://' + raw).hostname.toLowerCase();
    (exception ? exceptions : wild ? wildcard : exact).add(ascii);
  });
  urlGuideSuffixes = { exact, wildcard, exceptions };
  return urlGuideSuffixes;
}

function analyzeLearningUrl(input){
  const text = String(input).trim();
  if(!text) throw new Error('Écris une adresse Web avant de cliquer sur Analyser.');
  if(/[\s\\]/u.test(text)) throw new Error('L’adresse contient un espace ou une barre inversée. Utilise une adresse comme https://www.minecraft.net/ sans espace.');
  let candidate = text;
  if(text.startsWith('//')) candidate = 'https:' + text;
  else if(!/^https?:\/\//i.test(text)){
    if(/^[a-z][a-z\d+.-]*:/i.test(text) && !/^[^/?#]+:\d+(?:[/?#]|$)/.test(text)){
      throw new Error('Utilise une adresse Web commençant par https:// ou http://, ou un nom comme www.roblox.com.');
    }
    candidate = 'https://' + text;
  }
  let url;
  try { url = new URL(candidate); }
  catch { throw new Error('Cette adresse ne peut pas être lue. Essaie par exemple https://www.minecraft.net/.'); }
  if(!['https:', 'http:'].includes(url.protocol) || !url.hostname){
    throw new Error('Seules les adresses Web http:// et https:// sont prises en charge.');
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const notes = [];
  if(url.username || url.password) notes.push('L’adresse contient un identifiant avant « @ ». Le site visité est le nom complet du site affiché ci-dessous, pas le texte avant « @ ».');
  if(url.protocol === 'http:') notes.push('Cette adresse utilise HTTP, qui ne chiffre pas la connexion. HTTPS ne garantit toutefois pas qu’un site est honnête.');
  const base = { hostname, fullUrl: url.href, protocol: url.protocol + '//', port: url.port, path: url.pathname + url.search + url.hash, notes };
  if(hostname.startsWith('[') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)){
    return { ...base, kind: 'ip', domain: null, suffix: null, subdomain: '' };
  }
  const labels = hostname.split('.');
  if(hostname.length > 253 || labels.some(label => label.length > 63 || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/.test(label))){
    throw new Error('Le nom complet du site n’a pas une forme valide : vérifie les points, les lettres et les tirets de l’adresse.');
  }
  if(labels.some(label => label.startsWith('xn--'))) notes.push('Ce nom utilise des caractères internationaux. Il est affiché dans sa forme technique « xn-- » pour faciliter la comparaison des adresses.');
  if(labels.length === 1 || hostname.endsWith('.localhost')){
    return { ...base, kind: 'local', domain: null, suffix: null, subdomain: '' };
  }
  const rules = getUrlGuideSuffixes();
  let suffixLength = 1, knownSuffix = false;
  for(let i = 0; i < labels.length; i++){
    const part = labels.slice(i).join('.');
    if(rules.exceptions.has(part)){
      suffixLength = labels.length - i - 1;
      knownSuffix = true;
      break;
    }
    if(rules.exact.has(part)){
      suffixLength = Math.max(suffixLength, labels.length - i);
      knownSuffix = true;
    }
    if(i + 1 < labels.length && rules.wildcard.has(labels.slice(i + 1).join('.'))){
      suffixLength = Math.max(suffixLength, labels.length - i);
      knownSuffix = true;
    }
  }
  const suffix = labels.slice(-suffixLength).join('.');
  const domain = labels.length > suffixLength ? labels.slice(-suffixLength - 1).join('.') : null;
  if(!knownSuffix) notes.push('Cette extension n’est pas répertoriée dans la copie locale des suffixes. Le découpage est indicatif ; l’outil ne vérifie ni l’existence ni la sécurité du site.');
  const authorityStart = url.protocol.length + 2;
  const authority = url.href.slice(authorityStart).split(/[/?#]/, 1)[0];
  const hostStart = authorityStart + authority.lastIndexOf('@') + 1;
  return { ...base, kind: domain ? 'domain' : 'suffix', domain, suffix,
    domainOffset: domain ? hostStart + hostname.length - domain.length : null,
    subdomain: domain ? labels.slice(0, -suffixLength - 1).join('.') : '' };
}

function displayLearningUrlResult(input, output){
  try {
    const result = analyzeLearningUrl(input.value);
    input.removeAttribute('aria-invalid');
    const details = [
      ['Nom complet du site', result.hostname],
      ['Sous-domaine', result.subdomain || 'Aucun'],
      ['Extension / suffixe', result.suffix || 'Sans objet'],
      ['Chemin, paramètres et fragment', result.path]
    ];
    if(result.port) details.push(['Port', result.port]);
    const title = result.domain || (result.kind === 'ip' ? 'Adresse IP : aucun domaine à extraire'
      : result.kind === 'local' ? 'Nom local : aucun domaine principal à extraire'
        : 'Suffixe seul : aucun domaine principal à extraire');
    const highlight = result.domain
      ? `<p class="url-result-host">${escapeHtml(result.fullUrl.slice(0, result.domainOffset))}<strong>${escapeHtml(result.domain)}</strong>${escapeHtml(result.fullUrl.slice(result.domainOffset + result.domain.length))}</p>`
      : `<p class="url-result-host">${escapeHtml(result.fullUrl)}</p>`;
    output.innerHTML = `<div class="url-analysis-result"><span class="url-result-label">${result.domain ? 'DOMAINE PRINCIPAL' : 'TYPE D’ADRESSE'}</span><h4>${escapeHtml(title)}</h4>${highlight}<dl>${details.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${result.notes.map(note => `<p class="url-result-note">${escapeHtml(note)}</p>`).join('')}<p class="url-result-footnote">Le domaine a été extrait localement. L’existence et la fiabilité du site ne sont pas vérifiées.</p></div>`;
  } catch(error){
    input.setAttribute('aria-invalid', 'true');
    output.replaceChildren();
    const message = document.createElement('p');
    message.className = 'url-analysis-error';
    message.textContent = error.message;
    output.appendChild(message);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const officialButton = document.getElementById('official-domains-button');
  const officialDialog = document.getElementById('official-domains-dialog');
  officialButton.addEventListener('click', () => officialDialog.showModal());
  document.getElementById('official-domains-close').addEventListener('click', () => officialDialog.close());
  officialDialog.addEventListener('close', () => officialButton.focus());
  officialDialog.addEventListener('click', event => {
    if(event.target !== officialDialog) return;
    const bounds = officialDialog.getBoundingClientRect();
    if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) officialDialog.close();
  });
  const button = document.getElementById('url-guide-button');
  const dialog = document.getElementById('url-guide-dialog');
  const input = document.getElementById('url-analyzer-input');
  const output = document.getElementById('url-analyzer-result');
  const form = document.getElementById('url-analyzer-form');
  button.addEventListener('click', () => dialog.showModal());
  document.getElementById('url-guide-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => button.focus());
  dialog.addEventListener('click', event => {
    if(event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    displayLearningUrlResult(input, output);
  });
  dialog.querySelectorAll('[data-url-example]').forEach(example => {
    example.addEventListener('click', () => {
      input.value = example.dataset.urlExample;
      form.requestSubmit();
    });
  });
});
