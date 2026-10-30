/* ---------- Wörter: everything about this site that isn't grammar ----------
   The shared code (index.html, keys.html, getkey.html, css/ and js/) is identical on every practice site.
   This folder, site/, holds what differs: this file (names, text, lists), cat.js (the tutor cat and its AI prompts),
   language.js (how the language behaves in the shared code), engine.js (sentences and grading), uses.js and theme.css. */
const SITE={
  id:"woerter", // the folder name; prefix for this language's saved progress (woerter.xp) and for keys like woerter-onboarded
  name:"Wörter", title:"Wörter · German practice with Fröhlix",
  langKey:"de", // where this language's progress sits in the shared account document (Verba: null, the top level)
  cat:"Fröhlix", catDir:"frohlix", catV:"1", // the tutor cat: name, img/<catDir>/, and the image version (bump it to refresh caches)
  proudFace:"delighted", // the face shown when setup is done
  board:"boardde", otherBoard:"board", // this site's Firestore leaderboard, and the one checked before freeing a username
  acctIcon:"scroll-unfurled", // game-icons symbol on the Account button (the sprite in index.html has them all)
  limitDefault:false, // whether the bar's checkbox (#limit) starts ticked
  confetti:['#B23A26','#2D5193','#C8901A','#4E7A2E','#E9DEC7'],
  laurea:["Kranz", "wreath: completed AP German"], honors:["Honores", "honors"], // [word, meaning] for the AP tag and the honors heading
  pageAccent:"#2D5193", pageButton:"#B23A26" // link and button colours on keys.html and getkey.html
};
const LANG_NAME="German";
/* text the shared code drops into its messages; {word|meaning} marks a hover definition */
const TXT={
  onbHello:"{Hallo!|hello!} I’m {Fröhlix|my name (from fröhlich, cheerful)}, your German tutor cat and Fēlix’s cousin. Let’s get you set up. It takes about 5 minutes.",
  onbAlso:" (Already use Verba for Latin or Palabras for Spanish? Your key and account work here too.)",
  onbLogin:"I have a Verba, Palabras or Wörter account: log in",
  onbDone:"{Sehr gut!|very good!} You’re all set. Here are a few tricks before you start.",
  onbTyping:"<li>Type umlauts with the buttons, or type : after a vowel (a: → ä). Writing ae, oe, ue and ss counts as correct too.</li>\n   ",
  onbBack:"{Hallo wieder!|hello again!} Log in and I’ll bring back your XP, streak and settings. Verba and Palabras accounts work here too.",
  helloAgain:"{Hallo wieder!|hello again!}",
  useOf:"use of ",
  wellDone:"{Gut gemacht!|well done!}",
  onFire:"{Super!|great!}, you're on fire!",
  whoIsnt:"Wörter (like Verba and Palabras)",
  loginHint:"Capital letters and accents don’t matter: “Sofía” can log in as “sofia”. Your Verba or Palabras username works here too.",
  sameAccount:"This is the same account as Verba (Latin).",
  famous:"Famous figures",
  usernameHint:"Accents and capitals are fine: “Sofía” and “sofia” count as the same name. Your username is shared with Verba.",
  mottoEg:"e.g. Übung macht den Meister (practice makes perfect)",
  apToast:"{Kranz|wreath} earned! You finished AP German. {Gut gemacht!|well done!}",
  usePlaceholder:"Type the use, like “location” or “purpose”",
  xcHint:"Name why one word is used for bonus XP.",
  marks:"umlauts",
  markMatters:"the umlaut",
  diffForm:"a different form or word",
  anyOrder:"",
  award:()=>`<b>${LWS('Kranz','wreath')}</b><br>For completing AP German Language. Your wreath shows beside your name on the German leaderboard and your profile.`
};
/* pieces of index.html (filled in by js/site-fill.js) */
const HTML={
  nav:"<a class=\"brand\" href=\"./\" aria-label=\"Wörter home\"><svg class=\"gi\" aria-hidden=\"true\"><use href=\"#gi-castle\"/></svg><b class=\"lw\" data-en=\"words\">Wörter</b><span>Deutsch</span></a><a class=\"langsw alllang\" href=\"../linguae/\" title=\"Linguae: every language site, with one account\">All languages</a><a class=\"langsw\" href=\"../verba/\" title=\"Same account, separate XP: practice Latin on Verba\">Latin ↗</a><a class=\"langsw\" href=\"../palabras/\" title=\"Same account, separate XP: practice Spanish on Palabras\">Spanish ↗</a>",
  boardTitle:"German leaderboard",
  heroP:"Sentences built fresh from German I through AP German. Earn XP, keep your streak alive, and ask Fröhlix when you're stuck.",
  heroBubble:"<span class=\"lw\" tabindex=\"0\" data-en=\"hello!\">Hallo</span>! I'm <span class=\"lw\" tabindex=\"0\" data-en=\"my name (from fröhlich, cheerful)\">Fröhlix</span>, Fēlix's German cousin. Pick some topics and <span class=\"lw\" tabindex=\"0\" data-en=\"let's go!\">los geht's!</span>",
  usesTab:"Why this case?",
  chartsTitle:"Charts for this sentence",
  usesHead:"Why this case? <span class=\"hint\">What the nominative, accusative, dative and genitive are used for. Closed on every new problem; opening one voids extra credit for it.</span>",
  macLabel:"Insert an umlaut or ß",
  macHint:"or type : after a vowel (a: → ä), or write ae, oe, ue and ss",
  credits:"Icons by Lorc and Delapouite from <a href=\"https://game-icons.net\" target=\"_blank\" rel=\"noopener\">game-icons.net</a> (CC BY 3.0). Fröhlix is Fēlix from <a href=\"../verba/\">Verba</a>, dressed for German class. Theme switch after Adam Argyle (web.dev, Apache 2.0) with Feather Icons. Confetti by <a href=\"https://github.com/catdad/canvas-confetti\" target=\"_blank\" rel=\"noopener\">canvas-confetti</a>. <a href=\"https://github.com/janavduraikkannan/Verba/blob/main/PRIVACY.md\" target=\"_blank\" rel=\"noopener\">Privacy Statement</a> (shared with Verba).",
  limit:"<label title=\"Also use Sie, the formal “you”. du and ihr are always used.\"><input type=\"checkbox\" id=\"limit\"> Use Sie (formal you)</label>"
};
/* ---------- courses and topics ---------- */
const LEVELS=[['I','German I'],['II','German II'],['III','German III'],['IV','German IV'],['AP','AP German Language']];
const TAUGHT=new Set([]); // topics covered in the class notes (to be filled in from the notes)
const COURSE={I:'German I',II:'German II',III:'German III',IV:'German IV',AP:'AP German Language'};
const COURSES=[['','Not set'],['I','German I'],['I+','German I – completed'],['II','German II'],['II+','German II – completed'],['III','German III'],['III+','German III – completed'],['IV','German IV'],['IV+','German IV – completed'],['AP','AP German Language'],['AP+','AP German Language – completed']];
const COURSE_SHORT={I:'German I',II:'German II',III:'German III',IV:'German IV',AP:'AP German'};
/* ---------- ranks and badges ---------- */
const RANKS=[['Schüler','student'],['Lehrling','apprentice'],['Reisender','traveler'],['Entdecker','explorer'],['Plauderer','chatterbox'],['Erzähler','storyteller'],['Dichter','poet'],['Weiser','sage'],['Meister','master'],['Legende','legend']];
const RANK_INFO=['Every German speaker starts here.','Learning the basics, one verb at a time.','Ready for a trip: you can order, ask and get around.','Off the beaten path, trying new tenses.','You can keep a real conversation going.','You can tell a whole story in the past.','Your Spanish has style.','You know why every form is the way it is.','A master of the language.','A legend, the top rank on Wörter. Levels keep going from here.'];
/* [icon, word, meaning, what earns it, earned?] for a profile's honors */
const BADGES=(r,place,wplace,lv,best)=>[['laurel-crown','Kranz','wreath','Completed AP German',r.course==='AP+'],['trophy','Wochensieger','champion of the week','#1 on this week’s leaderboard',wplace===1],['trophy','Siegertreppchen','podium','Top 3 of all time',place>0&&place<=3],
    ['castle','Plauderer','chatterbox','Reached Level 5',lv>=5],['castle','Meister','master','Reached Level 9',lv>=9],['laurel-crown','Legende','legend','Reached Level 10',lv>=10],
    ['fluffy-flame','Drei Tage','three days','A 3-day streak',best>=3],['fluffy-flame','Eine Woche','one week','A 7-day streak',best>=7],['fluffy-flame','Ein Monat','one month','A 30-day streak',best>=30],['fluffy-flame','Hundert Tage','a hundred days','A 100-day streak',best>=100],
    ['round-star','Mil','a thousand','1,000 XP',r.xp>=1000],['round-star','Diez mil','ten thousand','10,000 XP',r.xp>=10000]];
/* ---------- profiles: animal names, pictures and banners ---------- */
const ANIMALS=[['Lobo','wolf'],['Zorro','fox'],['Oso','bear'],['Águila','eagle'],['León','lion'],['Caballo','horse'],['Cuervo','raven'],['Paloma','dove'],['Delfín','dolphin'],['Ciervo','stag'],['Búho','owl'],['Toro','bull'],['Liebre','hare'],['Ganso','goose'],['Gato','cat'],['Abeja','bee']];
/* Profile pictures: freely licensed photos from Wikimedia Commons (credits are loaded live from Commons), or your own upload. */
const PICS=[
  {id:'cervantes',n:'Miguel de Cervantes',g:'fig',f:['Cervates jauregui.jpg','Cervantes Jáuregui.jpg','Miguel de Cervantes.jpg'],pos:'50% 25%'},
  {id:'frida',n:'Frida Kahlo',g:'fig',f:['Frida Kahlo, by Guillermo Kahlo.jpg','Frida Kahlo, by Guillermo Kahlo 2.jpg'],pos:'50% 20%'},
  {id:'bolivar',n:'Simón Bolívar',g:'fig',f:['Simón Bolívar 2.jpg','Simon Bolivar.jpg'],pos:'50% 25%'},
  {id:'velazquez',n:'Diego Velázquez',g:'fig',f:['Diego Velázquez Autorretrato 45 x 38 cm - Colección Real Academia de Bellas Artes de San Fernando.jpg','Autorretrato de Diego Velázquez.jpg'],pos:'50% 30%'},
  {id:'sorjuana',n:'Sor Juana Inés de la Cruz',g:'fig',f:['Juana Inés de la Cruz.jpg','Sor Juana Inés de la Cruz (Miguel Cabrera).jpg'],pos:'50% 25%'},
  {id:'goya',n:'Francisco de Goya',g:'fig',f:['Vicente López Portaña - el pintor Francisco de Goya.jpg'],pos:'50% 25%'},
  {id:'quijote',n:'Don Quijote',g:'fig',f:['Honoré Daumier 017.jpg','Don Quijote and Sancho Panza.jpg'],pos:'50% 40%'},
  {id:'alhambra',n:'The Alhambra',g:'place',f:['Dawn Charles V Palace Alhambra Granada Andalusia Spain.jpg','Alhambra - Granada.jpg'],pos:'50% 50%'},
  {id:'sagrada',n:'Sagrada Família',g:'place',f:['Σαγράδα Φαμίλια 2941.jpg','Sagrada Familia 01.jpg'],pos:'50% 40%'},
  {id:'machupicchu',n:'Machu Picchu',g:'place',f:['Machu Picchu, Peru.jpg','80 - Machu Picchu - Juin 2009 - edit.jpg'],pos:'50% 50%'},
  {id:'chichen',n:'Chichén Itzá',g:'place',f:['Chichen Itza 3.jpg','Chichen-Itza-Castillo-Seen-From-East.JPG'],pos:'50% 50%'},
  {id:'plazamayor',n:'Plaza Mayor, Madrid',g:'place',f:['Plaza Mayor de Madrid 06.jpg','Plaza Mayor (Madrid) 01.jpg'],pos:'50% 50%'},
  {id:'teotihuacan',n:'Teotihuacan',g:'place',f:['Teotihuacan Pyramid of the Sun.jpg','Pirámide del Sol, Teotihuacán.jpg'],pos:'50% 50%'},
  {id:'havana',n:'Old Havana',g:'place',f:['Havana - Cuba - 0890.jpg','La Habana Vieja.jpg'],pos:'50% 50%'}];
const BANNERS=[['c:red','#B23A26','Rojo'],['c:gold','#C8901A','Oro'],['c:blue','#2D5193','Azul talavera'],['c:green','#3F7A3A','Verde'],['c:purple','#6B2D5C','Morado'],['c:stone','#8C8273','Piedra']];
