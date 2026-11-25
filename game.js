'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const paths = {
 arena:'M3 8l9-5 9 5v10l-9 4-9-4z M3 8l9 5 9-5 M12 13v9',
 chart:'M3 20h18 M5 16v-4 M11 16V7 M17 16V3',
 volume:'M3 9h4l5-5v16l-5-5H3z M15 8c3 2 3 6 0 8 M18 5c5 4 5 10 0 14',
 mute:'M3 9h4l5-5v16l-5-5H3z M16 9l6 6 M22 9l-6 6',
 help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 sliders:'M3 6h5m5 0h8 M3 12h10m5 0h3 M3 18h3m5 0h10 M8 4v4h5V4z M13 10v4h5v-4z M6 16v4h5v-4z',
 time:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2',
 fist:'M7 15c-2-2-3-5-2-7l2-3c1-2 3-2 4-1 2-2 4-1 5 0 2-1 4 0 4 3v5c0 3-2 4-3 5v3H7v-5z M7 16h10 M7 7v3m4-5v4m4-4v4',
 bolt:'M14 2L4 14h7l-1 8 10-13h-7z', baton:'M5 17L16 3c2-2 6 1 4 3L9 20z M7 15l4 3 M4 18l-1 2 3 2 2-2',
 pin:'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 expand:'M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5', play:'M6 3l14 9-14 9z',pause:'M5 4h4v16H5z M15 4h4v16h-4z',
 gamepad:'M7 6h10c3 0 4 2 5 8 1 5-2 6-5 3l-2-2H9l-2 2c-3 3-6 2-5-3 1-6 2-8 5-8z M5 10h5m-2.5-2.5v5 M16 10h.01m3 2h.01',
 close:'M5 5l14 14 M19 5L5 19'
};
function icon(name){return '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="'+paths[name]+'"/></svg>'}
$$('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));
function read(key,fallback){try{return JSON.parse(localStorage.getItem('impact-'+key))??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem('impact-'+key,JSON.stringify(value));return true}catch{return false}}
const settings={target:'boxer',zone:'face',gear:'gloves',duration:120,sex:'male',age:'young'};
const scene=$('#scene'), ring=$('#ring'), dummy=document.createElement('canvas');
let sceneWidth=1,sceneHeight=1;
const modal=$('#modal'), body=$('#modal-body');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let mesh=Mannequin.build(settings.sex,settings.age);
let phase='ready',remaining=120000,deadline=0,hits=0,combo=0,best=0,lastHit=-Infinity,lastStrike=-Infinity;
let motion={x:0,z:0,vx:0,vz:0},strike=null,guard=false,viewX=0,viewY=0,lastFrame=0,idleTime=0;
let charging=null;
const chargeMeter=$('#charge-meter'), chargeProgress=$('#charge-progress'), chargeValue=$('#charge-value'), reticle=$('.aim');
const fullChargeMs=1000;
let enabledSound=read('sound',true),audio,noise,history=read('history',[]),profile=read('avatar','');
if(!Array.isArray(history))history=[];
const isRound=()=>phase==='running'||phase==='paused';
function renderSound(){
 $('#audio').innerHTML=icon(enabledSound?'volume':'mute');
 $('#audio').setAttribute('aria-label',enabledSound?'ปิดเสียง':'เปิดเสียง');
 $('#audio').setAttribute('aria-pressed',String(enabledSound));
}
function unlock(){
 if(!enabledSound)return;
 try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}
}
function sound(kind,charge=0){
 if(!enabledSound||!audio||audio.state!=='running')return;
 const t=audio.currentTime,osc=audio.createOscillator(),amp=audio.createGain();
 const bell=kind==='bell',dur=bell?.52:.14+.045*charge;
 osc.type='sine';osc.frequency.setValueAtTime(bell?710:settings.gear==='baton'?143:108,t);
 osc.frequency.exponentialRampToValueAtTime(bell?695:43,t+dur);
 amp.gain.setValueAtTime(bell?.10:.35+.10*charge,t);amp.gain.exponentialRampToValueAtTime(.001,t+dur);
 osc.connect(amp).connect(audio.destination);osc.start(t);osc.stop(t+dur);
 if(!bell){
   if(!noise){noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.1),audio.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1}
   const burst=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
   burst.buffer=noise;filter.type='lowpass';filter.frequency.value=settings.gear==='baton'?2300:1050;gain.gain.setValueAtTime(.24,t);gain.gain.exponentialRampToValueAtTime(.001,t+.09);
   burst.connect(filter).connect(gain).connect(audio.destination);burst.start();
 }
}
$('#audio').onclick=()=>{enabledSound=!enabledSound;save('sound',enabledSound);renderSound();if(enabledSound){unlock();sound('bell')}};
renderSound();
function refreshMesh(){
 Ring.chooseBoxer(settings.sex,settings.age);
 $('#boxer-thumb').src='assets/boxers/'+settings.sex+'-'+settings.age+'.webp';
 mesh=Mannequin.build(settings.sex,settings.age);
 Mannequin.draw($('#thumb'),mesh,-.26,true);
 Mannequin.draw(dummy,mesh,-.1,false);
}
function resize(){
 sceneWidth=scene.clientWidth;sceneHeight=scene.clientHeight;
 const h=sceneHeight,ratio=Math.min(devicePixelRatio,2);
 ring.width=Math.max(1,Math.round(sceneWidth*ratio));ring.height=Math.max(1,Math.round(h*ratio));
 dummy.width=Math.max(1,Math.round(scene.clientWidth*.56*Math.min(devicePixelRatio,1.6)));
 dummy.height=Math.max(1,Math.round(h*Math.min(devicePixelRatio,1.6)));
 Mannequin.draw(dummy,mesh,-.1,false);
}
new ResizeObserver(resize).observe(scene);refreshMesh();
function choose(group,button){
 $$('[data-'+group+']').forEach(b=>{const on=b===button;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
}
$$('[data-target]').forEach(button=>button.onclick=()=>{
 if(isRound())return;
 settings.target=button.dataset.target;choose('target',button);
 $('#custom').hidden=settings.target==='bag';
 syncZone();
 motion={x:0,z:0,vx:0,vz:0};Ring.clearImpact();
});
$$('[data-gear]').forEach(button=>button.onclick=()=>{
 if(isRound())return;settings.gear=button.dataset.gear;choose('gear',button);syncZone();
});
function syncZone(){
 $('#aim-zone').hidden=settings.target==='bag'||settings.gear!=='gloves';
}
$$('[data-zone]').forEach(button=>button.onclick=()=>{
 if(isRound())return;
 settings.zone=button.dataset.zone;choose('zone',button);
});
function targetPoint(side,aimY){
 return Ring.hitPoint(settings.target,side,hits,aimY,settings.gear==='gloves'?settings.zone:'body');
}
$$('[data-duration]').forEach(b=>b.onclick=()=>{if(isRound())return;settings.duration=Number(b.dataset.duration);choose('duration',b);remaining=settings.duration*1000;drawHud()});
function time(ms){const sec=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
function drawHud(){$('#clock').textContent=time(remaining);$('#hits').textContent=hits;$('#combo').textContent='×'+combo}
function setPhase(next){
 phase=next;const running=phase==='running',paused=phase==='paused';
 $('#configuration').disabled=isRound();$('#end').hidden=!isRound();
 $('#primary').innerHTML=icon(running?'pause':'play')+'<span>'+(running?'พักเกม':paused?'ซ้อมต่อ':'เริ่มซ้อม')+'</span>';
 $('#ready-text').textContent=running?'กำลังซ้อม':paused?'พักเกม':'พร้อมซ้อม';
 $('.cam').innerHTML='<b></b>'+(running?'LIVE CAM':'ARENA CAM');
 $('#scene-pause').hidden=!isRound();$('#scene-pause').innerHTML=icon(paused?'play':'pause');$('#scene-pause').setAttribute('aria-label',paused?'ซ้อมต่อ':'พักเกม');
 scene.classList.toggle('running',running);$('.touchbar').hidden=!running||!matchMedia('(pointer:coarse)').matches;
 $('#scene-message').hidden=!paused;if(paused){$('#message-title').textContent='พักยก';$('#message-sub').textContent='กดซ้อมต่อเมื่อพร้อม'}
 if(!running){cancelCharge();guard=false;strike=null;viewX=viewY=0}
 drawHud();
}
function start(){
 unlock();Ring.clearImpact();hits=combo=best=0;lastStrike=lastHit=-Infinity;motion={x:0,z:0,vx:0,vz:0};remaining=settings.duration*1000;
 deadline=performance.now()+remaining;setPhase('running');sound('bell');scene.focus({preventScroll:true});
 if(matchMedia('(max-width:750px)').matches)scene.scrollIntoView({block:'start'});
}
function pause(){if(phase==='running'){remaining=Math.max(0,deadline-performance.now());if(!remaining){finish();return}setPhase('paused')}}
function resume(){if(phase==='paused'){unlock();deadline=performance.now()+remaining;setPhase('running');scene.focus({preventScroll:true})}}
$('#primary').onclick=()=>{if(phase==='running')pause();else if(phase==='paused')resume();else start()};
$('#scene-pause').onclick=()=>phase==='running'?pause():resume();
function exitExpanded(){
 if(document.fullscreenElement){document.exitFullscreen().catch(()=>{})}
 scene.classList.remove('expanded');
}
function openModal(title,html){
 if(phase==='running')pause();
 exitExpanded();$('#modal-title').textContent=title;body.innerHTML=html;
 if(!modal.open)modal.showModal();
}
function finish(){
 if(!isRound())return;
 if(phase==='running')remaining=Math.max(0,deadline-performance.now());
 const elapsed=Math.round((settings.duration*1000-remaining)/1000);
 const round={date:Date.now(),target:settings.target,hits,best,elapsed};
 history.unshift(round);history=history.slice(0,30);save('history',history);sound('bell');
 setPhase('finished');openModal('สรุปรอบซ้อม','<div class="result">'+hits+' ครั้งที่เข้าเป้า</div><p>คอมโบสูงสุด ×'+best+' · เวลาซ้อม '+time(elapsed*1000)+'</p><button id="again" class="primary">เริ่มรอบใหม่</button>');
 $('#again').onclick=()=>{modal.close();start()};
}
$('#end').onclick=finish;
function chargeLevel(now){
 if(!charging)return 0;
 // Keep a brief tap at the normal punch strength.
 return Math.min(1, Math.max(0,(now-charging.start-100)/(fullChargeMs-100)));
}
function cancelCharge(){
 charging=null;
 chargeMeter.hidden=true;
}
function beginCharge(side,owner,aimY){
 if(phase!=='running'||guard||modal.open||charging||strike)return false;
 const now=performance.now();
 if(now>=deadline){finish();return false}
 if(now-lastStrike<Ring.duration)return false;
 charging={side,owner,point:targetPoint(side,aimY),start:now};
 return true;
}
function releaseCharge(owner){
 if(!charging||charging.owner!==owner)return;
 const now=performance.now(),level=chargeLevel(now),{side,point}=charging;
 cancelCharge();
 if(phase!=='running'||guard||modal.open)return;
 if(now>=deadline){finish();return}
 lastStrike=now;strike={side,point,charge:level,start:now,landed:false,pushed:false};
}
function contact(now){
 Ring.contact(settings.target,strike.side,strike.point,idleTime*1000,settings.gear,strike.charge);
 hits++;combo=now-lastHit<1250?combo+1:1;best=Math.max(combo,best);lastHit=now;
 sound('hit',strike.charge);drawHud();
 if(navigator.vibrate)navigator.vibrate(18+Math.round(16*strike.charge));
}
function bindStrikePointer(element,buttonSide){
 element.addEventListener('pointerdown',e=>{
   if(!buttonSide&&e.target.closest('button')||e.button!==0&&e.button!==2)return;
   const rect=scene.getBoundingClientRect();
   const side=buttonSide || (e.button===2||e.clientX>rect.left+rect.width/2?'right':'left');
   const aimY=buttonSide?undefined:Math.min(.86,Math.max(.29,((e.clientY-rect.top)/rect.height+.08)/.92));
   if(beginCharge(side,e.pointerId,aimY)){
     element.setPointerCapture(e.pointerId);
     scene.focus({preventScroll:true});e.preventDefault();
   }
 });
 element.addEventListener('pointerup',e=>releaseCharge(e.pointerId));
 const cancel=e=>{if(charging?.owner===e.pointerId)cancelCharge()};
 element.addEventListener('pointercancel',cancel);
 element.addEventListener('lostpointercapture',cancel);
}
bindStrikePointer(scene);
scene.oncontextmenu=e=>e.preventDefault();
scene.onpointermove=e=>{if(e.pointerType!=='mouse'||phase!=='running')return;const r=scene.getBoundingClientRect();viewX=(e.clientX-r.left)/r.width-.5;viewY=(e.clientY-r.top)/r.height-.5};
scene.onpointerleave=()=>{viewX=viewY=0};
$$('[data-hand]').forEach(button=>{
 bindStrikePointer(button,button.dataset.hand);
 // Assistive technology can activate a button without a pointer sequence.
 button.onclick=e=>{if(e.detail===0 && beginCharge(button.dataset.hand,'activate'))releaseCharge('activate')};
});
$('#guard').onpointerdown=e=>{if(phase==='running'){cancelCharge();guard=true;e.target.setPointerCapture(e.pointerId)}};
$('#guard').onlostpointercapture=()=>guard=false;
document.addEventListener('keydown',e=>{
 if(modal.open||e.target.closest('input,select,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.code==='Escape'){if(phase==='running')pause();else if(phase==='paused')resume();else exitExpanded();return}
 if(phase!=='running'||(e.code==='Space'&&e.target.closest('button')))return;
 if(['KeyA','KeyD','Space'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='Space'){cancelCharge();guard=true}else beginCharge(e.code==='KeyA'?'left':'right',e.code)}
});
document.addEventListener('keyup',e=>{if(e.code==='Space')guard=false;else releaseCharge(e.code)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',pause);
$('#expand').onclick=async()=>{if(document.fullscreenElement||scene.classList.contains('expanded')){exitExpanded();return}try{await scene.requestFullscreen()}catch{scene.classList.add('expanded')}};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)pause()});
function showHelp(){openModal('วิธีเล่น','<p>เลือกเป้าซ้อม อุปกรณ์ และเวลาต่อรอบ แล้วกด <b>เริ่มซ้อม</b></p><p class="formrow"><span>ชกซ้าย / ขวา</span><span><kbd>A</kbd> / <kbd>D</kbd></span></p><p>กดสั้นแล้วปล่อยเพื่อชกปกติ หรือกดค้าง 1 วินาทีจนแถบพลังเต็มแล้วปล่อยเพื่อชกแรงขึ้น ใช้เมาส์และหน้าจอสัมผัสได้ทั้งสองฝั่งของสนาม โจมตีต่อเนื่องภายใน 1.25 วินาทีเพื่อเพิ่มคอมโบ</p><p class="formrow"><span>ยกนวมตั้งการ์ดค้างไว้</span><kbd>SPACE</kbd></p><p class="formrow"><span>พักเกม / ซ้อมต่อ</span><kbd>ESC</kbd></p>')}
$('#help').onclick=$('#morehelp').onclick=showHelp;
$('#custom').onclick=()=>{
 openModal('ปรับคู่ซ้อม','<label class="formrow">เพศ<select id="sex"><option value="male">ชาย</option><option value="female">หญิง</option></select></label><label class="formrow">ช่วงวัย<select id="age"><option value="young">ผู้ใหญ่ 20–39 ปี</option><option value="middle">ผู้ใหญ่ 40–59 ปี</option><option value="senior">ผู้ใหญ่ 60 ปีขึ้นไป</option></select></label><button id="apply" class="primary">ใช้คู่ซ้อมนี้</button>');
 $('#sex').value=settings.sex;$('#age').value=settings.age;
 $('#apply').onclick=()=>{settings.sex=$('#sex').value;settings.age=$('#age').value;refreshMesh();modal.close()};
};
function showHistory(){
 openModal('สถิติการซ้อม','<div class="profile"><div id="avatar"></div><div><b>โปรไฟล์ผู้เล่น</b><br><button id="pick-photo" class="pick-photo">เลือกรูปโปรไฟล์</button><input hidden id="photo" type="file" accept="image/png,image/jpeg,image/webp"></div></div><p id="image-status" role="status"></p><div id="records"></div>');
 function showAvatar(){const host=$('#avatar');host.replaceChildren();if(profile){const img=new Image();img.className='avatar';img.alt='โปรไฟล์ผู้เล่น';img.src=profile;host.append(img)}else{host.innerHTML=icon('fist')}}
 showAvatar();
 $('#pick-photo').onclick=()=>$('#photo').click();
 $('#photo').onchange=async e=>{
   const file=e.target.files[0];if(!file)return;
   const status=$('#image-status');
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8e6){status.textContent='เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB';return}
   const url=URL.createObjectURL(file);
   try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const side=Math.min(img.width,img.height);canvas.getContext('2d').drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,96,96);profile=canvas.toDataURL('image/jpeg',.85);const saved=save('avatar',profile);if(status.isConnected){showAvatar();status.textContent=saved?'เก็บรูปไว้ในเบราว์เซอร์นี้แล้ว':'ใช้รูปสำหรับการเล่นครั้งนี้แล้ว'}}catch{status.textContent='อ่านรูปนี้ไม่ได้ ลองเลือกรูปใหม่'}finally{URL.revokeObjectURL(url)}
 };
 const records=$('#records');if(!history.length){records.textContent='ยังไม่มีรอบที่จบ เมื่อจบรอบ สถิติจะปรากฏที่นี่';return}
 history.forEach(r=>{const row=document.createElement('div');row.className='history-row';const title=document.createElement('div'),detail=document.createElement('small'),count=document.createElement('b');title.textContent=({boxer:'นักมวยสมมติ',dummy:'หุ่นคู่ซ้อม',bag:'กระสอบทราย'})[r.target]||'กระสอบทราย';detail.textContent=new Date(r.date).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})+' · '+time(r.elapsed*1000);title.append(detail);count.textContent=r.hits+' ครั้ง · ×'+r.best;row.append(title,count);records.append(row)});
}
$('#nav-history').onclick=showHistory;$('#nav-arena').onclick=()=>{if(modal.open)modal.close();$('#arena').scrollIntoView({block:'start'})};
$('#close').onclick=()=>modal.close();modal.onclick=e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}};
let renderedYaw=-.1,lastMeshFrame=0;
function frame(now){
 const dt=Math.min(.033,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 const still=phase==='paused'||modal.open;
 if(!still)idleTime+=dt;
 if(phase==='running'){
   const prev=Math.ceil(remaining/1000);remaining=Math.max(0,deadline-now);
   if(!remaining)finish();
   else {if(combo&&now-lastHit>1250){combo=0;drawHud()}else if(Math.ceil(remaining/1000)!==prev)drawHud()}
 }
 let extension=0;
 if(strike){
   let elapsed=now-strike.start;
   if(elapsed>=Ring.approach&&!strike.landed){
     // Present a complete contact frame even if a slow display skipped the approach.
     elapsed=Ring.approach;strike.start=now-elapsed;strike.landed=true;contact(now);
   }
   if(elapsed>=Ring.approach+35&&!strike.pushed){
     const direction=strike.side==='left'?1:-1;
     const force=1+.72*strike.charge;
     motion.vx+=direction*(settings.gear==='baton'?92:69)*force;
     motion.vz+=(settings.gear==='baton'?190:145)*force;strike.pushed=true;
   }
   extension=Ring.reach(elapsed);
   if(elapsed>=Ring.duration)strike=null;
 }
 if(!still){
   motion.vx+=(-motion.x*53-motion.vx*5.2)*dt;motion.x+=motion.vx*dt;
   motion.vz+=(-motion.z*70-motion.vz*7.5)*dt;motion.z+=motion.vz*dt;
 }
 const m=reduced.matches?.27:1;
 const yaw=-.1+motion.x*.022*m+viewX*.15*m;
 if(settings.target==='dummy'&&now-lastMeshFrame>42&&Math.abs(yaw-renderedYaw)>.009){
   Mannequin.draw(dummy,mesh,yaw,false);renderedYaw=yaw;lastMeshFrame=now;
 }
 $('#shadow').style.transform='translateX('+motion.x*2*m+'px) scale('+(1-motion.z*.004)+')';
 const level=chargeLevel(now);
 if(charging && now-charging.start>=100){
   const percent=Math.round(level*100);
   chargeMeter.hidden=false;chargeProgress.value=percent;chargeValue.textContent=percent+'%';
 }
 let point=strike?.point??charging?.point;
 if(!point&&settings.target!=='bag'){
   const left=targetPoint('left'),right=targetPoint('right');
   point={u:(left.u+right.u)/2,v:(left.v+right.v)/2};
 }
 const windup=charging?level:strike&&!strike.landed?strike.charge*(1-extension):0;
 const tip=Ring.draw(ring,dummy,{width:sceneWidth,height:sceneHeight,target:settings.target,gear:settings.gear,
   side:strike?.side,chargeSide:charging?.side??strike?.side,windup,point,extension,motion,guard,t:idleTime*1000,lookX:viewX,lookY:viewY,lessMotion:reduced.matches});
 if(tip){
   reticle.style.left=settings.target==='bag'&&!point?'50%':tip.x+'px';
   reticle.style.top=settings.target==='bag'&&!point?'48%':tip.y+'px';
 }
 scene.style.setProperty('--lookX',(-viewX*9*m)+'px');scene.style.setProperty('--lookY',(-viewY*7*m)+'px');
 requestAnimationFrame(frame)
}
setPhase('ready');resize();requestAnimationFrame(frame);
