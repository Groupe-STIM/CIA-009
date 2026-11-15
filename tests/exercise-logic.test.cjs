const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBrowser,readData} = require('./helpers/browser.cjs');
const {context:c} = createBrowser(['exercise-logic.js']);
const plain = value => JSON.parse(JSON.stringify(value));
const messages = [{phishing:false},{phishing:true},{phishing:false}];
test('Chat: no answer and empty exercises never count as successes',()=>{
 assert.deepEqual(plain(c.evaluateChatAnswers(messages,[])),{total:3,categorized:0,good:0,phishingCount:1,complete:false,success:false});
 assert.equal(c.evaluateChatAnswers([],[]).success,false);
});
test('Chat: incomplete, incorrect and invalid answers are distinguished',()=>{
 assert.equal(c.evaluateChatAnswers(messages,['normal']).complete,false);
 const wrong=c.evaluateChatAnswers(messages,['phishing','phishing','normal']);assert(wrong.complete);assert.equal(wrong.good,2);assert(!wrong.success);
 assert.equal(c.evaluateChatAnswers(messages,['normal','unknown','normal']).categorized,2);
});
test('Chat: all correct answers unlock successful completion',()=>{
 const result=c.evaluateChatAnswers(messages,['normal','phishing','normal']);assert(result.complete);assert(result.success);assert.equal(result.good,3);
});
for(const [game,list] of Object.entries(readData().games))test(`Chat ${game}: actual totals and phishing hint follow the data`,()=>{
 const answers=list.map(m=>m.phishing?'phishing':'normal');const result=c.evaluateChatAnswers(list,answers);assert(result.success);assert.equal(result.total,game==='minecraft'?6:10);assert.equal(result.phishingCount,game==='minecraft'?4:5);
});
const box={left:100,top:100,right:200,bottom:200};
const flag=(x,y)=>({left:x-10,top:y-10,width:20,height:20});
test('Flags: the center, rather than partial overlap, determines a hit',()=>{
 assert.equal(c.scoreFlagPlacements([box],[flag(95,150)]).incorrectCount,1);
 assert(c.scoreFlagPlacements([box],[flag(150,150)]).success);
});
test('Flags: centers on each target edge count as inside',()=>{
 for(const [x,y] of [[100,150],[200,150],[150,100],[150,200]])assert(c.scoreFlagPlacements([box],[flag(x,y)]).success);
});
test('Flags: extra wrong flags prevent success even when every target is found',()=>{
 const r=c.scoreFlagPlacements([box],[flag(150,150),flag(500,500),flag(700,700)]);assert.equal(r.correctCount,1);assert.equal(r.incorrectCount,2);assert(!r.success);
});
test('Flags: duplicate markers do not increase the number of detected clues',()=>{
 const r=c.scoreFlagPlacements([box],[flag(150,150),flag(160,160)]);assert.equal(r.correctCount,1);assert.equal(r.incorrectCount,0);
});
test('Flags: multiple targets, missing markers and empty exercises',()=>{
 const boxes=[box,{left:300,top:100,right:400,bottom:200}];assert.equal(c.scoreFlagPlacements(boxes,[flag(150,150)]).success,false);assert(c.scoreFlagPlacements(boxes,[flag(150,150),flag(350,150)]).success);assert.equal(c.scoreFlagPlacements([],[]).success,false);assert.equal(c.scoreFlagPlacements([], [flag(1,1)]).incorrectCount,1);
});
test('Chat HTML: appends a link once, or replaces its existing occurrence once',()=>{
 for(const text of ['Regarde example.net','Regarde ceci']){const html=c.buildGameChatHtml('Roblox',[{user:'Alex',text,href:'https://example.net',hrefText:'example.net'}]);assert.equal((html.match(/class="mc-discord-text"/g)||[]).length,1);assert(html.includes('disabled>Valider'));}
});
test('Chat HTML: escapes author, text and URL attributes before generating markup',()=>{
 const html=c.buildGameChatHtml('Roblox',[{user:'<img src=x onerror=alert(1)>',text:'<script>boom</script>',href:'https://example.net/" onmouseover="alert(1)',hrefText:'<b>site</b>'}]);assert(!html.includes('<img'));assert(!html.includes('<script>'));assert(!html.includes(' onmouseover="'));assert(html.includes('&lt;b&gt;site&lt;/b&gt;'));
});
test('HTML escaping handles null, numbers, apostrophes and ampersands',()=>{
 assert.equal(c.escapeHtml(null),'');assert.equal(c.escapeHtml(42),'42');assert.equal(c.escapeHtml(`<&"'>`),'&lt;&amp;&quot;&#39;&gt;');
});
