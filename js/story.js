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
// listen with paragraph highlight
const ps=[...document.querySelectorAll('.paper p')];let on=false;
const stop=()=>{on=false;speechSynthesis.cancel();ps.forEach(p=>p.classList.remove('speaking'));$('#listen').classList.remove('on');$('#listen span').textContent='Listen'};
const speak=n=>{if(!on||n>=ps.length)return stop();ps.forEach(p=>p.classList.remove('speaking'));ps[n].classList.add('speaking');ps[n].classList.add('in');ps[n].scrollIntoView({behavior:'smooth',block:'center'});
const u=new SpeechSynthesisUtterance((n===0?s.title+'. ':'')+s.text[n]);u.rate=.9;u.onend=()=>speak(n+1);u.onerror=stop;speechSynthesis.speak(u)};
$('#listen').onclick=()=>{if(!('speechSynthesis' in window))return toast('Audio is not supported in this browser');if(on)return stop();on=true;$('#listen').classList.add('on');$('#listen span').textContent='Stop';speak(0)};
addEventListener('beforeunload',()=>speechSynthesis.cancel());
// end actions
$('#again').onclick=()=>scrollTo({top:0});
$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Link copied! 💌')}catch(e){toast('Copy the link from the address bar')}};
// more stories: same category first
const rel=S.filter(x=>x!==s).sort((a,b)=>b.cat.filter(c=>s.cat.includes(c)).length-a.cat.filter(c=>s.cat.includes(c)).length).slice(0,4);
$('#more').innerHTML=rel.map(r=>`<a class="mcard" href="story.html?s=${encodeURIComponent(r.title)}"><div class="im"><img src="${esc(r.img)}" alt="" loading="lazy"></div><div><h3>${esc(r.title)}</h3><small>Ages ${r.ages[0]}-${r.ages[1]} · ${r.mins} min</small></div></a>`).join('');
})();
