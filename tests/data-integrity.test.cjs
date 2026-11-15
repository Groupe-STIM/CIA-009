const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {root,readData}=require('./helpers/browser.cjs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const data=readData();
test('External and embedded exercise data are identical for offline use',()=>{
 const embedded=html.match(/<script id="embedded-messages" type="application\/json">([\s\S]*?)<\/script>/);assert(embedded);assert.deepEqual(JSON.parse(embedded[1]),data);
});
test('Current message totals and classifications are preserved',()=>{
 for(const [key,list] of Object.entries(data.games)){assert.equal(list.length,key==='minecraft'?6:10);assert.equal(list.filter(m=>m.phishing).length,key==='minecraft'?4:5);assert.equal(new Set(list.map(m=>m.id)).size,list.length);}
 assert.equal(data.outlook.emails.length,5);assert(data.outlook.emails.every(email=>email.clues.length===4));
 assert.deepEqual(data.sms.conversations.map(c=>c.parts.filter(p=>p.suspect).length),[2,4,1]);
 for(const [key,c] of Object.entries(data.discord.communities)){assert.equal(c.messages.length,4);assert.equal(c.messages.filter(m=>m.phishing).length,key==='minecraft'?2:1);}
});
test('Minecraft edited order and Fortnite swapped messages remain fixed',()=>{
 assert.deepEqual(data.games.minecraft.map(m=>m.id),[5,9,3,6,8,10]);assert.equal(data.games.fortnite[7].user,'Epic_Security');assert.equal(data.games.fortnite[9].href,'https://fortnite.com.costumes-gratuits.net');
});
test('All HTML IDs are unique and all referenced scripts exist in dependency order',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);for(const src of scripts)assert(fs.existsSync(path.join(root,src)),src);
 assert(scripts.indexOf('js/exercise-logic.js')<scripts.indexOf('js/ui.js'));assert(scripts.indexOf('js/exercise-logic.js')<scripts.indexOf('js/app.js'));assert(scripts.indexOf('js/public-suffix-list.js')<scripts.indexOf('js/url-guide.js'));assert(scripts.indexOf('js/url-guide.js')<scripts.indexOf('js/url-quiz.js'));
});
test('Desktop app order and separated SMS/Outlook groups are preserved',()=>{
 assert.deepEqual([...html.matchAll(/class="icon" data-app="([^"]+)"/g)].map(m=>m[1]),['roblox','fortnite','minecraft','sms','outlook','discord']);assert(html.indexOf('data-app="sms"')<html.indexOf('class="desktop-icon-spacer"'));assert(html.indexOf('class="desktop-icon-spacer"')<html.indexOf('data-app="outlook"'));
});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name)]);}
const sources=[html,JSON.stringify(data),fs.readFileSync(path.join(root,'styles/styles.css'),'utf8'),...walk(path.join(root,'js')).map(file=>fs.readFileSync(file,'utf8'))].join('\n');
test('Every bundled image is referenced by the production app',()=>{
 for(const file of walk(path.join(root,'assets')))assert(sources.includes(path.basename(file)),`Unused resource: ${file}`);
});
test('All literal resource paths point to existing local files',()=>{
 for(const match of sources.matchAll(/(?:\.\.\/)?assets\/images\/[\w./-]+/g)){const file=match[0].replace(/^\.\.\//,'');assert(fs.existsSync(path.join(root,file)),file);}
});
test('No retired blank page, screenshot paths or stale optional Outlook branch remains',()=>{
 assert(!fs.existsSync(path.join(root,'blank.html')));for(const name of ['blank.html','Outlook_Background.png','Discord_message_privee.png','apple.ico','onlyActionClue'])assert(!sources.includes(name),name);
});
