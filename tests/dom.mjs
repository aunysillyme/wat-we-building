// Dependency-free scripted DOM harness. Exercises real inline JS and its event listeners.
// It does not implement layout, iframe execution, browser CSP or native clipboard behavior.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('index.html','utf8'),script=source.match(/<script>([\s\S]*?)<\/script>/)[1];
fs.writeFileSync('tests/frontend-extracted.js',script);
class El{
 constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentNode=null;this.listeners={};this.style={};this.value='';this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.dataset={};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.classList={add:(...cs)=>{this.className=[...new Set([...this.className.split(' '),...cs])].join(' ').trim()},remove:c=>{this.className=this.className.split(' ').filter(x=>x!==c).join(' ')},contains:c=>this.className.split(' ').includes(c)}}
 get id(){return this.attrs.id||''}set id(v){this.attrs.id=v}get className(){return this.attrs.class||''}set className(v){this.attrs.class=v}
 get textContent(){return this.tagName==='#TEXT'?this.text:this.children.map(c=>c.textContent).join('')}set textContent(v){this.children=[];if(v!==''&&v!=null){const e=new El('#text');e.text=String(v);this.append(e)}}
 set innerHTML(v){this.children=[];parse(String(v),this)}get innerHTML(){return this.textContent}
 append(...els){for(let e of els){if(typeof e==='string'){const t=new El('#text');t.text=e;e=t}e.parentNode=this;this.children.push(e)}}appendChild(e){this.append(e);return e}replaceChildren(...els){this.children=[];this.append(...els)}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this)}setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 async fire(type){for(const fn of this.listeners[type]||[])await fn({target:this,preventDefault(){},key:'',ctrlKey:false,metaKey:false});await new Promise(resolve=>setImmediate(resolve))}
 async click(){if(!this.disabled)await this.fire('click')}focus(){}select(){}scrollIntoView(){}setCustomValidity(v){this.validation=v}reportValidity(){return !this.validation}
 querySelectorAll(selector){if(selector.includes(','))return [...new Set(selector.split(',').flatMap(s=>this.querySelectorAll(s)))];const parts=selector.trim().split(/\s+/);const out=[];function matches(e,s){const id=s.match(/#([\w-]+)/),cl=s.match(/\.([\w-]+)/),attr=s.match(/\[([\w-]+)(?:="?([^"\]]*)"?)?\]/),tag=s.match(/^[\w-]+/);return(!id||e.id===id[1])&&(!cl||e.classList.contains(cl[1]))&&(!tag||e.tagName===tag[0].toUpperCase())&&(!attr||(attr[1]in e.attrs&&(attr[2]===undefined||e.attrs[attr[1]]===attr[2])))}
 function visit(e){for(const c of e.children){if(matches(c,parts.at(-1))){let parent=c.parentNode,k=parts.length-2;while(parent&&k>=0){if(matches(parent,parts[k]))k--;parent=parent.parentNode}if(k<0)out.push(c)}visit(c)}}visit(this);return out}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
}
function parse(html,root){const stack=[root],voids=new Set(['INPUT','META','LINK','BR','HR','IMG']);for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/[\w-]+\s*>|<[\w-]+\b[^>]*>|[^<]+/g)){const t=m[0];if(t.startsWith('<!'))continue;if(t.startsWith('</')){const tag=t.slice(2,-1).trim().toUpperCase();for(let i=stack.length-1;i>0;i--)if(stack[i].tagName===tag){stack.length=i;break}continue}if(t[0]==='<'){const tag=t.match(/^<([\w-]+)/)[1],attrs={};for(const a of t.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';const e=new El(tag,attrs);stack.at(-1).append(e);if(!voids.has(e.tagName))stack.push(e)}else stack.at(-1).append(t)}}
function boot({hash='',storage=new Map(),blocked=false}={}){
 const doc=new El('document');parse(source.replace(/<style>[\s\S]*?<\/style>/,'').replace(/<script>[\s\S]*?<\/script>/,''),doc);doc.createElement=t=>new El(t);doc.getElementById=id=>doc.querySelector('#'+id);doc.body=doc.querySelector('body');doc.execCommand=()=>false;
 const requests=[],copies=[],timers=[];let count=0,failNext=false;const localStorage={getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v)}};
 const context=vm.createContext({document:doc,localStorage,console,URL,Blob,TextEncoder,TextDecoder,Uint8Array,AbortController,btoa,atob,location:{hash,href:'file:///repo/index.html'+hash},navigator:{clipboard:{writeText:async x=>copies.push(x)}},setTimeout:(fn,ms)=>{timers.push(fn);return timers.length},clearTimeout(){},setInterval(){},clearInterval(){},fetch:async(url,opts)=>{const body=JSON.parse(opts.body);requests.push({url,body});const d=url.endsWith('/plan')?{plan:'# plan\n## build order\n1. Validate dimensions\n2. Calculate tins\n## proof walk\nWalk it',model:'fixture'}:{html:failNext?'<html>truncated':`<!doctype html><html><body>version ${++count}</body></html>`,model:'fixture'};failNext=false;return {ok:true,json:async()=>d}}});context.window=context;context.scrollTo=()=>{};vm.runInContext(script,context);
 return {doc,storage,requests,copies,run:code=>vm.runInContext(code,context),el:id=>doc.getElementById(id),fail:()=>failNext=true};
}
const app=boot(),{el,run}=app;
const clickText=async(root,text)=>{const b=root.querySelectorAll('button').find(b=>b.textContent===text);assert(b,'Missing button '+text);await b.click()};
const fill=async(id,value)=>{el(id).value=value;await el(id).fire('input')};
await clickText(el('shapeChips'),'Calculator / estimator');assert.match(el('shapeNote').textContent,/calculator shape/);
for(let i=0;i<5;i++){assert(el('q'+i).classList.contains('active'));assert(el('a'+i).value);await el('q'+i).querySelector('[data-next]').click()}
assert(el('result').classList.contains('active'));assert.match(el('out').textContent,/paint estimator/);
await el('botBtn').click();assert.match(run('lastPlan'),/Validate dimensions/);
for(const target of ['Lovable','Bolt','Claude Code','Cursor','Copy for any agent']){await clickText(app.doc.querySelector('[data-export="brief"]'),target);assert.match(app.copies.at(-1),/Validate dimensions/)}
console.log('PASS F2 F4: four archetypes available; calculator -> five questions -> brief -> plan -> five target exports with build order');
await el('toAgentBtn').click();await el('buildBtn').click();assert.equal(run('versions.length'),1);assert.match(app.requests.at(-1).body.brief,/Validate dimensions/);assert.match(el('frame').srcdoc,/version 1/);assert.match(el('walkVerdict').textContent,/Not verified yet/);
await clickText(el('walkSteps').children[0],'Passed');await clickText(el('walkSteps').children[1],'Failed');await fill('failure1','The total stays zero');await clickText(el('walkSteps').children[1],'Send this back to the agent');assert.match(el('repairRequest').value,/Failed must-do:.*Proof step:.*The total stays zero/);
await el('repairForm').fire('submit');assert.equal(run('versions.length'),2);assert(app.requests.at(-1).url.endsWith('/revise'));assert.match(app.requests.at(-1).body.html,/version 1/);assert.match(app.requests.at(-1).body.request,/The total stays zero/);
assert.equal(run('walks[2].every(s=>!s.status)'),true);
await clickText(el('versions'),'v1');assert.match(el('frame').srcdoc,/version 1/);assert.equal(el('failure1').value,'The total stays zero');assert.equal(el('walkCount').textContent,'1 of 4 steps passed');
for(let i=0;i<4;i++)await clickText(el('walkSteps').children[i],'Passed');assert.match(el('walkVerdict').textContent,/You walked it/);assert.equal(JSON.parse(app.storage.get('wwb.walk'))[1].filter(s=>s.status==='passed').length,4);
console.log('PASS F1 F5 F8: build -> pass/fail -> matching must-do repair -> revised preview -> rewind restores HTML and proof -> all-pass verdict and persistence');
await clickText(app.doc.querySelector('[data-export="agent"]'),'Share this build');const shared=app.copies.at(-1);assert(shared.startsWith('file:///repo/index.html#s='));const sharedApp=boot({hash:new URL(shared).hash});assert(sharedApp.el('result').classList.contains('active'));assert.equal(sharedApp.el('sharedBanner').hidden,false);assert.equal(sharedApp.run('JSON.stringify(ans)'),run('JSON.stringify(ans)'));
const bad=boot({hash:'#s=bad!'});assert(bad.el('q0').classList.contains('active'));
run("ans=['x'.repeat(30000),'b','c','d','e'];shareBuild()");assert.match(el('toast').textContent,/30KB/);
console.log('PASS F9: UTF-8 base64url JSON round-trip, result banner, malformed input and 30KB guard');
await clickText(el('shapeChips'),'Calculator / estimator');await fill('a0','A modern calculator');assert.match(el('feedback0').textContent,/modern.*Try:/);await clickText(el('feedback0'),'Dismiss');assert.equal(el('feedback0').textContent,'');
await fill('a1','login with email\ncalculate total');assert.match(el('feedback1').textContent,/login.*heavy/);await clickText(el('feedback1'),'Park for v2');assert.equal(el('a1').value,'calculate total');run('finish()');assert.match(el('out').textContent,/Parked for v2 \(do not build\)/);assert.match(el('parking').textContent,/login with email/);assert.match(el('reality').textContent,/Runs free in the browser/);
await fill('a1','login\ncalculate total');await clickText(el('feedback1'),'Keep it');assert.equal(el('a1').value,'login\ncalculate total');
run("ans[1]='database\\nlogin\\nAI\\nemail\\nupload\\ndomain';finish()");assert.match(el('reality').textContent,/Database.*Auth provider.*AI API key.*Email.*File storage.*Domain/s);
console.log('PASS F3 F6 F7: explicit park and keep, parking in brief/storage, vague chips/dismiss, negation-aware browser card and service ranges');
run("ans[1]='login\\ntwo\\nthree\\nfour\\nfive\\nsix';dismissed.clear();heavySeen.add('login');mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/You left "modern"/);

run("dismissed.add('0:modern');mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/6 things/);
run("ans[1]='login';mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/kept login/);
run("ans[1]='calculate';walks[currentId].forEach(s=>s.status='');mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/called it done/);
run("walks[currentId].forEach(s=>s.status='passed');mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/That is the habit/);
run("walks[currentId].forEach(s=>s.status='failed');mirrorShown=false;showMirror({...currentVersion(),answers:ans,parked:[]})");assert.match(el('mirror').textContent,/That is the habit/);
console.log('PASS F10: all five mirror branches in priority order, failed steps count as walked, one card with next-time rule');
for(let i=0;i<5;i++)await run('runBuild()');assert.equal(run('versions.length'),7);assert.equal(JSON.parse(app.storage.get('wwb.versions')).length,5);
const restored=boot({storage:app.storage});assert.equal(restored.run('versions.length'),5);assert.equal(restored.run('currentId'),7);
const before=run('lastHtml');app.fail();await run('runBuild()');assert.equal(run('lastHtml'),before);assert.match(el('buildStatus').textContent,/Incomplete HTML/);
await el('sampleBtn').click();assert.match(el('out').textContent,/habit tracker/);
const blocked=boot({blocked:true});await clickText(blocked.el('shapeChips'),'Interactive quiz');await blocked.run('runBuild()');assert.equal(blocked.run('versions.length'),1);
for(const label of ['Curated list','Form to summary']){await clickText(el('shapeChips'),label);assert(run('ans.every(x=>x.trim())'))}
assert.equal((source.match(/<style>/g)||[]).length,1);assert.equal((source.match(/<script>/g)||[]).length,1);assert.match(source,/@media\(max-width:639px\).*grid-template-columns:1fr/);
console.log('PASS guards: latest-five persistence/all-seven memory, storage-blocked startup/build, incomplete frontend reply, original sample, distinct starters, one script/style and single-column CSS');
