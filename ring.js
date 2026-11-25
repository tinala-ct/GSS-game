// Project each target and its contact point with the same transform, then
// composite the player's equipment last so a fist cannot slip behind a target.
const Ring = (() => {
  const approach = 115, hold = 64, duration = 335;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const ready = image => image.complete && image.naturalWidth > 0;
  function sprite(url) {
    const image = new Image();
    image.src = url;
    return image;
  }
  const bag = sprite('assets/bag.webp'), glove = sprite('assets/glove.webp'), baton = sprite('assets/baton.webp');
  const warped = document.createElement('canvas');
  const athlete = document.createElement('canvas');
  athlete.width = athlete.height = 512;
  let portrait, portraitKey, marks = [], dirty = true, dent = null, longGlove;
  function chooseBoxer(sex, age) {
    const key = sex + '-' + age;
    if (key === portraitKey) return;
    portraitKey = key;
    portrait = sprite('assets/boxers/' + key + '.webp');
    clearImpact();
  }
  function clearImpact() {
    dent = null;
    marks = [];
    dirty = true;
  }
  function hitPoint(target, side, index, aimY, zone = 'body') {
    const left = side === 'left';
    if (target === 'boxer') {
      if (zone === 'face') {
        const center = portraitKey === 'female-young' ? .535 : .51;
        const height = portraitKey?.startsWith('female') ? .259 : .231;
        return {u: center + (left ? -.051 : .051), v: height};
      }
      // Coordinates on the exposed arms in the six aligned, authored portraits.
      const spread = [0, .013, -.012, .006][index % 4];
      return {u: (left ? .302 : .690) - spread * .45, v: (left ? .511 : .461) + spread};
    }
    if (target === 'dummy' && zone === 'face') {
      return {u: left ? -.16 : .16, v: portraitKey?.endsWith('senior') ? 1.25 : 1.34};
    }
    if (target === 'dummy') return {u: left ? -.67 : .67, v: .37};
    return {u: left ? .065 : .935, v: aimY ?? [.58, .64, .50, .69][index % 4]};
  }
  function bruise(point) {
    const mark = marks.find(m => Math.hypot(m.u-point.u,m.v-point.v) < .014);
    if (mark) mark.weight = Math.min(7, mark.weight + 1);
    else marks.push({...point,weight:1});
    dirty = true;
  }
  function contact(target, side, point, time, gear, charge = 0) {
    if (target === 'bag') dent = {side, point, time, force: (gear === 'baton' ? .9 : 1) * (1 + .42 * charge)};
    if (target === 'boxer') bruise(point);
  }
  function boxerImage() {
    if (!ready(portrait)) return null;
    if (!dirty) return athlete;
    const ctx = athlete.getContext('2d');
    ctx.clearRect(0,0,512,512);
    ctx.drawImage(portrait,0,0,512,512);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    for (const {u,v,weight} of marks) {
      ctx.save();
      ctx.translate(u*512,v*512);
      ctx.rotate(u < .5 ? .4 : -.4);
      const radius = 7 + 2.2 * Math.sqrt(weight);
      ctx.scale(radius, radius * 1.34);
      const tint = ctx.createRadialGradient(-.12,-.14,.03,0,0,1);
      tint.addColorStop(0,'rgba(83,46,76,'+(.18 + .054*weight)+')');
      tint.addColorStop(.48,'rgba(122,58,74,'+(.16 + .035*weight)+')');
      tint.addColorStop(1,'rgba(150,72,66,0)');
      ctx.fillStyle=tint;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    ctx.restore();
    dirty = false;
    return athlete;
  }
  function pressure(time) {
    if (!dent) return 0;
    const t = Math.max(0, time - dent.time);
    if (t > 600) {dent = null; return 0}
    if (t < 38) return dent.force * smooth(t / 38);
    return dent.force * Math.exp(-Math.max(0, t - hold - 20) / 153);
  }
  // Piecewise horizontal displacement. The near side gives way most,
  // the lettering follows, and adjacent rows form the lip of the dent.
  function warp(u, v, strength) {
    if (!strength || !dent) return u;
    const right = dent.side === 'right', x = right ? 1-u : u;
    const dy = (v-dent.point.v)/.074;
    const center = Math.exp(-dy*dy*.95);
    const lip = Math.exp(-((Math.abs(dy)-1.42)**2)/.19);
    const displacement = x < .5
      ? mix(.24*center-.033*lip, .105*center, 2*x)
      : mix(.105*center, .008*center, 2*x-1);
    const deformed = x + displacement*strength;
    return right ? 1-deformed : deformed;
  }
  function bagImage(strength) {
    if (!ready(bag)) return null;
    if (!strength) return bag;
    const w=bag.naturalWidth,h=bag.naturalHeight;
    if (warped.width!==w || warped.height!==h) {warped.width=w;warped.height=h}
    const ctx=warped.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const first=Math.max(0,Math.floor((dent.point.v-.27)*h));
    const last=Math.min(h,Math.ceil((dent.point.v+.27)*h));
    if(first)ctx.drawImage(bag,0,0,w,first,0,0,w,first);
    if(last<h)ctx.drawImage(bag,0,last,w,h-last,0,last,w,h-last);
    for(let y=first;y<last;y+=4){
      const n=Math.min(4,last-y),v=(y+n/2)/h;
      const a=warp(0,v,strength)*w,b=warp(.5,v,strength)*w,c=warp(1,v,strength)*w;
      ctx.drawImage(bag,0,y,w/2,n,a,y,b-a,n);
      ctx.drawImage(bag,w/2,y,w/2,n,b,y,c-b,n);
    }
    ctx.save();ctx.globalCompositeOperation='source-atop';
    ctx.translate(warp(dent.point.u,dent.point.v,strength)*w,dent.point.v*h);
    ctx.scale(w*.32,h*.095);
    const shade=ctx.createRadialGradient(0,0,0,0,0,1);
    shade.addColorStop(0,'rgba(9,5,3,'+strength*.65+')');
    shade.addColorStop(.60,'rgba(16,11,8,'+strength*.38+')');
    shade.addColorStop(.86,'rgba(243,196,153,'+strength*.17+')');
    shade.addColorStop(1,'rgba(230,190,150,0)');
    ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);
    // Shallow folds fan away from the compressed leather and flatten on release.
    ctx.scale(dent.side==='left'?1:-1,1);
    for(const sign of [-1,1]){
      const crease=ctx.createLinearGradient(-.4,0,1.75,0);
      crease.addColorStop(0,'rgba(39,25,16,0)');
      crease.addColorStop(.45,'rgba(234,193,144,'+strength*.37+')');
      crease.addColorStop(1,'rgba(223,194,157,0)');
      ctx.strokeStyle=crease;ctx.lineWidth=.035;ctx.beginPath();
      ctx.moveTo(-.4,sign*.78);ctx.quadraticCurveTo(.57,sign*.93,1.72,sign*.50);ctx.stroke();
    }
    ctx.restore();
    return warped;
  }
  function reach(elapsed) {
    if (elapsed < approach) return smooth(clamp(elapsed / approach,0,1));
    if (elapsed <= approach+hold) return 1;
    return 1-smooth(clamp((elapsed-approach-hold)/(duration-approach-hold),0,1));
  }
  function equipment(ctx,img,x,y,width,height,angle,anchorX,anchorY,mirror) {
    if(!ready(img))return;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    if(mirror)ctx.scale(-1,1);
    ctx.translate(-width*anchorX,-height*anchorY);
    if(img===glove){
      // Extend the photographed wrist with a smoothly widening forearm.
      // Bake it once so there are no per-frame texture joins or floating cuffs.
      if(!longGlove){
        longGlove=document.createElement('canvas');
        longGlove.width=800;longGlove.height=2850;
        const arm=longGlove.getContext('2d');
        for(let y=959;y<longGlove.height;y+=4){
          const f=(y-959)/(longGlove.height-959),stretch=1+.74*f;
          const sample=945+13*Math.sin((y-959)/44);
          arm.drawImage(glove,0,sample,613,4,92+209*(1-stretch),y,613*stretch,4.2);
        }
        arm.drawImage(glove,92,0);
      }
      ctx.drawImage(longGlove,-92/613*width,0,width*800/613,height*2850/972);
    }else ctx.drawImage(img,0,0,width,height);
    ctx.restore();
  }
  function draw(canvas, dummy, state) {
    const {width:w,height:h,target,gear,side,extension,motion,guard,t,lookX,lookY,lessMotion}=state;
    if(!w||!h)return;
    const ctx=canvas.getContext('2d');
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
    const m=lessMotion?.28:1;
    const bagMode=target==='bag', dummyMode=target==='dummy';
    const angle=bagMode?(-motion.x*.015+Math.sin(t*.0006)*.006)*m:-motion.x*.008*m;
    const scale=clamp(1-motion.z*.003*m,.84,1.05);
    const pivotX=w*.5,pivotY=bagMode?-h*.08:h*1.03;
    const tw=bagMode?Math.min(w*.27,h*.39):dummyMode?w*.56:Math.min(h*.98,w*.96);
    const th=bagMode?h*.92:dummyMode?h:tw;
    const top=bagMode?0:dummyMode?-h*.98:-th;
    const depth=bagMode?pressure(t):0;
    const image=bagMode?bagImage(depth):dummyMode?dummy:boxerImage();
    ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(angle);ctx.scale(scale,scale);
    const lean=(motion.x*.0024+Math.sin(t*.0015)*.0022)*m;
    const bend=v=>(1-v)*(1-v)*tw*lean;
    if(image && target==='boxer'){
      // Distribute recoil through the torso, with the feet below the crop.
      for(let y=0;y<512;y+=8){
        ctx.drawImage(image,0,y,512,8,-tw/2+bend((y+4)/512),top+y/512*th,tw,th/64+.3);
      }
    }else if(image)ctx.drawImage(image,-tw/2,top,tw,th);
    ctx.restore();
    const point=state.point??hitPoint(target,side||'left',0);
    let localX,localY;
    if(dummyMode){
      // The mannequin uses the same 8-unit perspective camera in mannequin.js.
      const unit=h/4.85*8/(8-.42);
      localX=point.u*unit;localY=top+h*.46-point.v*unit;
    }else{
      localX=((bagMode?warp(point.u,point.v,depth):point.u)-.5)*tw;
      localY=top+point.v*th;
      if(target==='boxer')localX+=bend(point.v);
    }
    const hitX=pivotX+scale*(localX*Math.cos(angle)-localY*Math.sin(angle));
    const hitY=pivotY+scale*(localX*Math.sin(angle)+localY*Math.cos(angle));
    const bob=lessMotion?0:Math.sin(t*.0017)*h*.004;
    for(const hand of ['left','right']){
      if(gear==='baton'&&hand==='right')continue;
      const sign=hand==='left'?1:-1;
      const k=gear==='gloves'&&side===hand?extension:0;
      const lift=guard&&!side?1:0;
      const windup=state.chargeSide===hand ? (state.windup || 0)*m : 0;
      const restX=-sign*w*.055*windup+w*(hand==='left'?.22:.78)+sign*lift*w*.080+lookX*4*m;
      const restY=h*(.635-lift*.17+.065*windup)+sign*bob+lookY*3*m;
      const handWidth=Math.min(h*.44,w*.28);
      const size=mix(1,.64,k);
      const x=mix(restX,hitX,k)-sign*Math.sin(k*Math.PI)*w*.024*m;
      const y=mix(restY,hitY,k)+Math.sin(k*Math.PI)*h*.025*m;
      equipment(ctx,glove,x,y,handWidth*size,handWidth*972/613*size,
        sign*mix(.32-lift*.22-.20*windup,.67,k),.53,.067,sign<0);
    }
    if(gear==='baton'){
      const k=extension, stickH=h*.80*mix(1,.78,k);
      const x=mix(w*.74,hitX,k),y=mix(h*(guard?.23:.38)+bob,hitY,k);
      const tilt=mix(-.35+(state.windup||0)*.26*m,side==='left'?-.98:-.66,k);
      equipment(ctx,baton,x,y,stickH*93/1001,stickH,tilt,.5,.026,false);
      const grip=stickH*.79, palm=Math.min(w*.16,h*.24)*mix(1,.8,k);
      equipment(ctx,glove,x-Math.sin(tilt)*grip,y+Math.cos(tilt)*grip,
        palm,palm*972/613,-.33,.47,.36,true);
    }
    return {x:hitX,y:hitY};
  }
  return {approach,duration,reach,draw,chooseBoxer,clearImpact,hitPoint,contact};
})();
