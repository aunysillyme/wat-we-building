import {readFileSync} from 'fs';
const src=readFileSync('index.html','utf8');
const fn=src.match(/function positiveText\(text\)\{[^\n]*\}/)[0];
const positiveText=new Function('return ('+fn.replace('function positiveText','function')+')')();
const wordIn=(t,w)=>new RegExp('\\b'+w.replace(/ /g,'\\s+')+'\\b','i').test(t);
const cases=[
 ['No login except for admin, who needs an account.', 'account', true,  'review finding: real need after except'],
 ['No accounts, database or network calls.',          'database', false,'existing sample: genuine negation list'],
 ['One HTML file. Keep data in memory. No email sending, uploads, accounts or server.','email',false,'form-to-summary sample'],
 ['No framework, but it does need a database.',       'database', true, 'but-clause already handled'],
];
let bad=0;
for(const [text,word,want,label] of cases){
  const got=wordIn(positiveText(text),word);
  const ok=got===want; if(!ok)bad++;
  console.log(`${ok?'PASS':'FAIL'} [${label}] "${word}" detected=${got} want=${want}`);
}
console.log(bad?`${bad} failing`:'all pass');
process.exit(bad?1:0);
