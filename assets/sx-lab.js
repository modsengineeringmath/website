(function(){
'use strict';
var $=function(i){return document.getElementById(i)},U=window.UNITS;
var CATS={
 'ความดัน':{u:['Pa','kPa','MPa','bar','mbar','psi','atm','mmHg','torr','inHg','inH2O','mmH2O','kgf/cm^2'],d:[1,'bar','psi']},
 'อุณหภูมิ':{u:['°C','°F','K','°R','Δ°C','Δ°F'],d:[25,'°C','°F']},
 'ความยาว':{u:['m','mm','µm','nm','km','in','ft','yd','mi','mil','Å'],d:[1,'in','mm']},
 'มวล':{u:['kg','g','mg','t','lb','oz','slug'],d:[1,'lb','kg']},
 'แรง / ทอร์ก':{u:['N','kN','kgf','lbf','dyn','N*m','kgf*m','lbf*ft','lbf*in','oz*in'],d:[1,'kgf','N']},
 'พลังงาน':{u:['J','kJ','MJ','Wh','kWh','cal','kcal','BTU','eV','erg','ft*lbf'],d:[1,'kWh','MJ']},
 'กำลัง':{u:['W','kW','MW','hp','PS','BTU/h','TR','VA','kVA'],d:[1,'hp','kW']},
 'อัตราการไหล':{u:['m^3/s','m^3/h','L/s','L/min','mL/min','gal/min','ft^3/min','bbl/d'],d:[1,'m^3/h','L/min']},
 'ความเร็ว / รอบ':{u:['m/s','km/h','mph','kn','ft/s','rpm','Hz','kHz','rad/s','deg/s'],d:[1500,'rpm','rad/s']},
 'ไฟฟ้า':{u:['V','mV','µV','kV','A','mA','µA','Ω','mΩ','kΩ','MΩ','S','F','µF','nF','pF','H','mH','µH'],d:[1,'mV','µV']},
 'แม่เหล็ก':{u:['T','mT','µT','G','Wb','mWb','Mx','A/m','Oe'],d:[1,'G','mT']},
 'ความหนืด / อื่น ๆ':{u:['Pa*s','cP','P','m^2/s','cSt','St','ppm','%','mV/V','ppm/°C','%/K'],d:[1,'cP','Pa*s']}
};
var cat=$('cv-cat'),dl=$('cv-units');
if(cat){
  Object.keys(CATS).forEach(function(k){var o=document.createElement('option');o.textContent=k;cat.appendChild(o)});
  function setCat(){
    var c=CATS[cat.value];dl.innerHTML='';c.u.forEach(function(u){var o=document.createElement('option');o.value=u;dl.appendChild(o)});
    $('cv-val').value=c.d[0];$('cv-from').value=c.d[1];$('cv-to').value=c.d[2];run();
  }
  function run(){
    var out=$('cv-out'),info=$('cv-info');
    var v=parseFloat($('cv-val').value);
    if(isNaN(v)){out.textContent='ใส่ตัวเลขก่อน';info.textContent='';return}
    try{
      var r=U.convert(v,$('cv-from').value,$('cv-to').value);
      out.innerHTML='<span class="big">'+U.fmt(r.value,8)+'</span> '+esc($('cv-to').value);
      var t=[];
      if(r.factor!==null)t.push('1 '+$('cv-from').value+' = '+U.fmt(r.factor,10)+' '+$('cv-to').value);
      t.push('มิติ: '+U.dimStr(r.dimA)+(r.quantity?' · '+r.quantity:''));
      if(r.note)t.push(r.note);
      if(r.quantity&&r.quantity.indexOf('ความดัน')===0)t.push('⚠ ระบุให้ชัดว่าเป็นความดันเกจ (g) หรือสัมบูรณ์ (a): 1 atm สัมบูรณ์ ≈ 0 barg ที่ระดับน้ำทะเล แต่ 1.01325 bara');
      if(/^(°C|degC|℃)$/.test($('cv-from').value.trim())||/^(°C|degC|℃)$/.test($('cv-to').value.trim()))t.push('ถ้าเป็นผลต่างอุณหภูมิ (เช่น ΔT = 10 °C) ให้ใช้ Δ°C หรือ K เพราะผลต่าง 10 °C = 10 K = 18 °F');
      info.textContent=t.join('\n');info.style.color='';
    }catch(e){out.textContent='—';info.textContent='⚠ '+e.message;info.style.color='var(--acc2)'}
  }
  function esc(s){return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  ['cv-val','cv-from','cv-to'].forEach(function(i){$(i).addEventListener('input',run)});
  cat.onchange=setCat;
  $('cv-swap').onclick=function(){var a=$('cv-from').value;$('cv-from').value=$('cv-to').value;$('cv-to').value=a;
    try{var r=U.convert(parseFloat($('cv-val').value),a,$('cv-from').value);}catch(e){}run()};
  document.querySelectorAll('[data-cv]').forEach(function(b){b.onclick=function(){var p=b.getAttribute('data-cv').split('|');$('cv-val').value=p[0];$('cv-from').value=p[1];$('cv-to').value=p[2];run()}});
  setCat();
}
/* ---- 4-20 mA scaler ---- */
var ma=$('sc-ma');
if(ma){
  var lock=false;
  function st(i){if(i<=3.6)return ['สัญญาณล้มเหลว (≤ 3.6 mA) ตาม NAMUR NE 43: สายขาด/เซนเซอร์เสีย','var(--acc2)'];if(i<3.8)return ['ช่วงไม่นิยาม 3.6–3.8 mA (ระหว่างล้มเหลวกับ under-range)','var(--acc2)'];if(i<4)return ['ต่ำกว่าช่วง (under-range) 3.8–4.0 mA','var(--acc2)'];if(i<=20)return ['ปกติ (4–20 mA)','var(--acc)'];if(i<=20.5)return ['เกินช่วง (over-range) 20–20.5 mA','var(--acc2)'];if(i<21)return ['ช่วงไม่นิยาม 20.5–21 mA','var(--acc2)'];return ['สัญญาณล้มเหลว (≥ 21 mA) ตาม NAMUR NE 43','var(--acc2)']}
  function upd(src){
    if(lock)return;lock=true;
    var lo=parseFloat($('sc-lrv').value),hi=parseFloat($('sc-urv').value);
    var i;
    if(src==='ma')i=parseFloat($('sc-ma').value);
    else if(src==='pct')i=4+16*parseFloat($('sc-pct').value)/100;
    else i=4+16*(parseFloat($('sc-val').value)-lo)/(hi-lo);
    if(isNaN(i)||hi===lo){lock=false;return}
    if(src!=='ma')$('sc-ma').value=+i.toFixed(4);
    if(src!=='pct')$('sc-pct').value=+(((i-4)/16)*100).toFixed(3);
    if(src!=='val')$('sc-val').value=+(lo+(i-4)/16*(hi-lo)).toPrecision(8);
    var s=st(i);$('sc-st').textContent=s[0];$('sc-st').style.color=s[1];
    $('sc-v').textContent='เมื่อใช้ตัวต้านทานชันต์:  100 Ω → '+(i*0.1).toFixed(3)+' V  ·  250 Ω → '+(i*0.25).toFixed(3)+' V (1–5 V)  ·  500 Ω → '+(i*0.5).toFixed(3)+' V (2–10 V)\nกำลังที่ 250 Ω: '+(i*i*250/1000).toFixed(2)+' mW';
    lock=false;
  }
  $('sc-ma').oninput=function(){upd('ma')};$('sc-pct').oninput=function(){upd('pct')};$('sc-val').oninput=function(){upd('val')};
  $('sc-lrv').oninput=function(){upd('pct')};$('sc-urv').oninput=function(){upd('pct')};
  $('sc-ma').value=12;upd('ma');
}
/* ---- dB tools ---- */
var dbs=$('db-type');
if(dbs){
  var DB={
   p:{l:'อัตราส่วนกำลัง (P₂/P₁)',toDb:function(x){return 10*Math.log10(x)},fromDb:function(d){return Math.pow(10,d/10)},u:'เท่า'},
   v:{l:'อัตราส่วนแรงดัน/กระแส (V₂/V₁)',toDb:function(x){return 20*Math.log10(x)},fromDb:function(d){return Math.pow(10,d/20)},u:'เท่า'},
   dbm:{l:'dBm ↔ กำลัง (mW)',toDb:function(x){return 10*Math.log10(x)},fromDb:function(d){return Math.pow(10,d/10)},u:'mW'},
   dbv:{l:'dBV ↔ แรงดัน rms (V)',toDb:function(x){return 20*Math.log10(x)},fromDb:function(d){return Math.pow(10,d/20)},u:'V'},
   dbuv:{l:'dBµV ↔ แรงดัน rms (µV)',toDb:function(x){return 20*Math.log10(x)},fromDb:function(d){return Math.pow(10,d/20)},u:'µV'}
  };
  Object.keys(DB).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=DB[k].l;dbs.appendChild(o)});
  var lk=false;
  function dbUpd(src){if(lk)return;lk=true;var m=DB[dbs.value];$('db-lu').textContent=m.u;
    if(src==='lin'){var x=parseFloat($('db-lin').value);if(x>0)$('db-db').value=+m.toDb(x).toFixed(4)}
    else{var d=parseFloat($('db-db').value);if(!isNaN(d))$('db-lin').value=+m.fromDb(d).toPrecision(8)}
    lk=false}
  $('db-lin').oninput=function(){dbUpd('lin')};$('db-db').oninput=function(){dbUpd('db')};dbs.onchange=function(){dbUpd('lin')};
  $('db-lin').value=2;dbUpd('lin');
}
/* ---- dimension analyzer ---- */
var da=$('da-in');
if(da){
  function dar(){
    try{var p=U.parse(da.value);var nm=U.nameOf(p.d);
      $('da-out').textContent='มิติ (หน่วยฐาน SI): '+U.dimStr(p.d)+'\nเทียบเท่าปริมาณ: '+(nm||'— (ไม่ตรงกับปริมาณที่รู้จักในตาราง)')+'\n1 ['+da.value+'] = '+U.fmt(p.f,10)+' ในหน่วยฐาน SI ของมิตินั้น'}
    catch(e){$('da-out').textContent='⚠ '+e.message}
  }
  da.oninput=dar;
  document.querySelectorAll('[data-da]').forEach(function(b){b.onclick=function(){da.value=b.getAttribute('data-da');dar()}});
  da.value='kg*m^2/(s^3*A)';dar();
}
/* ---- prefix table ---- */
var pt=$('pfx-body');
if(pt){
  var NM={30:['quetta','Q'],27:['ronna','R'],24:['yotta','Y'],21:['zetta','Z'],18:['exa','E'],15:['peta','P'],12:['tera','T'],9:['giga','G'],6:['mega','M'],3:['kilo','k'],2:['hecto','h'],1:['deca','da'],'-1':['deci','d'],'-2':['centi','c'],'-3':['milli','m'],'-6':['micro','µ'],'-9':['nano','n'],'-12':['pico','p'],'-15':['femto','f'],'-18':['atto','a'],'-21':['zepto','z'],'-24':['yocto','y'],'-27':['ronto','r'],'-30':['quecto','q']};
  Object.keys(NM).map(Number).sort(function(a,b){return b-a}).forEach(function(e){var tr=document.createElement('tr');tr.innerHTML='<td>'+NM[e][0]+'</td><td><b>'+NM[e][1]+'</b></td><td>10'+U.sup(e)+'</td>';pt.appendChild(tr)});
}
})();
