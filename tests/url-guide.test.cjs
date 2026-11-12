const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const callbacks = [];
const context = { URL, window: { addEventListener: (type, callback) => callbacks.push(callback) } };
vm.createContext(context);
for (const file of ['js/public-suffix-list.js', 'js/url-guide.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const parse = context.analyzeLearningUrl;
const cases = [
  ['https://www.roblox.com/games', 'roblox.com', 'com', 'www'],
  ['www.minecraft.net', 'minecraft.net', 'net', 'www'],
  ['https://login.roblox.com.verification-urgence.com/connexion', 'verification-urgence.com', 'com', 'login.roblox.com'],
  ['https://security.roblox.com.protection-compte.net', 'protection-compte.net', 'net', 'security.roblox.com'],
  ['https://security.microsoft.com/path', 'microsoft.com', 'com', 'security'],
  ['https://shop.exemple.co.uk/produits', 'exemple.co.uk', 'co.uk', 'shop'],
  ['https://a.b.ck/', 'a.b.ck', 'b.ck', ''], // PSL wildcard
  ['https://www.ck/', 'www.ck', 'ck', ''], // PSL exception
  ['https://sub.www.ck/', 'www.ck', 'ck', 'sub'],
  ['https://a.city.kawasaki.jp/', 'city.kawasaki.jp', 'kawasaki.jp', 'a'],
  ['https://user.github.io/', 'user.github.io', 'github.io', ''], // PRIVATE rule
  ['https://roblox.com@cadeaux.net/connexion', 'cadeaux.net', 'net', ''],
  ['https://cadeaux.net/roblox.com', 'cadeaux.net', 'net', ''],
  ['https://cadeaux.net?site=roblox.com#google.com', 'cadeaux.net', 'net', ''],
  ['https://WWW.ROBLOX.COM.:443/games', 'roblox.com', 'com', 'www'],
  ['//accounts.google.com/login', 'google.com', 'com', 'accounts'],
  ['www.roblox.com:8443/games', 'roblox.com', 'com', 'www'],
  ['https://bücher.de/', 'xn--bcher-kva.de', 'de', ''],
  ['https://食狮.公司.cn/', 'xn--85x722f.xn--55qx5d.cn', 'xn--55qx5d.cn', ''],
  ['https://co.uk/', null, 'co.uk', ''],
  ['https://127.0.0.1/', null, null, ''],
  ['http://[::1]:8080/', null, null, ''],
  ['localhost:8080', null, null, ''],
  ['https://app.localhost/', null, null, '']
];
for (const [input, domain, suffix, subdomain] of cases) {
  const actual = parse(input);
  assert.equal(actual.domain, domain, input);
  assert.equal(actual.suffix, suffix, input);
  assert.equal(actual.subdomain, subdomain, input);
}
assert(parse('https://roblox.com@cadeaux.net').notes.some(note => note.includes('identifiant')));
assert(parse('http://www.roblox.com/').notes.some(note => note.includes('HTTP')));
assert(parse('https://bücher.de/').notes.some(note => note.includes('internationaux')));
assert(parse('https://example.extensioninconnue').notes.some(note => note.includes('indicatif')));
for (const input of ['', 'bonjour monde', 'https://', 'https://a..com', 'ftp://example.com', 'javascript:alert(1)', 'mailto:alex@example.com', 'https:example.com', 'https://-bad.com', 'https://example.com:99999', 'https://example.com\\path']) {
  assert.throws(() => parse(input), undefined, input);
}
// Official-domain matches do not depend on the example URL's path or brand names elsewhere.
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/messages.json'), 'utf8'));
const addresses = [
  ...Object.values(data.games).flat().map(message => message.href),
  ...data.outlook.emails.map(email => email.href),
  ...Object.values(data.discord.communities).flatMap(community => community.messages.map(message => message.href)),
  ...data.sms.conversations.flatMap(conversation => conversation.parts.map(part => part.href))
].filter(Boolean);
for (const address of addresses) assert(parse(address).domain, address);
// Error output is text-only; user input is escaped before inclusion in rich result HTML.
context.escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
context.document = { createElement: () => ({}) };
const input = { value: '', attrs: {}, setAttribute(k,v){ this.attrs[k]=v; }, removeAttribute(k){ delete this.attrs[k]; } };
const output = { replaceChildren(){ this.innerHTML=''; }, appendChild(el){ this.message=el.textContent; } };
context.displayLearningUrlResult(input, output);
assert.equal(input.attrs['aria-invalid'], 'true');
input.value = 'https://roblox.com.verification-urgence.com/<img/src=x/onerror=alert(1)>';
context.displayLearningUrlResult(input, output);
assert(!output.innerHTML.includes('<img'));
assert(output.innerHTML.includes('verification-urgence.com'));
assert.equal(input.attrs['aria-invalid'], undefined);
console.log(`URL guide: ${cases.length} extraction cases, 11 invalid inputs, ${addresses.length} project URLs and safe result rendering passed.`);
// Native-dialog wiring and desktop-only button visibility.
function element(){
  return { events:{}, dataset:{}, attrs:{}, focused:false, open:false,
    addEventListener(type,fn){ this.events[type]=fn; },
    setAttribute(k,v){ this.attrs[k]=v; }, removeAttribute(k){ delete this.attrs[k]; },
    focus(){this.focused=true;},
    showModal(){this.open=true;}, close(){this.open=false;this.events.close?.();},
    getBoundingClientRect(){return {left:10,right:100,top:10,bottom:100};},
    querySelectorAll(){return [];}
  };
}
const ids = Object.fromEntries(['official-domains-button','official-domains-dialog','official-domains-close','url-quiz-button','url-guide-button','url-guide-dialog','url-guide-close','url-analyzer-input','url-analyzer-result','url-analyzer-form'].map(id=>[id,element()]));
ids['url-analyzer-result'].replaceChildren=function(){this.innerHTML='';};
ids['url-analyzer-result'].appendChild=function(el){this.message=el.textContent;};
const example = element(); example.dataset.urlExample='https://shop.exemple.co.uk/';
ids['url-guide-dialog'].querySelectorAll=()=>[example];
ids['url-analyzer-form'].requestSubmit=function(){this.events.submit({preventDefault(){}});};
context.document = {getElementById:id=>ids[id], createElement:()=>element()};
callbacks[0]();
ids['official-domains-button'].events.click();assert(ids['official-domains-dialog'].open);
ids['official-domains-close'].events.click();assert(!ids['official-domains-dialog'].open);assert(ids['official-domains-button'].focused);
ids['official-domains-button'].events.click();
ids['official-domains-dialog'].events.click({target:ids['official-domains-dialog'],clientX:200,clientY:200});assert(!ids['official-domains-dialog'].open);
ids['url-guide-button'].events.click(); assert(ids['url-guide-dialog'].open);
ids['url-guide-close'].events.click(); assert(!ids['url-guide-dialog'].open);assert(ids['url-guide-button'].focused);
ids['url-guide-button'].events.click();
ids['url-guide-dialog'].events.click({target:ids['url-guide-dialog'],clientX:50,clientY:50});assert(ids['url-guide-dialog'].open);
ids['url-guide-dialog'].events.click({target:ids['url-guide-dialog'],clientX:200,clientY:200});assert(!ids['url-guide-dialog'].open);
example.events.click();assert(ids['url-analyzer-result'].innerHTML.includes('exemple.co.uk'));
const appWindow=element();
const classes=new Set(['bg-sms']);
const appContent={classList:{[Symbol.iterator]:()=>classes[Symbol.iterator](),remove:name=>classes.delete(name)},style:{},focus(){}};
const title=element();
context.document.getElementById=id=>id==='app-window'?appWindow:id==='app-content'?appContent:id==='app-title'?title:ids[id];
vm.runInContext(fs.readFileSync(path.join(root,'js/ui.js'),'utf8'),context);
context.openAppWindow('SMS','<div></div>');assert.equal(ids['url-guide-button'].hidden,true);assert.equal(ids['official-domains-button'].hidden,false);
context.closeAppWindow();assert.equal(ids['url-guide-button'].hidden,false);assert.equal(ids['official-domains-button'].hidden,false);
console.log('URL guide: modal open/close, backdrop, examples and desktop-only visibility passed.');
