(function(){
'use strict';
function css(n){return getComputedStyle(document.querySelector('.sx')||document.documentElement).getPropertyValue(n).trim()||'#888'}
function $(id){return document.getElementById(id)}
/* ---------- 1. measurement chain ---------- */
var EX={
 pt100:{n:'อุณหภูมิ · Pt100 (RTD)',st:[
  ['ปริมาณที่วัด','อุณหภูมิ 0–150 °C'],
  ['เซนเซอร์','Pt100: R₀ = 100 Ω ที่ 0 °C → 157.3 Ω ที่ 150 °C (ความไวเฉลี่ย ≈ 0.38 Ω/°C) ตามเส้นโค้ง IEC 60751'],
  ['ภาคปรับสภาพ','แหล่งจ่ายกระแสคงที่ 1 mA → 100–157.3 mV, ต่อสาย 3 หรือ 4 สายเพื่อตัดความต้านทานสาย, ขยายสัญญาณ'],
  ['แปลง A/D','ADC 16–24 บิต, ใช้ reference แบบ ratiometric เพื่อให้ผลไม่ขึ้นกับความคลาดของกระแสกระตุ้น'],
  ['แสดงผล / ส่งต่อ','linearize ด้วยสมการ Callendar–Van Dusen → °C → แสดงผลหรือส่ง 4–20 mA']]},
 tck:{n:'อุณหภูมิ · เทอร์โมคัปเปิล type K',st:[
  ['ปริมาณที่วัด','อุณหภูมิ 0–400 °C (ปลายวัดเทียบ cold junction)'],
  ['เซนเซอร์','คู่ Chromel–Alumel ให้แรงเคลื่อนไฟฟ้าซีเบก: 0 → 16.397 mV ที่ 400 °C (เทียบ 0 °C) ความไว ≈ 41 µV/°C'],
  ['ภาคปรับสภาพ','ขยาย (µV→V), ชดเชย cold junction ด้วยเซนเซอร์อุณหภูมิที่ขั้วต่อ, กรองสัญญาณรบกวน 50 Hz'],
  ['แปลง A/D','ADC ความละเอียดสูง (≥ 16 บิต) เพราะสัญญาณมีหน่วย mV'],
  ['แสดงผล / ส่งต่อ','แปลง mV + T_cj → °C ด้วยตารางหรือพหุนามตาม IEC 60584-1 / NIST ITS-90']]},
 load:{n:'แรง/น้ำหนัก · โหลดเซลล์ (strain gauge)',st:[
  ['ปริมาณที่วัด','น้ำหนัก 0–100 kg (พิกัดโหลดเซลล์ 100 kg)'],
  ['เซนเซอร์','บริดจ์ Wheatstone ของสเตรนเกจ ความไวพิกัด 2 mV/V (ค่าทั่วไป)'],
  ['ภาคปรับสภาพ','จ่ายกระตุ้น 10 V → สัญญาณเต็มสเกล = 2 mV/V × 10 V = 20 mV, ขยายด้วย instrumentation amplifier'],
  ['แปลง A/D','ADC 24 บิตแบบ sigma-delta, reference ratiometric ร่วมกับแหล่งกระตุ้น'],
  ['แสดงผล / ส่งต่อ','หัก tare, คูณ span ที่ได้จากการสอบเทียบด้วยตุ้มน้ำหนักมาตรฐาน → กิโลกรัม']]},
 ptx:{n:'ความดัน · ทรานสมิตเตอร์ 4–20 mA',st:[
  ['ปริมาณที่วัด','ความดันเกจ 0–10 bar'],
  ['เซนเซอร์','เซลล์ความดันแบบเพียโซรีซิสทีฟ/คาปาซิทีฟ (มิลลิโวลต์ถึงหลายสิบ mV)'],
  ['ภาคปรับสภาพ','ในตัวทรานสมิตเตอร์: ชดเชยอุณหภูมิ, linearize, แปลงเป็นกระแส 4 mA (0 bar) ถึง 20 mA (10 bar)'],
  ['แปลง A/D','ฝั่งรับ: ตัวต้านทาน 250 Ω → 1–5 V แล้วเข้า ADC ของ PLC/DAQ'],
  ['แสดงผล / ส่งต่อ','สเกลกลับ: P = 10 × (I − 4)/16 bar, กระแส ≤ 3.6 mA หรือ ≥ 21 mA ถือเป็นสัญญาณล้มเหลว และ 3.8–20.5 mA คือช่วงวัดที่ใช้ได้ (แนวทาง NAMUR NE 43)']]},
 hall:{n:'กระแสไฟฟ้า · Hall current sensor',st:[
  ['ปริมาณที่วัด','กระแสวงจรกำลัง ±30 A (เช่น ในคอนเวอร์เตอร์ DC-DC)'],
  ['เซนเซอร์','ชิป Hall + ตัวนำปฐมภูมิ: สนามแม่เหล็ก B ∝ I → แรงดัน Hall'],
  ['ภาคปรับสภาพ','ในตัวชิป: ขยาย, ชดเชยออฟเซ็ต/อุณหภูมิ, ออกแรงดันอ้างอิงกลาง (เช่น Vcc/2) ± ความไว'],
  ['แปลง A/D','ADC ของไมโครคอนโทรลเลอร์ ซิงก์การสุ่มกับช่วง PWM เพื่อเลี่ยง switching noise'],
  ['แสดงผล / ส่งต่อ','ลบออฟเซ็ต หาร sensitivity → A เข้าลูปควบคุมหรือวงจรป้องกันกระแสเกิน']]}
};
var root=$('chain-root');
if(root){
  var sel=$('chain-ex'),detail=$('chain-detail');
  Object.keys(EX).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=EX[k].n;sel.appendChild(o)});
  var cur=0;
  function draw(){
    var e=EX[sel.value];root.innerHTML='';
    e.st.forEach(function(s,i){
      var b=document.createElement('button');b.type='button';b.className='sx-ghost';b.style.cssText='flex:1 1 130px;text-align:center;padding:10px 6px;'+(i===cur?'background:var(--acc);color:#fff':'');
      b.innerHTML='<small style="opacity:.8">'+(i+1)+'</small><br><b>'+s[0]+'</b>';
      b.onclick=function(){cur=i;draw()};
      root.appendChild(b);
      if(i<e.st.length-1){var a=document.createElement('span');a.textContent='→';a.style.cssText='align-self:center;color:var(--mut)';a.setAttribute('aria-hidden','true');root.appendChild(a)}
    });
    detail.textContent=e.st[cur][1];
  }
  sel.onchange=function(){cur=0;draw()};
  root.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:10px 0';
  draw();
}
/* ---------- 2. static characteristics lab ---------- */
var cv=$('stat-cv');
if(cv){
  var ctx=cv.getContext('2d');
  var ids=['sg','so','sn','sh','sz'];
  var seed=7;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  function gauss(){var u=0,v=0;while(!u)u=rnd();v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
  var noise=[];function renoise(){noise=[];for(var i=0;i<=100;i++)noise.push([gauss(),gauss()])}
  renoise();
  function val(id){return parseFloat($(id).value)}
  function run(){
    var g=val('sg')/100,o=val('so')/100,nl=val('sn')/100,h=val('sh')/100,z=val('sz')/100;
    ids.forEach(function(i){$(i+'v').textContent=$(i).value});
    var W=cv.width,H=cv.height,pad=44,ph=Math.round(H*0.58),eh=H-ph-pad*1.6;
    ctx.clearRect(0,0,W,H);
    var ink=css('--ink'),mut=css('--mut'),line=css('--line'),acc=css('--acc'),acc2=css('--acc2');
    ctx.font='13px sans-serif';ctx.lineWidth=1;
    // top plot
    var x0=pad,x1=W-16,y0=14,y1=ph-8;
    function X(x){return x0+(x1-x0)*x}function Y(y,a,b,c,d){return d-(d-c)*y}
    ctx.strokeStyle=line;ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    ctx.fillStyle=mut;ctx.fillText('ผลลัพธ์ (%FS)',4,y0+10);ctx.fillText('อินพุต (%FS) →',x1-100,y1+16);
    var ymin=-0.1,ymax=1.1;function YT(y){return y1-(y1-y0)*(y-ymin)/(ymax-ymin)}
    ctx.strokeStyle=mut;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(X(0),YT(0));ctx.lineTo(X(1),YT(1));ctx.stroke();ctx.setLineDash([]);
    var up=[],dn=[],eu=[],ed=[],mu=0,md=0,N=100;
    for(var i=0;i<=N;i++){
      var x=i/N,bump=4*x*(1-x);
      var base=(1+g)*x+o+nl*bump;
      var yu=base-h/2*bump+z*noise[i][0],yd=base+h/2*bump+z*noise[i][1];
      up.push(yu);dn.push(yd);eu.push(yu-x);ed.push(yd-x);
      mu=Math.max(mu,Math.abs(base-h/2*bump-x),Math.abs(base+h/2*bump-x));
    }
    function path(arr,col,wd){ctx.strokeStyle=col;ctx.lineWidth=wd;ctx.beginPath();arr.forEach(function(y,i){var px=X(i/N),py=YT(y);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();ctx.lineWidth=1}
    path(up,acc,2);path(dn,acc2,2);
    ctx.fillStyle=acc;ctx.fillText('— ขาขึ้น',x0+8,y1-24);ctx.fillStyle=acc2;ctx.fillText('— ขาลง',x0+8,y1-8);ctx.fillStyle=mut;ctx.fillText('- - อุดมคติ y = x',x0+80,y1-8);
    // error plot
    var e0=ph+pad*0.7,e1=H-18;
    ctx.strokeStyle=line;ctx.strokeRect(x0,e0,x1-x0,e1-e0);
    var emax=Math.max(0.02,Math.ceil(Math.max.apply(null,eu.concat(ed).map(Math.abs))*100/2)*2/100*1.0);
    function YE(y){return (e0+e1)/2-(e1-e0)/2*y/emax}
    ctx.strokeStyle=mut;ctx.beginPath();ctx.moveTo(x0,YE(0));ctx.lineTo(x1,YE(0));ctx.stroke();
    ctx.fillStyle=mut;ctx.fillText('ความคลาดเคลื่อน ±'+(emax*100).toFixed(0)+' %FS',4,e0-4);
    function pathE(arr,col){ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.beginPath();arr.forEach(function(y,i){var px=X(i/N),py=YE(y);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();ctx.lineWidth=1}
    pathE(eu,acc);pathE(ed,acc2);
    var worst=Math.abs(g)+Math.abs(o)+Math.abs(nl)+h/2,rss=Math.sqrt(g*g+o*o+nl*nl+(h/2)*(h/2));
    $('stat-out').textContent=
     'ความคลาดเคลื่อนสูงสุดจากแบบจำลอง (ยังไม่รวมสัญญาณรบกวน): '+(mu*100).toFixed(2)+' %FS\n'+
     'รวมแบบเลวร้ายที่สุด (บวกตรง ๆ): ±'+(worst*100).toFixed(2)+' %FS   |   รวมแบบ RSS: ±'+(rss*100).toFixed(2)+' %FS\n'+
     'สัญญาณรบกวน 3σ: ±'+(3*z*100).toFixed(2)+' %FS   |   ฮิสเทอรีซิสสูงสุดที่กลางสเกล: '+(h*100).toFixed(2)+' %FS\n'+
     'ที่อินพุต 10 %FS: ความคลาดเคลื่อนสัมพัทธ์ต่ออ่านค่า (%RDG) ≈ '+(Math.abs((up[10]-0.1))/0.1*100).toFixed(1)+' %RDG ← สังเกตว่า %FS เดียวกัน แต่ %RDG ที่ปลายล่างแย่กว่ามาก';
  }
  ids.forEach(function(i){$(i).oninput=run});
  $('stat-seed').onclick=function(){seed=(Math.random()*1e9)|0;renoise();run()};
  $('stat-reset').onclick=function(){$('sg').value=0;$('so').value=0;$('sn').value=0;$('sh').value=0;$('sz').value=0;run()};
  run();matchMedia('(prefers-color-scheme:dark)').addEventListener&&matchMedia('(prefers-color-scheme:dark)').addEventListener('change',run);
}
/* ---------- 3. dynamic response lab ---------- */
var dv=$('dyn-cv');
if(dv){
  var dc=dv.getContext('2d');
  function dyn(){
    var tau=parseFloat($('dt').value),f=Math.pow(10,parseFloat($('df').value));
    $('dtv').textContent=tau.toFixed(2);$('dfv').textContent=f<10?f.toFixed(2):f.toFixed(1);
    var W=dv.width,H=dv.height,x0=44,x1=W-14,y0=14,y1=H-30,T=Math.max(6*tau,1.0)+0.5,t0=0.5;
    dc.clearRect(0,0,W,H);var mut=css('--mut'),line=css('--line'),acc=css('--acc'),acc2=css('--acc2'),ink=css('--ink');
    function X(t){return x0+(x1-x0)*t/T}function Y(y){return y1-(y1-y0)*y/1.1}
    dc.font='13px sans-serif';dc.strokeStyle=line;dc.strokeRect(x0,y0,x1-x0,y1-y0);
    [0.632,0.95,0.993].forEach(function(l){dc.strokeStyle=line;dc.setLineDash([3,4]);dc.beginPath();dc.moveTo(x0,Y(l));dc.lineTo(x1,Y(l));dc.stroke();dc.setLineDash([]);dc.fillStyle=mut;dc.fillText((l*100).toFixed(1)+'%',4,Y(l)+4)});
    dc.strokeStyle=mut;dc.beginPath();dc.moveTo(X(0),Y(0));dc.lineTo(X(t0),Y(0));dc.lineTo(X(t0),Y(1));dc.lineTo(X(T),Y(1));dc.stroke();
    dc.strokeStyle=acc;dc.lineWidth=2.4;dc.beginPath();for(var i=0;i<=300;i++){var t=T*i/300,y=t<t0?0:1-Math.exp(-(t-t0)/tau);i?dc.lineTo(X(t),Y(y)):dc.moveTo(X(t),Y(y))}dc.stroke();dc.lineWidth=1;
    [1,3,5].forEach(function(k){var t=t0+k*tau;if(t<=T){dc.strokeStyle=acc2;dc.beginPath();dc.moveTo(X(t),Y(0));dc.lineTo(X(t),Y(1-Math.exp(-k)));dc.stroke();dc.fillStyle=acc2;dc.fillText(k+'τ',X(t)-8,y1+16)}});
    dc.fillStyle=mut;dc.fillText('เวลา (s) →',x1-70,y1+16);
    var wt=2*Math.PI*f*tau,mag=1/Math.sqrt(1+wt*wt),ph=-Math.atan(wt)*180/Math.PI;
    $('dyn-out').textContent=
     'ค่าคงตัวเวลา τ = '+tau.toFixed(2)+' s\n'+
     'เวลาขึ้น 10→90 % = 2.197τ = '+(2.197*tau).toFixed(2)+' s   |   เวลาเข้าที่ ±2 % ≈ 3.912τ = '+(3.912*tau).toFixed(2)+' s\n'+
     'ความถี่คัตออฟ (−3 dB) f_c = 1/(2πτ) = '+(1/(2*Math.PI*tau)).toFixed(3)+' Hz\n'+
     'อินพุตไซน์ '+(f<10?f.toFixed(2):f.toFixed(1))+' Hz → เซนเซอร์อ่านแอมพลิจูดได้ '+(mag*100).toFixed(1)+' % ของจริง ('+(20*Math.log10(mag)).toFixed(2)+' dB) และเฟสล้าหลัง '+(-ph).toFixed(1)+'°';
  }
  $('dt').oninput=dyn;$('df').oninput=dyn;dyn();matchMedia('(prefers-color-scheme:dark)').addEventListener&&matchMedia('(prefers-color-scheme:dark)').addEventListener('change',dyn);
}
})();
