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
    ['round-star','Tausend','a thousand','1,000 XP',r.xp>=1000],['round-star','Zehntausend','ten thousand','10,000 XP',r.xp>=10000]];
/* ---------- profiles: animal names, pictures and banners ---------- */
const ANIMALS=[['Wolf','wolf'],['Fuchs','fox'],['Bär','bear'],['Adler','eagle'],['Löwe','lion'],['Pferd','horse'],['Rabe','raven'],['Taube','dove'],['Delfin','dolphin'],['Hirsch','stag'],['Eule','owl'],['Stier','bull'],['Hase','hare'],['Gans','goose'],['Katze','cat'],['Biene','bee']];
/* Profile pictures: freely licensed photos from Wikimedia Commons (credits are loaded live from Commons), or your own upload. */
const PICS=[
  {id:'goethe',n:'Johann Wolfgang von Goethe',g:'fig',f:['Goethe (Stieler 1828).jpg'],pos:'50% 25%'},
  {id:'beethoven',n:'Ludwig van Beethoven',g:'fig',f:['Joseph Karl Stieler\'s Beethoven mit dem Manuskript der Missa solemnis.jpg','Beethoven.jpg'],pos:'50% 20%'},
  {id:'mozart',n:'Wolfgang Amadeus Mozart',g:'fig',f:['Croce-Mozart-Detail.jpg','Wolfgang-amadeus-mozart 1.jpg'],pos:'50% 25%'},
  {id:'bach',n:'Johann Sebastian Bach',g:'fig',f:['Johann Sebastian Bach.jpg','Bach.jpg'],pos:'50% 25%'},
  {id:'einstein',n:'Albert Einstein',g:'fig',f:['Einstein 1921 by F Schmutzer - restoration.jpg','Albert Einstein Head.jpg'],pos:'50% 25%'},
  {id:'clara',n:'Clara Schumann',g:'fig',f:['Clara Schumann 1878.jpg'],pos:'50% 25%'},
  {id:'durer',n:'Albrecht Dürer',g:'fig',f:['Albrecht Dürer - 1500 self-portrait (High resolution and detail).jpg'],pos:'50% 25%'},
  {id:'neuschwanstein',n:'Schloss Neuschwanstein',g:'place',f:['Schloss Neuschwanstein 2013.jpg','Neuschwanstein Castle LOC print.jpg'],pos:'50% 50%'},
  {id:'brandenburg',n:'Brandenburger Tor',g:'place',f:['Brandenburger Tor abends.jpg','Brandenburger Tor 2009.jpg'],pos:'50% 50%'},
  {id:'koelnerdom',n:'Kölner Dom',g:'place',f:['Kölner Dom.jpg','Cologne Cathedral.jpg'],pos:'50% 40%'},
  {id:'schoenbrunn',n:'Schloss Schönbrunn, Wien',g:'place',f:['Schloss Schönbrunn Wien 2014 (Zuschnitt 2).jpg','Schönbrunn Palace.jpg'],pos:'50% 50%'},
  {id:'matterhorn',n:'Matterhorn',g:'place',f:['Matterhorn from Domhütte - 2.jpg','3818 - Riffelberg - Matterhorn viewed from Gornergratbahn.JPG'],pos:'50% 50%'},
  {id:'heidelberg',n:'Heidelberg',g:'place',f:['Heidelberg corr.jpg'],pos:'50% 50%'},
  {id:'rothenburg',n:'Rothenburg ob der Tauber',g:'place',f:['Rothenburg BW 2.JPG'],pos:'50% 50%'}];
const BANNERS=[['c:red','#B23A26','Rot'],['c:gold','#C8901A','Gold'],['c:blue','#2D5193','Blau'],['c:green','#3F7A3A','Grün'],['c:purple','#6B2D5C','Lila'],['c:stone','#8C8273','Stein']];
