const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBrowser,readData} = require('./helpers/browser.cjs');
const data=readData();
const latest=b=>b.appWindow.children.at(-1);
test('Windows: open resets backgrounds and overlays; domain help is available inside the window',()=>{
 const b=createBrowser();b.content.classList.add('bg-sms','custom');const stale=b.document.createElement('div');stale.className='link-alert-overlay';b.appWindow.appendChild(stale);b.context.openAppWindow('Roblox','<p>Chat</p>');assert(!b.content.classList.contains('bg-sms'));assert(b.content.classList.contains('custom'));assert.equal(stale.parentNode,null);assert.equal(b.appWindow.getAttribute('aria-hidden'),'false');for(const id of ['url-guide-button','url-quiz-button','official-domains-button'])assert(b.document.getElementById(id).hidden);assert.equal(b.document.activeElement,b.content);
 b.context.closeAppWindow();assert.equal(b.appWindow.getAttribute('aria-hidden'),'true');for(const id of ['url-guide-button','url-quiz-button','official-domains-button'])assert.equal(b.document.getElementById(id).hidden,false);
});
test('Escape closes the exercise only when no native help/quiz dialog is open',()=>{
 const b=createBrowser();b.events.find(e=>e.type==='DOMContentLoaded').callback();b.context.openAppWindow('SMS','');const dialog=b.add('official-domains-dialog','dialog');dialog.open=true;for(const fn of b.document.events.keydown)fn({key:'Escape'});assert.equal(b.appWindow.getAttribute('aria-hidden'),'false');dialog.open=false;for(const fn of b.document.events.keydown)fn({key:'Escape'});assert.equal(b.appWindow.getAttribute('aria-hidden'),'true');
});
test('Chat partial results use the current total and phishing count',()=>{
 const b=createBrowser();b.context.showChatPartialAlert(3,6,4);const html=latest(b).innerHTML;assert(html.includes('3 messages sur 6'));assert(html.includes('4 messages sont'));assert(!html.includes('Bravo !'));
});
test('Chat success keeps the agreed simple message',()=>{
 const b=createBrowser();b.context.showChatAllGoodAlert();const html=latest(b).innerHTML;assert(html.includes('Bravo !'));assert(html.includes('Vous avez catégorisé correctement tous les messages.'));assert(!html.includes('Voici le(s)'));
});
for(const [key,title] of [['roblox','Roblox'],['fortnite','Fortnite'],['minecraft','Minecraft']])test(`Explanations ${title}: every current message with a ? has valid feedback`,()=>{
 const b=createBrowser();for(const m of data.games[key]){
  if(key==='roblox'){if(m.explanation)b.context.showRobloxPhishingExplanation(m.explanation);else if(m.id===26)b.context.showRobloxLegitAlert();else continue;}
  if(key==='fortnite'){if(m.explanation==='official')b.context.showFortniteLegitAlert();else if(m.explanation)b.context.showFortnitePhishingExplanation(m.explanation);else continue;}
  if(key==='minecraft'){if(m.explanation)b.context.showMinecraftExplanation(m.explanation);else continue;}
  const html=latest(b).innerHTML;assert(html.includes(m.phishing?'hameçonnage':'message légitime'),m.user);assert(!html.includes('undefined'));
 }
});
test('Minecraft Minecoins explanation identifies minecoins.net rather than microsoft.com',()=>{
 const b=createBrowser();b.context.showMinecraftExplanation('coins');assert(latest(b).innerHTML.includes('microsoft.com.minecoins.net'));assert(latest(b).innerHTML.replace(/<[^>]+>/g,'').includes('domaine minecoins.net'));
});
for(const [good,bad] of [[0,0],[3,0],[3,2],[4,1],[4,0]])test(`Outlook result: ${good}/4 clues and ${bad} misplaced flags`,()=>{
 const b=createBrowser();b.context.showOutlookSuccessAlert(good,4,bad,data.outlook.emails[0]);const html=latest(b).innerHTML;
 if(good===4&&bad===0){assert(html.includes('Bravo !'));assert(html.includes('À se rappeler :'));assert(html.includes('<li>Un logo officiel'));assert(html.includes('à l’intérieur du courriel'));}
 else {assert(!html.includes('Bravo !'));assert(html.includes(`<strong>${good}</strong>`));assert.equal(html.includes('placé incorrectement')||html.includes('placés incorrectement'),bad>0);if(bad>0)assert(html.includes(`<strong>${bad}</strong>`));}
});
test('Outlook feedback restores focus when its close button is clicked',()=>{
 const b=createBrowser();b.context.showOutlookSuccessAlert(2,4,0,data.outlook.emails[0]);const overlay=latest(b),button=overlay.querySelector('button');assert.equal(b.document.activeElement,button);button.emit('click');assert.equal(overlay.parentNode,null);assert.equal(b.document.activeElement,b.content);
});
test('Discord Minecraft success separates both explanations and supplies the correct hint',()=>{
 const b=createBrowser(),community=data.discord.communities.minecraft;b.context.showDiscordCommunityResult(community,true);const html=latest(b).innerHTML;assert.equal((html.match(/<section>/g)||[]).length,2);assert(html.includes('Minecraft_Securite'));b.context.showDiscordCommunityResult(community,false);assert(latest(b).innerHTML.includes('2 messages sont'));
});
test('SMS results preserve reminders and the single TikTok clue without exposing links',()=>{
 const b=createBrowser();for(const conversation of data.sms.conversations){const count=conversation.parts.filter(p=>p.suspect).length;b.context.showSmsResult(conversation,count,count,0);const html=latest(b).innerHTML;assert(html.includes('Les indices :'));assert(html.includes('À se rappeler :'));assert(!html.includes('href='));if(count===1){assert(html.includes('<strong>TON</strong>'));assert(!html.includes('ami a été piraté'));}}
});
test('SMS feedback does not claim success with extra wrong flags',()=>{
 const b=createBrowser();b.context.showSmsResult(data.sms.conversations[2],1,1,1);assert(latest(b).innerHTML.includes('drapeau est mal placé'));assert(!latest(b).innerHTML.includes('Bravo !'));b.context.showSmsResult(data.sms.conversations[2],0,1,0);assert(!latest(b).innerHTML.includes('mal placé'));
});
test('SMS/Outlook startup dialogs use Commencer and do not change exercise data',()=>{
 const b=createBrowser();b.context.showSmsInstructions();assert(latest(b).innerHTML.includes('Commencer'));b.context.showOutlookInstructions();assert(latest(b).innerHTML.includes('chacun des courriels'));assert(latest(b).innerHTML.includes('Commencer'));
});
test('Fortnite simulated phishing-page popup only uses the bundled image',()=>{
 const b=createBrowser();b.context.showFortniteImageAlert();const html=latest(b).innerHTML;assert(html.includes('assets/images/apps/Vbuck-gen.png'));assert(!html.includes('src="http'));const overlay=latest(b);overlay.querySelector('button').emit('click');assert.equal(overlay.parentNode,null);
});
test('Defensive empty-answer popup can be closed',()=>{
 const b=createBrowser();b.context.showChatNoAnswerAlert();const overlay=latest(b);assert(overlay.innerHTML.includes('Aucun message catégorisé'));b.document.getElementById('close-chat-result').emit('click');assert.equal(overlay.parentNode,null);
});
test('Window close control restores the desktop tools',()=>{
 const b=createBrowser();b.events[0].callback();b.context.openAppWindow('Outlook','');b.document.getElementById('close-window').emit('click');assert.equal(b.appWindow.getAttribute('aria-hidden'),'true');assert.equal(b.document.getElementById('official-domains-button').hidden,false);
});
