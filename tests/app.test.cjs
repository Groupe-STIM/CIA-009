const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBrowser,readData} = require('./helpers/browser.cjs');
const data=readData();
for(const scenario of ['HTTP success','network blocked','HTTP error','invalid HTTP JSON'])test(`Data loader: ${scenario}`,async()=>{
 const {context:c,add}=createBrowser();const embedded=add('embedded-messages');embedded.textContent=JSON.stringify(data);
 c.fetch=scenario==='network blocked'?async()=>{throw Error('file://');}:async()=>({ok:scenario!=='HTTP error',json:async()=>{if(scenario==='invalid HTTP JSON')throw Error('JSON');return data;}});
 assert.deepEqual(JSON.parse(JSON.stringify(await c.loadData())),data);
});
test('Data loader: both sources unusable returns its empty structure',async()=>{
 const {context:c,add}=createBrowser();add('embedded-messages').textContent='{bad';c.fetch=async()=>{throw Error('offline')};assert.equal(Object.keys((await c.loadData()).games).length,0);
});
function chatFixture(browser,messages,answers=[]){
 const chat=browser.document.createElement('div');chat.className='mc-chat';
 messages.forEach((m,i)=>{const row=browser.document.createElement('div');row.className='mc-message';row.dataset.phishing=m.phishing?'1':'0';row.checked=answers[i]?{value:answers[i]}:null;const right=browser.document.createElement('div');right.className='mc-right';row.appendChild(right);chat.appendChild(row);});
 const send=browser.document.createElement('button');send.className='mc-send-btn';chat.appendChild(send);
 messages.filter(m=>m.href).forEach(m=>{const link=browser.document.createElement('a');link.className='mc-discord-link';link.setAttribute('data-real-href',m.href);link.textContent=m.hrefText;chat.appendChild(link);});
 browser.content.appendChild(chat);return chat;
}
for(const [key,title] of [['roblox','Roblox'],['fortnite','Fortnite'],['minecraft','Minecraft']])test(`Chat ${key}: empty/partial feedback, then labels and all associated explanations`,()=>{
 const b=createBrowser(),c=b.context,messages=data.games[key];const chat=chatFixture(b,messages);let result;
 c.showChatNoAnswerAlert=()=>result='empty';c.showChatPartialAlert=(...args)=>result=args;c.showChatAllGoodAlert=()=>result='success';
 c.checkChatAnswers(title,messages);assert.equal(result,'empty');
 const rows=chat.querySelectorAll('.mc-message');rows.forEach((row,i)=>row.checked={value:messages[i].phishing?'phishing':'normal'});rows[0].checked.value=messages[0].phishing?'normal':'phishing';c.checkChatAnswers(title,messages);assert.equal(result[0],messages.length-1);assert.equal(result[2],key==='minecraft'?4:5);
 rows[0].checked.value=messages[0].phishing?'phishing':'normal';c.checkChatAnswers(title,messages);assert.equal(result,'success');assert.equal(chat.dataset.completed,'true');assert.equal(chat.querySelectorAll('.mc-result-label').length,messages.length);assert.equal(chat.querySelectorAll('.mc-result-help').length,6);assert.equal(chat.querySelectorAll('.mc-send-btn').length,0);assert.equal(chat.querySelectorAll('.mc-discord-link').length,key==='fortnite'?1:0);
 for(const link of chat.querySelectorAll('.mc-completed-link'))assert(link.getAttribute('data-href'));
});
test('Chat URL preview: full URL, focus, pointer exit and scroll cleanup',()=>{
 const b=createBrowser();const chat=b.document.createElement('div');const link=b.document.createElement('span');link.className='mc-discord-text';link.setAttribute('data-href','https://roblox.com.verification-urgence.com/path');link.bounds={left:950,top:15,bottom:40};chat.appendChild(link);b.context.addChatUrlPreview(chat);const tooltip=b.document.getElementById('chat-url-preview');
 chat.emit('pointerover',{target:link});assert.equal(tooltip.textContent,link.getAttribute('data-href'));assert.equal(tooltip.hidden,false);assert(parseFloat(tooltip.style.left)<=968);chat.emit('pointerout',{relatedTarget:null});assert(tooltip.hidden);chat.emit('focusin',{target:link});assert(!tooltip.hidden);chat.emit('scroll');assert(tooltip.hidden);assert.equal(link.getAttribute('aria-describedby'),null);
});
test('Flag tool: drag immediately from source, score, move and delete in trash',()=>{
 const b=createBrowser(),stage=b.document.createElement('section');stage.bounds={left:0,top:0,width:1000,height:800,right:1000,bottom:800};const target=b.document.createElement('div');target.className='discord-phishing-target';target.bounds={left:300,top:250,right:500,bottom:350};stage.appendChild(target);let result;
 b.context.addFlagTools(stage,{sourcePos:{left:'10%',top:'10%'},trashPos:{left:'90%',top:'85%'},reportPos:{},reportClass:'report',onSubmit:r=>result=r});const source=stage.querySelector('.discord-flag-source');const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){}});
 source.emit('pointerdown',{button:2});assert.equal(stage.querySelectorAll('.discord-draggable-flag').length,0);source.emit('pointerdown',event(110,90));const flag=stage.querySelector('.discord-draggable-flag');assert(flag);flag.emit('pointermove',event(400,300));flag.emit('pointerup');stage.querySelector('.report').emit('click');assert(result.success);flag.emit('pointerdown',event(400,300));flag.emit('pointermove',event(916,696));flag.emit('pointerup');assert.equal(stage.querySelectorAll('.discord-draggable-flag').length,0);
});
test('Flag tool: cancellation removes a new flag but restores an already placed flag',()=>{
 const b=createBrowser(),stage=b.document.createElement('section');stage.bounds={left:0,top:0,width:1000,height:800,right:1000,bottom:800};b.context.addFlagTools(stage,{sourcePos:{left:'10%',top:'10%'},trashPos:{left:'90%',top:'85%'},reportPos:{},reportClass:'report',onSubmit(){}});const source=stage.querySelector('.discord-flag-source');const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){}});
 source.emit('pointerdown',event(110,90));stage.querySelector('.discord-draggable-flag').emit('pointercancel');assert.equal(stage.querySelectorAll('.discord-draggable-flag').length,0);
 source.emit('pointerdown',event(110,90));const flag=stage.querySelector('.discord-draggable-flag');flag.emit('pointermove',event(400,300));flag.emit('pointerup');const position={...flag.style};flag.emit('pointerdown',event(400,300));flag.emit('pointermove',event(600,400));flag.emit('pointercancel');assert.deepEqual(flag.style,position);assert.equal(stage.querySelectorAll('.discord-draggable-flag').length,1);
});
test('Flag tool: keyboard activation creates one flag; repeated initialization adds no duplicate tools',()=>{
 const b=createBrowser(),stage=b.document.createElement('section');const config={sourcePos:{},trashPos:{},reportPos:{},reportClass:'report',onSubmit(){}};b.context.addFlagTools(stage,config);b.context.addFlagTools(stage,config);assert.equal(stage.querySelectorAll('.discord-flag-source').length,1);stage.querySelector('.discord-flag-source').emit('click',{detail:0});assert.equal(stage.querySelectorAll('.discord-draggable-flag').length,1);
});
test('Discord: three communities, correct target counts and cached flag positions',()=>{
 const b=createBrowser();b.context.renderDiscord(data.discord);const first=b.content.children[0];assert.equal(first.querySelectorAll('article').length,4);const flag=b.document.createElement('span');flag.className='discord-draggable-flag';first.appendChild(flag);
 const change=value=>{const select=b.content.querySelector('select');select.value=value;select.emit('change');};change('fortnite');assert.equal(b.content.querySelectorAll('.discord-phishing-target').length,1);change('minecraft');assert.equal(b.content.querySelectorAll('.discord-phishing-target').length,2);change('roblox');assert.strictEqual(b.content.children[0],first);assert(first.contains(flag));
});
test('SMS: instructions, two/four/one targets, precise Google fragment and retained progress',()=>{
 const b=createBrowser();b.context.renderSms(data.sms);assert(b.document.getElementById('sms-popup').innerHTML.includes('Commencer'));const first=b.content.children[0];assert.equal(first.querySelectorAll('.discord-phishing-target').length,2);assert.equal(first.querySelector('.sms-target-fragment').textContent,'compte Google');assert.equal(first.querySelector('.sms-link').tagName,'span');
 const flag=b.document.createElement('span');flag.className='discord-draggable-flag';first.appendChild(flag);first.querySelector('.sms-next').emit('click');assert.equal(b.content.querySelectorAll('.discord-phishing-target').length,4);b.content.querySelector('.sms-next').emit('click');const last=b.content.children[0];assert.equal(last.querySelectorAll('.discord-phishing-target').length,1);assert.equal(last.querySelectorAll('.sms-link').length,0);last.querySelector('.sms-next').emit('click');assert.strictEqual(b.content.children[0],last);last.querySelector('.sms-previous').emit('click');b.content.querySelector('.sms-previous').emit('click');assert.strictEqual(b.content.children[0],first);assert(first.contains(flag));
});
test('Outlook: five emails, four targets each, bounded navigation and retained flags',()=>{
 const b=createBrowser();b.context.renderOutlook(data.outlook);const first=b.content.children[0];const flag=b.document.createElement('span');flag.className='discord-draggable-flag';first.appendChild(flag);
 for(let i=0;i<5;i++){assert.equal(b.content.querySelectorAll('.discord-phishing-target').length,4);assert(b.content.children[0].innerHTML.includes(`${i+1} / 5`));if(i<4)b.content.querySelector('.outlook-email-next').emit('click');}
 const last=b.content.children[0];last.querySelector('.outlook-email-next').emit('click');assert.strictEqual(b.content.children[0],last);for(let i=0;i<4;i++)b.content.querySelector('.outlook-email-previous').emit('click');assert.strictEqual(b.content.children[0],first);assert(first.contains(flag));
});
test('Outlook destination: shows only on hover or keyboard focus and hides again',()=>{
 const b=createBrowser(),stage=b.context.createOutlookEmail(data.outlook.emails[0],0,5,()=>{});const button=stage.querySelector('.outlook-inspect-link'),destination=stage.querySelector('.outlook-link-destination');button.emit('pointerenter');assert.equal(destination.hidden,false);button.emit('pointerleave');assert.equal(destination.hidden,true);button.keyboardFocus=true;button.emit('focus');assert(!destination.hidden);button.keyboardFocus=false;button.emit('blur');assert(destination.hidden);assert.equal(button.getAttribute('aria-expanded'),'false');assert.equal(button.events.click,undefined);
});
for(const app of ['roblox','fortnite','minecraft'])test(`Launcher ${app}: disabled validation, chat expansion, safe link actions and completion`,async()=>{
 const b=createBrowser(),c=b.context;const icon=b.add('test-icon','button');icon.className='icon';icon.dataset.app=app;c.fetch=async()=>({ok:true,json:async()=>data});b.events.at(-1).callback();await icon.events.click[0]();
 const chat=b.content.querySelector('.mc-chat'),send=b.document.getElementById('mc-send-btn');assert(send.disabled);
 const messages=data.games[app];messages.forEach(m=>{const row=b.document.createElement('div');row.className='mc-message';row.dataset.phishing=m.phishing?'1':'0';const right=b.document.createElement('div');right.className='mc-right';row.appendChild(right);chat.appendChild(row);});chat.appendChild(send);
 const source=messages.find(m=>m.href);const span=b.document.createElement('span');span.className='mc-discord-text';span.textContent=source.hrefText;span.setAttribute('data-href',source.href);chat.appendChild(span);
 chat.emit('click',{target:chat});assert(chat.classList.contains('mc-chat--expanded'));assert.equal(chat.querySelectorAll('.mc-discord-link').length,1);
 let imageOpened=0,prevented=0;c.showFortniteImageAlert=()=>imageOpened++;const link=chat.querySelector('.mc-discord-link');chat.emit('click',{target:link,preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(imageOpened,app==='fortnite'?1:0);
 chat.emit('click',{target:chat});assert(!chat.classList.contains('mc-chat--expanded'));assert.equal(chat.querySelectorAll('.mc-discord-link').length,0);
 const rows=chat.querySelectorAll('.mc-message');rows[0].checked={value:messages[0].phishing?'phishing':'normal'};chat.emit('change');assert(send.disabled);rows.forEach((row,i)=>row.checked={value:messages[i].phishing?'phishing':'normal'});chat.emit('change');assert.equal(send.disabled,false);
 let completed=false;c.showChatAllGoodAlert=()=>completed=true;send.emit('click');assert(completed);assert.equal(chat.dataset.completed,'true');
});
for(const app of ['discord','outlook','sms'])test(`Launcher ${app}: registered desktop action opens the correct exercise`,async()=>{
 const b=createBrowser();const icon=b.add('test-icon','button');icon.className='icon';icon.dataset.app=app;b.context.fetch=async()=>({ok:true,json:async()=>data});b.events.at(-1).callback();await icon.events.click[0]();assert.equal(b.appWindow.getAttribute('aria-hidden'),'false');assert(b.document.getElementById('app-title').textContent.toLowerCase().includes(app));assert.equal(b.content.children.length,1);
});
