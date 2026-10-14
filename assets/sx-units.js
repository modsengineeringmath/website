/* Units engine — Mod's Engineering Math · sensors & transducers
   dims order: [m, kg, s, A, K, mol, cd, angle] */
(function(root){
'use strict';
var D=function(m,kg,s,A,K,mol,cd,ang){return [m||0,kg||0,s||0,A||0,K||0,mol||0,cd||0,ang||0]};
var PI=Math.PI;
var U={}; // symbol -> {f,d,p(prefixable)}
function def(sym,f,d,p){U[sym]={f:f,d:d,p:!!p}}
// base & derived SI
def('m',1,D(1),1);def('g',1e-3,D(0,1),1);def('s',1,D(0,0,1),1);def('A',1,D(0,0,0,1),1);def('K',1,D(0,0,0,0,1),1);def('mol',1,D(0,0,0,0,0,1),1);def('cd',1,D(0,0,0,0,0,0,1),1);
def('rad',1,D(0,0,0,0,0,0,0,1),1);def('sr',1,D(),1);
def('Hz',2*PI,D(0,0,-1,0,0,0,0,1),1); // 1 Hz = 1 cycle/s (angle-based so that Hz<->rad/s is 2π)
def('N',1,D(1,1,-2),1);def('Pa',1,D(-1,1,-2),1);def('J',1,D(2,1,-2),1);def('W',1,D(2,1,-3),1);
def('C',1,D(0,0,1,1),1);def('V',1,D(2,1,-3,-1),1);def('F',1,D(-2,-1,4,2),1);def('Ω',1,D(2,1,-3,-2),1);def('S',1,D(-2,-1,3,2),1);
def('Wb',1,D(2,1,-2,-1),1);def('T',1,D(0,1,-2,-1),1);def('H',1,D(2,1,-2,-2),1);
def('lm',1,D(0,0,0,0,0,0,1),1);def('lx',1,D(-2,0,0,0,0,0,1),1);def('Bq',1,D(0,0,-1),1);def('Gy',1,D(2,0,-2),1);def('Sv',1,D(2,0,-2),1);def('kat',1,D(0,0,-1,0,0,1),1);
def('L',1e-3,D(3),1);def('l',1e-3,D(3),1);def('t',1000,D(0,1),1);def('bar',1e5,D(-1,1,-2),1);def('eV',1.602176634e-19,D(2,1,-2),1);
def('Wh',3600,D(2,1,-2),1);def('VA',1,D(2,1,-3),1);def('var',1,D(2,1,-3),1);def('Np',1,D(),0);
def('cal',4.184,D(2,1,-2),1);def('Da',1.66053906892e-27,D(0,1),0);
// time
def('min',60,D(0,0,1));def('h',3600,D(0,0,1));def('d',86400,D(0,0,1));def('yr',31557600,D(0,0,1));
// angle
def('deg',PI/180,D(0,0,0,0,0,0,0,1));def('°',PI/180,D(0,0,0,0,0,0,0,1));def('rev',2*PI,D(0,0,0,0,0,0,0,1));def('rpm',2*PI/60,D(0,0,-1,0,0,0,0,1));def('rps',2*PI,D(0,0,-1,0,0,0,0,1));
def('arcmin',PI/10800,D(0,0,0,0,0,0,0,1));def('arcsec',PI/648000,D(0,0,0,0,0,0,0,1));
// length
def('in',0.0254,D(1));def('ft',0.3048,D(1));def('yd',0.9144,D(1));def('mi',1609.344,D(1));def('nmi',1852,D(1));def('mil',2.54e-5,D(1));def('Å',1e-10,D(1));def('thou',2.54e-5,D(1));
// mass/force
def('lb',0.45359237,D(0,1));def('oz',0.028349523125,D(0,1));def('slug',14.593902937,D(0,1));def('ton',907.18474,D(0,1));def('tonUK',1016.0469088,D(0,1));
def('kgf',9.80665,D(1,1,-2));def('lbf',4.4482216152605,D(1,1,-2));def('ozf',0.2780138509537812,D(1,1,-2));def('dyn',1e-5,D(1,1,-2));def('pdl',0.138254954376,D(1,1,-2));
// pressure
def('atm',101325,D(-1,1,-2));def('mmHg',133.322387415,D(-1,1,-2));def('torr',101325/760,D(-1,1,-2));def('psi',6894.757293168,D(-1,1,-2));def('inHg',3386.389,D(-1,1,-2));
def('inH2O',249.08891,D(-1,1,-2));def('mmH2O',9.80665,D(-1,1,-2));def('mH2O',9806.65,D(-1,1,-2));def('ksi',6894757.293168,D(-1,1,-2));def('at',98066.5,D(-1,1,-2));
// energy/power
def('erg',1e-7,D(2,1,-2));def('BTU',1055.05585262,D(2,1,-2));def('kcal',4184,D(2,1,-2));def('therm',105505585.262,D(2,1,-2));def('ftlbf',1.3558179483314004,D(2,1,-2));
def('hp',745.69987158227022,D(2,1,-3));def('PS',735.49875,D(2,1,-3));def('TR',3516.8528420667,D(2,1,-3));
// volume / flow bits
def('gal',3.785411784e-3,D(3));def('galUK',4.54609e-3,D(3));def('qt',9.46352946e-4,D(3));def('pt',4.73176473e-4,D(3));def('floz',2.95735295625e-5,D(3));def('bbl',0.158987294928,D(3));def('cc',1e-6,D(3));
// speed
def('kn',1852/3600,D(1,0,-1));def('mph',0.44704,D(1,0,-1));def('fps',0.3048,D(1,0,-1));def('kph',1/3.6,D(1,0,-1));
// EM legacy
def('G',1e-4,D(0,1,-2,-1));def('Mx',1e-8,D(2,1,-2,-1));def('Oe',1000/(4*PI),D(-1,0,0,1));def('Gs',1e-4,D(0,1,-2,-1));def('gamma',1e-9,D(0,1,-2,-1));
def('abV',1e-8,D(2,1,-3,-1));def('Ah',3600,D(0,0,1,1));def('mAh',3.6,D(0,0,1,1));
def('P',0.1,D(-1,1,-1),1);def('cP',1e-3,D(-1,1,-1));def('St',1e-4,D(2,0,-1),1);def('cSt',1e-6,D(2,0,-1));
def('mil2',1,D()); delete U['mil2'];
def('ppm',1e-6,D());def('ppb',1e-9,D());def('pct',0.01,D());def('%',0.01,D());def('‰',0.001,D());
// temperature handled specially
var TEMP={'K':{a:1,b:0},'°C':{a:1,b:273.15},'degC':{a:1,b:273.15},'℃':{a:1,b:273.15},'°F':{a:5/9,b:459.67*5/9},'degF':{a:5/9,b:459.67*5/9},'℉':{a:5/9,b:459.67*5/9},'°R':{a:5/9,b:0},'degR':{a:5/9,b:0}};
def('Δ°C',1,D(0,0,0,0,1));def('ΔK',1,D(0,0,0,0,1));def('Δ°F',5/9,D(0,0,0,0,1));def('degCd',1,D(0,0,0,0,1));def('degFd',5/9,D(0,0,0,0,1));
var PFX={'Q':30,'R':27,'Y':24,'Z':21,'E':18,'P':15,'T':12,'G':9,'M':6,'k':3,'h':2,'da':1,'d':-1,'c':-2,'m':-3,'µ':-6,'μ':-6,'u':-6,'n':-9,'p':-12,'f':-15,'a':-18,'z':-21,'y':-24,'r':-27,'q':-30};
var NOPFX={'min':1,'mi':1,'in':1,'ft':1,'cd':1,'cal':0,'mil':1,'at':1,'ton':1,'pt':1,'cc':1,'Pa':0,'kn':1,'yd':1,'mol':0,'rad':0,'rpm':1,'rev':1,'psi':1,'hp':1,'deg':1,'atm':1,'gal':1,'qt':1,'lb':1,'oz':1,'yr':1,'dyn':1,'erg':1,'Gs':1,'mph':1,'fps':1,'kph':1,'ksi':1,'kat':0,'sr':0,'lm':0,'lx':0,'Da':0,'Wb':0,'var':0};
function findUnit(tok){
  if(TEMP[tok]) return {temp:TEMP[tok],f:TEMP[tok].a,d:D(0,0,0,0,1),sym:tok};
  if(U[tok]) return {f:U[tok].f,d:U[tok].d.slice(),sym:tok};
  // prefix + unit
  var cand=[];
  for(var p in PFX){ if(tok.length>p.length && tok.indexOf(p)===0){ var base=tok.slice(p.length); if(U[base]&&U[base].p&&!NOPFX[tok]){ cand.push({f:Math.pow(10,PFX[p])*U[base].f,d:U[base].d.slice(),sym:tok,pre:p,base:base}); } } }
  if(cand.length) { cand.sort(function(a,b){return b.pre.length-a.pre.length}); return cand[0]; }
  return null;
}
function tokenize(s){
  s=s.replace(/\s+/g,' ').trim();
  var t=[],i=0,sup={'²':'2','³':'3','⁻':'-','¹':'1','⁰':'0','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
  while(i<s.length){
    var c=s[i];
    if(c===' '){i++;continue}
    if(sup[c]!==undefined){var e='';while(i<s.length&&sup[s[i]]!==undefined){e+=sup[s[i]];i++}t.push({t:'^'});t.push({t:'n',v:parseFloat(e)});continue}
    if('*·×⋅'.indexOf(c)>=0){t.push({t:'*'});i++;continue}
    if('/÷'.indexOf(c)>=0){t.push({t:'/'});i++;continue}
    if(c==='^'){t.push({t:'^'});i++;continue}
    if(c==='('){t.push({t:'('});i++;continue}
    if(c===')'){t.push({t:')'});i++;continue}
    var m=/^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/.exec(s.slice(i));
    if(m&&(/[0-9.]/.test(c))){t.push({t:'n',v:parseFloat(m[0])});i+=m[0].length;continue}
    if((c==='-'||c==='+')&&t.length&&t[t.length-1].t==='^'){var m2=/^[+-]?[0-9]*\.?[0-9]+/.exec(s.slice(i));if(m2){t.push({t:'n',v:parseFloat(m2[0])});i+=m2[0].length;continue}}
    if((c==='-'||c==='+')&&t.length&&t[t.length-1].t==='('){var m3=/^[+-]?[0-9]*\.?[0-9]+/.exec(s.slice(i));if(m3){t.push({t:'n',v:parseFloat(m3[0])});i+=m3[0].length;continue}}
    var m4=/^[A-Za-zµμΩÅ°℃℉Δ%‰][A-Za-z0-9µμΩÅ°℃℉Δ%‰]*/.exec(s.slice(i));
    if(m4){
      // split trailing digits as exponent: m2 -> m^2 (but keep names like H2O, mil2)
      var w=m4[0];var mm=/^(.*?[A-Za-zµμΩÅ°℃℉%‰])([0-9]+)$/.exec(w);
      if(mm && !findUnit(w) && findUnit(mm[1])){t.push({t:'u',v:mm[1]});t.push({t:'^'});t.push({t:'n',v:parseFloat(mm[2])});}
      else t.push({t:'u',v:w});
      i+=w.length;continue;
    }
    throw new Error('อ่านอักขระ "'+c+'" ไม่ได้');
  }
  return t;
}
function mul(a,b,sign){var d=a.d.map(function(x,i){return x+sign*b.d[i]});return {f:sign>0?a.f*b.f:a.f/b.f,d:d,units:a.units.concat(b.units)}}
function parse(str){
  var t=tokenize(str),p=0;
  function peek(){return t[p]}
  function atom(){
    var k=peek();if(!k)throw new Error('นิพจน์ไม่สมบูรณ์');
    if(k.t==='n'){p++;return {f:k.v,d:D(),units:[]}}
    if(k.t==='u'){p++;var u=findUnit(k.v);if(!u)throw new Error('ไม่รู้จักหน่วย "'+k.v+'"');return {f:u.f,d:u.d,units:[u],temp:u.temp}}
    if(k.t==='('){p++;var r=expr();if(!peek()||peek().t!==')')throw new Error('วงเล็บไม่ครบ');p++;return r}
    throw new Error('ตำแหน่งไม่ถูกต้อง');
  }
  function power(){
    var b=atom();
    if(peek()&&peek().t==='^'){p++;var n;var k=peek();
      if(k&&k.t==='('){p++;n=expr();if(peek().t!==')')throw new Error('วงเล็บไม่ครบ');p++;n=n.f}
      else if(k&&k.t==='n'){p++;n=k.v}else throw new Error('เลขชี้กำลังไม่ถูกต้อง');
      b={f:Math.pow(b.f,n),d:b.d.map(function(x){return x*n}),units:b.units,exp:n};
    }
    return b;
  }
  function implicit(){ // adjacency = multiplication (e.g. "kg m")
    var a=power();
    while(peek()&&(peek().t==='u'||peek().t==='(')){a=mul(a,power(),1)}
    return a;
  }
  function expr(){
    var a=implicit();
    while(peek()&&(peek().t==='*'||peek().t==='/')){var op=peek().t;p++;var b=implicit();a=mul(a,b,op==='*'?1:-1)}
    return a;
  }
  var r=expr();if(p<t.length)throw new Error('มีส่วนเกินท้ายนิพจน์');
  // detect pure temperature token
  if(t.length===1&&t[0].t==='u'&&r.temp) r.pureTemp=r.temp;
  return r;
}
var NAMES=[
 ['ความยาว',D(1)],['มวล',D(0,1)],['เวลา',D(0,0,1)],['กระแสไฟฟ้า',D(0,0,0,1)],['อุณหภูมิเทอร์โมไดนามิก',D(0,0,0,0,1)],['ปริมาณสาร',D(0,0,0,0,0,1)],['ความเข้มการส่องสว่าง',D(0,0,0,0,0,0,1)],
 ['พื้นที่',D(2)],['ปริมาตร',D(3)],['ความเร็ว',D(1,0,-1)],['ความเร่ง',D(1,0,-2)],['ความถี่ (รอบ/วินาที)',D(0,0,-1,0,0,0,0,1)],['ความถี่ที่ไม่นับเป็นมุม (อัตรา/วินาที)',D(0,0,-1)],
 ['แรง',D(1,1,-2)],['ความดัน / ความเค้น',D(-1,1,-2)],['พลังงาน / งาน (หรือทอร์ก N·m)',D(2,1,-2)],['กำลัง',D(2,1,-3)],['ประจุไฟฟ้า',D(0,0,1,1)],['แรงดันไฟฟ้า',D(2,1,-3,-1)],['ความจุไฟฟ้า',D(-2,-1,4,2)],
 ['ความต้านทาน',D(2,1,-3,-2)],['ความนำ',D(-2,-1,3,2)],['ฟลักซ์แม่เหล็ก',D(2,1,-2,-1)],['ความหนาแน่นฟลักซ์แม่เหล็ก',D(0,1,-2,-1)],['ความเหนี่ยวนำ',D(2,1,-2,-2)],
 ['ความหนาแน่น (มวล/ปริมาตร)',D(-3,1)],['อัตราการไหลเชิงปริมาตร',D(3,0,-1)],['อัตราการไหลเชิงมวล',D(0,1,-1)],['ความหนืดพลวัต',D(-1,1,-1)],['ความหนืดจลน์',D(2,0,-1)],['สนามไฟฟ้า',D(1,1,-3,-1)],['สนามแม่เหล็ก H',D(-1,0,0,1)],['ความจุความร้อน',D(2,1,-2,0,-1)],['การนำความร้อน',D(1,1,-3,0,-1)],['ความหนาแน่นกระแส',D(-2,0,0,1)],['ความไวสัญญาณ (V/Pa ฯลฯ)',D(3,-1,3,-1)],
 ['ความต้านทานจำเพาะ',D(3,1,-3,-2)],['อัตราส่วนไร้มิติ',D()]
];
function nameOf(d){for(var i=0;i<NAMES.length;i++){var n=NAMES[i][1],ok=true;for(var j=0;j<8;j++)if(n[j]!==d[j]){ok=false;break}if(ok)return NAMES[i][0]}return null}
var SYM=['m','kg','s','A','K','mol','cd','rad'];
var SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','.':'·'};
function sup(n){return String(n).split('').map(function(c){return SUP[c]||c}).join('')}
function dimStr(d){var out=[];for(var i=0;i<8;i++){if(d[i]){out.push(SYM[i]+(d[i]===1?'':sup(+d[i].toFixed(3))))}}return out.length?out.join('·'):'1 (ไร้มิติ)'}
function convert(val,from,to){
  var a=parse(from),b=parse(to);
  if(a.pureTemp&&b.pureTemp){
    var K=val*a.pureTemp.a+a.pureTemp.b; // to kelvin: v*a + b  (b = offset in K)
    var out=(K-b.pureTemp.b)/b.pureTemp.a;
    return {value:out,factor:null,dimA:a.d,dimB:b.d,affine:true,note:'แปลงอุณหภูมิแบบมีออฟเซ็ต (ใช้ได้เฉพาะ "จุดอุณหภูมิ" ไม่ใช่ผลต่าง)'};
  }
  if(a.pureTemp||b.pureTemp){ if(!(a.pureTemp&&b.pureTemp)){ if(a.d.join()!==b.d.join()) throw new Error('มิติต่างกัน'); throw new Error('การแปลงอุณหภูมิแบบจุดทำได้ระหว่าง °C, °F, K, °R เท่านั้น ถ้าเป็นผลต่างอุณหภูมิให้ใช้ Δ°C, Δ°F, ΔK'); } }
  var da=a.d.slice(),db=b.d.slice(),note=null;
  if(da.join()!==db.join()){
    // frequency <-> angular frequency bridge handled by angle exponent baked into Hz (f=2π) — nothing else
    var ex=[];for(var i=0;i<8;i++)if(da[i]!==db[i])ex.push(SYM[i]+' ('+da[i]+' vs '+db[i]+')');
    var e=new Error('มิติไม่ตรงกัน: ต้นทางคือ '+dimStr(da)+(nameOf(da)?' ('+nameOf(da)+')':'')+' ปลายทางคือ '+dimStr(db)+(nameOf(db)?' ('+nameOf(db)+')':''));e.dimA=da;e.dimB=db;throw e;
  }
  var f=a.f/b.f;
  return {value:val*f,factor:f,dimA:da,dimB:db,note:note,quantity:nameOf(da)};
}
function fmt(x,sig){
  sig=sig||8;if(!isFinite(x))return String(x);if(x===0)return '0';
  var a=Math.abs(x);
  if(a>=1e9||a<1e-4){var s=x.toExponential(sig-1);s=s.replace(/\.?0+e/,'e');return s.replace('e+','×10^').replace('e','×10^')}
  var s2=parseFloat(x.toPrecision(sig)).toString();return s2;
}
function fmtTh(x,sig){var s=fmt(x,sig);return s.replace(/×10\^(-?\d+)/,function(_,e){return '×10'+sup(e)})}
root.UNITS={parse:parse,convert:convert,fmt:fmtTh,dimStr:dimStr,nameOf:nameOf,table:U,PFX:PFX,sup:sup};
if(typeof module!=='undefined')module.exports=root.UNITS;
})(typeof window!=='undefined'?window:globalThis);
