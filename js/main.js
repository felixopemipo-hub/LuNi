(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store=(k,v)=>{try{const a=JSON.parse(localStorage.getItem(k)||'[]');a.push(v);localStorage.setItem(k,JSON.stringify(a))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STORIES={};SITE.stories.forEach(s=>STORIES[s.title]={c:s.cat,a:s.ages,img:s.img,t:s.text});
const BLOG={
"10 Creative Ways to Make Storytime Magical":["Use different voices for each character, add sound effects with household items, and let your child choose the ending.","Dim the lights, build a blanket fort or bring along a puppet. Small rituals turn reading into a memory your child will treasure."],
"5 Storytelling Games to Spark Imagination":["Try 'Add a Sentence', where each person adds one line to a story, or 'Story Dice', where pictures decide what happens next.","These games build vocabulary, listening and confidence, and they work in the car, at dinner or at bedtime."],
"Our Top 10 Picture Books for Toddlers This Spring":["Look for bold pictures, rhythm and repeated phrases. Books about animals, seasons and bedtime are always winners.","Visit our Stories page to browse illustrated tales picked for ages 0-5."],
"The Benefits of Audio Stories for Early Readers":["Audio stories strengthen listening, vocabulary and pronunciation, and let children enjoy tales above their reading level.","Pair a recording with the printed book so your child can follow along and connect the sounds to the words."],
"Create Your Own Storybook Characters: A Craft Guide":["Gather paper bags, socks or craft sticks, plus markers, buttons and wool for hair.","Let your child design a hero, give it a name and then act out a short story together."],
"Building a Home Library Your Child Will Love":["Keep books at child height, in baskets, and rotate them every few weeks so favourites feel fresh.","Include a cosy reading corner with a lamp and a soft cushion."],
"Bedtime Stories That Help Children Sleep":["Choose slow, gentle stories with repeating patterns and quiet endings.","Keep the same routine every night: bath, pyjamas, story, lights out."],
"Why Fantasy Stories Are Important for Child Development":["Fantasy lets children explore big feelings safely through dragons, unicorns and magical forests.","It also builds creativity, empathy and problem-solving."]};
const EV={};SITE.events.forEach(e=>EV[e.title]=e.desc);

// toast & modal
document.body.insertAdjacentHTML('beforeend','<div id="toast"></div><div id="modal"><div class="modal-box"><button class="modal-x" aria-label="Close">&times;</button><div id="mc"></div></div></div><button id="totop" aria-label="Back to top">↑</button><div id="progress"></div>');
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3200)};
const modal=h=>{$('#mc').innerHTML=h;$('#modal').classList.add('open');document.body.style.overflow='hidden'};
const close=()=>{$('#modal').classList.remove('open');document.body.style.overflow='';speechSynthesis&&speechSynthesis.cancel()};
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'||e.target.classList.contains('modal-x'))close()});
document.addEventListener('keydown',e=>e.key==='Escape'&&close());
$('#totop').onclick=()=>scrollTo({top:0});
$$('#year').forEach(y=>y.textContent=new Date().getFullYear());

// story reader
const readStory=title=>{const s=STORIES[title];if(!s)return;
modal(`<img src="${s.img}" alt=""><h2>${esc(title)}</h2><p style="color:#777">Ages ${s.a[0]}-${s.a[1]}</p>${s.t.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="modal-actions"><button class="cta-button" id="listen">🎧 Listen</button><button class="btn-outline" id="share">Share</button></div>`);
$('#listen').onclick=function(){if(!('speechSynthesis' in window))return toast('Audio is not supported in this browser');if(speechSynthesis.speaking){speechSynthesis.cancel();this.textContent='🎧 Listen';return}const u=new SpeechSynthesisUtterance(title+'. '+s.t.join(' '));u.rate=.9;u.onend=()=>this.textContent='🎧 Listen';speechSynthesis.speak(u);this.textContent='⏹ Stop'};
$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname.replace(/[^/]*$/,'')+'stories.html?read='+encodeURIComponent(title));toast('Link copied!')}catch(e){toast('Could not copy link')}}};
const readPost=title=>{const p=BLOG[title];if(!p)return;modal(`<h2>${esc(title)}</h2>${p.map(x=>`<p>${esc(x)}</p>`).join('')}<div class="modal-actions"><a class="cta-button" style="text-decoration:none" href="stories.html">Browse Stories</a></div>`)};
const register=(title,sub)=>{modal(`<h2>${esc(title)}</h2><p>${esc(sub||'Reserve your spot. We will confirm by email.')}</p><form id="reg"><label>Parent name</label><input name="n" required><label>Email</label><input name="e" type="email" required><label>Number of children</label><select name="k"><option>1</option><option>2</option><option>3</option><option>4+</option></select><button class="cta-button" style="width:100%">Confirm Registration</button></form>`);
$('#reg').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);store('registrations',{event:title,name:f.get('n'),email:f.get('e'),kids:f.get('k')});close();toast(`You're registered for ${title}! 🎉`)}};
const ics=(t,d)=>{const f=x=>x.toISOString().replace(/[-:]|\.\d+/g,'');const e=new Date(d.getTime()+36e5);const b=new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:${t}\r\nDTSTART:${f(d)}\r\nDTEND:${f(e)}\r\nLOCATION:Luni Story Shop\r\nEND:VEVENT\r\nEND:VCALENDAR`],{type:'text/calendar'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=t.replace(/\W+/g,'-')+'.ics';a.click();toast('Event added to your calendar file')};


// render stories & events from js/data.js
const tfmt=d=>d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const MON=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const sCard=(s,f)=>{const h=f?'h2':'h3';return `<article class="story-card"><div class="story-image"><img src="${esc(s.img)}" alt="${esc(s.title)}" loading="lazy"></div><div class="story-content"><div class="story-meta"><span class="story-age">Ages ${s.ages[0]}-${s.ages[1]}</span><span><i class="far fa-clock"></i> ${s.mins} min</span></div><${h} class="story-title">${esc(s.title)}</${h}><p class="story-excerpt">${esc(s.excerpt)}</p><div class="story-actions"><button class="btn-primary">${f?'Read Story':'Read'}</button><button class="btn-outline">${f?'Listen':'Preview'}</button></div></div></article>`};
if($('.stories-grid')&&$('.featured-story')){const [f,...r]=SITE.stories;$('.featured-story').innerHTML=sCard(f,1);$('.stories-grid').innerHTML=r.map(s=>sCard(s)).join('');
$$('.categories-list a').forEach(a=>{const k=a.childNodes[0].textContent.trim().toLowerCase().split(' ')[0];const n=SITE.stories.filter(s=>s.cat.includes(k)).length;const c=$('.category-count',a);c&&(c.textContent=n)})}
if($('.events-list')){const t0=new Date();t0.setHours(0,0,0,0);const up=SITE.events.filter(e=>new Date(e.date)>=t0).sort((a,b)=>new Date(a.date)-new Date(b.date));
const eCard=(e,f)=>{const d=new Date(e.date),en=new Date(d.getTime()+e.minutes*6e4),h=f?'h2':'h3',ag=e.ages[1]>=99?'All Ages':`Ages ${e.ages[0]}-${e.ages[1]}`;const virt=/virtual/i.test(e.place);
return `<article class="event-card" data-date="${e.date}"><div class="event-date"><div class="event-day">${d.getDate()}</div><div class="event-month">${MON[d.getMonth()]}</div></div><div class="event-content"><div class="event-meta"><span><i class="far fa-clock"></i> ${tfmt(d)} - ${tfmt(en)}</span><span><i class="fas fa-${virt?'video':'map-marker-alt'}"></i> ${esc(e.place)}</span><span><i class="fas fa-user-friends"></i> ${ag}</span></div><${h} class="event-title">${esc(e.title)}</${h}><p class="event-excerpt">${esc(e.desc)}</p><div class="event-tags">${e.tags.map(t=>`<span class="event-tag">${esc(t)}</span>`).join('')}</div><div class="event-actions"><button class="cta-button">${f?'Register Now':'Register'}</button><button class="btn-outline">${f?'Add to Calendar':'Details'}</button></div></div></article>`};
const fi=Math.max(0,up.findIndex(e=>e.featured));const fe=up[fi];const rest=up.filter((e,i)=>i!==fi);
$('.featured-event').innerHTML=fe?eCard(fe,1):'';$('.events-list').innerHTML=rest.map(e=>eCard(e)).join('')||(fe?'':'<p class="empty-msg">No upcoming events right now. Check back soon!</p>')}

// nav, header, progress
const page=location.pathname.split('/').pop()||'index.html';
$$('nav a').forEach(a=>a.getAttribute('href')===page&&a.classList.add('active'));
const hc=$('.header-content');if(hc){hc.insertAdjacentHTML('beforeend','<button class="menu-btn" aria-label="Menu">☰</button>');$('.menu-btn').onclick=()=>$('nav').classList.toggle('open');$$('nav a').forEach(a=>a.onclick=()=>$('nav').classList.remove('open'))}
addEventListener('scroll',()=>{const h=document.documentElement;$('header').classList.toggle('scrolled',scrollY>10);$('#progress').style.width=(scrollY/(h.scrollHeight-innerHeight)*100)+'%';$('#totop').classList.toggle('show',scrollY>500)},{passive:true});

// animations
$$('.hero,.page-hero').forEach(h=>['⭐','✨','🌙','☁️','🦋'].forEach((e,i)=>h.insertAdjacentHTML('beforeend',`<span class="float" style="left:${8+i*21}%;top:${15+(i%3)*25}%;font-size:${1.6+i%3}rem;animation-delay:${i*.8}s">${e}</span>`)));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.category-card,.story-card,.feature-item,.schedule-card,.testimonial-card,.value-card,.team-member,.event-card,.blog-card,.format-card,.virtual-event-card,.sidebar-widget,.section-title,.community-content,.story-text,.contact-container').forEach((el,i)=>{el.classList.add('reveal');el.style.transitionDelay=(i%4)*90+'ms';io.observe(el)});
$$('.stat-number').forEach(n=>{const m=n.textContent.match(/(\d+)(.*)/);if(!m)return;const to=+m[1];new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){o.disconnect();const t0=performance.now();(function f(t){const p=Math.min((t-t0)/1500,1);n.textContent=Math.round(to*p)+m[2];p<1&&requestAnimationFrame(f)})(t0)}}).observe(n)});

// global buttons
$$('header .cta-button').forEach(b=>b.onclick=()=>register('Join Story Time','Sign up for our next storytime session.'));
$$('.schedule-card').forEach(c=>{const b=$('button',c),t=$('.schedule-title',c).textContent;b.onclick=()=>b.textContent.includes('Learn')?(location.href='events.html'):register(t,$('.schedule-details',c).textContent.trim().replace(/\s+/g,' '))});
$$('.newsletter-form').forEach(f=>f.onsubmit=e=>{e.preventDefault();const i=$('input',f);store('subscribers',i.value);const free=f.closest('.newsletter');i.value='';free?readStory("The Little Star Who Couldn't Shine"):toast('Thanks for subscribing! 💌')});
const cf=$('#contactForm');cf&&(cf.onsubmit=e=>{e.preventDefault();store('messages',Object.fromEntries(new FormData(cf)));cf.reset();toast('Message sent! We will reply soon ✨')});
$$('.read-more,.story-card .btn-primary,.story-card .btn-outline').forEach(b=>{const c=b.closest('.story-card,.blog-card');if(!c)return;b.onclick=e=>{e.preventDefault();const t=$('h2,h3',c).textContent.trim();STORIES[t]?readStory(t):BLOG[t]?readPost(t):0}});
$$('.virtual-event-card .btn-outline').forEach(b=>b.onclick=()=>b.textContent.match(/Learn/)?register('Family Story Kits','Tell us where to deliver your story box.'):(location.href='stories.html'));
$$('.social-icon').forEach(a=>a.onclick=e=>{e.preventDefault();toast('Follow us soon! Social links coming up')});

// stories page
const sg=$('.stories-content');if(sg){let cat='all',age=null;
const cards=$$('.story-card',sg);cards.forEach(c=>{c.dataset.t=$('.story-title',c).textContent.trim()});
const empty=document.createElement('p');empty.className='empty-msg hidden';empty.textContent='No stories match yet. Try another filter!';$('.stories-grid').appendChild(empty);
const apply=()=>{let n=0;cards.forEach(c=>{const s=STORIES[c.dataset.t]||{c:[],a:[0,99]};const ok=(cat==='all'||s.c.includes(cat))&&(!age||(s.a[0]<=age[1]&&s.a[1]>=age[0]));c.closest('.featured-story')?c.closest('.featured-story').classList.toggle('hidden',!ok):c.classList.toggle('hidden',!ok);ok&&(n++,c.classList.add('pop'))});empty.classList.toggle('hidden',n>0)};
const key=t=>t.toLowerCase().split(' ')[0].replace('animal','animal');
const setCat=k=>{cat=k;$$('.filter-btn').forEach(b=>b.classList.toggle('active',key(b.textContent)===k||(k==='all'&&/all/i.test(b.textContent))));apply()};
$$('.filter-btn').forEach(b=>b.onclick=()=>setCat(/all/i.test(b.textContent)?'all':key(b.textContent)));
$$('.categories-list a').forEach(a=>a.onclick=e=>{e.preventDefault();setCat(key(a.childNodes[0].textContent.trim()));scrollTo({top:$('.stories-content').offsetTop-80})});
const ages=[[0,2],[3,5],[6,8],[9,12]];$$('.age-group').forEach((g,i)=>g.onclick=()=>{const on=g.classList.contains('active');$$('.age-group').forEach(x=>x.classList.remove('active'));if(!on){g.classList.add('active');age=ages[i]}else age=null;apply()});
$$('.age-group').forEach(g=>g.classList.remove('active'));
$$('.popular-story').forEach(p=>{p.style.cursor='pointer';p.onclick=()=>{const t=$('h4',p).textContent;const k=Object.keys(STORIES).find(x=>x.includes(t.replace('The ','')));k&&readStory(k)}});
const q=new URLSearchParams(location.search).get('read');q&&readStory(q)}

// blog page
if($('.blog-posts')){const cs=$$('.blog-card');const f=w=>{let n=0;cs.forEach(c=>{const ok=c.textContent.toLowerCase().includes(w.toLowerCase());c.classList.toggle('hidden',!ok);ok&&n++});n||toast('No posts for that yet - showing all');n||cs.forEach(c=>c.classList.remove('hidden'))};
$$('.categories-list a').forEach(a=>a.onclick=e=>{e.preventDefault();f(a.childNodes[0].textContent.trim())});$$('.tag').forEach(t=>t.onclick=e=>{e.preventDefault();f(t.textContent)});
$$('.recent-post').forEach(p=>{p.style.cursor='pointer';p.onclick=()=>readPost($('h4',p).textContent.trim())})}

// events page
const el=$('.events-list');if(el){const cards=$$('.event-card'),M=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const today=new Date();today.setHours(0,0,0,0);const evs=[];
$$('.event-card').forEach(c=>{const d=new Date(c.dataset.date);
$('.event-day',c).textContent=String(d.getDate()).padStart(2,'0');$('.event-month',c).textContent=M[d.getMonth()];
const title=$('.event-title',c).textContent.trim(),tags=$$('.event-tag',c).map(t=>t.textContent.toLowerCase()).join(' ');
const wk=[0,6].includes(d.getDay());c.dataset.cat=tags+(wk?' weekend':'');evs.push({c,d,title});
const [reg,det]=$$('button',c);reg.onclick=()=>register(title,`${d.toDateString()} at ${$('.event-meta span',c).textContent.trim()}`);
det.onclick=()=>det.textContent.includes('Calendar')?ics(title,d):modal(`<h2>${esc(title)}</h2><p><strong>${d.toDateString()}</strong><br>${esc($('.event-meta span',c).textContent.trim())}</p><p>${esc(EV[title]||'')}</p><div class="modal-actions"><button class="cta-button" id="r2">Register</button><button class="btn-outline" id="c2">Add to Calendar</button></div>`)||($('#r2').onclick=()=>reg.click(),$('#c2').onclick=()=>ics(title,d))});
// sidebar upcoming
const up=$('.upcoming-events');const sorted=[...evs].sort((a,b)=>a.d-b.d);up.innerHTML=sorted.slice(0,3).map(e=>`<li class="upcoming-event" style="cursor:pointer" data-t="${esc(e.title)}"><div class="upcoming-date"><div class="upcoming-day">${String(e.d.getDate()).padStart(2,'0')}</div><div class="upcoming-month">${M[e.d.getMonth()].slice(0,3)}</div></div><div class="upcoming-content"><h4>${esc(e.title)}</h4><div class="event-meta"><span>${e.d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span></div></div></li>`).join('');
$$('.upcoming-event',up).forEach(li=>li.onclick=()=>evs.find(e=>e.title===li.dataset.t).c.scrollIntoView({behavior:'smooth',block:'center'}));
// calendar
let vm=new Date(today.getFullYear(),today.getMonth(),1);const grid=$('.calendar-grid'),head=$('.calendar-month'),days=grid.innerHTML.split('<div class="calendar-date')[0];
const draw=()=>{head.textContent=vm.toLocaleString('en',{month:'long',year:'numeric'});let h=days;const first=vm.getDay(),n=new Date(vm.getFullYear(),vm.getMonth()+1,0).getDate();for(let i=0;i<first;i++)h+='<div class="calendar-date"></div>';
for(let d=1;d<=n;d++){const dt=new Date(vm.getFullYear(),vm.getMonth(),d),has=evs.some(e=>e.d.toDateString()===dt.toDateString());h+=`<div class="calendar-date${has?' event':''}${dt.getTime()===today.getTime()?' today':''}" data-d="${d}">${d}</div>`}
grid.innerHTML=h;$$('.calendar-date.event',grid).forEach(x=>x.onclick=()=>{const e=evs.find(e=>e.d.getFullYear()===vm.getFullYear()&&e.d.getMonth()===vm.getMonth()&&e.d.getDate()===+x.dataset.d);e&&e.c.scrollIntoView({behavior:'smooth',block:'center'})})};
const [pv,nx]=$$('.calendar-nav');pv.onclick=()=>{vm.setMonth(vm.getMonth()-1);draw()};nx.onclick=()=>{vm.setMonth(vm.getMonth()+1);draw()};draw();
// filters
const fk={'storytimes':'storytime','workshops':'workshop','special':'special','virtual':'virtual','weekend':'weekend'};
const fe=k=>{let n=0;evs.forEach(e=>{const ok=k==='all'||e.c.dataset.cat.includes(k);e.c.closest('.featured-event')?e.c.closest('.featured-event').classList.toggle('hidden',!ok):e.c.classList.toggle('hidden',!ok);ok&&(n++,e.c.classList.add('pop'))});$('#noev')&&$('#noev').remove();n||el.insertAdjacentHTML('afterbegin','<p id="noev" class="empty-msg">No events in this category right now.</p>')};
$$('.filter-btn').forEach(b=>b.onclick=()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');const w=b.textContent.toLowerCase().split(' ')[0];fe(w==='all'?'all':fk[w])});
$$('.categories-list a').forEach(a=>a.onclick=e=>{e.preventDefault();const w=a.childNodes[0].textContent.trim().toLowerCase().split(' ')[0];$$('.filter-btn').find(b=>b.textContent.toLowerCase().startsWith(w)).click();scrollTo({top:$('.events-container').offsetTop})})}
})();
