const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const callbacks = [];
const ctx = { URL, window: { addEventListener(type, fn){callbacks.push(fn);} } };
vm.createContext(ctx);
for(const file of ['js/public-suffix-list.js', 'js/url-guide.js', 'js/url-quiz.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:path.join(root,file)});
const questions = vm.runInContext('URL_QUIZ_QUESTIONS',ctx);
assert.equal(questions.length,10);
assert.equal(new Set(questions.map(q=>q.url)).size,10);
for(const q of questions){
 assert.equal(q.choices.length,4);
 assert.equal(new Set(q.choices).size,4);
 assert.equal(ctx.analyzeLearningUrl(q.url).domain,q.choices[q.answer],q.url);
 assert.equal(q.isOfficial,['roblox.com','fortnite.com','minecraft.net','google.com','microsoft.com'].includes(q.choices[q.answer]));
}
let state=ctx.createUrlQuizState();
assert.equal(ctx.getUrlQuizScore(state),0);
assert.equal(ctx.advanceUrlQuiz(state),false);
for(const bad of [-1,4,1.5,NaN])assert.equal(ctx.answerUrlQuiz(state,bad),false);
for(let i=0;i<10;i++){
 assert.equal(ctx.answerUrlQuiz(state,questions[i].answer),true);
 assert.equal(ctx.answerUrlQuiz(state,(questions[i].answer+1)%4),false);
 assert.equal(ctx.getUrlQuizScore(state),i+1);
 assert.equal(ctx.advanceUrlQuiz(state),true);
}
assert(state.finished);assert.equal(ctx.advanceUrlQuiz(state),false);assert.equal(ctx.answerUrlQuiz(state,0),false);
state=ctx.createUrlQuizState();
for(const q of questions){ctx.answerUrlQuiz(state,(q.answer+1)%4);ctx.advanceUrlQuiz(state);}
assert.equal(ctx.getUrlQuizScore(state),0);
function element(){return {events:{},dataset:{},attrs:{},focused:false,open:false,setAttribute(k,v){this.attrs[k]=v;},matches(){return !!this.keyboardFocus;},contains(target){return target===this;},addEventListener(type,fn){this.events[type]=fn;},focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();},getBoundingClientRect(){return {left:0,top:0,right:500,bottom:500};}};}
const ids=Object.fromEntries(['url-quiz-button','url-quiz-dialog','url-quiz-content','url-quiz-counter','url-quiz-progress','url-quiz-close','url-quiz-safety-dialog','url-quiz-safety-content','url-quiz-safety-close','url-quiz-safety-dismiss'].map(id=>[id,element()]));
let choices=[];
Object.defineProperty(ids['url-quiz-content'],'innerHTML',{get(){return this.html;},set(html){
 this.html=html;
 choices=[...html.matchAll(/<button[^>]+data-quiz-choice="(\d+)"[^>]*>/g)].map(match=>{const el=element();el.dataset.quizChoice=match[1];el.disabled=/\sdisabled/.test(match[0]);return el;});
 for(const id of ['url-quiz-next','url-quiz-restart','url-quiz-safety-button'])if(html.includes(`id="${id}"`))ids[id]=element();
}});
ids['url-quiz-content'].querySelectorAll=()=>choices;
ids['url-quiz-content'].querySelector=()=>element();
ctx.document={getElementById:id=>ids[id]};
ctx.escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
callbacks.at(-1)();
ids['url-quiz-button'].events.click();assert(ids['url-quiz-dialog'].open);assert(ids['url-quiz-counter'].textContent.includes('1 / 10'));
ids['url-quiz-next'].events.click();assert(ids['url-quiz-counter'].textContent.includes('1 / 10'));
choices[questions[0].answer].events.click();ids['url-quiz-next'].events.click();
assert(ids['url-quiz-counter'].textContent.includes('2 / 10'));
ids['url-quiz-restart'].events.click();assert(ids['url-quiz-counter'].textContent.includes('1 / 10'));assert.equal(ids['url-quiz-progress'].value,0);assert(choices.every(button=>!button.disabled));
for(let i=0;i<10;i++){
 assert.match(ids['url-quiz-content'].html, /id="url-quiz-safety-button"[^>]*hidden/);
 const choice=i===0?questions[i].answer:(questions[i].answer+1)%4;
 choices[choice].events.click();
 assert(choices.every(button=>button.disabled));
 assert.doesNotMatch(ids['url-quiz-content'].html, /id="url-quiz-safety-button"[^>]*hidden/);
 assert(ids['url-quiz-content'].html.includes('is-correct'));
 assert(ids['url-quiz-content'].html.includes(`<mark class="url-quiz-domain is-official">${questions[i].choices[questions[i].answer]}</mark>`));
 assert(ids['url-quiz-content'].html.includes(i===0?'BONNE RÉPONSE !':'MAUVAISE RÉPONSE !'));
 assert(!ids['url-quiz-content'].html.includes('url-quiz-domain-verdict'));
 assert.equal((ids['url-quiz-content'].html.match(/<mark /g)||[]).length,1);
 const safety=ids['url-quiz-safety-button'],popup=ids['url-quiz-safety-dialog'];
 assert.equal(safety.events.pointerenter,undefined);
 assert.equal(safety.events.focus,undefined);
 assert(!popup.open);
 safety.events.click();assert(popup.open);
 const verdict=ids['url-quiz-safety-content'].innerHTML;
 assert(verdict.includes(ctx.formatUrlQuizAddress(questions[i],true,true)));
 assert(verdict.includes(questions[i].isOfficial?"OUI, il s’agit d’un nom de domaine officiel :":"NON, il s’agit d’une adresse trompeuse :"));
 assert.equal(verdict.includes('<span>DANGER</span>'),!questions[i].isOfficial);
 popup.events.click({target:popup,clientX:100,clientY:100});assert(popup.open);
 ids[i%2?'url-quiz-safety-close':'url-quiz-safety-dismiss'].events.click();
 assert(!popup.open);assert(safety.focused);assert(ids['url-quiz-dialog'].open);
 safety.events.click();
 popup.events.click({target:popup,clientX:600,clientY:600});assert(!popup.open);

 if(i===0){
  safety.events.click();assert(popup.open);
  ids['url-quiz-close'].events.click();assert(!ids['url-quiz-dialog'].open);assert(ids['url-quiz-button'].focused);assert(!popup.open);
  ids['url-quiz-button'].events.click();assert(choices.every(button=>button.disabled));
 }
 ids['url-quiz-next'].events.click();
}
assert.equal(ids['url-quiz-counter'].textContent,'Quiz terminé');assert.equal(ids['url-quiz-progress'].value,10);
assert(ids['url-quiz-content'].html.includes('url-quiz-score">1<span> / 10'));
ids['url-quiz-restart'].events.click();assert(ids['url-quiz-counter'].textContent.includes('1 / 10'));assert.equal(ids['url-quiz-progress'].value,0);assert(choices.every(button=>!button.disabled));assert(!ids['url-quiz-content'].html.includes('<mark'));assert(!ids['url-quiz-content'].html.includes('url-quiz-domain-verdict'));
ids['url-quiz-dialog'].events.click({target:ids['url-quiz-dialog'],clientX:600,clientY:600});assert(!ids['url-quiz-dialog'].open);
console.log('Quiz: 10 answers checked against PSL, locked choices, immediate feedback, navigation, resume, score, restart and modal close passed.');
