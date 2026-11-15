// Small DOM fixtures for unit tests. Geometry is explicit; these are not browser-layout tests.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../..');
class Element {
  constructor(tag = 'div', document = null) {
    this.tagName = tag; this.document = document; this.children = []; this.style = {};
    this.events = {}; this.dataset = {}; this.attributes = {}; this.className = '';
    this.clientWidth = 1000; this.clientHeight = 800; this.offsetWidth = 32; this.offsetHeight = 32;
    this.bounds = null; this.hidden = false; this.disabled = false; this.value = '';
    this.classList = {
      add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(' ').filter(name => !names.includes(name)).join(' '); },
      contains: name => this.className.split(' ').includes(name),
      toggle: name => { const present = this.classList.contains(name); this.classList[present ? 'remove' : 'add'](name); return !present; },
      [Symbol.iterator]: () => this.className.split(' ').filter(Boolean)[Symbol.iterator]()
    };
  }
  set innerHTML(html) {
    this.html = html; this.children = [];
    // Only expose template controls to fixtures. No parsing or layout is claimed here.
    this.templateControls = [...html.matchAll(/<([a-z][\w-]*)\b([^>]*?)>/gi)].map(match => {
      const child = new Element(match[1], this.document);
      for(const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(attr[1], attr[2]);
      child.disabled = /\sdisabled(?:\s|$)/.test(match[2]);
      child.parentNode = this;
      return child;
    });
  }
  get innerHTML() { return this.html || ''; }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
    if(key === 'class') this.className = String(value);
    if(key === 'id') { this.id = value; if(this.document) this.document.ids[value] = this; }
    if(key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, x) => x.toUpperCase())] = value;
  }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; if(child.id && this.document)this.document.ids[child.id]=child; return child; }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  replaceChildren(...children) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; this.templateControls = []; this.append(...children); }
  remove() { if(this.parentNode) { this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; } }
  replaceChild(other, previous) { const index=this.children.indexOf(previous); this.children[index]=other; other.parentNode=this; previous.parentNode=null; return previous; }
  replaceWith(other) { const parent = this.parentNode; parent.children[parent.children.indexOf(this)] = other; other.parentNode = parent; this.parentNode = null; }
  contains(other) { return this === other || this.children.some(child => child.contains(other)); }
  matches(selector) { if(selector === ':focus-visible') return !!this.keyboardFocus; if(selector.startsWith('.'))return this.classList.contains(selector.slice(1)); return this.tagName === selector; }
  closest(selector) { if(selector.split(',').some(part => this.matches(part.trim())))return this; return this.parentNode?.closest(selector) || null; }
  querySelectorAll(selector) {
    const choices = selector.split(',').map(part => part.trim().split(/\s+/).at(-1));
    const matches = child => choices.some(part => child.matches(part));
    return [...this.children, ...(this.templateControls || [])].flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { if(selector === 'input[type="radio"]:checked') return this.checked || null; return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.events[type] = (this.events[type] || []).filter(listener => listener !== fn); }
  emit(type, event = {}) { for(const listener of [...(this.events[type] || [])])listener(event); }
  focus() { if(this.document)this.document.activeElement = this; }
  setPointerCapture() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  getBoundingClientRect() {
    if(this.bounds) return this.bounds;
    const coordinate = (value, total) => value?.endsWith('%') ? parseFloat(value) * total / 100 : parseFloat(value) || 0;
    const left = coordinate(this.style.left, 1000), top = coordinate(this.style.top, 800);
    return { left, top, width:this.offsetWidth, height:this.offsetHeight, right:left+this.offsetWidth, bottom:top+this.offsetHeight };
  }
}
function createBrowser(files = ['exercise-logic.js', 'ui.js', 'app.js']) {
  const document = { ids: {}, events: {}, activeElement:null,
    createElement(tag) { return new Element(tag, this); },
    createTextNode(text) { const node = new Element('#text',this); node.textContent = text; return node; },
    getElementById(id) { return this.ids[id] || null; },
    querySelector(selector) { if(selector === 'dialog[open]') return Object.values(this.ids).find(node=>node.open) || null; return this.root.querySelector(selector); },
    querySelectorAll(selector) { return this.root.querySelectorAll(selector); },
    addEventListener(type,fn) { (this.events[type] ||= []).push(fn); }
  };
  document.root = new Element('body',document);
  function add(id,tag='div') { const node = document.createElement(tag); node.setAttribute('id',id); document.root.appendChild(node); return node; }
  for(const id of ['desktop','app-window','app-title','app-content','close-window','url-guide-button','official-domains-button','url-quiz-button','app-official-domains-button']) add(id);
  document.ids['app-window'].appendChild(document.ids['app-content']);
  document.ids['app-window'].bounds = {left:0,top:0,right:1000,bottom:800,width:1000,height:800};
  document.activeElement = document.ids['app-content'];
  const events = [];
  const context = {URL,document,window:{addEventListener(type,callback){events.push({type,callback});}}};
  vm.createContext(context);
  for(const file of files) vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context,{filename:path.join(root,'js',file)});
  return {context,document,add,events,content:document.ids['app-content'],appWindow:document.ids['app-window']};
}
const readData = () => JSON.parse(fs.readFileSync(path.join(root,'data/messages.json'),'utf8'));
module.exports = {root,Element,createBrowser,readData};
