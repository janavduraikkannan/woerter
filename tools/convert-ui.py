"""Builds Wörter's index.html: pastes the German engine (tools/engine.js) into the page and converts the
interface it shares with Palabras. Run from the repo root after editing tools/engine.js:  python3 tools/convert-ui.py
(The engine block is replaced every time; the text conversions are skipped once they've been applied.)"""
import re
p='index.html';h=open(p,encoding='utf-8').read()
eng=open('tools/engine.js',encoding='utf-8').read()
a=h.index('<script id="engine">')+len('<script id="engine">');b=h.index('</script>',a)
h=h[:a]+'\n'+eng+'\n'+h[b:]
miss=[]
def rep(x,y):
    global h
    if x in h:h=h.replace(x,y)
    elif y not in h:miss.append(x[:100])
R=[
('<title>Palabras · Spanish practice with Felicísimo</title>','<title>Wörter · German practice with Fröhlix</title>'),
('<a class="brand" href="./" aria-label="Palabras home"><svg class="gi" aria-hidden="true"><use href="#gi-guitar"/></svg><b class="lw" data-en="words">Palabras</b><span>Español</span></a><a class="langsw alllang" href="../learnlanguage/" title="Linguae: every language site, with one account">All languages</a><a class="langsw" href="../verba/" title="Same account, separate XP: practice Latin on Verba">Latin ↗</a>',
 '<a class="brand" href="./" aria-label="Wörter home"><svg class="gi" aria-hidden="true"><use href="#gi-castle"/></svg><b class="lw" data-en="words">Wörter</b><span>Deutsch</span></a><a class="langsw alllang" href="../linguae/" title="Linguae: every language site, with one account">All languages</a><a class="langsw" href="../verba/" title="Same account, separate XP: practice Latin on Verba">Latin ↗</a><a class="langsw" href="../palabras/" title="Same account, separate XP: practice Spanish on Palabras">Spanish ↗</a>'),
('<button class="acct-btn" id="acctbtn" type="button" aria-haspopup="dialog"><svg class="gi" aria-hidden="true"><use href="#gi-castle"/></svg>','<button class="acct-btn" id="acctbtn" type="button" aria-haspopup="dialog"><svg class="gi" aria-hidden="true"><use href="#gi-scroll-unfurled"/></svg>'),
('<span class="rank" id="hudRank">Estudiante</span>','<span class="rank" id="hudRank">Schüler</span>'),
('<option value="I">Spanish I</option><option value="II">Spanish II</option><option value="III">Spanish III Honors</option><option value="IV">Spanish IV Honors</option><option value="AP">AP Spanish Language</option><option value="done">Finished Spanish</option>',
 '<option value="I">German I</option><option value="II">German II</option><option value="III">German III</option><option value="IV">German IV</option><option value="AP">AP German Language</option><option value="done">Finished German</option>'),
('Spanish leaderboard','German leaderboard'),
('<img class="felixbig" src="img/felicisimo/delighted.svg?v=1" alt="Felicísimo, the Palabras cat">','<img class="felixbig" src="img/frohlix/delighted.svg?v=1" alt="Fröhlix, the Wörter cat">'),
('<h1>Learn Spanish by <em>writing</em> it.</h1>','<h1>Learn German by <em>writing</em> it.</h1>'),
("<p>Sentences built fresh from Spanish I through AP Spanish. Earn XP, keep your streak alive, and ask Felicísimo when you're stuck.</p>","<p>Sentences built fresh from German I through AP German. Earn XP, keep your streak alive, and ask Fröhlix when you're stuck.</p>"),
('''<div class="bubble" id="heroBubble"><span class="lw" tabindex="0" data-en="hello!">¡Hola</span>! I'm <span class="lw" tabindex="0" data-en="super happy (my name; feliz means happy)">Felicísimo</span>, Fēlix's Spanish cousin. Pick some topics and <span class="lw" tabindex="0" data-en="let's go!">¡vamos!</span></div>''',
 '''<div class="bubble" id="heroBubble"><span class="lw" tabindex="0" data-en="hello!">Hallo</span>! I'm <span class="lw" tabindex="0" data-en="my name (from fröhlich, cheerful)">Fröhlix</span>, Fēlix's German cousin. Pick some topics and <span class="lw" tabindex="0" data-en="let's go!">los geht's!</span></div>'''),
('<section class="uses"><h2>Why this form? <span class="hint">Uses of ser, estar, por, para, the preterite, the imperfect and the subjunctive. Closed on every new problem; opening one voids extra credit for it.</span></h2>',
 '<section class="uses"><h2>Why this case? <span class="hint">What the nominative, accusative, dative and genitive are used for. Closed on every new problem; opening one voids extra credit for it.</span></h2>'),
('<div class="macrons" id="macrons" aria-label="Insert an accented letter"></div>','<div class="macrons" id="macrons" aria-label="Insert an umlaut or ß"></div>'),
("<span class=\"hint\" id=\"machint\">or type ' after a vowel (a' → á) and ~ after n (n~ → ñ)</span>","<span class=\"hint\" id=\"machint\">or type : after a vowel (a: → ä), or write ae, oe, ue and ss</span>"),
('<img id="felix" src="img/felicisimo/happy.svg?v=1" alt="Felicísimo looking happy"><b>Felicísimo</b>','<img id="felix" src="img/frohlix/happy.svg?v=1" alt="Fröhlix looking happy"><b>Fröhlix</b>'),
('<h3>Ask Felicísimo</h3>','<h3>Ask Fröhlix</h3>'),
('aria-label="Your question for Felicísimo"','aria-label="Your question for Fröhlix"'),
('Felicísimo is Fēlix from <a href="../verba/">Verba</a>, dressed for Spanish class.','Fröhlix is Fēlix from <a href="../verba/">Verba</a>, dressed for German class.'),
('<label><input type="radio" name="mode" value="e2l" checked> English to Spanish</label>','<label><input type="radio" name="mode" value="e2l" checked> English to German</label>'),
('<label><input type="radio" name="mode" value="l2e"> Spanish to English</label>','<label><input type="radio" name="mode" value="l2e"> German to English</label>'),
('<label><input type="radio" name="mode" value="id"> Identify the use</label>','<label><input type="radio" name="mode" value="id"> Identify the case</label>'),
('<label title="Also use vosotros, the “you all” of Spain. Ustedes is always accepted."><input type="checkbox" id="limit"> Use vosotros (Spain)</label>','<label title="Also use Sie, the formal “you”. du and ihr are always used."><input type="checkbox" id="limit"> Use Sie (formal you)</label>'),
('<img id="onbFelix" src="img/felicisimo/delighted.svg?v=1" alt="Felicísimo the cat">','<img id="onbFelix" src="img/frohlix/delighted.svg?v=1" alt="Fröhlix the cat">'),
('<link rel="icon" href="img/felicisimo/happy.svg?v=1" type="image/svg+xml">','<link rel="icon" href="img/frohlix/happy.svg?v=1" type="image/svg+xml">'),
("const LEVELS=[['I','Spanish I'],['II','Spanish II'],['III','Spanish III Honors'],['IV','Spanish IV Honors'],['AP','AP Spanish Language']];","const LEVELS=[['I','German I'],['II','German II'],['III','German III'],['IV','German IV'],['AP','AP German Language']];"),
("/* Accounts are shared with Verba (Latin): the profile, login and AI settings are global; XP, levels, streaks and topics belong to Spanish only. */","/* Accounts are shared with Verba (Latin) and Palabras (Spanish): the profile, login and AI settings are global; XP, levels, streaks and topics belong to German only. */"),
("const LANG='es',","const LANG='de',"),
("const SK=k=>(GLOBAL_KEYS.includes(k)?'verba.':'palabras.')+k;","const SK=k=>(GLOBAL_KEYS.includes(k)?'verba.':'woerter.')+k;"),
("// Spanish words with hover definitions. In fixed text, write {Spanish|English}; AI replies send a word→meaning map instead.","// German words with hover definitions. In fixed text, write {German|English}; AI replies send a word→meaning map instead."),
("LANG_KEYS.forEach(k=>{const v=readLS('palabras.'+k);","LANG_KEYS.forEach(k=>{const v=readLS('woerter.'+k);"),
("localStorage.setItem('palabras.'+k,","localStorage.setItem('woerter.'+k,"),
("lsSet('palabras-onboarded',true)","lsSet('woerter-onboarded',true)"),("lsGet('palabras-onboarded',false)","lsGet('woerter-onboarded',false)"),
("sha('palabras-chain:'","sha('woerter-chain:'"),
("const COURSE={I:'Spanish I',II:'Spanish II',III:'Spanish III Honors',IV:'Spanish IV Honors',AP:'AP Spanish Language'};","const COURSE={I:'German I',II:'German II',III:'German III',IV:'German IV',AP:'AP German Language'};"),
("const COURSE_SHORT={I:'Spanish I',II:'Spanish II',III:'Spanish III',IV:'Spanish IV',AP:'AP Spanish'};","const COURSE_SHORT={I:'German I',II:'German II',III:'German III',IV:'German IV',AP:'AP German'};"),
("const RANKS=[['Estudiante','student'],['Aprendiz','apprentice'],['Viajero','traveler'],['Explorador','explorer'],['Conversador','conversationalist'],['Narrador','storyteller'],['Poeta','poet'],['Sabio','sage'],['Maestro','master'],['Leyenda','legend']];",
 "const RANKS=[['Schüler','student'],['Lehrling','apprentice'],['Reisender','traveler'],['Entdecker','explorer'],['Plauderer','chatterbox'],['Erzähler','storyteller'],['Dichter','poet'],['Weiser','sage'],['Meister','master'],['Legende','legend']];"),
("const RANK_INFO=['Every Spanish speaker starts here.'","const RANK_INFO=['Every German speaker starts here.'"),
("'A legend, the top rank on Palabras. Levels keep going from here.']","'A legend, the top rank on Wörter. Levels keep going from here.']"),
("LWS('Leyenda','legend')","LWS('Legende','legend')"),
("{¡Bien hecho!|well done!}","{Gut gemacht!|well done!}"),("{¡Olé!|bravo!}","{Super!|great!}"),("{¡Hola otra vez!|hello again!}","{Hallo wieder!|hello again!}"),
("${LWS('Corona','crown: completed AP Spanish')}","${LWS('Kranz','wreath: completed AP German')}"),
("['laurel-crown','Corona','crown','Completed AP Spanish',r.course==='AP+'],['trophy','Campeón de la semana','champion of the week','#1 on this week’s leaderboard',wplace===1],['trophy','Podio','podium','Top 3 of all time',place>0&&place<=3],",
 "['laurel-crown','Kranz','wreath','Completed AP German',r.course==='AP+'],['trophy','Wochensieger','champion of the week','#1 on this week’s leaderboard',wplace===1],['trophy','Siegertreppchen','podium','Top 3 of all time',place>0&&place<=3],"),
("['castle','Conversador','conversationalist','Reached Level 5',lv>=5],['castle','Maestro','master','Reached Level 9',lv>=9],['laurel-crown','Leyenda','legend','Reached Level 10',lv>=10],",
 "['castle','Plauderer','chatterbox','Reached Level 5',lv>=5],['castle','Meister','master','Reached Level 9',lv>=9],['laurel-crown','Legende','legend','Reached Level 10',lv>=10],"),
("['fluffy-flame','Tres días','three days','A 3-day streak',best>=3],['fluffy-flame','Una semana','one week','A 7-day streak',best>=7],['fluffy-flame','Un mes','one month','A 30-day streak',best>=30],['fluffy-flame','Cien días','a hundred days','A 100-day streak',best>=100],",
 "['fluffy-flame','Drei Tage','three days','A 3-day streak',best>=3],['fluffy-flame','Eine Woche','one week','A 7-day streak',best>=7],['fluffy-flame','Ein Monat','one month','A 30-day streak',best>=30],['fluffy-flame','Hundert Tage','a hundred days','A 100-day streak',best>=100],"),
('placeholder="e.g. Poco a poco se va lejos (little by little, you go far)"','placeholder="e.g. Übung macht den Meister (practice makes perfect)"'),
("optional · shown on your profile, Spanish welcome","optional · shown on your profile, German welcome"),
("${LWS('Corona','crown')}</b><br>For completing AP Spanish Language. Your crown shows beside your name on the Spanish leaderboard and your profile.","${LWS('Kranz','wreath')}</b><br>For completing AP German Language. Your wreath shows beside your name on the German leaderboard and your profile."),
("toast('adoring','{Corona|crown} earned! You finished AP Spanish. {Gut gemacht!|well done!}')","toast('adoring','{Kranz|wreath} earned! You finished AP German. {Gut gemacht!|well done!}')"),
("replace(/\\b(ser|estar|por|para|the|preterite|imperfect|subjunctive|subj|use|usage|of|a|an|it|is|its|this|type|for a|for an)\\b/g,' ')",
 "replace(/\\b(nominative|accusative|dative|genitive|nominativ|akkusativ|dativ|genitiv|case|kasus|the|use|usage|it|is|its|this|type|for a|for an|a|an)\\b/g,' ')"),
("const[a,b]=spanIdx(qq,tok),pre=qq.end==='?'?'¿':qq.end==='!'?'¡':'';","const[a,b]=spanIdx(qq,tok),pre='';"),
("qq.topic={id:'identify',level:{ser:'I',estar:'I',por:'II',para:'II',pret:'II',impf:'II',subj:'III'}[TYPES[ty].c],name:'Identify: uses of '+USES[TYPES[ty].c].name};","qq.topic={id:'identify',level:{nom:'I',akk:'I',dat:'II',gen:'III'}[TYPES[ty].c],name:'Identify: uses of the '+USES[TYPES[ty].c].name.toLowerCase()};"),
("return makeQuestion(selected.size?selected:new Set(['serest']));","return makeQuestion(selected.size?selected:new Set(['nomakk']));"),
("if(!types.length)types=Object.keys(TYPES).filter(x=>!/^sj/.test(x)||[...selected].some(t=>/^sj|ojala/.test(t)));","if(!types.length)types=Object.keys(TYPES).filter(x=>!/^gen/.test(x)||[...selected].some(t=>/^gen/.test(t)));"),
("$('macrons').innerHTML=['á','é','í','ó','ú','ñ','ü','¿','¡'].map(","$('macrons').innerHTML=['ä','ö','ü','ß','Ä','Ö','Ü'].map("),
("$('askq').addEventListener('input',e=>accType(e.target,'~´'));","$('askq').addEventListener('input',e=>accType(e.target,'\"'));"),
("  if(/^(el|la|los|las) \\S+$/.test(plain))laW=plain.split(' ')[1];","  const plainD=plain.replace(/\\|/g,'');if(/^(der|die|das) \\S+/.test(plainD))laW=plainD.split(' ')[1].replace(/,$/,'');\n  else if(/\\|/.test(plain))laW=plainD.split(/[ ,]/)[0];"),
("  $('cbody').classList.toggle('novos',!VOS);\n",""),
("const FV='?v=1',felixImg=m=>`img/felicisimo/${FACES[m]?m:'happy'}.svg${FV}`,faceImg=m=>`img/felicisimo/face-${FACES[m]?m:'happy'}.svg${FV}`;","const FV='?v=1',felixImg=m=>`img/frohlix/${FACES[m]?m:'happy'}.svg${FV}`,faceImg=m=>`img/frohlix/face-${FACES[m]?m:'happy'}.svg${FV}`;"),
("const onbFace=m=>`img/felicisimo/${m}.svg?v=1`;","const onbFace=m=>`img/frohlix/${m}.svg?v=1`;"),
]
for x,y in R:rep(x,y)
open(p,'w',encoding='utf-8').write(h)
print('\n'.join('MISS '+m for m in miss) or 'all applied')
