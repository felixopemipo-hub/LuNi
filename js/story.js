(()=>{
const $=s=>document.querySelector(s),S=SITE.stories;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
$('#year').textContent=new Date().getFullYear();
const q=new URLSearchParams(location.search).get('s');
const i=S.findIndex(s=>s.title===q);const s=S[i>=0?i:0];
document.title=s.title+' - Luni Story Shop';
$('#cover').src=s.img;$('#cover').alt=s.title;$('#bg').style.backgroundImage=`url("${s.img}")`;
$('#title').textContent=s.title;$('#age').textContent=`Ages ${s.ages[0]}-${s.ages[1]}`;
const words=s.text.join(' ').split(/\s+/).length;$('#mins').textContent=`${Math.max(1,Math.round(words/120))} min read`;
$('#chips').innerHTML=s.cat.map(c=>`<span>${esc(c)}</span>`).join('');
$('#story').innerHTML=s.text.map((p,n)=>`<p>${esc(p)}</p>${n<s.text.length-1?'<div class="div">✦ ✦ ✦</div>':''}`).join('');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.2});
document.querySelectorAll('.paper p,.paper .div').forEach(el=>io.observe(el));
// progress
addEventListener('scroll',()=>{const h=document.documentElement;$('#bar').style.width=(scrollY/(h.scrollHeight-innerHeight)*100)+'%'},{passive:true});
// theme & font
const night=()=>{document.body.classList.toggle('night',get('night')==='1');$('#theme i').className=get('night')==='1'?'fas fa-sun':'fas fa-moon'};
night();$('#theme').onclick=()=>{set('night',get('night')==='1'?'0':'1');night()};
let fs=+get('fs')||1.3;const font=()=>$('#story').style.setProperty('--fs',fs+'rem');font();
$('#bigger').onclick=()=>{fs=Math.min(2,fs+.15);set('fs',fs);font()};$('#smaller').onclick=()=>{fs=Math.max(1,fs-.15);set('fs',fs);font()};
// woman's voice
let voices=[];const loadV=()=>{voices=speechSynthesis.getVoices()};if('speechSynthesis' in window){loadV();speechSynthesis.onvoiceschanged=loadV}
const MALE=/\b(male|david|mark|daniel|james|george|alex|fred|guy|ryan|thomas|rishi|oliver|arthur|gordon|ralph|bruce|junior)\b/i;
const FEM=/(female|woman|samantha|zira|susan|hazel|aria|jenny|libby|sonia|victoria|karen|moira|tessa|fiona|serena|kate|allison|ava|emma|joanna|salli|kendra|kimberly|ivy|amy|nicole|natasha|michelle|clara|google uk english female|google us english)/i;
const pickVoice=()=>{const en=voices.filter(v=>/^en/i.test(v.lang));return en.find(v=>FEM.test(v.name)&&!MALE.test(v.name))||en.find(v=>!MALE.test(v.name))||en[0]||null};
// background lullaby (generated in the browser, no files needed)
let ac,master,echo,mOn=false,mTimer,nextBar=0,barN=0,ducked=false;
const CH=[[261.6,329.6,392,523.3],[220,261.6,329.6,440],[174.6,220,261.6,349.2],[196,246.9,293.7,392]],PAT=[0,1,2,3,2,1,2,1];
const note=(f,t,d,type,v)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);g.connect(echo);o.start(t);o.stop(t+d+.1)};
const bar=t=>{const c=CH[barN%4];PAT.forEach((p,i)=>note(c[p]*2,t+i*.5,1.4,'triangle',.22));note(c[0]/2,t,3.8,'sine',.35);note(c[2],t,3.8,'sine',.12);barN++};
const tick=()=>{while(nextBar<ac.currentTime+1.5){bar(nextBar);nextBar+=4}};
const vol=()=>master&&master.gain.setTargetAtTime(mOn?(ducked?.07:.16):0,ac.currentTime,.4);
const musicBtn=$('#music');
const musicOn=()=>{if(mOn)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return toast('Music is not supported in this browser');
if(!ac){ac=new AC();master=ac.createGain();master.gain.value=0;master.connect(ac.destination);const d=ac.createDelay(1);d.delayTime.value=.38;const fb=ac.createGain();fb.gain.value=.38;echo=ac.createGain();echo.gain.value=.5;echo.connect(d);d.connect(fb);fb.connect(d);d.connect(master)}
ac.resume();mOn=true;nextBar=ac.currentTime+.1;tick();mTimer=setInterval(tick,800);vol();musicBtn.classList.add('on');set('music','1')};
const musicOff=()=>{if(!mOn)return;mOn=false;vol();clearInterval(mTimer);setTimeout(()=>{!mOn&&ac&&ac.suspend()},1200);musicBtn.classList.remove('on');set('music','0')};
musicBtn.onclick=()=>mOn?musicOff():musicOn();
const duck=b=>{ducked=b;vol()}; 
// listen with paragraph highlight
const ps=[...document.querySelectorAll('.paper p')];let on=false;
const stop=()=>{on=false;duck(false);speechSynthesis.cancel();ps.forEach(p=>p.classList.remove('speaking'));$('#listen').classList.remove('on');$('#listen span').textContent='Listen'};
const speak=n=>{if(!on||n>=ps.length)return stop();duck(true);ps.forEach(p=>p.classList.remove('speaking'));ps[n].classList.add('speaking');ps[n].classList.add('in');ps[n].scrollIntoView({behavior:'smooth',block:'center'});
const u=new SpeechSynthesisUtterance((n===0?s.title+'. ':'')+s.text[n]);u.rate=.88;u.pitch=1.12;const v=pickVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-US';u.onend=()=>speak(n+1);u.onerror=stop;speechSynthesis.speak(u)};
$('#listen').onclick=()=>{if(!('speechSynthesis' in window))return toast('Audio is not supported in this browser');if(on)return stop();on=true;if(get('music')!=='0')musicOn();$('#listen').classList.add('on');$('#listen span').textContent='Stop';speak(0)};
addEventListener('beforeunload',()=>speechSynthesis.cancel());
// end actions
$('#again').onclick=()=>scrollTo({top:0});
$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Link copied! 💌')}catch(e){toast('Copy the link from the address bar')}};
// more stories: same category first
const rel=S.filter(x=>x!==s).sort((a,b)=>b.cat.filter(c=>s.cat.includes(c)).length-a.cat.filter(c=>s.cat.includes(c)).length).slice(0,4);
$('#more').innerHTML=rel.map(r=>`<a class="mcard" href="story.html?s=${encodeURIComponent(r.title)}"><div class="im"><img src="${esc(r.img)}" alt="" loading="lazy"></div><div><h3>${esc(r.title)}</h3><small>Ages ${r.ages[0]}-${r.ages[1]} · ${r.mins} min</small></div></a>`).join('');
})();
