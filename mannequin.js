// Lit polygon mesh for the spring-mounted training dummy. Positive z faces the player.
const Mannequin = (() => {
  const amber = [159, 99, 59], rubber = [53, 54, 53], trim = [214, 117, 55];
  let faces = [];
  function surface(rows, color, offset = [0, 0, 0]) {
    const rings = rows.map(([y, width, depth, z = 0]) =>
      Array.from({length: 32}, (_, i) => {
        const angle = i * Math.PI / 16;
        return [offset[0] + width * Math.cos(angle), offset[1] + y, offset[2] + z + depth * Math.sin(angle)];
      })
    );
    for (let j = 1; j < rings.length; j++) for (let i = 0; i < 32; i++) {
      const k = (i + 1) % 32;
      faces.push({v: [rings[j-1][i], rings[j][i], rings[j][k], rings[j-1][k]], color});
    }
  }
  function oval(x, y, z, w, h, d, color) {
    const rows = Array.from({length: 13}, (_, i) => {
      const a = (i / 12 - .5) * Math.PI;
      return [Math.sin(a) * h, Math.cos(a) * w, Math.cos(a) * d];
    });
    surface(rows, color, [x, y, z]);
  }
  function build(sex, age) {
    faces = [];
    const shoulder = sex === 'female' ? .87 : 1.04;
    const height = age === 'senior' ? -.09 : 0;
    const skin = age === 'senior' ? [148, 110, 81] : age === 'middle' ? [157, 107, 67] : amber;
    surface([[-2.65, .01, .01],[-2.62,.92,.70],[-2.40,1,.74],[-2.05,.94,.71],[-1.89,.65,.53],[-1.88,.01,.01]], rubber);
    surface([[-1.93,.28,.26],[-1.08,.26,.24]], [68,66,60]);
    for(let y=-1.8;y<-1.15;y+=.13) surface([[y,.28,.26],[y+.04,.31,.29],[y+.08,.28,.26]],rubber);
    surface([[-1.27,.25,.26],[-1.19,.54,.38],[-.88,.65,.41],[-.47,.61,.41],[0,.78,.46],[.38,shoulder,.49],[.59,shoulder*.98,.47],[.72,shoulder*.72,.36],[.83,.32,.29]], rubber);
    for(const s of [-1,1]) {
      oval(s*shoulder*.91,.33,.015,.25,.35,.37,skin);
      oval(s*shoulder*.39,.39,.31,.46*shoulder,.24,.19,[79,77,68]);
    }
    oval(0,-.02,.44,.19,.18,.038,trim);
    surface([[.66,.32,.28],[.94+height,.26,.26],[1.09+height,.27,.26]],skin);
    surface([[.90,.11,.16,.09],[.97,.26,.25,.07],[1.11,.34,.29,.07],[1.34,.40,.35,.04],[1.62,.41,.38],[1.81,.37,.34],[1.95,.25,.24],[2.01,.05,.05]],skin,[0,height,0]);
    for(const s of [-1,1]){
      oval(s*.393,1.41+height,-.005,.06,.13,.085,skin);
      oval(s*.167,1.47+height,.36,.138,.048,.060,skin);
      oval(s*.164,1.414+height,.37,.103,.019,.025,[75,53,40]);
    }
    oval(0,1.34+height,.40,.074,.12,.084,skin);
    oval(0,1.14+height,.365,.117,.019,.014,[103,72,50]);
    if(age!=='young')oval(0,1.63+height,.366,.18,.011,.012,[130,95,66]);
    return faces;
  }
  // Smooth normals and a depth buffer keep overlapping molded parts continuous
  // as the target turns. The painter below also works without GPU acceleration.
  const renderers = new WeakMap();
  const geometry = new WeakMap();
  function vertices(mesh) {
    if (geometry.has(mesh)) return geometry.get(mesh);
    const normals = new Map();
    for (const {v} of mesh) {
      const a = v[1].map((n,i) => n-v[0][i]), b = v[2].map((n,i) => n-v[1][i]);
      const normal = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
      for (const point of v) {
        const sum = normals.get(point) || [0,0,0];
        normal.forEach((n,i) => sum[i]+=n);
        normals.set(point,sum);
      }
    }
    const data = [];
    for (const {v,color} of mesh) for (const i of [0,1,2,0,2,3]) {
      const n=normals.get(v[i]),len=Math.hypot(...n)||1;
      data.push(...v[i], ...n.map(x=>x/len), ...color.map(c=>c/255));
    }
    const result=new Float32Array(data);
    geometry.set(mesh,result);
    return result;
  }
  function getRenderer(canvas) {
    if (renderers.has(canvas)) return renderers.get(canvas);
    // Use an independent surface so the same output canvas can fall back to 2D.
    const surface=document.createElement('canvas');
    const gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!gl){renderers.set(canvas,null);return null}
    function compile(type,source) {
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      return shader;
    }
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,`
      attribute vec3 position,normal,color;
      uniform vec4 projection;
      varying vec3 worldNormal,baseColor;
      void main(){
        float c=cos(projection.w),s=sin(projection.w);
        mat3 turn=mat3(c,0.,-s, 0.,1.,0., s,0.,c);
        vec3 p=turn*position;
        float w=1.-p.z/8.;
        gl_Position=vec4(p.x*projection.x,p.y*projection.y+projection.z*w,-p.z*.12,w);
        worldNormal=turn*normal;baseColor=color;
      }`));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec3 worldNormal,baseColor;
      void main(){
        vec3 n=normalize(worldNormal),light=normalize(vec3(-.75,.75,.9));
        float diffuse=max(dot(n,light),0.);
        float gloss=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),25.);
        vec3 rgb=baseColor*(.51+.64*diffuse)+vec3(.12,.09,.065)*gloss;
        gl_FragColor=vec4(rgb,1.);
      }`));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){renderers.set(canvas,null);return null}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    ['position','normal','color'].forEach((name,i)=>{
      const attr=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr,3,gl.FLOAT,false,36,i*12);
    });
    gl.enable(gl.DEPTH_TEST);
    const projection=gl.getUniformLocation(program,'projection');
    let previous=null,count=0;
    const render=(mesh,yaw,bust)=>{
      if(gl.isContextLost())return false;
      if(surface.width!==canvas.width||surface.height!==canvas.height){surface.width=canvas.width;surface.height=canvas.height}
      gl.viewport(0,0,surface.width,surface.height);
      if(previous!==mesh){const data=vertices(mesh);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);count=data.length/9;previous=mesh}
      const scale=2/(bust?3.13:4.85);
      gl.uniform4f(projection,scale*surface.height/surface.width,scale,1-2*(bust?.68:.46),yaw);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,count);
      const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(surface,0,0);
      return true;
    };
    renderers.set(canvas,render);return render;
  }
  function draw(canvas, mesh, yaw, bust) {
    if(getRenderer(canvas)?.(mesh,yaw,bust))return;
    const ctx = canvas.getContext('2d');
    const w=canvas.width,h=canvas.height,cos=Math.cos(yaw),sin=Math.sin(yaw);
    ctx.clearRect(0,0,w,h);
    const scale=h/(bust?3.13:4.85), center=bust?h*.68:h*.46;
    const projected = [];
    for(const face of mesh){
      const pts=face.v.map(([x,y,z])=>[x*cos+z*sin,y,z*cos-x*sin]);
      const [p,q,r]=pts, a=q.map((v,i)=>v-p[i]), b=r.map((v,i)=>v-q[i]);
      const nx=a[1]*b[2]-a[2]*b[1], ny=a[2]*b[0]-a[0]*b[2], nz=a[0]*b[1]-a[1]*b[0];
      if(nz<0)continue;
      const light=.51+.58*Math.max(0,(-.58*nx+.59*ny+.55*nz)/(Math.hypot(nx,ny,nz)||1));
      projected.push({depth:pts.reduce((sum,v)=>sum+v[2],0),color:'rgb('+face.color.map(v=>Math.min(255,Math.round(v*light))).join(',')+')',points:pts.map(([x,y,z])=>[w/2+x*scale*8/(8-z),center-y*scale*8/(8-z)])});
    }
    projected.sort((a,b)=>a.depth-b.depth);
    ctx.lineWidth=.5;
    for(const f of projected){
      ctx.beginPath();f.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=ctx.strokeStyle=f.color;ctx.fill();ctx.stroke();
    }
  }
  return {build, draw};
})();
