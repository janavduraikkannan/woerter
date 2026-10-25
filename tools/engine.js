/* ===================== ENGINE ===================== */
/* Wörter's German sentence engine. Same shape as Palabras' Spanish engine: every sentence is a list of tokens
   ({la: the German word(s), alt, forms, lemma, concept, cids, vocab, why}), plus English versions and other
   accepted German word orders (altTokens). */
const R=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
const T6=s=>s.split(' ');
let VOS=false; // here: also use Sie, the formal "you" (the UI's checkbox)
function setLimit(on){VOS=!!on}
let ALT=[];
const GN={m:'masculine',f:'feminine',n:'neuter',pl:'plural'};
const CN={nom:'nominative',akk:'accusative',dat:'dative',gen:'genitive'};
const TN={pres:'present',praet:'simple past (Präteritum)',perf:'present perfect (Perfekt)',plusq:'past perfect (Plusquamperfekt)',fut:'future (werden + infinitive)',k2:'subjunctive II (Konjunktiv II)',k2p:'past subjunctive II',pass:'passive (present)',passp:'passive (simple past)',imp:'command (imperative)'};
const PERS=['ich','du','er / sie / es','wir','ihr','sie / Sie'];

/* ---------- spelling: umlauts and ß ---------- */
// ae, oe, ue and ss are the standard way to write ä, ö, ü and ß without the keys, so they count as fully correct
const foldDE=s=>String(s).toLowerCase().normalize('NFC').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
const stripU=s=>foldDE(s).replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u');
const stripA=stripU;

/* ---------- verbs ----------
   inf | English: base, past, participle, -ing | object noun tags | flags | aux (h haben, s sein) | Partizip II | Präteritum (ich) | du/er forms if the stem changes
   flags: T takes an accusative object, I can add a dative (indirect) object, D takes a dative object instead (helfen),
   M motion to a place, L happens at a place, P put somewhere (legen, stellen), S be somewhere (liegen, stehen, sitzen), N fine with nothing after it
   a separable verb is written an|rufen */
const VERBS=`spielen|play,played,played,playing|g|TLN|h|gespielt|spielte|
machen|do,did,done,doing|h|TL|h|gemacht|machte|
kaufen|buy,bought,bought,buying|fdtbc|TIL|h|gekauft|kaufte|
lernen|learn,learned,learned,learning|x|TLN|h|gelernt|lernte|
hören|listen to,listened to,listened to,listening to|m|T|h|gehört|hörte|
kochen|cook,cooked,cooked,cooking|k|TIL|h|gekocht|kochte|
besuchen|visit,visited,visited,visiting|p|T|h|besucht|besuchte|
brauchen|need,needed,needed,needing|tcb|T|h|gebraucht|brauchte|
suchen|look for,looked for,looked for,looking for|tap|T|h|gesucht|suchte|
finden|find,found,found,finding|tab|T|h|gefunden|fand|
sehen|see,saw,seen,seeing|pav|T|h|gesehen|sah|siehst sieht
lesen|read,read,read,reading|b|TLN|h|gelesen|las|liest liest
essen|eat,ate,eaten,eating|f|TLN|h|gegessen|aß|isst isst
trinken|drink,drank,drunk,drinking|d|TL|h|getrunken|trank|
schreiben|write,wrote,written,writing|w|TIL|h|geschrieben|schrieb|
nehmen|take,took,taken,taking|tf|T|h|genommen|nahm|nimmst nimmt
geben|give,gave,given,giving|tbf|TI|h|gegeben|gab|gibst gibt
schenken|give,gave,given,giving|tb|TI|h|geschenkt|schenkte|
zeigen|show,showed,shown,showing|vt|TI|h|gezeigt|zeigte|
bringen|bring,brought,brought,bringing|fdt|TI|h|gebracht|brachte|
tragen|wear,wore,worn,wearing|c|T|h|getragen|trug|trägst trägt
waschen|wash,washed,washed,washing|cq|T|h|gewaschen|wusch|wäschst wäscht
lieben|love,loved,loved,loving|pa|T|h|geliebt|liebte|
haben|have,had,had,having|aq|T|h|gehabt|hatte|hast hat
fragen|ask,asked,asked,asking|p|T|h|gefragt|fragte|
an|rufen|call,called,called,calling|p|T|h|angerufen|rief|
ein|laden|invite,invited,invited,inviting|p|T|h|eingeladen|lud|lädst lädt
mit|bringen|bring,brought,brought,bringing|fd|T|h|mitgebracht|brachte|
fern|sehen|watch TV,watched TV,watched TV,watching TV||LN|h|ferngesehen|sah|siehst sieht
auf|stehen|get up,got up,gotten up,getting up||N|s|aufgestanden|stand|
ein|kaufen|go shopping,went shopping,gone shopping,going shopping||LN|h|eingekauft|kaufte|
helfen|help,helped,helped,helping|p|D|h|geholfen|half|hilfst hilft
danken|thank,thanked,thanked,thanking|p|D|h|gedankt|dankte|
antworten|answer,answered,answered,answering|p|D|h|geantwortet|antwortete|
gehen|go,went,gone,going||M|s|gegangen|ging|
fahren|drive,drove,driven,driving||M|s|gefahren|fuhr|fährst fährt
laufen|run,ran,run,running||MN|s|gelaufen|lief|läufst läuft
kommen|come,came,come,coming||MN|s|gekommen|kam|
fliegen|fly,flew,flown,flying||M|s|geflogen|flog|
wohnen|live,lived,lived,living||L|h|gewohnt|wohnte|
arbeiten|work,worked,worked,working||LN|h|gearbeitet|arbeitete|
schlafen|sleep,slept,slept,sleeping||LN|h|geschlafen|schlief|schläfst schläft
tanzen|dance,danced,danced,dancing||LN|h|getanzt|tanzte|
schwimmen|swim,swam,swum,swimming||N|s|geschwommen|schwamm|
bleiben|stay,stayed,stayed,staying||LN|s|geblieben|blieb|
warten|wait,waited,waited,waiting||N|h|gewartet|wartete|
sitzen|sit,sat,sat,sitting||S|h|gesessen|saß|
liegen|lie,lay,lain,lying||S|h|gelegen|lag|
stehen|stand,stood,stood,standing||S|h|gestanden|stand|
legen|put,put,put,putting|bt|P|h|gelegt|legte|
bezahlen|pay for,paid for,paid for,paying for|fdc|T|h|bezahlt|bezahlte|
verkaufen|sell,sold,sold,selling|tcb|TI|h|verkauft|verkaufte|
erzählen|tell,told,told,telling|y|TI|h|erzählt|erzählte|
vergessen|forget,forgot,forgotten,forgetting|tw|T|h|vergessen|vergaß|vergisst vergisst
verstehen|understand,understood,understood,understanding|p|T|h|verstanden|verstand|
stellen|put,put,put,putting|t|P|h|gestellt|stellte|`.split('\n').map(l=>{
  const parts=l.split('|');let pre='';if(parts.length===9){pre=parts.shift()}
  const[base,en,obj,fl,aux,pp,praet,sc]=parts;const[e,past,epp,ing]=en.split(',');
  return{inf:pre+base,base,pre,e,past,pp:epp,ing,obj,fl,aux,part:pp,praet,sc:sc?sc.split(' '):null}});
// English verbs that differ by context
const EN_ALT={fahren:[['go','went','gone','going'],['ride','rode','ridden','riding']],laufen:[['walk','walked','walked','walking']],schenken:[['give as a gift','gave as a gift','given as a gift','giving as a gift']],hören:[['hear','heard','heard','hearing']],
  kommen:[],legen:[['lay','laid','laid','laying'],['place','placed','placed','placing']],stellen:[['place','placed','placed','placing'],['set','set','set','setting']],tragen:[['carry','carried','carried','carrying']],ein_kaufen:[['shop','shopped','shopped','shopping']],lernen:[['study','studied','studied','studying']],
  machen:[['make','made','made','making']],kochen:[['make','made','made','making']],an_rufen:[['phone','phoned','phoned','phoning']]};
const vb=inf=>VERBS.find(v=>v.inf===inf)||SPECIAL[inf];
/* irregular verbs with whole tables */
const TAB=(pres,praet,k2,part,aux,e,extra={})=>Object.assign({inf:extra.inf,base:extra.inf,pre:'',irrT:{pres:T6(pres),praet:T6(praet),k2:T6(k2)},part,aux,e:e[0],past:e[1],pp:e[2],ing:e[3],obj:'',fl:''},extra);
const SPECIAL={
  sein:TAB('bin bist ist sind seid sind','war warst war waren wart waren','wäre wärst wäre wären wärt wären','gewesen','s',['be','was','been','being'],{inf:'sein'}),
  haben:null,
  werden:TAB('werde wirst wird werden werdet werden','wurde wurdest wurde wurden wurdet wurden','würde würdest würde würden würdet würden','geworden','s',['become','became','become','becoming'],{inf:'werden'}),
  wissen:TAB('weiß weißt weiß wissen wisst wissen','wusste wusstest wusste wussten wusstet wussten','wüsste wüsstest wüsste wüssten wüsstet wüssten','gewusst','h',['know','knew','known','knowing'],{inf:'wissen'}),
  können:TAB('kann kannst kann können könnt können','konnte konntest konnte konnten konntet konnten','könnte könntest könnte könnten könntet könnten','gekonnt','h',['can','could','been able to','being able to'],{inf:'können',modal:1}),
  müssen:TAB('muss musst muss müssen müsst müssen','musste musstest musste mussten musstet mussten','müsste müsstest müsste müssten müsstet müssten','gemusst','h',['must','had to','had to','having to'],{inf:'müssen',modal:1}),
  dürfen:TAB('darf darfst darf dürfen dürft dürfen','durfte durftest durfte durften durftet durften','dürfte dürftest dürfte dürften dürftet dürften','gedurft','h',['may','was allowed to','been allowed to','being allowed to'],{inf:'dürfen',modal:1}),
  sollen:TAB('soll sollst soll sollen sollt sollen','sollte solltest sollte sollten solltet sollten','sollte solltest sollte sollten solltet sollten','gesollt','h',['should','was supposed to','been supposed to','being supposed to'],{inf:'sollen',modal:1}),
  wollen:TAB('will willst will wollen wollt wollen','wollte wolltest wollte wollten wolltet wollten','wollte wolltest wollte wollten wolltet wollten','gewollt','h',['want','wanted','wanted','wanting'],{inf:'wollen',modal:1}),
  möchten:TAB('möchte möchtest möchte möchten möchtet möchten','wollte wolltest wollte wollten wolltet wollten','möchte möchtest möchte möchten möchtet möchten','gewollt','h',['would like','wanted','wanted','wanting'],{inf:'möchten',modal:1}),
};
SPECIAL.haben=Object.assign(VERBS.find(v=>v.inf==='haben'),{irrT:{pres:T6('habe hast hat haben habt haben'),praet:T6('hatte hattest hatte hatten hattet hatten'),k2:T6('hätte hättest hätte hätten hättet hätten')}});
const MODALS=['können','müssen','dürfen','sollen','wollen'];
/* present tense of the verb itself (for a separable verb: of the base verb; the prefix goes elsewhere) */
function presF(v,p){
  if(v.irrT)return v.irrT.pres[p];
  const b=v.base,st=b.replace(/e?n$/,'');
  if(v.sc&&(p===1||p===2))return v.sc[p-1];
  const eIns=/[td]$/.test(st)||/[^aeiouhlrmn][mn]$/.test(st),sib=/[sßzx]$/.test(st);
  return st+[ 'e', eIns?'est':sib?'t':'st', eIns?'et':'t','en',eIns?'et':'t','en'][p];
}
function praetF(v,p){
  if(v.irrT)return v.irrT.praet[p];
  const s=v.praet;
  if(/te$/.test(s))return s+['','st','','n','t','n'][p];
  const dt=/[dt]$/.test(s),sib=/[sßz]$/.test(s);
  return s+['',dt||sib?'est':'st','','en',dt?'et':'t','en'][p];
}
function k2F(v,p){if(v.irrT&&v.irrT.k2)return v.irrT.k2[p];return null}
const WURDE=T6('würde würdest würde würden würdet würden'),WERDE=T6('werde wirst wird werden werdet werden');
const infOf=v=>v.inf;
/* every form a student might confuse with the right one (for the umlaut check) */
const vforms=v=>{const out=new Set();for(let p=0;p<6;p++){out.add(presF(v,p));out.add(praetF(v,p));const k=k2F(v,p);if(k)out.add(k)}out.add(v.inf);out.add(v.part);return[...out]};
function verbV(v){
  if(v.modal||v.inf==='sein'||v.inf==='werden'||v.inf==='wissen')return `${v.inf} (${presF(v,2)}), ${praetF(v,2)}, ${v.aux==='s'?'ist':'hat'} ${v.part} : ${v.inf==='möchten'?'would like (to)':v.e==='can'?'can, be able to':v.e==='must'?'must, have to':v.e==='may'?'may, be allowed to':v.e==='should'?'should, be supposed to':v.e==='want'?'want (to)':'to '+v.e}`;
  const sep=v.pre?`${v.pre}|${v.base}`:v.inf,er=presF(v,2)+(v.pre?' '+v.pre:''),strong=!/te$/.test(v.praet);
  return `${sep}${v.sc?` (${er})`:''}, ${praetF(v,2)}${v.pre&&strong?' '+v.pre:v.pre?' '+v.pre:''}, ${v.aux==='s'?'ist':'hat'} ${v.part} : ${v.e}`;
}

/* ---------- English verbs ---------- */
const BE=['am','are','is','are','are','are'],WAS=['was','were','was','were','were','were'];
const s3=b=>{const[w,...r]=b.split(' ');let x;if(w==='have')x='has';else if(w==='be')x='is';else if(w==='do')x='does';else if(w==='go')x='goes';else if(/(s|sh|ch|x|z|o)$/.test(w))x=w+'es';else if(/[^aeiou]y$/.test(w))x=w.slice(0,-1)+'ies';else x=w+'s';return[x,...r].join(' ')};
const vE=(v)=>[[v.e,v.past,v.pp,v.ing],...(EN_ALT[v.inf.replace(/^(an|ein|mit|fern|auf)(?=\w)/,'$1_')]||EN_ALT[v.inf]||[])];
/* English verb phrases for a German tense. Every list starts with the most natural version. */
const STATIVE=new Set(['haben','brauchen','lieben','wissen','sehen','finden','verstehen','möchten','gehören']);
function ev(v,t,ep,neg){
  const s=ep===2,out=[];const st0=STATIVE.has(v.inf);
  if(v.inf==='sein'){
    const be=BE[ep],was=WAS[ep],n=neg?' not':'';
    return{pres:[be+n],praet:[was+n],perf:[was+n,(s?'has':'have')+n+' been'],plusq:['had'+n+' been'],fut:['will'+n+' be',be+n+' going to be'],k2:['would'+n+' be',were(ep)+n]}[t]||[be+n];
  }
  for(const[b,past,pp,ing]of vE(v)){
    const be=BE[ep],was=WAS[ep],has=s?'has':'have',dO=s?'does':'do',x=s?s3(b):b;
    if(!neg)out.push(...({pres:[x,be+' '+ing],praet:[past,was+' '+ing],perf:[past,has+' '+pp],plusq:['had '+pp],fut:['will '+b,be+' going to '+b],k2:['would '+b],k2p:['would have '+pp]}[t]||[x]));
    else out.push(...({pres:[dO+' not '+b,be+' not '+ing],praet:['did not '+b,was+' not '+ing],perf:['did not '+b,has+' not '+pp],plusq:['had not '+pp],fut:['will not '+b,be+' not going to '+b],k2:['would not '+b],k2p:['would not have '+pp]}[t]||[dO+' not '+b]));
  }
  return[...new Set(out)].filter(x=>!(st0&&/\b(am|is|are|was|were)( not)? \w+ing\b/.test(x)&&!/going to/.test(x)));
}
const were=ep=>ep===0||ep===2?'were':'were';
/* English modal + verb */
function evModal(m,v,t,ep,neg){
  const s=ep===2,be=BE[ep],was=WAS[ep],dO=s?'does':'do',b=vE(v).map(x=>x[0]),n=neg?' not':'';
  const X=f=>b.flatMap(f);
  if(t==='praet'||t==='perf')return X(x=>({können:[`could${n} ${x}`,`was${n} able to ${x}`.replace('was',was)],müssen:neg?[`did not have to ${x}`]:[`had to ${x}`],dürfen:[`was${n} allowed to ${x}`.replace('was',was),...(neg?[`could not ${x}`]:[`could ${x}`])],sollen:[`was${n} supposed to ${x}`.replace('was',was)],wollen:neg?[`did not want to ${x}`]:[`wanted to ${x}`]}[m]||[]));
  if(t==='k2')return X(x=>({können:[`could${n} ${x}`],müssen:neg?[`would not have to ${x}`]:[`would have to ${x}`],sollen:[`should${n} ${x}`],dürfen:[`would${n} be allowed to ${x}`]}[m]||[]));
  return X(x=>({können:[`can${n} ${x}`,`${be}${n} able to ${x}`],müssen:neg?[`${dO} not have to ${x}`]:[`${s?'has':'have'} to ${x}`,`must ${x}`],dürfen:[`${be}${n} allowed to ${x}`,`may${n} ${x}`,`can${n} ${x}`],sollen:[`should${n} ${x}`,`${be}${n} supposed to ${x}`],wollen:neg?[`${dO} not want to ${x}`]:[`${s?'wants':'want'} to ${x}`],möchten:neg?[`would not like to ${x}`,`${dO} not want to ${x}`]:[`would like to ${x}`,`${s?'wants':'want'} to ${x}`]}[m]||[]));
}
/* English question word order: [helper, rest-of-verb] pairs */
function evQ(v,t,ep){
  const s=ep===2,be=BE[ep],was=WAS[ep];
  if(v.inf==='sein')return{pres:[[be,'']],praet:[[was,'']],perf:[[was,''],[s?'has':'have','been']],fut:[['will','be']],k2:[['would','be']]}[t]||[[be,'']];
  return vE(v).flatMap(([b,past,pp,ing])=>({pres:[[s?'does':'do',b],[be,ing]],praet:[['did',b],[was,ing]],perf:[['did',b],[s?'has':'have',pp]],plusq:[['had',pp]],fut:[['will',b],[be,'going to '+b]],k2:[['would',b]]}[t]||[[s?'does':'do',b]]));
}

/* ---------- nouns ----------
   singular | gender | plural (- none) | genitive | English | English plural | tags | flags (w weak noun: -n/-en outside the nominative, u uncountable, b no article: Fußball spielen)
   tags: p person, F family, a animal, f food, k something you cook, d drink, b something to read, w something to write, t thing, c clothing, v something to look at, m something to listen to, g game or sport, h homework, x school subject, q washable thing */
const NOUNS=`Mann|m|Männer|Mannes|man|men|p|
Frau|f|Frauen|Frau|woman|women|p|
Kind|n|Kinder|Kindes|child|children|p|
Junge|m|Jungen|Jungen|boy|boys|p|w
Mädchen|n|Mädchen|Mädchens|girl|girls|p|
Lehrer|m|Lehrer|Lehrers|teacher|teachers|p|
Lehrerin|f|Lehrerinnen|Lehrerin|teacher|teachers|p|
Freund|m|Freunde|Freundes|friend|friends|p|
Freundin|f|Freundinnen|Freundin|friend|friends|p|
Bruder|m|Brüder|Bruders|brother|brothers|pF|
Schwester|f|Schwestern|Schwester|sister|sisters|pF|
Mutter|f|Mütter|Mutter|mother|mothers|pF|
Vater|m|Väter|Vaters|father|fathers|pF|
Oma|f|Omas|Oma|grandma|grandmas|pF|
Opa|m|Opas|Opas|grandpa|grandpas|pF|
Student|m|Studenten|Studenten|student|students|p|w
Nachbar|m|Nachbarn|Nachbarn|neighbor|neighbors|p|w
Arzt|m|Ärzte|Arztes|doctor|doctors|p|
Hund|m|Hunde|Hundes|dog|dogs|a|
Katze|f|Katzen|Katze|cat|cats|a|
Pferd|n|Pferde|Pferdes|horse|horses|a|
Vogel|m|Vögel|Vogels|bird|birds|a|
Apfel|m|Äpfel|Apfels|apple|apples|f|
Brezel|f|Brezeln|Brezel|pretzel|pretzels|f|
Kuchen|m|Kuchen|Kuchens|cake|cakes|f|
Suppe|f|Suppen|Suppe|soup|soups|fk|
Pizza|f|Pizzas|Pizza|pizza|pizzas|f|
Nudeln|pl|Nudeln|Nudeln|pasta|pasta|fk|
Geschichte|f|Geschichten|Geschichte|story|stories|y|
Banane|f|Bananen|Banane|banana|bananas|f|
Ei|n|Eier|Eies|egg|eggs|f|
Wurst|f|Würste|Wurst|sausage|sausages|f|
Brötchen|n|Brötchen|Brötchens|roll|rolls|f|
Kaffee|m|-|Kaffees|coffee|-|d|u
Tee|m|-|Tees|tea|-|d|u
Milch|f|-|Milch|milk|-|d|u
Wasser|n|-|Wassers|water|-|d|u
Saft|m|-|Saftes|juice|-|d|u
Buch|n|Bücher|Buches|book|books|bt|
Zeitung|f|Zeitungen|Zeitung|newspaper|newspapers|b|
Brief|m|Briefe|Briefes|letter|letters|w|
E-Mail|f|E-Mails|E-Mail|email|emails|w|
Ball|m|Bälle|Balles|ball|balls|t|
Tasche|f|Taschen|Tasche|bag|bags|tq|
Auto|n|Autos|Autos|car|cars|tq|
Fahrrad|n|Fahrräder|Fahrrads|bike|bikes|tq|
Handy|n|Handys|Handys|cell phone|cell phones|t|
Computer|m|Computer|Computers|computer|computers|t|
Stift|m|Stifte|Stiftes|pen|pens|t|
Schlüssel|m|Schlüssel|Schlüssels|key|keys|t|
Geschenk|n|Geschenke|Geschenkes|gift|gifts|t|
Lampe|f|Lampen|Lampe|lamp|lamps|t|
Jacke|f|Jacken|Jacke|jacket|jackets|cq|
Hemd|n|Hemden|Hemdes|shirt|shirts|cq|
Mantel|m|Mäntel|Mantels|coat|coats|cq|
Kleid|n|Kleider|Kleides|dress|dresses|cq|
Hut|m|Hüte|Hutes|hat|hats|c|
Film|m|Filme|Filmes|movie|movies|v|
Foto|n|Fotos|Fotos|photo|photos|vt|
Bild|n|Bilder|Bildes|picture|pictures|vt|
Lied|n|Lieder|Liedes|song|songs|m|
Musik|f|-|Musik|music|-|m|u
Fußball|m|-|Fußballs|soccer|-|g|b
Tennis|n|-|Tennis|tennis|-|g|b
Basketball|m|-|Basketballs|basketball|-|g|b
Schach|n|-|Schachs|chess|-|g|b
Klavier|n|-|Klaviers|the piano|-|g|b
Gitarre|f|-|Gitarre|the guitar|-|g|b
Hausaufgaben|pl|Hausaufgaben|Hausaufgaben|homework|homework|h|
Deutsch|n|-|Deutsch|German|-|x|b
Mathe|f|-|Mathe|math|-|x|b`.split('\n').map(l=>{const[de,g,pl,gen,e,ep,tag,fl]=l.split('|');return{de,g,pl:pl==='-'?null:pl,gen,e,ep:ep==='-'?e:ep,tag,weak:fl==='w',unc:fl==='u',bare:fl==='b',plOnly:g==='pl'}});
const NAMES=[['Anna','f'],['Lukas','m'],['Lena','f'],['Jonas','m'],['Sophie','f'],['Max','m'],['Emma','f'],['Paul','m']].map(([de,g])=>({de,g,pl:null,gen:/s$/.test(de)?de+"'":de+'s',e:de,ep:de,tag:'p',name:1}));
const nn=de=>NOUNS.find(n=>n.de===de)||NAMES.find(n=>n.de===de);
const PEOPLE=[...NOUNS.filter(n=>n.tag.includes('p')),...NAMES];
const FAMILY=NOUNS.filter(n=>n.tag.includes('F'));
const nounV=n=>n.name?`${n.de} : ${n.e}`:n.plOnly?`die ${n.de} (pl.) : ${n.e}`:`${{m:'der',f:'die',n:'das'}[n.g]} ${n.de}${n.pl?`, ${n.pl===n.de?'-':n.pl.startsWith(n.de)?'-'+n.pl.slice(n.de.length):n.pl}`:''}${n.weak?` (weak: den ${n.pl||n.de+'n'})`:''} : ${n.e.replace(/^the /,'')}`;
const aAn=w=>/^[aeiou]/i.test(w)&&!/^(uni|use|eu)/i.test(w)?'an':'a';
/* the noun itself in a case */
function nounF(n,k,c){
  if(n.name)return c==='gen'?n.gen:n.de;
  if(k||n.plOnly){const p=n.pl||n.de;return c==='dat'&&!/[ns]$/.test(p)?p+'n':p}
  if(c==='gen')return n.g==='f'?n.de:n.gen;
  if(n.weak&&c!=='nom')return n.pl;
  return n.de;
}

/* ---------- determiners ---------- */
const CI={nom:0,akk:1,dat:2,gen:3};
const DEF={m:T6('der den dem des'),f:T6('die die der der'),n:T6('das das dem des'),pl:T6('die die den der')};
const EIN_END={m:['','en','em','es'],f:['e','e','er','er'],n:['','','em','es'],pl:['e','e','en','er']};
const DER_END={m:['er','en','em','es'],f:['e','e','er','er'],n:['es','es','em','es'],pl:['e','e','en','er']};
// possessors: German stem, English
const POSS=[['mein','my'],['dein','your'],['sein','his'],['ihr','her'],['unser','our'],['euer','your'],['ihr','their'],['Ihr','your']];
const POSS_V={mein:'mein : my',dein:'dein : your (du)',sein:'sein : his, its',ihr:'ihr : her, their',unser:'unser : our',euer:'euer : your (ihr)',Ihr:'Ihr : your (Sie)'};
const einW=(stem,gk,c)=>{const e=EIN_END[gk][CI[c]];if(stem==='euer'&&e)return 'eur'+e;return stem+e};
const gkOf=(n,k)=>k||n.plOnly?'pl':n.g;
/* adjective endings */
const ADJ_END={
  weak:{m:['e','en','en','en'],f:['e','e','en','en'],n:['e','e','en','en'],pl:['en','en','en','en']},
  mixed:{m:['er','en','en','en'],f:['e','e','en','en'],n:['es','es','en','en'],pl:['en','en','en','en']},
  strong:{m:['er','en','em','en'],f:['e','e','er','er'],n:['es','es','em','en'],pl:['e','e','en','er']}};
const ADJ=`groß|big|größer|am größten|tap
klein|small|kleiner|am kleinsten|tap
alt|old|älter|am ältesten|tapc
neu|new|neuer|am neuesten|tbcv
gut|good|besser|am besten|fbvmp
schön|beautiful|schöner|am schönsten|tcvmp
rot|red|röter|am rötesten|tc
blau|blue|blauer|am blauesten|tc
schnell|fast|schneller|am schnellsten|tpa
teuer|expensive|teurer|am teuersten|tcf
billig|cheap|billiger|am billigsten|tcf
interessant|interesting|interessanter|am interessantesten|bv
lustig|funny|lustiger|am lustigsten|pvb
nett|nice|netter|am nettesten|p
lecker|delicious|leckerer|am leckersten|f
warm|warm|wärmer|am wärmsten|cd
kalt|cold|kälter|am kältesten|d
jung|young|jünger|am jüngsten|pa
lang|long|länger|am längsten|bvc
müde|tired|müder|am müdesten|P
glücklich|happy|glücklicher|am glücklichsten|P
krank|sick|kränker|am kränksten|P
fleißig|hard-working|fleißiger|am fleißigsten|P`.split('\n').map(l=>{const[de,e,comp,sup,tags]=l.split('|');return{de,e,comp,sup,tags,stem:de==='teuer'?'teur':de}});
const EN_CMP={big:['bigger','biggest'],small:['smaller','smallest'],old:['older','oldest'],new:['newer','newest'],good:['better','best'],beautiful:['more beautiful','most beautiful'],red:['redder','reddest'],blue:['bluer','bluest'],fast:['faster','fastest'],expensive:['more expensive','most expensive'],cheap:['cheaper','cheapest'],interesting:['more interesting','most interesting'],funny:['funnier','funniest'],nice:['nicer','nicest'],delicious:['more delicious','most delicious'],warm:['warmer','warmest'],cold:['colder','coldest'],young:['younger','youngest'],long:['longer','longest'],tired:['more tired','most tired'],happy:['happier','happiest'],sick:['sicker','sickest'],'hard-working':['more hard-working','most hard-working']};
const fitsA=(a,n)=>[...n.tag].some(c=>a.tags.includes(c==='F'?'p':c==='k'?'f':c==='q'?'t':c));
const adjFor=n=>{const c=ADJ.filter(a=>fitsA(a,n)&&a.tags!=='P');return c.length?R(c):null};
const adjV=a=>`${a.de} : ${a.e}`;

/* noun phrase in a case. o.det: def | indef | kein | poss | dies | none; o.pp possessor index; o.adj; o.cid (use id for identify mode) */
function np(n,k,c,o={}){
  if(n.unc||n.bare)k=0;if(n.plOnly)k=1;
  if(o.adj==='auto')o=Object.assign({},o,{adj:n.name||n.bare?null:adjFor(n)});
  if(o.adj&&(n.name||n.bare))o=Object.assign({},o,{adj:null});
  let det=o.det||'def';
  if(n.name)det='none';
  if(n.bare&&det!=='kein')det='none';
  if((n.unc||k)&&det==='indef')det='none';
  if(det==='none'&&!k&&!n.unc&&!n.bare&&!n.name&&!n.plOnly)det='indef';
  // meine Frau / mein Mann would mean my wife / my husband
  if(det==='poss'&&(n.de==='Frau'||n.de==='Mann'))det='def';
  const gk=gkOf(n,k),toks=[],cid=o.cid||null;
  const nounTok={la:nounF(n,k,c),lemma:n.de,cids:[cid&&(det==='none')?cid:'noun'],concept:`${n.name?'name':'noun'}, ${GN[gk]}${n.name?'':' '+(k?'plural':'singular')}, ${CN[c]}`,forms:[n.de,n.pl,nounF(n,k,'dat'),nounF(n,k,'akk'),nounF(n,k,'gen')].filter(Boolean),vocab:nounV(n),n,cap:1};
  let dw=null,dwhy='',kind='strong',eDet='';const eN=k?n.ep:n.e,ad=o.adj?o.adj.e+' ':'';
  if(det==='def'){dw=DEF[gk][CI[c]];kind='weak';eDet='the '}
  else if(det==='dies'){dw='dies'+DER_END[gk][CI[c]];kind='weak';eDet=k?'these ':'this '}
  else if(det==='indef'){dw=einW('ein',gk,c);kind='mixed';eDet=aAn(ad+eN)+' '}
  else if(det==='kein'){dw=einW('kein',gk,c);kind='mixed';eDet='no '}
  else if(det==='poss'){const P=POSS[o.pp||0];dw=einW(P[0],gk,c);kind='mixed';eDet=P[1]+' '}
  const toksD=[];
  if(dw){const lem={def:'der',dies:'dieser',indef:'ein',kein:'kein',poss:POSS[o.pp||0][0]}[det];
    const dtok={la:dw,lemma:lem,cids:[cid||'art',det==='poss'?'poss':det==='dies'?'dies':det==='kein'?'kein':'art'],concept:`${det==='def'?'definite article':det==='indef'?'indefinite article':det==='kein'?'kein (no, not a)':det==='dies'?'dieser (this)':'possessive'}, ${GN[gk]}, ${CN[c]}`,
      forms:det==='def'?['der','die','das','den','dem','des']:det==='dies'?['dieser','diese','dieses','diesen','diesem']:[...new Set(['','e','en','em','er','es'].map(e=>(lem==='euer'&&e?'eur':lem)+e))],
      vocab:det==='poss'?POSS_V[lem]:det==='dies'?'dieser, diese, dieses : this':det==='kein'?'kein : no, not a, not any':null,
      why:`${n.name?n.de:nounF(n,0,'nom')} is ${k||n.plOnly?'plural':GN[gk]}, and here it is ${CN[c]}${o.role?' ('+o.role+')':''}, so: ${dw}`};
    toksD.push(dtok)}
  toks.push(...toksD);
  if(o.adj){const a=o.adj,end=ADJ_END[kind][gk][CI[c]];toks.push({la:a.stem+end,lemma:a.de,cids:['adj'],concept:`adjective, ${kind==='weak'?'after der/dieser':kind==='mixed'?'after ein/kein/mein':'no article'}: ${GN[gk]} ${CN[c]}`,forms:['e','en','em','er','es'].map(e=>a.stem+e).concat(a.de),vocab:adjV(a),
    why:`${a.de} ${kind==='weak'?'after a der-word':kind==='mixed'?'after an ein-word':'with no article'}, ${GN[gk]} ${CN[c]}: -${end}`})}
  toks.push(nounTok);
  if(toksD[0])toksD[0].span=toks.length-1;
  let en;
  if(n.name)en=[n.e];
  else if(n.bare)en=n.e==='the piano'||n.e==='the guitar'?[n.e,n.e.replace('the ','')]:[n.e];
  else if(det==='none')en=[ad+eN,...(k&&!n.unc?['some '+ad+eN]:[])];
  else if(det==='poss'&&(o.pp===3||o.pp===6))en=['her '+ad+eN,'their '+ad+eN];
  else if(det==='poss'&&o.pp===2)en=['his '+ad+eN,'its '+ad+eN];
  else if(det==='kein')en=[(k?'no ':'no ')+ad+eN];
  else en=[eDet+ad+eN];
  if(det==='def'&&n.e==='homework')en=['the homework','homework','my homework'];
  return{toks,en,g:n.g,gk,k,n,det,p:k||n.plOnly?5:2,ep:k||n.plOnly?5:2,person:/p/.test(n.tag)};
}
/* pronouns */
const SUBJS=[
 {de:'ich',en:'I',p:0,ep:0},{de:'du',en:'you',p:1,ep:1},{de:'er',en:'he',p:2,ep:2,g:'m'},{de:'sie',en:'she',p:2,ep:2,g:'f'},
 {de:'wir',en:'we',p:3,ep:3},{de:'ihr',en:'you all',p:4,ep:4},{de:'sie',en:'they',p:5,ep:5},{de:'Sie',en:'you',p:5,ep:1,formal:1}];
const SUBJV={'you all':['you all','you',"y'all",'you guys']};
const PRA={0:'mich',1:'dich',m:'ihn',f:'sie',n:'es',3:'uns',4:'euch',pl:'sie',S:'Sie'},PRD={0:'mir',1:'dir',m:'ihm',f:'ihr',n:'ihm',3:'uns',4:'euch',pl:'ihnen',S:'Ihnen'};
const PRE={0:'me',1:'you',m:'him',f:'her',n:'it',3:'us',4:'you',pl:'them',S:'you'};
const pronTok=(la,c,why)=>({la,lemma:la,cids:[c==='akk'?'pa':'pd','pron'],concept:`personal pronoun, ${CN[c]}`,forms:['mich','dich','ihn','sie','es','uns','euch','mir','dir','ihm','ihr','ihnen','Sie','Ihnen'],vocab:c==='akk'?'mich, dich, ihn, sie, es, uns, euch, sie : me, you, him, her, it, us, you, them':'mir, dir, ihm, ihr, uns, euch, ihnen : (to) me, you, him, her, us, you, them',why,cap:/^S|^I/.test(la)?1:0});
const W=(la,vocab,cids,concept)=>({la,lemma:la,cids:cids||[],concept:concept||'',forms:[],vocab:vocab||null});
const SMALL={nicht:'nicht : not',und:'und : and',aber:'aber : but',gern:'gern : gladly (verb + gern = like to)',auch:'auch : also, too',sehr:'sehr : very',als:'als : than',wie:'wie : as, like, how',zu:'zu : to'};
const SW=(la,cids)=>W(la,SMALL[la]||null,cids);
const num=n=>n.unc||n.bare||n.name?0:n.plOnly?1:(chance(.35)?1:0);
const pick=(arr,ex=[])=>{const c=arr.filter(x=>!ex.includes(x));return c.length?R(c):null};
const tidy=s=>s.replace(/\s+/g,' ').replace(/ ,/g,',').replace(/,+/g,',').replace(/^[, ]+|[, ]+$/g,'').trim();
function cross(...parts){let out=[''];for(const p of parts){const a=Array.isArray(p)?p:[p];out=out.flatMap(x=>a.map(y=>x+' '+y));if(out.length>300)out=out.slice(0,300)}return[...new Set(out.map(tidy))]}

/* subject: a pronoun or a noun phrase */
function subject(o={}){
  const used=o.used||[];
  if(o.kind==='pron'||(o.kind!=='noun'&&chance(o.pron==null?.55:o.pron))){
    let c=SUBJS.filter(s=>(!s.formal||VOS||o.formal)&&(!o.ps||o.ps.includes(s.p)));if(!c.length)c=SUBJS.filter(s=>!s.formal);
    const s=R(c),tok={la:s.de,lemma:s.de,cids:['subj'],concept:'subject pronoun',forms:['sie','Sie','ihr','Ihr'],vocab:null,cap:s.formal?1:0,pron:1};
    let en=SUBJV[s.en]||[s.en];if(s.p===5)en=s.formal?['you','they']:['they','you'];
    return{toks:[tok],en,p:s.p,ep:s.ep,g:s.g,pron:s,k:s.p>2?1:0,refA:s.formal?'S':s.p===2?s.g:s.p===5?'pl':s.p};
  }
  const n=o.n||pick(o.pool||PEOPLE,used);used.push(n);const k=o.k!=null&&!n.name&&!n.unc?o.k:num(n);
  const r=np(n,k,'nom',Object.assign({det:R(['def','def','indef','poss']),pp:R([0,1,2,3,4,6])},o.np||{},{cid:'nomSubj',role:'the subject'}));
  return Object.assign(r,{refA:k?'pl':n.g});
}

/* ---------- places ----------
   name | gender | English | to (Akk / motion) | at (Dat / location); two-way preposition in */
const PLACES=`Küche|f|kitchen|to the kitchen,into the kitchen|in the kitchen
Park|m|park|to the park,into the park|in the park,at the park
Kino|n|movie theater|to the movies,to the movie theater,into the movie theater|at the movies,at the movie theater,in the movie theater
Garten|m|garden|into the garden,to the garden,into the yard|in the garden,in the yard
Stadt|f|city|into town,downtown,to town,into the city,to the city|in town,downtown,in the city
Bibliothek|f|library|to the library,into the library|in the library,at the library
Restaurant|n|restaurant|to the restaurant,into the restaurant|in the restaurant,at the restaurant
Supermarkt|m|supermarket|to the supermarket,into the supermarket|in the supermarket,at the supermarket
Bäckerei|f|bakery|to the bakery,into the bakery|in the bakery,at the bakery
Büro|n|office|to the office,into the office|in the office,at the office
Zimmer|n|room|into the room,to the room|in the room
Schule|f|school|to school,into the school|at school,in school
Café|n|café|to the café,into the café|in the café,at the café
Museum|n|museum|to the museum,into the museum|in the museum,at the museum`.split('\n').map(l=>{const[de,g,e,to,at]=l.split('|');return{de,g,e,to:to.split(','),at:at.split(','),place:1,pl:null,gen:g==='f'?de:de+'s',tag:'l'}});
// surfaces for legen / stellen (Akk) and liegen / stehen (Dat)
const SURF=`Tisch|m|table|auf|on the table,onto the table|on the table
Stuhl|m|chair|auf|on the chair,onto the chair|on the chair
Bett|n|bed|auf|on the bed,onto the bed|on the bed
Sofa|n|sofa|auf|on the sofa,onto the sofa|on the sofa
Boden|m|floor|auf|on the floor|on the floor
Regal|n|shelf|in|on the shelf,in the shelf|on the shelf,in the shelf`.split('\n').map(l=>{const[de,g,e,pr,to,at]=l.split('|');return{de,g,e,pr,to:to.split(','),at:at.split(','),pl:null,gen:de+'s',tag:'s'}});
const PL=de=>PLACES.find(x=>x.de===de);
const LOC_FOR={kaufen:['Supermarkt','Bäckerei','Stadt'],einkaufen:['Supermarkt','Stadt'],kochen:['Küche','Restaurant'],essen:['Restaurant','Küche','Café','Park','Garten','Schule'],trinken:['Café','Restaurant','Küche','Garten'],
  arbeiten:['Büro','Bibliothek','Restaurant','Bäckerei','Supermarkt','Museum','Schule','Café','Garten'],schlafen:['Zimmer','Garten'],fernsehen:['Zimmer'],lesen:['Bibliothek','Zimmer','Park','Garten','Café','Küche'],
  schreiben:['Bibliothek','Zimmer','Büro','Café'],lernen:['Bibliothek','Zimmer','Schule','Küche'],machen:['Bibliothek','Zimmer','Küche','Schule'],spielen:['Park','Garten','Zimmer','Schule'],tanzen:['Zimmer','Café','Restaurant','Küche'],
  bleiben:['Zimmer','Stadt','Garten','Park','Bibliothek','Büro'],wohnen:['Stadt']};
const DEST_FOR={fahren:['Stadt','Park','Supermarkt','Kino','Museum','Schule','Bibliothek','Restaurant'],laufen:['Küche','Park','Garten','Zimmer','Schule','Bäckerei'],kommen:['Küche','Zimmer','Garten','Büro','Schule','Stadt']};
const CITIES=['Berlin','München','Wien','Hamburg','Zürich','Köln'],CITY_EN={München:['Munich','München'],Wien:['Vienna','Wien'],Köln:['Cologne','Köln'],Zürich:['Zurich','Zürich']};
// what lies, stands or sits where; what you put where
const SURF_FOR={sitzen:['Stuhl','Sofa','Bett','Boden'],liegen:['Tisch','Bett','Sofa','Boden','Regal'],stehen:['Tisch','Boden','Regal'],legen:['Tisch','Bett','Sofa','Boden','Regal','Stuhl'],stellen:['Tisch','Boden','Regal']};
const THING_FOR={liegen:['Buch','Handy','Schlüssel','Tasche','Ball','Stift','Brief','Zeitung','Geschenk','Foto'],stehen:['Lampe','Computer','Tasche','Fahrrad'],legen:['Buch','Handy','Schlüssel','Tasche','Ball','Stift','Brief','Zeitung','Geschenk','Foto','Jacke'],stellen:['Lampe','Computer','Tasche']};
const CONTR={'in dem':'im','in das':'ins','an dem':'am','an das':'ans','zu dem':'zum','zu der':'zur','bei dem':'beim','von dem':'vom','auf das':'aufs'};
const PREP_V={in:'in : in, into (+ Akk for where to, + Dat for where)',an:'an : at, on (a vertical surface)',auf:'auf : on, onto',für:'für : for (+ Akk)',ohne:'ohne : without (+ Akk)',durch:'durch : through (+ Akk)',gegen:'gegen : against (+ Akk)',um:'um : around, at (a time) (+ Akk)',mit:'mit : with, by (+ Dat)',zu:'zu : to (+ Dat)',bei:'bei : at someone’s place, near (+ Dat)',nach:'nach : to (cities, countries), after (+ Dat)',aus:'aus : out of, from (+ Dat)',von:'von : from, of, by (+ Dat)',seit:'seit : since, for (+ Dat)',wegen:'wegen : because of (+ Gen)',trotz:'trotz : despite, in spite of (+ Gen)',während:'während : during (+ Gen)'};
/* a prepositional phrase: preposition + noun phrase in its case; the preposition and article merge when German does (in dem → im) */
function pp(prep,n,k,c,o={}){
  const ph=np(n,k,c,Object.assign({det:'def'},o,{cid:null}));let toks=ph.toks;
  const ctok={la:prep,lemma:prep,cids:[o.cid||'prep'],concept:`preposition + ${CN[c]}`,forms:[],vocab:PREP_V[prep]||null,why:o.why||null};
  const d=toks[0],key=prep+' '+(d?d.la:'');
  if(d&&CONTR[key]&&ph.det==='def'&&!o.adj){
    const m=Object.assign({},d,{la:CONTR[key],alt:[key],lemma:prep,cids:[o.cid||'prep','art'],concept:`${prep} + ${d.la} (${CN[c]})`,vocab:PREP_V[prep],why:o.why||d.why,span:toks.length-1});
    toks=[m,...toks.slice(1)];
  }else{ctok.span=toks.length;toks=[ctok,...toks];if(d)d.cids=['art',...d.cids.slice(1)]}
  return{toks,en:ph.en,ph};
}

/* ---------- time expressions ---------- */
const TIME={pres:[['heute','today'],['jeden Tag','every day','akkTime'],['am Wochenende','on the weekend|on weekends|at the weekend'],['oft','often'],['jetzt','now']],
  past:[['gestern','yesterday'],['letzte Woche','last week','akkTime'],['letztes Jahr','last year','akkTime'],['am Montag','on Monday'],['gestern Abend','last night|yesterday evening']],
  fut:[['morgen','tomorrow'],['nächste Woche','next week','akkTime'],['nächsten Sommer','next summer','akkTime'],['bald','soon']],
  k2:[['jeden Tag','every day','akkTime'],['am Wochenende','on the weekend|on weekends']]};
const timeFor=t=>t==='praet'||t==='perf'||t==='plusq'||t==='passp'?TIME.past:t==='fut'?TIME.fut:t==='k2'||t==='k2p'?TIME.k2:TIME.pres;
function timeTok(t){const[de,en,cid]=R(timeFor(t));return{tok:{la:de,lemma:de,cids:[cid||'time'],concept:cid?'time expression in the accusative':'time expression',forms:cid?['jede','jeder','jedes','jedem','letzte','letzter','letzten','letztem','nächste','nächster','nächstes','nächstem','letzte','nächsten','jeden']:[],vocab:`${de} : ${en.split('|')[0]}`,why:cid?`${de}: a definite time without a preposition is accusative`:null,span:0},en:en.split('|')}}

/* ---------- the verb as tokens: finite verb (position 2 or last), the rest at the end ---------- */
/* returns {fin, tail:[tokens at the end], sub: [tokens for verb-final order], en(list)}  t: tense; mod: modal inf */
function verbToks(v,t,p,o={}){
  const vv=v,cids=[...(o.cids||[]),t],vocab=verbV(vv),forms=vforms(vv);
  const mk=(la,extra={})=>Object.assign({la,lemma:vv.inf,cids:[...cids],concept:`${PERS[p]}, ${TN[t]}`,forms,vocab,vb:vv,t,p},extra);
  const sepT=vv.pre?{la:vv.pre,lemma:vv.inf,cids:['sep'],concept:`separable prefix of ${vv.inf}`,forms:[],vocab:null,why:`${vv.inf} is separable: the prefix ${vv.pre}- goes to the end of the clause`}:null;
  const infT=(x,c)=>({la:x.inf,lemma:x.inf,cids:[c||'inf'],concept:'infinitive (at the end)',forms:vforms(x),vocab:verbV(x),vb:x});
  const partT=x=>({la:x.part,lemma:x.inf,cids:['part'],concept:'past participle (at the end)',forms:[x.inf,x.part,...vforms(x)],vocab:verbV(x),vb:x,why:`the past participle of ${x.inf} is ${x.part}`});
  if(o.modal){const m=SPECIAL[o.modal],mt=t==='perf'?'praet':t;const f=mt==='k2'?k2F(m,p):mt==='praet'?praetF(m,p):presF(m,p);
    const fin=Object.assign(mk(f),{lemma:m.inf,vocab:verbV(m),forms:vforms(m),vb:m,cids:['modal',mt],concept:`${PERS[p]}, ${TN[mt]} of ${m.inf}`,why:`${m.inf}, ${PERS[p]}: ${f}`});
    const inf=infT(vv);return{fin,tail:[inf],sub:[inf,fin],t:mt}}
  if(t==='pres'||t==='praet'){
    const f=t==='pres'?presF(vv,p):praetF(vv,p),fin=mk(f,{why:`${vv.inf}, ${PERS[p]}, ${TN[t]}: ${f}${vv.sc&&t==='pres'&&(p===1||p===2)?' (the stem changes for du and er/sie/es)':''}`});
    if(vv.pre){const fused=mk(vv.pre+f,{why:`in a clause with the verb at the end, ${vv.pre}- joins the verb again: ${vv.pre+f}`});return{fin,tail:[sepT],sub:[fused]}}
    return{fin,tail:[],sub:[fin]}}
  if(t==='perf'||t==='plusq'){
    const aux=vv.aux==='s'?SPECIAL.sein:SPECIAL.haben,f=t==='perf'?presF(aux,p):praetF(aux,p);
    const fin=Object.assign(mk(f),{lemma:aux.inf,cids:['aux',t],concept:`${PERS[p]}, ${t==='perf'?'present':'simple past'} of ${aux.inf} (helping verb)`,forms:vforms(aux),vocab:verbV(aux),
      why:`${vv.inf} forms the ${t==='perf'?'Perfekt':'Plusquamperfekt'} with ${aux.inf}${vv.aux==='s'?' (it shows movement or a change of state)':''}: ${f}`});
    const pt=partT(vv);return{fin,tail:[pt],sub:[pt,fin]}}
  if(t==='fut'){const f=WERDE[p],fin=Object.assign(mk(f),{lemma:'werden',cids:['aux','fut'],concept:`${PERS[p]}, present of werden (future)`,forms:vforms(SPECIAL.werden),vocab:verbV(SPECIAL.werden)});const inf=infT(vv);return{fin,tail:[inf],sub:[inf,fin]}}
  if(t==='k2'){
    if(vv.irrT&&vv.irrT.k2&&(vv.inf==='sein'||vv.inf==='haben'||vv.modal)){const f=k2F(vv,p),fin=mk(f,{why:`${vv.inf} has its own subjunctive II form: ${f}`});return{fin,tail:[],sub:[fin]}}
    const f=WURDE[p],fin=Object.assign(mk(f),{lemma:'werden',cids:['aux','k2'],concept:`${PERS[p]}, würde (subjunctive II of werden)`,forms:[...WURDE,...WERDE,'wurde','wurden'],vocab:'würde : would'});const inf=infT(vv);return{fin,tail:[inf],sub:[inf,fin]}}
  if(t==='k2p'){const aux=vv.aux==='s'?SPECIAL.sein:SPECIAL.haben,f=k2F(aux,p),fin=Object.assign(mk(f),{lemma:aux.inf,cids:['aux','k2p'],concept:`${PERS[p]}, subjunctive II of ${aux.inf}`,forms:vforms(aux),vocab:verbV(aux)});const pt=partT(vv);return{fin,tail:[pt],sub:[pt,fin]}}
  if(t==='pass'||t==='passp'){const f=t==='pass'?presF(SPECIAL.werden,p):praetF(SPECIAL.werden,p),fin=Object.assign(mk(f),{lemma:'werden',cids:['aux',t],concept:`${PERS[p]}, ${t==='pass'?'present':'simple past'} of werden (passive)`,forms:vforms(SPECIAL.werden),vocab:verbV(SPECIAL.werden)});const pt=partT(vv);return{fin,tail:[pt],sub:[pt,fin]}}
  throw new Error('tense '+t);
}

/* ---------- one clause ----------
   pieces: S subject, fin, mid (ordered list of {k, toks}), tail; English pieces */
const objFor=v=>[...NOUNS,...NAMES].filter(n=>v.obj&&[...n.tag].some(c=>v.obj.includes(c)));
const TV=VERBS.filter(v=>v.fl.includes('T')),IV=VERBS.filter(v=>v.fl.includes('I')),DVB=VERBS.filter(v=>v.fl.includes('D'));
const MV=VERBS.filter(v=>v.fl.includes('M')),LV=VERBS.filter(v=>v.fl.includes('L')&&v.inf!=='wohnen'),PV=VERBS.filter(v=>v.fl.includes('P')),SV=VERBS.filter(v=>v.fl.includes('S'));
const NV=VERBS.filter(v=>v.fl.includes('N'));
const pronFor=(ref,c)=>(c==='akk'?PRA:PRD)[ref];
function clause(o={}){
  const t=o.t||'pres',used=o.used||[];
  let v=o.v;
  if(!v){let pool=o.pool||[...TV,...NV];if(o.vf)pool=pool.filter(o.vf);if(!pool.length)pool=TV;v=R(pool)}
  const thingSubj=(v.inf==='liegen'||v.inf==='stehen')&&!o.subj;
  const sb=o.subj||(thingSubj?subject({used,kind:'noun',k:0,np:{det:R(['def','def','poss']),pp:R([0,1,2,3,4,6])},pool:THING_FOR[v.inf].map(nn)}):subject({used,ps:o.ps,kind:o.sk,pron:o.pron,k:o.k,np:o.subjNp,pool:o.subjPool,formal:o.formal}));
  const p=sb.p,ep=sb.ep,mid=[];let eObj=[''],ePlace=[''],neg=!!o.neg,usedKein=false;
  /* direct (accusative) object */
  let ob=null,obPron=null;
  const wantsObj=v.fl.includes('T')&&o.obj!==false&&!(v.fl.includes('N')&&!o.obj&&chance(.25)&&!o.io&&!o.dop);
  if(v.fl.includes('T')&&(wantsObj||o.dop||o.objNp||o.objPool||v.fl.includes('P'))||v.fl.includes('P')){
    let pool=objFor(v).filter(n=>!used.includes(n));if(THING_FOR[v.inf])pool=THING_FOR[v.inf].map(nn).filter(n=>!used.includes(n));
    if(o.objPool){const fo=objFor(v);const c=o.objPool.filter(n=>!used.includes(n)&&fo.includes(n));if(c.length)pool=c}
    if(neg)pool=pool.filter(n=>!n.bare||n.tag.includes('x')===false);
    if(!pool.length)pool=objFor(v);
    const n=o.objN||R(pool);used.push(n);const k=o.ok!=null&&!n.unc&&!n.bare?o.ok:num(n);
    let det=o.objDet||(n.bare?'none':n.unc?R(['def','none','none']):R(['def','def','indef','poss']));
    if(neg&&(det==='indef'||det==='none')&&!n.bare){det='kein';usedKein=true}
    if(neg&&n.bare&&n.tag.includes('g'))det='none';
    ob=np(n,k,'akk',Object.assign({det,pp:R([0,1,2,3,4,6])},o.objNp||{},{cid:'akkDO',role:'the direct object'}));
    if(o.dop){const ref=ob.k||n.plOnly?'pl':n.g,live=/[pa]/.test(n.tag);obPron={tok:pronTok(pronFor(ref,'akk'),'akk',`${n.de} is ${ob.k?'plural':GN[n.g]} and the direct object: ${pronFor(ref,'akk')}`),en:[live||ref==='pl'?PRE[ref]:'it']}}
  }
  /* indirect (dative) object, or the object of a dative verb */
  let io=null,ioPron=null;
  if(o.io==null&&['geben','schenken'].includes(v.inf)&&chance(.85))o=Object.assign({},o,{io:'noun'});
  if((o.io&&v.fl.includes('I'))||v.fl.includes('D')){
    const n=o.ioN||pick(o.ioPool||PEOPLE.filter(x=>x.tag.includes('p')),used)||nn('Freund');used.push(n);const k=num(n);
    const role=v.fl.includes('D')?`the object of ${v.inf}, which takes the dative`:'the indirect object';
    io=np(n,k,'dat',{det:R(['def','poss','poss']),pp:R([0,1,2,3,4,6]),cid:v.fl.includes('D')?'datVerb':'datIO',role});
    if(o.io==='pron'||o.iop){const ref=io.k?'pl':n.g;const c=[...[0,1,3,4].filter(x=>x!==p&&!(x===3&&p===0)&&!(x===0&&p===3)&&!(x===4&&p===1)&&!(x===1&&p===4)),ref];const r2=R(c);
      ioPron={tok:Object.assign(pronTok(pronFor(r2,'dat'),'dat',`the ${v.fl.includes('D')?'object of '+v.inf:'indirect object'} is dative: ${pronFor(r2,'dat')}`),{cids:[v.fl.includes('D')?'datVerb':'datIO','pron']}),en:[PRE[r2]]}}
  }
  /* English object pieces */
  const obE=ob?(obPron?obPron.en:ob.en):null,ioE=io?(ioPron?ioPron.en:io.en):null;
  if(v.fl.includes('D'))eObj=ioE;
  else if(obE&&ioE){const to=['kaufen','kochen'].includes(v.inf)?'for':'to';eObj=obPron?cross(obE,to,ioE):[...cross(ioE,obE),...cross(obE,to,ioE)]}
  else if(obE)eObj=obE;
  /* the middle field: pronouns (accusative before dative), time, dative noun, accusative noun, then places */
  if(obPron)mid.push({k:'pron',toks:[obPron.tok]});
  if(ioPron)mid.push({k:'pron',toks:[ioPron.tok]});
  let tm=null;if(o.time){for(let i=0;i<8;i++){tm=timeTok(o.tense||t);if(!neg||!/jeden|oft|am Wochenende|jetzt/.test(tm.tok.la))break}mid.push({k:'time',toks:[tm.tok]})}
  if(io&&!ioPron)mid.push({k:'dat',toks:io.toks,def:io.det!=='none'||io.n.name});
  if(ob&&!obPron)mid.push({k:ob.det==='kein'?'kein':ob.n.bare?'bare':'akk',toks:ob.toks,def:ob.det!=='none'&&ob.det!=='kein'});
  /* place */
  if(o.place||v.fl.includes('M')&&o.place!==false||v.fl.includes('P')||v.fl.includes('S')){
    if(v.fl.includes('P')||v.fl.includes('S')){const sf=R((SURF_FOR[v.inf]||SURF.map(x=>x.de)).map(d=>SURF.find(x=>x.de===d))),motion=v.fl.includes('P'),c=motion?'akk':'dat';
      const ph=pp(sf.pr,sf,0,c,{cid:motion?'akkTwo':'datTwo',why:`${sf.pr} is a two-way preposition: ${motion?'movement to a place (wohin?) takes the accusative':'a position (wo?) takes the dative'}`});mid.push({k:'place',toks:ph.toks});ePlace=motion?sf.to:sf.at}
    else if(v.inf==='fliegen'||(v.inf==='fahren'&&chance(.25)&&!o.twoway)){const city=R(CITIES);mid.push({k:'place',toks:[{la:'nach',lemma:'nach',cids:['prep'],concept:'nach + a city or country (no article)',forms:[],vocab:PREP_V.nach},{la:city,lemma:city,cids:['noun'],concept:'city',forms:[],vocab:null,cap:1}]});ePlace=(CITY_EN[city]||[city]).map(x=>'to '+x)}
    else if(v.fl.includes('M')&&!(v.fl.includes('N')&&!o.place)){const pl=o.placeN||pick((DEST_FOR[v.inf]||PLACES.map(x=>x.de)).map(PL),used)||PL('Park');used.push(pl);
      if(chance(o.zu?1:.25)&&/^(Schule|Bäckerei|Supermarkt|Park|Bibliothek|Museum)$/.test(pl.de)&&!o.twoway){const ph=pp('zu',pl,0,'dat',{cid:'datPrep',why:'zu always takes the dative'});mid.push({k:'place',toks:ph.toks});ePlace=pl.to.filter(x=>/^to /.test(x))}
      else{const ph=pp('in',pl,0,'akk',{cid:'akkTwo',why:'in is a two-way preposition, and this is movement to a place (wohin?), so accusative'});mid.push({k:'place',toks:ph.toks});ePlace=pl.to}}
    else if(o.place&&v.fl.includes('L')){const pl=o.placeN||pick((LOC_FOR[v.inf]||PLACES.map(x=>x.de)).map(PL),used)||PL('Zimmer');used.push(pl);
      const ph=pp('in',pl,0,'dat',{cid:'datTwo',why:'in is a two-way preposition, and this is a location (wo?), so dative'});mid.push({k:'place',toks:ph.toks});ePlace=pl.at}
  }
  if(o.mit){const n=pick(PEOPLE,used);used.push(n);const ph=pp('mit',n,num(n),'dat',{det:R(['def','poss']),pp:R([0,1,4]),cid:'datPrep',why:'mit always takes the dative'});mid.push({k:'pp',toks:ph.toks});ePlace=cross(ePlace,'with',ph.en)}
  if(o.akkPrep){const pr=R(['für','ohne']),n=pick(PEOPLE,used);used.push(n);const ph=pp(pr,n,num(n),'akk',{det:R(['def','poss']),pp:R([0,1,4]),cid:'akkPrep',why:`${pr} always takes the accusative`});mid.push({k:'pp',toks:ph.toks});ePlace=cross(ePlace,pr==='für'?'for':'without',ph.en)}
  const vt=verbToks(v,t,p,{cids:o.vcids,modal:o.modal});
  /* nicht: after pronouns, time and definite objects; before places, other phrases and the verb at the end */
  if(neg&&!usedKein){const ni=SW('nicht',['neg']);ni.why='nicht comes after definite objects and time expressions, and before places and the verb parts at the end';
    let at=mid.findIndex(x=>['place','pp','bare','pred'].includes(x.k));if(at<0)at=mid.length;mid.splice(at,0,{k:'neg',toks:[ni]})}
  const eAdv=tm?tm.en:[''];
  return{v,t:vt.t||t,p,ep,sb,ob,io,mid,vt,eObj,ePlace,eAdv,neg,used,tm,usedKein,modal:o.modal};
}
/* German puts a comma before and after every subordinate clause; only the displayed copy of a token gets it */
const withComma=ts=>ts.length?[...ts.slice(0,-1),Object.assign({},ts[ts.length-1],{post:','})]:ts;
const midToks=(c,skip)=>c.mid.filter(x=>x!==skip).flatMap(x=>x.toks);
/* English for a clause */
function enOf(c,o={}){
  const neg=c.neg&&!c.usedKein;
  const vp=c.modal?evModal(c.modal,c.v,c.t,c.ep,neg):ev(c.v,c.t,c.ep,neg);
  // kein: English "do not have a" or "have no"
  let objE=c.eObj;
  if(c.usedKein&&c.ob){const n=c.ob.n,k=c.ob.k,eN=k?n.ep:n.e,ad=c.ob.toks.find(t=>t.cids[0]==='adj');const adE=ad?ADJ.find(a=>a.de===ad.lemma).e+' ':'';
    const vpNeg=c.modal?evModal(c.modal,c.v,c.t,c.ep,true):ev(c.v,c.t,c.ep,true);
    const a=k||n.unc?['any '+adE+eN,adE+eN]:[aAn(adE+eN)+' '+adE+eN];
    return[...cross(c.sb.en,vpNeg,a,c.ePlace,c.eAdv),...cross(c.sb.en,vp,'no '+adE+eN,c.ePlace,c.eAdv)];
  }
  let ens=cross(c.sb.en,vp,objE,c.ePlace,c.eAdv);
  if(c.tm)ens=[...ens,...cross(c.eAdv.map(x=>x+','),c.sb.en,vp,objE,c.ePlace)];
  return ens;
}
/* German main-clause orders: subject first, or time first (then the verb, then the subject) */
function mainOrders(c,front){
  const S0=c.sb.toks,mid=midToks(c),tail=c.vt.tail;
  const base=[...S0,c.vt.fin,...mid,...tail];const alts=[];
  const tmItem=c.mid.find(x=>x.k==='time');
  if(tmItem){const m2=midToks(c,tmItem);alts.push([...tmItem.toks,c.vt.fin,...S0,...m2,...tail])}
  // a dative noun and an accusative noun can also go the other way round
  const di=c.mid.findIndex(x=>x.k==='dat'),ai=c.mid.findIndex(x=>x.k==='akk');
  if(di>=0&&ai===di+1){const m=[...c.mid];[m[di],m[ai]]=[m[ai],m[di]];alts.push([...S0,c.vt.fin,...m.flatMap(x=>x.toks),...tail])}
  if(front==='time'&&tmItem)return{tokens:alts[0],alts:[base,...alts.slice(1)]};
  return{tokens:base,alts};
}
function subOrder(c){return[...c.sb.toks,...midToks(c),...c.vt.sub]}

/* ---------- finishing a sentence ---------- */
const contract=s=>s;
const esJoin=ts=>ts.filter(t=>!t.hide).map(t=>t.la+(t.post||'')).join(' ');
const deJoin=esJoin;
function S(tokens,ens,end='.',o={}){return Object.assign({tokens,en:ens[0],enAlt:ens.slice(1),end,altTokens:[]},o)}
function st(c,o={}){const r=mainOrders(c,o.front);return S(r.tokens,enOf(c),'.',{altTokens:r.alts})}
const pron1=c=>c.sb.pron;
/* any clause, with what its verb needs */
function anyC(o={}){return clause(o)}
function gC(o={}){
  if(o.time==null&&chance(.3))o.time=true;
  const c=clause(o);return st(c,{front:o.front});
}

/* ---------- topic generators ---------- */
/* sein and haben */
const PRED_ADJ=ADJ.filter(a=>/[pP]/.test(a.tags));
const JOBS=[['Lehrer','Lehrerin','a teacher'],['Arzt','Ärztin','a doctor'],['Student','Studentin','a student'],['Koch','Köchin','a cook'],['Polizist','Polizistin','a police officer'],['Verkäufer','Verkäuferin','a salesperson']];
function gSein(t='pres',o={}){
  const kind=o.kind||R(['adj','adj','job','place']);const sb=subject({ps:o.ps,pron:o.pron??.6,np:{det:R(['def','poss'])},pool:PEOPLE});
  const v=SPECIAL.sein,vt=verbToks(v,t,sb.p);let pred,pe;
  if(kind==='job'){const j=R(JOBS),f=sb.g==='f'||(sb.n&&sb.n.g==='f');const w=sb.k?(f?j[1]+'nen':j[0]+(/er$/.test(j[0])?'':'en')):(f?j[1]:j[0]);
    const word=sb.k?(f?j[1]+'nen':{Lehrer:'Lehrer',Arzt:'Ärzte',Student:'Studenten',Koch:'Köche',Polizist:'Polizisten',Verkäufer:'Verkäufer'}[j[0]]):w;
    pred=[{la:word,lemma:j[0],cids:['nomPred','noun'],concept:'predicate noun (no article for a job)',forms:[j[0],j[1]],vocab:`der ${j[0]} / die ${j[1]} : ${j[2].replace(/^an? /,'')}`,why:'after sein, a job takes no article in German: Sie ist Lehrerin',cap:1,span:0}];pe=sb.k?[j[2].replace(/^an? /,'')+'s']:[j[2]]}
  else if(kind==='place'){const pl=R(PLACES);const ph=pp('in',pl,0,'dat',{cid:'datTwo',why:'in + dative for where someone is (wo?)'});pred=ph.toks;pe=pl.at}
  else{const a=R(PRED_ADJ.concat(ADJ.filter(x=>/p/.test(x.tags))));pred=[{la:a.de,lemma:a.de,cids:['predadj'],concept:'adjective after sein (no ending)',forms:['e','en','em','er','es'].map(e=>a.stem+e),vocab:adjV(a),why:'an adjective after sein takes no ending'}];pe=[a.e]}
  if(o.sehr&&kind==='adj'){pred.unshift(SW('sehr'));pe=pe.map(x=>'very '+x)}
  const neg=o.neg?[SW('nicht',['neg'])]:[];
  const tok=[...sb.toks,vt.fin,...neg,...pred];
  const ens=cross(sb.en,ev(v,t,sb.ep,!!o.neg),pe);
  return S(tok,ens);
}
function gHaben(t='pres',o={}){return gC(Object.assign({v:SPECIAL.haben,t},o))}
/* gern: Ich spiele gern Fußball = I like playing soccer */
function gGern(o={}){
  const c=clause(Object.assign({pool:VERBS.filter(v=>/[LN]/.test(v.fl)&&!v.pre&&v.inf!=='wohnen'&&!v.fl.includes('M')),obj:true},o));
  const neg=o.neg??chance(.3);const g=SW('gern',['gern']);g.why='gern after the verb means you like doing it';
  const mid=c.mid,iObj=mid.findIndex(x=>['bare','akk','kein','place','pp'].includes(x.k));
  const ins=neg?[SW('nicht',['neg']),g]:[g];if(iObj<0)mid.push({k:'gern',toks:ins});else mid.splice(iObj,0,{k:'gern',toks:ins});
  const toks=[...c.sb.toks,c.vt.fin,...mid.flatMap(x=>x.toks),...c.vt.tail];
  const s=c.ep===2,like=neg?(s?'does not like':'do not like'):(s?'likes':'like');
  const ings=vE(c.v).flatMap(x=>[x[3],'to '+x[0]]);
  return S(toks,cross(c.sb.en,like,ings,c.eObj,c.ePlace));
}
/* möchte + noun or infinitive */
function gMoechte(){
  if(chance(.5)){const sb=subject({pron:.8});const pool=NOUNS.filter(n=>/[fdtbc]/.test(n.tag)&&!n.bare);const n=R(pool),k=num(n);
    const ob=np(n,k,'akk',{det:n.unc?'none':R(['indef','indef','def']),cid:'akkDO',role:'the direct object',adj:chance(.3)?'auto':null});
    const m=SPECIAL.möchten,f=presF(m,sb.p),fin={la:f,lemma:'möchten',cids:['modal','pres'],concept:`${PERS[sb.p]}, möchte (would like)`,forms:vforms(m),vocab:verbV(m),vb:m,t:'pres',p:sb.p};
    return S([...sb.toks,fin,...ob.toks],cross(sb.en,['would like','want'].map(x=>sb.ep===2&&x==='want'?'wants':x),ob.en))}
  return gModal({mods:['möchten']});
}
/* modal + infinitive */
function gModal(o={}){
  const m=R(o.mods||MODALS),t=o.t||'pres';
  const c=clause(Object.assign({modal:m,t,pool:VERBS.filter(v=>v.inf!=='haben'),time:chance(.3)},o.co||{}));
  const r=mainOrders(c,o.front);return S(r.tokens,enOf(c),'.',{altTokens:r.alts});
}
/* questions */
const QW={wann:['wann','when'],wo:['wo','where'],wohin:['wohin','where','where to'],was:['was','what'],wen:['wen','who','whom'],wer:['wer','who'],warum:['warum','why']};
function qEn(c,lead){
  // English question: [lead] helper subject rest
  const pairs=c.modal?null:evQ(c.v,c.t,c.ep);let out=[];
  if(c.modal){const vp=evModal(c.modal,c.v,c.t,c.ep,false);out=vp.flatMap(x=>{const[h,...r]=x.split(' ');return['can','must','may','should','could','would'].includes(h)?cross(lead||'',h,c.sb.en,r.join(' '),c.eObj,c.ePlace,c.eAdv):[]});
    if(!out.length)out=vp.flatMap(x=>cross(lead||'',c.ep===2?'does':'do',c.sb.en,x.replace(/^(has|wants)/,m=>m==='has'?'have':'want'),c.eObj,c.ePlace,c.eAdv));return out}
  for(const[h,r]of pairs)out.push(...cross(lead||'',h,c.sb.en,r,c.eObj,c.ePlace,c.eAdv));
  return out;
}
function gQues(o={}){
  const kind=o.kind||R(['yn','yn','wann','wo','wohin','was','wen','wer']);
  if(kind==='yn'){const c=clause(Object.assign({time:chance(.25)},o.co||{}));
    const toks=[c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail];return S(toks,qEn(c),'?')}
  if(kind==='wann'){const c=clause(Object.assign({},o.co||{},{time:false}));const w=W('wann','wann : when',['qw']);return S([w,c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],qEn(c,'when'),'?')}
  if(kind==='wo'){const c=clause(Object.assign({pool:LV,place:false},o.co||{}));const w=W('wo','wo : where',['qw']);return S([w,c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],qEn(c,'where'),'?')}
  if(kind==='wohin'){const c=clause(Object.assign({pool:MV.filter(v=>!v.fl.includes('N')||true),place:false},o.co||{}));c.mid=c.mid.filter(x=>x.k!=='place');c.ePlace=[''];const w=W('wohin','wohin : where (to)',['qw']);
    return S([w,c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],[...qEn(c,'where'),...qEn(c,'where').map(x=>x+' to')],'?')}
  if(kind==='was'||kind==='wen'){const pool=TV.filter(v=>!v.fl.includes('P')&&!v.fl.includes('I')&&objFor(v).some(n=>kind==='wen'?/p/.test(n.tag):!/p/.test(n.tag)&&!n.bare));
    const c=clause(Object.assign({pool,objPool:kind==='wen'?PEOPLE:NOUNS.filter(n=>!/p/.test(n.tag))},o.co||{}));c.mid=c.mid.filter(x=>!['akk','kein','bare'].includes(x.k));c.eObj=[''];
    const w=W(kind,kind==='was'?'was : what':'wen : who(m) (accusative)',['qw']);return S([w,c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],qEn(c,kind==='was'?'what':['who','whom']),'?')}
  if(kind==='wer'){const c=clause(Object.assign({subj:{toks:[],en:['who'],p:2,ep:2}},o.co||{}));const w=W('wer','wer : who (subject)',['qw']);
    const vp=c.modal?evModal(c.modal,c.v,c.t,2,false):ev(c.v,c.t,2,false);return S([w,c.vt.fin,...midToks(c),...c.vt.tail],cross('who',vp,c.eObj,c.ePlace,c.eAdv),'?')}
  return gQues({kind:'yn'});
}
/* commands */
function impF(v,who){
  if(who==='ihr')return presF(v,4);
  if(who==='Sie')return v.inf==='sein'?'seien':(v.pre?v.base:v.inf);
  if(v.inf==='sein')return 'sei';if(v.inf==='haben')return 'hab';
  if(v.sc&&!/[äÄ]/.test(v.sc[1])&&v.inf!=='haben')return v.sc[1].replace(/t$/,'');
  const st=v.base.replace(/e?n$/,'');return /[td]$|ig$/.test(st)?st+'e':st;
}
function gCmd(o={}){
  const who=o.who||R(['du','du','ihr','Sie']);
  const pool=VERBS.filter(v=>v.inf!=='haben'&&v.inf!=='wohnen'&&!v.fl.includes('S')&&(v.fl.includes('T')||v.fl.includes('M')||v.fl.includes('D')));
  const c=clause(Object.assign({pool,subj:{toks:[],en:[''],p:who==='ihr'?4:1,ep:1},place:chance(.4)},o.co||{}));
  const f=impF(c.v,who),fin={la:f,lemma:c.v.inf,cids:['imp'],concept:`command, ${who} form`,forms:vforms(c.v),vocab:verbV(c.v),vb:c.v,t:'imp',why:`the ${who} command of ${c.v.inf}: ${f}`};
  const alt=who==='du'&&!/e$/.test(f)&&!c.v.sc&&!/[aeiou]$/.test(f)?[f+'e']:null;if(alt)fin.alt=alt;
  const sieT=who==='Sie'?[{la:'Sie',lemma:'Sie',cids:['subj'],concept:'Sie (formal you) after the verb',forms:['sie'],vocab:null,cap:1}]:[];
  const toks=[fin,...sieT,...midToks(c),...(c.v.pre?[{la:c.v.pre,lemma:c.v.inf,cids:['sep'],concept:'separable prefix',forms:[],vocab:null}]:[])];
  const ens=cross(vE(c.v).map(x=>x[0]),c.eObj,c.ePlace).map(x=>x.replace(/^\w/,m=>m.toUpperCase()));
  return S(toks,ens,'!');
}
/* comparisons */
function gComp(o={}){
  const kind=o.kind||R(['comp','comp','so','sup']);
  const pool=PEOPLE.filter(n=>!n.name||chance(.5));const a=R(ADJ.filter(x=>/[p]/.test(x.tags)&&EN_CMP[x.e]));
  const A=subject({kind:'noun',k:0,np:{det:R(['def','poss'])},pool});const v=SPECIAL.sein,vt=verbToks(v,'pres',A.p);
  if(kind==='sup'){const tok={la:a.sup.split(' ')[1],lemma:a.de,cids:['sup'],concept:'superlative (am …sten)',forms:[a.de,a.comp],vocab:`${a.de}, ${a.comp}, ${a.sup} : ${a.e}`,why:`superlative after sein: ${a.sup}`};
    return S([...A.toks,vt.fin,W('am','am : (with -sten) the most',['sup']),tok],cross(A.en,ev(v,'pres',A.ep),['the '+EN_CMP[a.e][1],EN_CMP[a.e][1]]))}
  const B=np(pick(pool,[A.n])||nn('Lehrer'),0,'nom',{det:R(['def','poss']),pp:R([0,1,4]),cid:'nomSubj',role:'compared with the subject, so nominative too'});
  if(kind==='so'){return S([...A.toks,vt.fin,SW('so'),{la:a.de,lemma:a.de,cids:['predadj'],concept:'adjective',forms:[a.comp],vocab:adjV(a)},SW('wie'),...B.toks],cross(A.en,ev(v,'pres',A.ep),'as',a.e,'as',B.en))}
  const ctok={la:a.comp,lemma:a.de,cids:['comp'],concept:'comparative (-er)',forms:[a.de,a.sup.split(' ')[1]],vocab:`${a.de}, ${a.comp}, ${a.sup} : ${a.e}`,why:`the comparative of ${a.de} is ${a.comp}`};
  return S([...A.toks,vt.fin,ctok,SW('als'),...B.toks],cross(A.en,ev(v,'pres',A.ep),EN_CMP[a.e][0],'than',B.en));
}
/* dative-verb gefallen: Der Film gefällt mir = I like the movie */
function gGefallen(){
  const n=R(NOUNS.filter(x=>/[vmfcb]/.test(x.tag)&&!x.bare&&!x.unc)),k=num(n);
  const sub=np(n,k,'nom',{det:R(['def','dies']),cid:'nomSubj',role:'the subject: the thing that pleases'});
  const who=R([0,1,'m','f',3,4,'pl']),pr=pronTok(pronFor(who,'dat'),'dat','gefallen takes the dative: the person who likes it');pr.cids=['datVerb','pron'];
  const f=k?'gefallen':'gefällt',fin={la:f,lemma:'gefallen',cids:['pres'],concept:`${k?'sie (plural)':'er / sie / es'}, present`,forms:['gefalle','gefällst','gefällt','gefallen','gefallt'],vocab:'gefallen (gefällt), gefiel, hat gefallen : be pleasing to (= like)',why:'the thing liked is the subject, so the verb agrees with it'};
  const eWho={0:'I',1:'you',m:'he',f:'she',3:'we',4:'you',pl:'they'}[who],s=eWho==='he'||eWho==='she';
  return S([...sub.toks,fin,pr],[...cross(eWho,s?'likes':'like',sub.en),...cross(sub.en,k?'are':'is','pleasing to',PRE[who])]);
}
/* two-way prepositions: where vs. where to */
function gTwoWay(o={}){
  const motion=o.motion??chance(.5);
  if(chance(.45)){return gC({pool:motion?PV:SV,t:o.t||R(['pres','pres','perf'])})}
  return gC({pool:motion?MV:LV,place:true,twoway:true,t:o.t||'pres'});
}
/* dative / accusative / genitive prepositions */
function gDatPrep(){
  const kind=R(['mit','mitV','zu','bei','aus','von','seit']);
  if(kind==='mit')return gC({pool:VERBS.filter(v=>/[LN]/.test(v.fl)&&!v.fl.includes('M')&&v.inf!=='wohnen'),mit:true,obj:chance(.5)});
  if(kind==='mitV'){const c=clause({pool:[vb('fahren')],place:true});const veh=R([['Bus','m','bus'],['Zug','m','train'],['Auto','n','car'],['Fahrrad','n','bike']]);
    const vn={de:veh[0],g:veh[1],e:veh[2],ep:veh[2]+'s',pl:null,gen:veh[0]+'s',tag:'t'};const ph=pp('mit',vn,0,'dat',{cid:'datPrep',why:'mit always takes the dative'});
    c.mid.splice(c.mid.findIndex(x=>x.k==='place'),0,{k:'pp',toks:ph.toks});c.ePlace=[...cross(c.ePlace,'by',veh[2]),...cross('by',veh[2],c.ePlace)];
    const ens=cross(c.sb.en,['take'].includes('x')?[]:ev(vb('fahren'),'pres',c.ep).concat(ev({e:'go',past:'went',pp:'gone',ing:'going',inf:'gehen'},'pres',c.ep)),c.ePlace);const r=mainOrders(c);return S(r.tokens,ens,'.',{altTokens:r.alts})}
  if(kind==='zu'||kind==='bei'){const sb=subject({pron:.8});const pool=kind==='zu'?[...FAMILY,nn('Arzt'),nn('Freund'),nn('Freundin')]:[...FAMILY,nn('Freund'),nn('Freundin')];const n=R(pool);
    const v=kind==='zu'?R([vb('gehen'),vb('fahren')]):R([vb('wohnen'),vb('bleiben'),vb('essen'),vb('schlafen')]);const vt=verbToks(v,'pres',sb.p);
    const ph=pp(kind,n,0,'dat',{det:n.tag.includes('F')?'poss':'def',pp:R([0,1,2,3,4,6]),cid:'datPrep',why:`${kind} always takes the dative`});
    const en=kind==='zu'?cross('to',ph.en.flatMap(x=>[x,x+"'s",x+"’s"])):[...cross('at',ph.en.flatMap(x=>[x+"'s",x+"’s",x+"'s house",x+"'s place"])),...cross('with',ph.en)];
    const vEn=ev(v,'pres',sb.ep).concat(v.inf==='fahren'?ev({e:'go',past:'went',pp:'gone',ing:'going',inf:'x'},'pres',sb.ep):[]);
    return S([...sb.toks,vt.fin,...ph.toks],cross(sb.en,vEn,en))}
  if(kind==='aus'||kind==='von'){const sb=subject({pron:.8});const v=vb('kommen');const vt=verbToks(v,'pres',sb.p);
    if(kind==='aus'){const pl=R(PLACES.filter(x=>/^(Schule|Kino|Büro|Museum|Restaurant|Bibliothek|Supermarkt|Bäckerei)$/.test(x.de)));const ph=pp('aus',pl,0,'dat',{cid:'datPrep',why:'aus always takes the dative'});
      return S([...sb.toks,vt.fin,...ph.toks],cross(sb.en,ev(v,'pres',sb.ep),['out of','from'],pl.to.map(x=>x.replace(/^(to|into) /,'')).map(x=>/^the /.test(x)?x:x)))}
    const n=R(FAMILY);const ph=pp('von',n,0,'dat',{det:'poss',pp:R([0,1,2,3,4,6]),cid:'datPrep',why:'von always takes the dative'});
    return S([...sb.toks,vt.fin,...ph.toks],cross(sb.en,ev(v,'pres',sb.ep),'from',ph.en))}
  // seit: present tense in German, have been -ing in English
  const sb=subject({pron:.8}),v=R([vb('wohnen'),vb('lernen'),vb('spielen'),vb('arbeiten')]);const vt=verbToks(v,'pres',sb.p);
  const d=R([['einem Jahr','Jahr','n','a year','one year'],['einer Woche','Woche','f','a week','one week'],['einem Monat','Monat','m','a month','one month'],['zwei Jahren','Jahr','pl','two years','two years']]);
  const obj=v.inf==='lernen'?[{la:'Deutsch',lemma:'Deutsch',cids:['noun'],concept:'language',forms:[],vocab:'Deutsch : German',cap:1}]:v.inf==='spielen'?[{la:R(['Fußball','Tennis','Klavier']),lemma:'x',cids:['noun'],concept:'',forms:[],vocab:null,cap:1}]:v.inf==='wohnen'?[W('hier','hier : here',['adv'])]:[];
  const objE=v.inf==='lernen'?['German']:v.inf==='spielen'?[{Fußball:'soccer',Tennis:'tennis',Klavier:'the piano'}[obj[0].la]]:v.inf==='wohnen'?['here']:[''];
  const [w1,w2]=d[0].split(' ');const stok={la:'seit',lemma:'seit',cids:['datPrep'],concept:'seit + dative',forms:[],vocab:PREP_V.seit,span:2,why:'seit always takes the dative, and German uses the present tense with it'};
  const tt=[stok,{la:w1,lemma:w1,cids:['art'],concept:'dative',forms:['ein','einen','einem','einer','zwei'],vocab:null},{la:w2,lemma:d[1],cids:['noun'],concept:'noun, dative',forms:['Jahr','Jahre','Jahren','Woche','Wochen','Monat','Monate','Monaten'],vocab:`${{n:'das',f:'die',m:'der',pl:'das'}[d[2]]} ${d[1]} : ${d[3].replace(/^(a|two) /,'')}`,cap:1}];
  const hb=sb.ep===2?'has':'have',ing=v.ing;
  return S([...sb.toks,vt.fin,...(obj[0]&&obj[0].la==='hier'?obj:[]),...tt,...(obj[0]&&obj[0].la!=='hier'?obj:[])],cross(sb.en,[hb+' been '+ing,hb+' '+v.pp],objE,'for',[d[3],d[4]]));
}
function gAkkPrep(){
  if(chance(.35)){const sb=subject({pron:.7}),v=R([vb('gehen'),vb('laufen'),vb('fahren')]);const vt=verbToks(v,'pres',sb.p);const pl=R([nn('Park')||PLACES[1],PLACES.find(x=>x.de==='Stadt'),PLACES.find(x=>x.de==='Garten')]);
    const ph=pp('durch',pl,0,'akk',{cid:'akkPrep',why:'durch always takes the accusative'});return S([...sb.toks,vt.fin,...ph.toks],cross(sb.en,ev(v,'pres',sb.ep),'through',ph.en))}
  return gC({akkPrep:true,pool:VERBS.filter(v=>/[TLN]/.test(v.fl)&&!v.fl.includes('P')&&!v.fl.includes('S')&&!v.fl.includes('M')&&v.inf!=='haben'&&v.inf!=='wohnen'),io:false});
}
const GEN_N=[['Regen','m','des Regens','the rain'],['Wetter','n','des Wetters','the weather'],['Film','m','des Films','the movie'],['Woche','f','der Woche','the week'],['Prüfung','f','der Prüfung','the test'],['Ferien','pl','der Ferien','the vacation']];
function gGen(){
  if(chance(.5)){ // possession: das Auto meines Vaters
    const thing=R(NOUNS.filter(n=>/[t]/.test(n.tag)&&!n.bare&&!n.unc)),owner=R([...FAMILY,nn('Lehrer'),nn('Lehrerin'),nn('Freund'),nn('Nachbar')]);
    const th=np(thing,0,'nom',{det:'def',cid:'nomPred',role:'after sein'});const ow=np(owner,0,'gen',{det:R(['def','poss']),pp:R([0,1,2,3,4,6]),cid:'genPoss',role:'the owner'});
    const t0=[W('Das','das : that, this',['demo']),{la:'ist',lemma:'sein',cids:['pres'],concept:'is',forms:vforms(SPECIAL.sein),vocab:null,vb:SPECIAL.sein,t:'pres',p:2},...th.toks,...ow.toks];t0[0].la='das';
    const ownE=ow.en.map(x=>x+(/s$/.test(x)?"'":"'s")),thE=thing.e;
    return S(t0,[...cross(['that is','this is'],ownE,thE),...cross(['that is','this is'],'the',thE,'of',ow.en)])}
  const g=R(GEN_N),pr=R(g[0]==='Regen'||g[0]==='Wetter'?['wegen','trotz']:['während']);
  const sb=subject({pron:.8}),v=pr==='während'?R([vb('schlafen'),vb('arbeiten'),vb('lernen')]):vb('bleiben');const vt=verbToks(v,'pres',sb.p);
  const[gw1,gw2]=g[2].split(' ');const ptok={la:pr,lemma:pr,cids:['genPrep'],concept:`${pr} + genitive`,forms:[],vocab:PREP_V[pr],span:2,why:`${pr} takes the genitive`};
  const gt=[ptok,{la:gw1,lemma:'der',cids:['art'],concept:`definite article, genitive`,forms:['der','die','das','den','dem','des'],vocab:null},{la:gw2,lemma:g[0],cids:['noun'],concept:'noun, genitive',forms:[g[0],g[0]+'s'],vocab:`${{m:'der',f:'die',n:'das',pl:'die'}[g[1]]} ${g[0]}${g[1]==='pl'?' (pl.)':''} : ${g[3].replace('the ','')}`,cap:1}];
  if(pr==='trotz'){const fb={la:'Fußball',lemma:'Fußball',cids:['noun'],concept:'sport (no article)',forms:[],vocab:'der Fußball : soccer',cap:1},v2=vb('spielen'),vt2=verbToks(v2,'pres',sb.p);
    return S([...sb.toks,vt2.fin,...gt,fb],[...cross(sb.en,ev(v2,'pres',sb.ep),'soccer',['despite','in spite of'],g[3]),...cross(['despite','in spite of'],g[3]+',',sb.en,ev(v2,'pres',sb.ep),'soccer')],'.',{altTokens:[[...gt,vt2.fin,...sb.toks,fb]]})}
  const home=v.inf==='bleiben'?[W('zu Hause','zu Hause : at home',['adv'])]:[];
  const eP=pr==='wegen'?['because of']:pr==='trotz'?['despite','in spite of']:['during'];
  return S([...sb.toks,vt.fin,...gt,...home],[...cross(sb.en,ev(v,'pres',sb.ep),home.length?['at home','home']:'',eP,g[3]),...cross(eP,g[3]+',',sb.en,ev(v,'pres',sb.ep),home.length?['at home','home']:'')],'.',{altTokens:[[...sb.toks,vt.fin,...home,...gt],[...gt,vt.fin,...sb.toks,...home]]});
}
/* subordinate clauses: weil, dass, wenn, ob */
const MAIN_INTRO={dass:[['Ich glaube','I think|I believe'],['Ich weiß','I know'],['Es ist gut','it is good'],['Ich hoffe','I hope']],ob:[['Ich weiß nicht','I do not know'],['Ich frage','I am asking|I ask'],['Weißt du','do you know']]};
function gSub(o={}){
  const conj=o.conj||R(['weil','weil','dass','wenn','ob']);
  const c=clause(Object.assign({t:R(['pres','pres','perf']),time:chance(.2)},o.co||{}));
  const subT=[{la:conj,lemma:conj,cids:['conj'],concept:`${conj} sends the verb to the end`,forms:[],vocab:{weil:'weil : because',dass:'dass : that',wenn:'wenn : when, whenever, if',ob:'ob : whether, if'}[conj],why:`after ${conj}, the conjugated verb goes to the end of the clause`},...subOrder(c)];
  const se=enOf(c);
  if(conj==='dass'||conj==='ob'){const[mi,me]=R(MAIN_INTRO[conj]);const mt=mi.split(' ').map(w=>W(w,null,['main']));mt[0].la=mt[0].la.toLowerCase();
    if(/^(Weißt)/.test(mi))mt[0].la='weißt';
    const q=/^weißt/.test(mt[0].la);const mens=me.split('|');return S([...withComma(mt),...subT],cross(mens,conj==='dass'?['that','']:['if','whether'],se),q?'?':'.',{altTokens:[[...mt,...subT]]})}
  // a main clause: weil / wenn
  const mains=conj==='weil'?[['ich bleibe zu Hause','I am staying at home|I stay at home|I am staying home|I stay home',['bleibe','zu','Hause'],'ich'],['wir lernen Deutsch','we are learning German|we learn German|we study German',['lernen','Deutsch'],'wir'],['ich bin glücklich','I am happy',['bin','glücklich'],'ich']]:
    [['bin ich glücklich','I am happy',['bin','glücklich'],'ich'],['spielen wir Fußball','we play soccer|we are playing soccer',['spielen','Fußball'],'wir'],['lese ich ein Buch','I read a book',['lese','ein','Buch'],'ich']];
  const mm=R(mains),me=mm[1].split('|');
  const mkMain=(inv)=>{const subjW=W(mm[3],null,['main']),vs=mm[2].map(w=>Object.assign(W(w,null,['main']),{cap:/^[A-ZÄÖÜ]/.test(w)?1:0}));return inv?[vs[0],subjW,...vs.slice(1)]:[subjW,...vs]};
  // Main clause first: "Ich bleibe zu Hause, weil ..."; or the sub clause first, then verb, subject: "Weil ..., bleibe ich zu Hause"
  const first=[...withComma(mkMain(false)),...subT],second=[...withComma(subT),...mkMain(true)];
  const eConj=conj==='weil'?['because']:['when','whenever','if'];
  const ens=[...cross(me,eConj,se),...cross(eConj,se.map(x=>x+','),me)];
  return conj==='weil'?S(first,ens,'.',{altTokens:[second]}):S(second,ens,'.',{altTokens:[first]});
}
/* relative clauses */
const RELP={m:T6('der den dem dessen'),f:T6('die die der deren'),n:T6('das das dem dessen'),pl:T6('die die denen deren')};
function gRel(){
  const role=R(['nom','akk','akk','dat']);const n=R([...PEOPLE.filter(x=>!x.name),...NOUNS.filter(x=>/[ab]/.test(x.tag)&&!x.unc)].filter(x=>role==='dat'?/p/.test(x.tag):true)),k=num(n);
  const head=np(n,k,'nom',{det:'def',cid:'nomPred',role:'after ist'}),gk=head.gk,rp=RELP[gk][CI[role]];
  const rtok={la:rp,lemma:'der',cids:['rel'],concept:`relative pronoun, ${GN[gk]}, ${CN[role]}`,forms:['der','die','das','den','dem','denen','dessen','deren'],vocab:'der, die, das : who, which, that (relative pronoun)',why:`${n.de} is ${k?'plural':GN[gk]}, and inside the relative clause it is ${role==='nom'?'the subject (nominative)':role==='akk'?'the direct object (accusative)':'the object of helfen (dative)'}: ${rp}`};
  let inner,ie;
  if(role==='nom'&&!/[pa]/.test(n.tag))return gRel();
  if(role==='nom'){const v=/a/.test(n.tag)?R([vb('schlafen'),vb('spielen'),vb('essen')]):R(VERBS.filter(x=>x.fl.includes('L')&&x.fl.includes('N')&&!x.pre));const vt=verbToks(v,'pres',head.p);const pl=R(PLACES);const pl2=pick((LOC_FOR[v.inf]||PLACES.map(x=>x.de)).map(PL))||pl;const ph=pp('in',pl2,0,'dat',{cid:'datTwo'});inner=[...ph.toks,...vt.sub];ie=cross(/p/.test(n.tag)?['who','that']:['that','which'],ev(v,'pres',head.ep),pl2.at)}
  else{const sb=subject({kind:'pron',pron:1});const v=role==='dat'?R([vb('helfen'),vb('danken')]):R(TV.filter(x=>!x.pre&&x.inf!=='haben'&&!x.fl.includes('I')&&!x.fl.includes('P')&&objFor(x).includes(n)));if(!v)return gRel();
    const vt=verbToks(v,R(['pres','perf']),sb.p);inner=[...sb.toks,...vt.sub];ie=[...cross(/p/.test(n.tag)?['who','whom','that','']:['that','which',''],sb.en,ev(v,vt.fin.t||'pres',sb.ep))];
    if(vt.fin.cids.includes('perf'))ie=cross(/p/.test(n.tag)?['who','whom','that','']:['that','which',''],sb.en,ev(v,'perf',sb.ep));}
  const toks=[W('das','das : that, this',['demo']),{la:k?'sind':'ist',lemma:'sein',cids:['pres'],concept:'present of sein',forms:vforms(SPECIAL.sein),vocab:null},...withComma(head.toks),rtok,...inner];
  const head0=toks.indexOf(head.toks[0]);if(head0<0){const i=toks.findIndex(t=>t.n===head.n);}
  return S(toks,cross(k?['those are','these are','they are']:['that is','this is','that’s','it is'],head.en,ie));
}
/* subjunctive II */
const K2_FUN=()=>VERBS.filter(v=>['spielen','gehen','fahren','fliegen','lesen','essen','kaufen','besuchen','tanzen','schwimmen','schlafen','kochen','lernen','einladen','fernsehen','einkaufen','bleiben'].includes(v.inf));
const WENN_K2=[['ich','reich','wäre','I were rich|I was rich',0],['ich','Zeit','hätte','I had time',0],['wir','mehr Geld','hätten','we had more money',3],['ich','du','wäre','I were you|I was you',0],['es','nicht so kalt','wäre','it were not so cold|it was not so cold|it was not that cold|it were not that cold',2]];
function gK2(o={}){
  const kind=o.kind||R(['wurde','wenn','wenn','gern']);
  if(kind==='wurde'||kind==='gern'){const c=clause(Object.assign({t:'k2',pool:kind==='gern'?K2_FUN():VERBS.filter(v=>!v.fl.includes('S')&&v.inf!=='haben'),time:chance(.3)}));
    if(kind==='gern'){const g=SW('gern',['gern']);const mid=c.mid;const i=mid.findIndex(x=>['akk','bare','kein','place','pp'].includes(x.k));if(i<0)mid.push({k:'gern',toks:[g]});else mid.splice(i,0,{k:'gern',toks:[g]});
      return S([...c.sb.toks,c.vt.fin,...mid.flatMap(x=>x.toks),...c.vt.tail],cross(c.sb.en,['would like to','would love to','would gladly'],vE(c.v).map(x=>x[0]),c.eObj,c.ePlace,c.eAdv))}
    const r=mainOrders(c);return S(r.tokens,enOf(c),'.',{altTokens:r.alts})}
  const w=R(WENN_K2),pers=w[4];const subjW=W(w[0],null,['subj']);const predW=w[1].split(' ').map(x=>Object.assign(W(x,x==='reich'?'reich : rich':x==='Zeit'?'die Zeit : time':x==='Geld'?'das Geld : money':null,[]),{cap:/^[A-Z]/.test(x)?1:0}));
  const vTok={la:w[2],lemma:w[2]==='wäre'||w[2]==='wären'?'sein':'haben',cids:['k2'],concept:'subjunctive II',forms:vforms(w[2].startsWith('w')?SPECIAL.sein:SPECIAL.haben),vocab:w[2].startsWith('w')?'wäre : would be, were':'hätte : would have, had',why:`subjunctive II of ${w[2].startsWith('w')?'sein':'haben'}: ${w[2]}`};
  const wenn={la:'wenn',lemma:'wenn',cids:['conj'],concept:'wenn sends the verb to the end',forms:[],vocab:'wenn : if, when',why:'after wenn, the conjugated verb goes to the end'};
  const sub=[wenn,subjW,...predW,vTok];
  const c=clause({t:'k2',ps:pers===0?[0]:pers===3?[3]:undefined,pron:1,pool:K2_FUN()});
  const mainInv=[c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],mainSt=[...c.sb.toks,c.vt.fin,...midToks(c),...c.vt.tail];
  const ie=w[3].split('|'),me=enOf(c);
  return S([...withComma(sub),...mainInv],[...cross('if',ie.map(x=>x+','),me),...cross(me,'if',ie)],'.',{altTokens:[[...sub,...mainInv],[...mainSt,...sub]]});
}
function gK2Past(){
  const c=clause({t:'k2p',pool:K2_FUN(),pron:.8});
  const wenn={la:'wenn',lemma:'wenn',cids:['conj'],concept:'wenn sends the verb to the end',forms:[],vocab:'wenn : if, when'};
  const w=R([['ich','Zeit','gehabt','hätte','I had had time',0],['wir','Zeit','gehabt','hätten','we had had time',3],['das Wetter','schön','gewesen','wäre','the weather had been nice',2]]);
  const sub=[wenn,...w[0].split(' ').map(x=>Object.assign(W(x,null,[]),{cap:/^[A-Z]/.test(x)?1:0})),Object.assign(W(w[1],w[1]==='Zeit'?'die Zeit : time':'schön : nice, beautiful',[]),{cap:w[1]==='Zeit'?1:0}),W(w[2],null,['part']),Object.assign(W(w[3],null,['k2p']),{forms:['hätte','hätten','wäre','wären','hatte','hatten','war','waren']})];
  const mainInv=[c.vt.fin,...c.sb.toks,...midToks(c),...c.vt.tail],mainSt=[...c.sb.toks,c.vt.fin,...midToks(c),...c.vt.tail];
  const me=enOf(c);return S([...withComma(sub),...mainInv],[...cross('if',w[4]+',',me),...cross(me,'if',w[4])],'.',{altTokens:[[...mainSt,...sub]]});
}
/* passive */
function gPass(past){
  const pairs=[['lesen','b'],['essen','f'],['kaufen','tcb'],['schreiben','w'],['trinken','d'],['waschen','cq'],['besuchen','p'],['kochen','k']];
  const [inf,tags]=R(pairs),v=vb(inf);const n=R(NOUNS.filter(x=>[...x.tag].some(c=>tags.includes(c))&&!x.bare&&(x.unc||true))),k=num(n);
  const sub=np(n,k,'nom',{det:R(['def','def','poss']),pp:R([0,2,3,4,6]),cid:'nomSubj',role:'the subject of the passive sentence'});
  const t=past?'passp':'pass',vt=verbToks(v,t,sub.p);
  let ag=[],agE=[''];if(chance(.6)){const a=R(PEOPLE.filter(x=>!x.name||chance(.4)));const ph=pp('von',a,num(a),'dat',{det:R(['def','poss']),pp:R([0,1,4]),cid:'datPrep',why:'von (by) always takes the dative'});ag=ph.toks;agE=cross('by',ph.en)}
  let tm=null;if(chance(.3)){tm=timeTok(past?'passp':'pres')}
  const toks=[...sub.toks,vt.fin,...(tm?[tm.tok]:[]),...ag,...vt.tail];
  const be=past?WAS[sub.ep]:BE[sub.ep],ens=past?cross(sub.en,[be,be+' being'],v.pp,agE,tm?tm.en:''):cross(sub.en,[be,be+' being'],v.pp,agE,tm?tm.en:'');
  return S(toks,ens);
}
/* um ... zu + infinitive */
const UMZU=[['Bibliothek','lesen',['Buch','Zeitung']],['Bibliothek','lernen',['Deutsch','Mathe']],['Restaurant','essen',['Pizza','Suppe','Kuchen','Nudeln']],['Café','trinken',['Kaffee','Tee','Saft']],['Café','essen',['Kuchen','Brezel']],
  ['Kino','sehen',['Film']],['Park','spielen',['Fußball','Tennis','Basketball']],['Supermarkt','kaufen',['Milch','Äpfel','Bananen','Saft','Eier']],['Bäckerei','kaufen',['Brötchen','Brezel','Kuchen']],['Stadt','kaufen',['Jacke','Schuh','Hut','Kleid']],['Museum','sehen',['Bild','Foto']]];
function gUmZu(){
  const[pl,gi,ns]=R(UMZU),goal=vb(gi);const n=nn(ns[Math.floor(Math.random()*ns.length)].replace(/^(Äpfel|Bananen|Eier)$/,m=>({Äpfel:'Apfel',Bananen:'Banane',Eier:'Ei'})[m]));
  const c=clause({pool:[vb('gehen'),vb('fahren')],placeN:PL(pl),place:true,pron:.8,twoway:true});
  const ob=np(n,/^(Apfel|Banane|Ei|Brötchen)$/.test(n.de)?1:0,'akk',{det:n.bare||n.unc?'none':R(['indef','indef','def']),cid:'akkDO',role:'the direct object'});
  const um=W('um','um … zu : in order to',['umzu']),zu=W('zu','zu : to',['umzu']),inf={la:goal.inf,lemma:goal.inf,cids:['inf'],concept:'infinitive (at the end, after zu)',forms:vforms(goal),vocab:verbV(goal)};
  const main=mainOrders(c).tokens,umT=[um,...ob.toks,zu,inf];const mainD=[...main.slice(0,-1),Object.assign({},main[main.length-1],{post:','})];
  return S([...mainD,...umT],cross(enOf(c),['to','in order to'],vE(goal).map(x=>x[0]),ob.en),'.',{altTokens:[[...main,...umT]]});
}
function gUmZuOld(){
  const c=clause({pool:MV.filter(v=>!v.pre),place:true,pron:.8});
  const goal=R(LV.concat(TV).filter(v=>!v.pre&&v.fl.includes('T')&&v.inf!=='haben'&&!v.fl.includes('I')&&!v.fl.includes('P')));const n=R(objFor(goal).filter(x=>!x.name&&!/p/.test(x.tag))||[nn('Buch')]);if(!n)return gUmZu();
  const ob=np(n,num(n),'akk',{det:n.bare?'none':R(['indef','def']),cid:'akkDO',role:'the direct object'});
  const um=W('um','um … zu : in order to',['umzu']),zu=W('zu','zu : to',['umzu']),inf={la:goal.inf,lemma:goal.inf,cids:['inf'],concept:'infinitive (at the end, after zu)',forms:vforms(goal),vocab:verbV(goal)};
  const main=mainOrders(c).tokens,umT=[um,...ob.toks,zu,inf];
  return S([...main,...umT],cross(enOf(c),['to','in order to'],vE(goal).map(x=>x[0]),ob.en));
}
/* conjugation sprint */
const FORM_V=()=>[...VERBS.filter(v=>!['legen','stellen'].includes(v.inf)),SPECIAL.sein,SPECIAL.werden,...MODALS.map(m=>SPECIAL[m])];
function gForm(tenses){
  const v=R(FORM_V()),t=R(tenses.filter(x=>!(v.modal&&x==='perf'))),p=R([0,1,2,3,4,5]);
  const vt=verbToks(v,t,p),la=[vt.fin.la,...vt.tail.map(x=>x.la)].join(' ').replace(/\s+/g,' ');
  const tok={la,lemma:v.inf,cids:['form',t],concept:`${PERS[p]}, ${TN[t]}`,forms:vforms(v),vocab:verbV(v),vb:v,t,p};
  const pr=['ich','du','er','wir','ihr','sie'][p];
  const s=S([tok],[`Write the ${TN[t]} of ${v.inf} (“to ${v.e}”) for ${pr}${v.pre&&(t==='pres'||t==='praet')?' (the prefix goes after the verb, so write both parts)':''}`]);s.form=1;return s;
}

/* ---------- uses: which case, and why (identify mode, extra credit, the case charts) ---------- */
const USES={
 nom:{name:'Nominative',word:'the nominative',list:[
  {id:'nomSubj',full:'the nominative for the subject',n:'Subject',syn:['subject','subj','doer','who does it','the one doing','performer','agent','actor'],what:'who or what does the action, or what is described',la:'Der Hund schläft',en:'The dog is sleeping'},
  {id:'nomPred',full:'the nominative after sein (predicate)',n:'After sein (predicate noun)',syn:['predicate','predicate nominative','predicate noun','after sein','after to be','after is','complement','renames','equals','after werden','after ist','linking verb'],what:'a noun that says what the subject is, after sein or werden',la:'Das ist der Lehrer',en:'That is the teacher'}]},
 akk:{name:'Accusative',word:'the accusative',list:[
  {id:'akkDO',full:'the accusative for the direct object',n:'Direct object',syn:['direct object','object','dobj','receives the action','receiver','what is affected'],what:'who or what the action is done to',la:'Ich sehe den Hund',en:'I see the dog'},
  {id:'akkPrep',full:'the accusative after durch, für, gegen, ohne, um',n:'After an accusative preposition',syn:['always accusative','fixed preposition','durch','fur','für','gegen','ohne','dogfu','fudgo','after a preposition that always takes accusative'],what:'durch, für, gegen, ohne and um always take the accusative',la:'für meine Mutter',en:'for my mother'},
  {id:'akkTwo',full:'the accusative after a two-way preposition, for movement (wohin?)',n:'Two-way preposition: movement (wohin?)',syn:['wohin','where to','motion','movement','direction','destination','change of place','going to','moving','two way motion','two way movement','two way'],what:'in, an, auf … for movement to a place: wohin?',la:'Ich gehe in den Park',en:'I go into the park'},
  {id:'akkTime',full:'the accusative for a definite time',n:'Definite time',syn:['time','time expression','definite time','when','how often','duration','specific time','time without preposition','jeden tag'],what:'a time with no preposition: jeden Tag, letzte Woche, nächsten Sommer',la:'Ich spiele jeden Tag',en:'I play every day'}]},
 dat:{name:'Dative',word:'the dative',list:[
  {id:'datIO',full:'the dative for the indirect object',n:'Indirect object',syn:['indirect object','indirect','recipient','to whom','for whom','gets something','receiver of the object'],what:'the person something is given, shown or bought to or for',la:'Ich gebe dem Kind einen Ball',en:'I give the child a ball'},
  {id:'datPrep',full:'the dative after aus, bei, mit, nach, seit, von, zu',n:'After a dative preposition',syn:['always dative','fixed preposition','after a preposition that always takes dative','aus','bei','mit','nach','seit','von','zu'],what:'aus, bei, mit, nach, seit, von and zu always take the dative',la:'mit meinem Bruder',en:'with my brother'},
  {id:'datTwo',full:'the dative after a two-way preposition, for position (wo?)',n:'Two-way preposition: position (wo?)',syn:['where','location','in a place','no motion','static','staying','stationary','two way location','two way position','where something is','two way'],what:'in, an, auf … for where someone or something is: wo?',la:'Ich bin im Park',en:'I am in the park'},
  {id:'datVerb',full:'the dative after a dative verb (helfen, danken, gefallen …)',n:'Dative verb',syn:['dative verb','verb takes dative','verb that takes dative','helfen','danken','gefallen','antworten','gehoren','gehören','special verb','verb'],what:'a few verbs take a dative object: helfen, danken, antworten, gefallen, gehören',la:'Ich helfe meiner Oma',en:'I help my grandma'}]},
 gen:{name:'Genitive',word:'the genitive',list:[
  {id:'genPoss',full:'the genitive for possession',n:'Possession (whose?)',syn:['possession','possessive','owner','whose','belongs','belonging','ownership','apostrophe s'],what:'whose something is: das Auto meines Vaters',la:'das Auto meines Vaters',en:'my father’s car'},
  {id:'genPrep',full:'the genitive after wegen, trotz, während, statt',n:'After a genitive preposition',syn:['always genitive','genitive preposition','wegen','trotz','wahrend','während','statt','anstatt','because of','despite','during','after a preposition that takes genitive'],what:'wegen, trotz, während and statt take the genitive',la:'wegen des Regens',en:'because of the rain'}]}
};
const TYPES={};Object.entries(USES).forEach(([c,u])=>u.list.forEach(x=>TYPES[x.id]=Object.assign(x,{c})));
const TY=cid=>TYPES[cid]?cid:null;
function idQuestion(ty){
  let q;
  if(ty==='nomSubj')q=gC({sk:'noun',pool:TV});
  else if(ty==='nomPred')q=chance(.5)?gRel():gGen();
  else if(ty==='akkDO')q=gC({pool:TV.filter(v=>!v.fl.includes('P')),obj:true});
  else if(ty==='akkPrep')q=gAkkPrep();
  else if(ty==='akkTwo')q=gTwoWay({motion:true});
  else if(ty==='akkTime')q=gC({time:true,t:R(['pres','perf'])});
  else if(ty==='datIO')q=gC({pool:IV,io:'noun'});
  else if(ty==='datPrep')q=chance(.6)?gDatPrep():gPass();
  else if(ty==='datTwo')q=gTwoWay({motion:false});
  else if(ty==='datVerb')q=chance(.7)?gC({pool:DVB}):gGefallen();
  else if(ty==='genPoss')q=gGen();
  else q=gGen();
  return finish(q);
}
const ID_TOPIC={nomakk:['nomSubj','akkDO'],gender:['nomSubj','akkDO'],kein:['akkDO'],akkprep:['akkPrep'],v2:['akkTime','akkDO'],dat:['datIO'],datprep:['datPrep'],datverb:['datVerb'],twoway:['akkTwo','datTwo'],gen:['genPoss','genPrep'],rel:['nomPred'],pass:['nomSubj','datPrep'],passpast:['nomSubj','datPrep'],sein:['nomPred'],pron:['akkDO','datIO'],perf:['akkDO'],poss:['akkDO','nomSubj']};

/* ---------- topics by course ---------- */
const TOPICS=[
['gender','I','Nouns and articles','Articles and gender (der, die, das; ein, eine)',()=>gC({sk:chance(.5)?'noun':null,objDet:R(['def','indef']),subjNp:{det:R(['def','indef'])},pool:TV.filter(v=>!v.fl.includes('P')),obj:true})],
['plural','I','Nouns and articles','Plural nouns',()=>gC({sk:'noun',k:1,ok:1,pool:TV.filter(v=>!v.fl.includes('P')),obj:true})],
['nomakk','I','Nouns and articles','Nominative and accusative (der → den)',()=>gC({sk:chance(.6)?'noun':null,pool:TV.filter(v=>!v.fl.includes('P')),obj:true,objDet:R(['def','indef','poss'])})],
['poss','I','Nouns and articles','Possessive adjectives (mein, dein, sein, ihr …)',()=>gC({sk:chance(.5)?'noun':null,subjNp:{det:'poss'},objDet:'poss',pool:TV.filter(v=>!v.fl.includes('P')),obj:true})],
['kein','I','Nouns and articles','Negation: nicht and kein',()=>chance(.25)?gSein('pres',{neg:true,kind:'adj'}):gC({neg:true,pool:[...TV.filter(v=>!v.fl.includes('P')),...NV]})],
['pres','I','Verbs','Present tense: regular verbs',()=>gC({vf:v=>!v.sc&&!v.pre&&!v.irrT,pron:.75})],
['stem','I','Verbs','Present tense: stem-changing verbs (fährt, isst, liest)',()=>gC({vf:v=>!!v.sc&&!v.pre&&v.inf!=='haben',ps:R([[1],[2],[1,2],[1,2,0]]),pron:.8,place:chance(.3)})],
['sein','I','Verbs','sein and haben',()=>chance(.55)?gSein('pres'):gHaben('pres')],
['gern','I','Verbs','gern: saying what you like to do',()=>gGern()],
['moechte','I','Verbs','möchte (would like)',gMoechte],
['v2','I','Word order','Verb-second word order (Heute spiele ich …)',()=>gC({time:true,front:'time',pool:[...TV.filter(v=>!v.fl.includes('P')),...NV]})],
['ques','I','Word order','Questions: yes or no, and question words',()=>gQues()],
['akkprep','I','Prepositions','Accusative prepositions (durch, für, gegen, ohne, um)',gAkkPrep],
['sep','I','Verbs','Separable verbs (anrufen, einladen …)',()=>gC({vf:v=>!!v.pre,time:chance(.4)})],
['dat','II','Cases','Dative case: indirect objects',()=>chance(.15)?gC({pool:IV,io:'noun',dop:true}):gC({pool:IV,io:'noun'})],
['datprep','II','Prepositions','Dative prepositions (aus, bei, mit, nach, seit, von, zu)',gDatPrep],
['datverb','II','Cases','Dative verbs (helfen, danken, gefallen …)',()=>chance(.65)?gC({pool:DVB}):gGefallen()],
['twoway','II','Prepositions','Two-way prepositions (wo? or wohin?)',()=>gTwoWay()],
['pron','II','Cases','Personal pronouns: accusative and dative (ihn, ihm …)',()=>chance(.5)?gC({pool:TV.filter(v=>!v.fl.includes('P')),dop:true,obj:true}):gC({pool:IV,io:'pron',dop:chance(.4)})],
['perf','II','Past tenses','Perfect tense with haben',()=>gC({t:'perf',vf:v=>v.aux==='h'&&!v.pre,time:chance(.5)})],
['perfsein','II','Past tenses','Perfect tense with sein',()=>gC({t:'perf',pool:VERBS.filter(v=>v.aux==='s'),place:chance(.6),time:chance(.5)})],
['perfsep','II','Past tenses','Perfect tense: separable and inseparable verbs',()=>gC({t:'perf',vf:v=>!!v.pre||/^(be|ver|er|ge|ent|emp|zer)/.test(v.inf),time:chance(.4)})],
['imper','II','Verbs','Commands (imperative)',()=>gCmd()],
['comp','II','Adjectives','Comparative and superlative',()=>gComp()],
['modal','III','Verbs','Modal verbs (können, müssen, dürfen, sollen, wollen)',()=>gModal()],
['praetmod','III','Past tenses','Simple past: sein, haben and modal verbs (war, hatte, konnte)',()=>R([()=>gSein('praet'),()=>gHaben('praet'),()=>gModal({t:'praet'})])()],
['praet','III','Past tenses','Simple past: regular and irregular verbs',()=>gC({t:'praet',time:chance(.5),vf:v=>!v.irrT})],
['sub','III','Word order','Subordinate clauses (weil, dass, wenn, ob): verb at the end',()=>gSub()],
['adjweak','III','Adjectives','Adjective endings after der and dieser',()=>gC({sk:chance(.4)?'noun':null,subjNp:{det:R(['def','dies']),adj:'auto'},objDet:R(['def','dies']),objNp:{adj:'auto'},pool:TV.filter(v=>!v.fl.includes('P')&&!objFor(v).every(n=>n.bare)),obj:true})],
['adjmixed','III','Adjectives','Adjective endings after ein, kein and mein',()=>gC({sk:chance(.4)?'noun':null,subjNp:{det:R(['indef','poss']),adj:'auto'},objDet:R(['indef','poss']),objNp:{adj:'auto'},pool:TV.filter(v=>!v.fl.includes('P')&&!objFor(v).every(n=>n.bare)),obj:true})],
['gen','III','Cases','Genitive: possession and genitive prepositions',gGen],
['fut','III','Tenses','Future tense (werden + infinitive)',()=>gC({t:'fut',time:chance(.6)})],
['k2','IV','Subjunctive','Subjunctive II: würde, wäre, hätte',()=>gK2({kind:R(['wurde','gern'])})],
['k2wenn','IV','Subjunctive','Subjunctive II: wenn clauses (if I were …)',()=>gK2({kind:'wenn'})],
['rel','IV','Word order','Relative clauses (der, den, dem …)',gRel],
['plusq','IV','Past tenses','Past perfect (Plusquamperfekt)',()=>gC({t:'plusq'})],
['adjall','IV','Adjectives','Adjective endings: all three sets, every case',()=>chance(.4)?gC({pool:IV,io:'noun',objNp:{adj:'auto'},objDet:R(['def','indef','poss'])}):gC({sk:'noun',subjNp:{det:R(['def','indef','poss','dies']),adj:'auto'},objNp:{adj:'auto'},objDet:R(['def','indef','poss','none']),pool:TV.filter(v=>!v.fl.includes('P')&&!objFor(v).every(n=>n.bare)),obj:true})],
['umzu','IV','Word order','um … zu (in order to)',gUmZu],
['pass','AP','Advanced structures','Passive voice (wird … gelesen)',()=>gPass(false)],
['passpast','AP','Advanced structures','Passive in the past (wurde … gelesen)',()=>gPass(true)],
['k2past','AP','Advanced structures','Past subjunctive II (hätte … gemacht)',gK2Past],
['forms','AP','Review','Conjugation sprint: every tense',()=>gForm(['pres','praet','perf','fut','k2'])],
['mixed','AP','Review','Mixed review: everything',null]
].map(([id,level,group,name,gen])=>({id,level,group,name,gen}));
TOPICS.find(t=>t.id==='mixed').gen=()=>R(TOPICS.filter(t=>t.id!=='mixed'&&t.id!=='forms')).gen();

/* ---------- build your own sentence type ---------- */
const FRAMES=[['stmt','Plain statement'],['neg','Negative statement (nicht, kein)'],['yn','Yes or no question'],['qw','Question with a question word'],['modal','Modal verb + infinitive (können, müssen …)'],['sub','weil or dass clause (verb at the end)'],['cmd','Command']];
const ING_ALL=[['adj','Adjective with an ending','Nouns'],['poss','Possessive (mein, dein …)','Nouns'],['plur','Plural nouns','Nouns'],['pron','Object pronoun (ihn, ihm …)','Nouns'],
 ['io','Indirect object (dative)','Objects and extras'],['place','Place: two-way preposition','Objects and extras'],['akkp','für or ohne + a person','Objects and extras'],['mit','mit + a person','Objects and extras'],['time','Time expression','Objects and extras'],
 ['pres','Present','Tense'],['perf','Perfect','Tense'],['praet','Simple past','Tense'],['fut','Future','Tense']];
const FRAME_ONLY={},FRAME_NOT={cmd:['perf','praet','fut','pres','time'],modal:['perf','fut']};
const ingName=id=>(ING_ALL.find(x=>x[0]===id)||[0,id])[1];
function optsFor(set){
  const o={},vf=[];const tense=['pres','perf','praet','fut'].filter(x=>set.has(x));o.t=tense.length?R(tense):'pres';
  if(set.has('adj')){if(chance(.5)){o.sk='noun';o.subjNp=Object.assign(o.subjNp||{},{adj:'auto'})}else{o.objNp=Object.assign(o.objNp||{},{adj:'auto'});o.obj=true;vf.push(v=>v.fl.includes('T')&&!v.fl.includes('P')&&!objFor(v).every(n=>n.bare))}}
  if(set.has('poss')){if(chance(.5)&&!o.subjNp){o.sk='noun';o.subjNp={det:'poss'}}else{o.objDet='poss';o.obj=true;vf.push(v=>v.fl.includes('T')&&!objFor(v).every(n=>n.bare))}}
  if(set.has('plur')){o.k=1;o.ok=1;if(o.sk!=='noun'&&chance(.5))o.sk='noun'}
  if(set.has('pron')){o.dop=true;o.obj=true;vf.push(v=>v.fl.includes('T')&&!v.fl.includes('P'))}
  if(set.has('io')){o.io=set.has('pron')?'pron':'noun';vf.push(v=>v.fl.includes('I'))}
  if(set.has('place')&&!set.has('io')){o.place=true;vf.push(v=>/[MLPS]/.test(v.fl)&&v.inf!=='wohnen')}
  if(set.has('akkp'))o.akkPrep=true;if(set.has('mit'))o.mit=true;
  if(set.has('time'))o.time=true;
  if(vf.length)o.vf=v=>vf.every(f=>f(v));
  return o;
}
function B(frame,ings,must){
  let list=[...ings].filter(x=>!(FRAME_NOT[frame]||[]).includes(x));
  for(let tries=0;tries<40;tries++){
    const set=new Set(list);ALT=[];
    try{
      const o=optsFor(set);let q;
      if(frame==='stmt')q=st(clause(o),{});
      else if(frame==='neg')q=st(clause(Object.assign(o,{neg:true})),{});
      else if(frame==='yn')q=gQues({kind:'yn',co:o});
      else if(frame==='qw')q=gQues({kind:R(['wann','was','wen','wer']),co:o});
      else if(frame==='modal')q=gModal({co:o,t:o.t==='praet'?'praet':'pres'});
      else if(frame==='sub')q=gSub({conj:R(['weil','dass']),co:o});
      else if(frame==='cmd')q=gCmd({co:o});
      if(q&&q.tokens.length){q.built=[frame,...list];return q}
    }catch(e){if(typeof console!=='undefined'&&tries>35)console.warn(e)}
    if(tries>8&&tries%4===0&&list.length>1){const drop=list.map((x,i)=>i).filter(i=>list[i]!==must);if(drop.length)list.splice(R(drop),1)}
  }
  const q=gC({});q.built=[frame];return q;
}
const fitsFrame=(f,x)=>!(FRAME_NOT[f]||[]).includes(x);
function makeBuilt(frames,ings,per,focus){
  const fF=[...frames].filter(f=>focus&&focus.has(f)),fI=[...ings].filter(x=>focus&&focus.has(x));
  let frame=R([...frames]),must=null;const opts=[...fF.map(f=>['f',f]),...fI.map(x=>['i',x])];
  if(opts.length){const[k,v]=R(opts);if(k==='f')frame=v;else{must=v;const ok=[...frames].filter(f=>fitsFrame(f,v));if(ok.length&&!fitsFrame(frame,v))frame=R(ok)}}
  let pool=[...ings].filter(x=>x!==must).sort(()=>Math.random()-.5);
  const n=per==='all'?pool.length+(must?1:0):Math.min(pool.length+(must?1:0),+per);
  if(must)pool=[must,...pool];
  const q=B(frame,pool.slice(0,n),must),fn=FRAMES.find(f=>f[0]===q.built[0])[1],used=q.built.slice(1);
  q.topic={id:'built',level:'I',name:fn+(used.length?' + '+used.map(ingName).join(' + '):'')};
  return finish(q);
}
const TOPIC_PLAN={plural:{ing:['plur']},poss:{ing:['poss']},pron:{ing:['pron']},dat:{ing:['io']},twoway:{ing:['place']},perf:{ing:['perf']},praet:{ing:['praet']},fut:{ing:['fut']},kein:{frame:'neg'},ques:{frame:'yn|qw'},modal:{frame:'modal'},sub:{frame:'sub'},imper:{frame:'cmd'},v2:{ing:['time']}};
function makeFocused(selected,focus){
  const foc=[...focus].filter(x=>selected.has(x));if(!foc.length)return makeQuestion(selected);
  const fid=R(foc),ft=TOPICS.find(t=>t.id===fid),plan=TOPIC_PLAN[fid];
  const extras=[...selected].filter(x=>x!==fid&&TOPIC_PLAN[x]&&TOPIC_PLAN[x].ing);
  if(plan&&extras.length&&chance(.65)){
    const ex=TOPIC_PLAN[R(extras)],frame=plan.frame?R(plan.frame.split('|')):'stmt';
    const q=B(frame,[...new Set([...(plan.ing||[]),...ex.ing])],plan.ing?plan.ing[0]:null);
    const extraNames=q.built.slice(1).filter(x=>!(plan.ing||[]).includes(x)).map(ingName);
    q.topic=Object.assign({},ft,{name:ft.name+(extraNames.length?' + '+extraNames.join(' + '):'')});return finish(q);
  }
  return makeQuestion(new Set([fid]));
}
function makeQuestion(selected){
  ALT=[];const pid=R([...selected]),topic=TOPICS.find(t=>t.id===pid)||TOPICS[0];let q;
  for(let i=0;i<12;i++){try{q=topic.gen();if(q&&q.tokens&&q.tokens.length)break}catch(e){if(i>10)console.warn(e)}}
  if(!q)q=gC({});
  q.topic=topic;
  if(q.form)q.tokens[0].blank=true;
  return finish(q);
}
/* final touches: capital letters, the displayed sentence, which charts fit it */
const CHART_OF={pres:'pres',praet:'praet',perf:'perf',plusq:'perf',fut:'fut',k2:'k2',k2p:'k2',pass:'pass',passp:'pass',imp:'cmd'};
const CASE_CHART={art:'art',poss:'art',dies:'art',kein:'art',adj:'adj',pa:'pron',pd:'pron',pron:'pron',akkPrep:'prep',datPrep:'prep',akkTwo:'prep',datTwo:'prep',genPrep:'prep',prep:'prep',rel:'rel',modal:'modal',conj:'order',sep:'order',umzu:'order'};
function finish(q){
  q.altTokens=q.altTokens||[];q.alts=q.alts||[];
  // nouns keep their capital letter; the first word of the sentence gets one
  q.display=deJoin(q.tokens);
  const ch=new Set();
  for(const t of q.tokens){if(t.t&&CHART_OF[t.t])ch.add(CHART_OF[t.t]);if(t.cids)t.cids.forEach(c=>{if(CASE_CHART[c])ch.add(CASE_CHART[c])});
    if(t.vb&&t.vb.sc&&t.t==='pres')ch.add('irrpres');if(t.vb&&['sein','haben','werden','wissen'].includes(t.vb.inf)&&t.t==='pres')ch.add('shw');if(t.cids&&t.cids.includes('modal'))ch.add('modal');}
  const order=['pres','irrpres','shw','art','adj','pron','prep','perf','praet','modal','fut','k2','pass','rel','cmd','order'];
  q.charts=[...ch].sort((a,b)=>order.indexOf(a)-order.indexOf(b)).slice(0,4);if(!q.charts.length)q.charts=['pres'];
  return q;
}

/* ---------- checking answers ---------- */
// words that become a different word without their umlaut
const CLASH=new Set(['schon','hatte','hatten','hattest','hattet','wurde','wurden','wurdest','wurdet','konnte','konnten','musste','mussten','durfte','durften','mochte','mochten','war','waren','zahlen','mutter','bruder','vater','tochter','apfel','garten','mantel','fahrt','lauft','schlaft','tragt','wascht','drucken','zuruck','fur'].map(foldDE));
const wordsS=s=>String(s).normalize('NFC').replace(/[.,!?;:"“”„«»()]/g,' ').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
/* every accepted way of writing a token list: [{w: word, i: token index}] */
function candsOf(ts,cap=900){let c=[[]];ts.forEach((t,i)=>{const opts=[t.la,...(t.alt||[])];if(t.opt)opts.push('');c=c.flatMap(x=>opts.map(o=>[...x,...(o?o.split(' ').map(w=>({w,i})):[])]));if(c.length>cap)c=c.slice(0,cap)});return c}
const key=a=>a.map(x=>foldDE(x.w||x)).join(' ');
function gradeTokens(sets,input){
  const uRaw=wordsS(input);if(!uRaw.length)return{ok:false,empty:true};
  const cands=sets.flatMap(ts=>candsOf(ts)),uk=key(uRaw);
  const hit=cands.find(c=>key(c)===uk);
  if(hit){
    // Sie / Ihnen / Ihr (formal) is a different word from sie / ihnen / ihr
    const formal=hit.map((x,i)=>i>0&&/^(Sie|Ihnen|Ihr\w*)$/.test(x.w)&&uRaw[i]!==x.w&&uRaw[i].toLowerCase()===x.w.toLowerCase()?uRaw[i]:null).filter(Boolean);
    if(formal.length)return{ok:false,essential:formal,formal:true};
    const caps=hit.map((x,i)=>i>0&&/^\p{Lu}/u.test(x.w)&&!/^\p{Lu}/u.test(uRaw[i])?x.w:null).filter(Boolean);
    return caps.length?{ok:true,caps}:{ok:true};
  }
  const us=stripU(uk);const c=cands.find(c=>stripU(key(c))===us);if(!c)return{ok:false};
  const forms=new Set(sets.flat().flatMap(t=>(t.forms||[]).filter(Boolean).map(foldDE)));
  const clash=uRaw.filter((w,i)=>foldDE(w)!==foldDE(c[i].w)&&(CLASH.has(foldDE(w))||CLASH.has(foldDE(c[i].w))||forms.has(foldDE(w))));
  return clash.length?{ok:false,essential:clash}:{ok:true,macron:true,missing:uRaw.filter((w,i)=>foldDE(w)!==foldDE(c[i].w))};
}
const grade=(tok,input)=>gradeTokens([[tok]],input);
const gradeLatin=(q,input)=>gradeTokens([q.tokens,...(q.altTokens||[])],input);
/* what went wrong, worked out by the site itself: a wrong ending, a wrong case, a missing umlaut, the word order */
function explainDE(q,input){
  const raw=wordsS(input),u=raw.map(foldDE);if(!u.length)return[];
  const sets=[q.tokens,...(q.altTokens||[])];const notes=[];
  const all=sets.flatMap(ts=>candsOf(ts).map(c=>({c,ts})));
  const bag=a=>[...a].sort().join(' ');
  // same words, different order
  const same=all.find(({c})=>c.length===u.length&&bag(c.map(x=>foldDE(x.w)))===bag(u));
  if(same){
    const fin=same.ts.find(t=>t.cids&&t.vb&&t.t)||same.ts.find(t=>t.cids&&(t.cids.includes('aux')||t.cids.includes('modal')));
    const conj=same.ts.find(t=>t.cids&&t.cids.includes('conj'));
    const tail=same.ts.filter(t=>t.cids&&(t.cids.includes('part')||t.cids.includes('inf')||t.cids.includes('sep')));
    let m='<b>Word order.</b> You have the right words in the wrong order.';
    if(conj)m+=` After <b>${conj.la}</b>, the conjugated verb goes to the very end of that clause.`;
    else if(q.end==='?'&&!same.ts[0].vb&&!(same.ts[0].cids||[]).includes('qw'))m+='';
    else if(fin)m+=` In a German statement the conjugated verb (<b>${fin.la}</b>) is always the second element: if something else comes first, such as a time, the subject goes right after the verb.`;
    if(tail.length&&foldDE(raw[raw.length-1])!==foldDE(tail[tail.length-1].la))m+=` ${tail.map(t=>'<b>'+t.la+'</b>').join(' and ')} go${tail.length>1?'':'es'} to the end.`;
    notes.push(m);return notes;
  }
  // same length: compare word by word with the closest version
  const best=all.filter(({c})=>c.length===u.length).map(x=>({x,d:x.c.reduce((s,w,i)=>s+(foldDE(w.w)===u[i]?0:1),0)})).sort((a,b)=>a.d-b.d)[0];
  if(best&&best.d<=3){
    const {c,ts}=best.x;
    c.forEach((w,i)=>{if(foldDE(w.w)===u[i])return;const t=ts[w.i];
      const known=(t.forms||[]).filter(Boolean).map(foldDE).includes(u[i]);
      const r=raw[i];
      if(stripU(w.w)===stripU(u[i]))notes.push(foldDE(w.w).length<u[i].length?`<b>${r}</b> → <b>${w.w}</b>: no umlaut here.`:`<b>${w.w}</b> needs its umlaut${CLASH.has(u[i])||CLASH.has(foldDE(w.w))?` (<b>${r}</b> is a different word)`:''}.`);
      else if(known&&t.why)notes.push(`<b>${r}</b> → <b>${w.w}</b>: ${t.why}.`);
      else if(known)notes.push(`<b>${r}</b> → <b>${w.w}</b> (${t.concept}).`);
    });
  }
  return notes.slice(0,4);
}
const normE=s=>(' '+String(s).toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[’‘]/g,"'")+' ')
  .replace(/\bwon't\b/g,'will not').replace(/\bcan't\b/g,'cannot').replace(/\bshan't\b/g,'shall not').replace(/n't\b/g,' not').replace(/\bcannot\b/g,'can not')
  .replace(/\bi'm\b/g,'i am').replace(/'re\b/g,' are').replace(/\b(he|she|it|that|what|who|there|here|where|when)'s\b/g,'$1 is').replace(/'ve\b/g,' have').replace(/'ll\b/g,' will').replace(/'d\b/g,' would')
  .replace(/\bgonna\b/g,'going to').replace(/\bwanna\b/g,'want to').replace(/\by'all\b|\byou guys\b|\byou all\b/g,'you').replace(/\bin order to\b/g,'to').replace(/\bo'clock\b/g,'oclock')
  .replace(/\bmom\b/g,'mother').replace(/\bdad\b/g,'father').replace(/\bgrandmother\b/g,'grandma').replace(/\bgrandfather\b/g,'grandpa').replace(/\bphone\b/g,'cell phone').replace(/\bcell cell\b/g,'cell').replace(/\bfilm\b/g,'movie').replace(/\bbicycle\b/g,'bike').replace(/\bcinema\b/g,'movie theater')
  .replace(/[^a-z' ]/g,' ').replace(/\b(the|a|an)\b/g,' ').replace(/\s+/g,' ').trim();
function gradeEnglish(q,input){
  const u=normE(input);if(!u)return{ok:false,empty:true};
  return[q.en,...(q.enAlt||[])].some(v=>normE(v)===u)?{ok:true}:{ok:false};
}
const latinOf=ts=>deJoin(ts);
const vphrase=(v,t,p)=>{const x=verbToks(v,t,p);return[x.fin.la,...x.tail.map(y=>y.la)].join(' ')};
const vf=(v,t,p)=>t==='pres'?presF(v,p):t==='praet'?praetF(v,p):t==='k2'?(k2F(v,p)||WURDE[p]+' '+v.inf):vphrase(v,t,p);
if(typeof module!=='undefined')module.exports={setLimit,makeBuilt,makeFocused,makeQuestion,TOPIC_PLAN,FRAMES,ING_ALL,TOPICS,B,grade,gradeLatin,gradeEnglish,explainDE,idQuestion,USES,TYPES,VERBS,NOUNS,ADJ,vf,vphrase,finish,presF,praetF,vb,SPECIAL,deJoin,np,impF};
