(function(){
var $=function(i){return document.getElementById(i)};
var ST=[
 ['นิยาม SI','7 หน่วยฐานที่นิยามด้วยค่าคงตัว (BIPM, ฝรั่งเศส)','ไฟฟ้า: แอมแปร์จาก e · อุณหภูมิ: เคลวินจาก k','ความไม่แน่นอนต่ำสุดของโซ่ — ไม่มีส่วนที่เป็นความไม่แน่นอนของการนิยามอีกต่อไป เพราะค่าคงตัวถูกกำหนดให้แน่นอน'],
 ['สถาบันมาตรวิทยาแห่งชาติ (NIMT ในไทย)','ทำการเทียบผ่านการเทียบเคียงระหว่างประเทศ (CIPM MRA)','ไฟฟ้า: อาเรย์ Josephson (แรงดัน) + QHE (ความต้านทาน) · อุณหภูมิ: เซลล์จุดคงที่ ITS-90 + SPRT','ความไม่แน่นอนเล็กระดับ ppb–ppm สำหรับปริมาณไฟฟ้าตามสถาบัน'],
 ['ห้องสอบเทียบที่ได้รับการรับรอง ISO/IEC 17025','สอบเทียบมาตรฐานอ้างอิงของโรงงาน/ห้องแล็บเอกชน','ไฟฟ้า: เครื่องสอบเทียบ/มัลติมิเตอร์ 8½ หลัก, ตัวต้านทานมาตรฐาน · อุณหภูมิ: อ่างสอบเทียบ + เทอร์โมมิเตอร์อ้างอิง','ความไม่แน่นอนระดับ ppm–สิบ ppm หรือ ±0.01–0.05 °C ขึ้นกับสาขา'],
 ['มาตรฐานทำงานของโรงงาน','เครื่องมือที่ใช้สอบเทียบเซนเซอร์ในไลน์ผลิต','เช่น เครื่องสอบเทียบกระบวนการ (mA/V/Ω simulator), เตาสอบเทียบแห้ง, ตุ้มน้ำหนักมาตรฐาน','ความไม่แน่นอนใหญ่ขึ้น แต่ต้อง "ดีกว่าเซนเซอร์ที่สอบเทียบอย่างน้อย 4 เท่า" (TUR 4:1)'],
 ['เซนเซอร์/เครื่องมือหน้างาน','ทรานสมิตเตอร์ Pt100 โหลดเซลล์ มัลติมิเตอร์พกพา','ใบสอบเทียบมีตารางจุดสอบและความไม่แน่นอน ระบุรอบสอบเทียบ','ค่าที่ใช้งานจริง — ความไม่แน่นอนรวมของโซ่ทั้งหมดอยู่ที่นี่']
];
var box=$('tr-steps');
ST.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.className='sx-ghost';b.style.cssText='text-align:left;margin-left:'+(i*14)+'px;';b.innerHTML='<b>'+(i+1)+'.</b> '+s[0];b.onclick=function(){show(i)};box.appendChild(b)});
function show(i){var s=ST[i];Array.prototype.forEach.call(box.children,function(c,j){c.style.background=j===i?'var(--acc)':'transparent';c.style.color=j===i?'#fff':'var(--acc)'});$('tr-detail').textContent=s[0]+'\nบทบาท: '+s[1]+'\nตัวอย่าง: '+s[2]+'\nความไม่แน่นอน: '+s[3]}
show(0);
// quantum calc
var e=1.602176634e-19,h=6.62607015e-34;
function q(){
 var f=parseFloat($('jq-f').value)*1e9,n=parseFloat($('jq-n').value),N=parseFloat($('jq-N').value),i=parseFloat($('jq-i').value);
 var KJ=2*e/h,RK=h/(e*e);
 var V=N*n*f/KJ;
 $('jq-out').textContent='K_J = 2e/h = '+(KJ/1e9).toLocaleString('en',{maximumFractionDigits:4})+' GHz/V   (ค่าตามสัญญา 1990: 483 597.9)\nR_K = h/e² = '+RK.toLocaleString('en',{maximumFractionDigits:5})+' Ω   (ค่าตามสัญญา 1990: 25 812.807)\n'+
 'แรงดันต่อรอยต่อ 1 ขั้น ที่ '+(f/1e9)+' GHz, n = '+n+':  '+(n*f/KJ*1e6).toFixed(2)+' µV\nอาเรย์ '+N.toLocaleString('en')+' รอยต่อ ให้ '+V.toFixed(4)+' V\nความต้านทานที่ราบ i = '+i+':  R_K/i = '+(RK/i).toLocaleString('en',{maximumFractionDigits:4})+' Ω';
}
['jq-f','jq-n','jq-N','jq-i'].forEach(function(id){$(id).addEventListener('input',q)});q();
// uncertainty budget
var DIV={'rect':['สี่เหลี่ยม (÷√3)',Math.sqrt(3)],'tri':['สามเหลี่ยม (÷√6)',Math.sqrt(6)],'n1':['ปกติ k=1 (÷1)',1],'n2':['ปกติ k=2 (÷2)',2],'n3':['ปกติ k=3 (÷3)',3]};
var rows=$('ub-rows');
function addRow(name,val,dist){
 var r=document.createElement('div');r.className='sx-row';
 var o='';Object.keys(DIV).forEach(function(k){o+='<option value="'+k+'"'+(k===dist?' selected':'')+'>'+DIV[k][0]+'</option>'});
 r.innerHTML='<label>องค์ประกอบ<input type="text" value="'+name+'" style="width:210px"></label><label>ขนาด<input type="number" step="any" value="'+val+'" style="width:100px"></label><label>การแจกแจง<select>'+o+'</select></label><button type="button" class="sx-ghost" aria-label="ลบ">✕</button>';
 r.querySelector('button').onclick=function(){r.remove();calc()};
 Array.prototype.forEach.call(r.querySelectorAll('input,select'),function(x){x.addEventListener('input',calc)});
 rows.appendChild(r);calc();
}
function calc(){
 var s=0,t='';
 Array.prototype.forEach.call(rows.children,function(r){var nm=r.children[0].querySelector('input').value,v=parseFloat(r.children[1].querySelector('input').value)||0,d=DIV[r.children[2].querySelector('select').value][1],u=v/d;s+=u*u;t+=nm+':  u = '+u.toPrecision(3)+'\n'});
 var uc=Math.sqrt(s),k=parseFloat($('ub-k').value);
 $('ub-out').textContent=t+'\nu_c (รวมแบบ RSS) = '+uc.toPrecision(4)+'\nU = k·u_c = '+(k*uc).toPrecision(4)+'  (k = '+k+')'+(k===2?'  ≈ ความเชื่อมั่น 95 %':'');
}
$('ub-add').onclick=function(){addRow('องค์ประกอบใหม่',0.01,'rect')};$('ub-k').onchange=calc;
addRow('ใบสอบเทียบ (U ที่ k=2)',0.05,'n2');addRow('สเปกความถูกต้องเครื่องวัด',0.1,'rect');addRow('ความละเอียดการอ่าน (ครึ่งหน่วยสุดท้าย)',0.005,'rect');addRow('การวัดซ้ำ (ส่วนเบี่ยงเบนมาตรฐานของค่าเฉลี่ย)',0.02,'n1');
})();
