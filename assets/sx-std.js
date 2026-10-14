(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var C={CH:'สวิตเซอร์แลนด์',FR:'ฝรั่งเศส',DE:'เยอรมนี',US:'สหรัฐอเมริกา',JP:'ญี่ปุ่น',TH:'ไทย'};
var DOM=['หน่วยและมาตรวิทยา','เซนเซอร์และการวัด','สัญญาณและการสื่อสาร','ความปลอดภัยและสภาพแวดล้อม','ระบบไฟฟ้าและมิเตอร์','ไทย'];
var S=[
{id:'si',n:'SI Brochure (ระบบหน่วยระหว่างประเทศ)',d:'ข้อกำหนดทางการของ SI: หน่วยฐาน 7 หน่วย คำนำหน้า และกฎการเขียน — ฉบับที่ 9 (2019) สะท้อนการนิยามใหม่ด้วยค่าคงตัวธรรมชาติ',o:'BIPM (สำนักงานชั่งตวงวัดระหว่างประเทศ)',c:'FR',city:'Sèvres (ชานกรุงปารีส)',dom:[0]},
{id:'vim',n:'VIM — JCGM 200',d:'ศัพท์มาตรวิทยาสากล: นิยาม sensor (3.8), measuring transducer (3.7), measuring chain (3.10), accuracy, calibration ฯลฯ',o:'JCGM (BIPM, IEC, ISO, OIML, ILAC, IFCC, IUPAC, IUPAP)',c:'FR',city:'สำนักเลขาที่ BIPM',dom:[0,1]},
{id:'gum',n:'GUM — JCGM 100',d:'หลักการประเมินและแสดงความไม่แน่นอนของการวัด (type A/B, combined, expanded uncertainty)',o:'JCGM',c:'FR',city:'สำนักเลขาที่ BIPM',dom:[0]},
{id:'its90',n:'ITS-90 (สเกลอุณหภูมิสากล ค.ศ. 1990)',d:'สเกลอ้างอิงของ °C และ K ที่ใช้นิยามเส้นโค้งของ RTD และเทอร์โมคัปเปิล',o:'CIPM / BIPM',c:'FR',city:'Sèvres',dom:[0,1]},
{id:'iso80000',n:'ISO 80000 / IEC 80000',d:'ปริมาณและหน่วย (ชุดหลายส่วน) และกฎการใช้สัญลักษณ์ รวมส่วนไฟฟ้า-แม่เหล็ก',o:'ISO และ IEC',c:'CH',city:'เจนีวา',dom:[0]},
{id:'17025',n:'ISO/IEC 17025',d:'ความสามารถของห้องปฏิบัติการทดสอบและสอบเทียบ — พื้นฐานของใบรับรองสอบเทียบที่สอบกลับได้',o:'ISO / IEC',c:'CH',city:'เจนีวา',dom:[0]},
{id:'5725',n:'ISO 5725 (ชุด)',d:'ความถูกต้อง (trueness) และความเที่ยง (precision) ของวิธีและผลการวัด',o:'ISO',c:'CH',city:'เจนีวา',dom:[0,1]},
{id:'60751',n:'IEC 60751',d:'เซนเซอร์อุณหภูมิความต้านทานแพลตตินัมอุตสาหกรรม (Pt100, Pt1000): ตารางค่า R–T และเกรดความคลาด (AA, A, B, C) α = 0.00385 °C⁻¹',o:'IEC',c:'CH',city:'เจนีวา',dom:[1],orig:'ต้นแบบเส้นโค้ง Pt100: มาตรฐาน DIN 43760 ของเยอรมนี → IEC 751 → IEC 60751'},
{id:'din',n:'DIN EN 60751',d:'ฉบับยุโรป/เยอรมนีของ IEC 60751 — ผู้วางรากเส้นโค้ง Pt100 ที่ทั่วโลกใช้',o:'DIN',c:'DE',city:'เบอร์ลิน',dom:[1]},
{id:'60584',n:'IEC 60584-1 / -3',d:'เทอร์โมคัปเปิล: ตารางแรงเคลื่อนไฟฟ้า–อุณหภูมิ ค่าพิกัดความคลาด และสายต่อ (ชนิด K J T E N R S B)',o:'IEC',c:'CH',city:'เจนีวา',dom:[1],orig:'ตัวอักษรชนิด K, J, T ฯลฯ เริ่มจากมาตรฐาน ANSI MC96.1 ของสหรัฐฯ'},
{id:'astm230',n:'ASTM E230 + NIST ITS-90 Thermocouple Database',d:'ตารางอ้างอิง emf–อุณหภูมิของเทอร์โมคัปเปิลมาตรฐาน และฐานข้อมูลสมการพหุนามที่ NIST เผยแพร่',o:'ASTM / NIST',c:'US',city:'West Conshohocken, PA / Gaithersburg, MD',dom:[1]},
{id:'jis',n:'JIS C 1602 / JIS C 1604',d:'เทอร์โมคัปเปิล และเซนเซอร์อุณหภูมิความต้านทาน (ญี่ปุ่น) — พบบ่อยกับอุปกรณ์จากญี่ปุ่น',o:'JISC / JSA',c:'JP',city:'โตเกียว',dom:[1]},
{id:'61298',n:'IEC 61298 / IEC 60770',d:'วิธีประเมินสมรรถนะของอุปกรณ์วัดและควบคุมกระบวนการ/ทรานสมิตเตอร์: ความถูกต้อง ฮิสเทอรีซิส ผลของอุณหภูมิ ฯลฯ',o:'IEC',c:'CH',city:'เจนีวา',dom:[1]},
{id:'oiml',n:'OIML Recommendations (เช่น R 76 เครื่องชั่ง)',d:'ข้อกำหนดมาตรวิทยาทางกฎหมาย: เครื่องชั่ง มิเตอร์ปั๊มน้ำมัน ฯลฯ ที่ใช้ซื้อขาย (เซลล์โหลดเกี่ยวข้องโดยตรง)',o:'OIML',c:'FR',city:'ปารีส',dom:[0,1]},
{id:'60381',n:'IEC 60381-1 / -2',d:'สัญญาณแอนะล็อกสำหรับระบบควบคุมกระบวนการ: กระแสตรง (4–20 mA เป็นหลัก) และแรงดันตรง (เช่น 1–5 V)',o:'IEC',c:'CH',city:'เจนีวา',dom:[2]},
{id:'ne43',n:'NAMUR NE 43',d:'การส่งสัญญาณ "ล้มเหลว" บน 4–20 mA: ช่วงวัด 3.8–20.5 mA, ล้มเหลวที่ ≤ 3.6 mA หรือ ≥ 21 mA',o:'NAMUR (สมาคมผู้ใช้ระบบอัตโนมัติอุตสาหกรรมกระบวนการ)',c:'DE',city:'เยอรมนี',dom:[2]},
{id:'hart',n:'HART',d:'ส่งข้อมูลดิจิทัล (FSK 1200/2200 Hz) ซ้อนบนสาย 4–20 mA — พัฒนาโดย Rosemount ในทศวรรษ 1980',o:'FieldComm Group (ผู้สืบทอดจาก HART Communication Foundation)',c:'US',city:'Austin, TX',dom:[2]},
{id:'modbus',n:'Modbus',d:'โปรโตคอลเรียบง่าย master/slave (RTU/ASCII/TCP) ที่ใช้อ่านเซนเซอร์และมิเตอร์ — เริ่มจาก Modicon ปี ค.ศ. 1979',o:'Modbus Organization',c:'US',city:'สหรัฐอเมริกา',dom:[2]},
{id:'61158',n:'IEC 61158 / IEC 61784',d:'ชุดมาตรฐานฟิลด์บัส/Industrial Ethernet และโปรไฟล์ (รวม PROFIBUS/PROFINET ต้นกำเนิดเยอรมนี, Foundation Fieldbus ต้นกำเนิดสหรัฐฯ)',o:'IEC',c:'CH',city:'เจนีวา',dom:[2]},
{id:'61131',n:'IEC 61131-2 และ -9 (IO-Link)',d:'-2 ข้อกำหนดอุปกรณ์ PLC รวมอินพุต/เอาต์พุต 24 V DC; -9 คือ SDCI หรือ IO-Link สำหรับเซนเซอร์/แอคชูเอเตอร์',o:'IEC',c:'CH',city:'เจนีวา',dom:[2]},
{id:'11898',n:'ISO 11898 (CAN)',d:'บัส CAN สำหรับยานยนต์/อุตสาหกรรม — ต้นแบบพัฒนาโดย Bosch',o:'ISO (ต้นกำเนิด Bosch เยอรมนี)',c:'CH',city:'เจนีวา',dom:[2]},
{id:'1451',n:'IEEE 1451 / ISO/IEC/IEEE 21451',d:'อินเทอร์เฟซทรานสดิวเซอร์อัจฉริยะ: TEDS (Transducer Electronic Data Sheet) ให้เซนเซอร์บอกคุณลักษณะของตัวเองได้',o:'IEEE',c:'US',city:'Piscataway, NJ',dom:[2,1]},
{id:'isa51',n:'ISA-5.1',d:'สัญลักษณ์และแท็กของเครื่องมือวัดบนแผนผัง P&ID (เช่น PT-101, TT-205)',o:'ISA',c:'US',city:'Research Triangle Park, NC',dom:[1,2]},
{id:'61010',n:'IEC 61010-1 / 61010-2-030',d:'ความปลอดภัยของอุปกรณ์ไฟฟ้าสำหรับวัด ควบคุม และห้องปฏิบัติการ รวมประเภทการวัด CAT I–IV',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'60529',n:'IEC 60529 (IP Code)',d:'ระดับการป้องกันฝุ่นและน้ำของตัวเรือน เช่น IP65, IP67',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'60079',n:'IEC 60079 (ชุด Ex)',d:'อุปกรณ์สำหรับบรรยากาศระเบิดได้ เช่น Ex ia (ปลอดภัยในตัว) — ยุโรปมี ATEX, สหรัฐฯ ใช้ NEC/NFPA 70 แบบ Class/Division',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'61508',n:'IEC 61508',d:'ความปลอดภัยเชิงหน้าที่ของระบบ E/E/PE และระดับ SIL สำหรับเซนเซอร์/ทรานสมิตเตอร์ในวงจรความปลอดภัย',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'61000',n:'IEC 61000 (EMC)',d:'ภูมิคุ้มกันและการแผ่รังสีแม่เหล็กไฟฟ้า: ESD (-4-2), EFT (-4-4), เซิร์จ (-4-5) ที่เซนเซอร์ต้องผ่าน',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'60068',n:'IEC 60068 (ชุด)',d:'การทดสอบสภาพแวดล้อม: อุณหภูมิ ความชื้น การสั่นสะเทือน การกระแทก',o:'IEC',c:'CH',city:'เจนีวา',dom:[3]},
{id:'61869',n:'IEC 61869 (ชุด) หม้อแปลงเครื่องวัด',d:'CT/VT: คลาสความแม่น ภาระ (burden) และการอิ่มตัว — เซนเซอร์กระแส/แรงดันของระบบไฟฟ้ากำลัง',o:'IEC',c:'CH',city:'เจนีวา',dom:[4]},
{id:'c5713',n:'IEEE C57.13',d:'ข้อกำหนดหม้อแปลงเครื่องวัด (CT/VT) ในแนวทางสหรัฐฯ',o:'IEEE',c:'US',city:'Piscataway, NJ',dom:[4]},
{id:'62053',n:'IEC 62053-21 / -22',d:'มิเตอร์พลังงานไฟฟ้ากระแสสลับแบบสถิต: คลาส 0.5, 1, 2 (-21) และ 0.1S, 0.2S, 0.5S (-22)',o:'IEC',c:'CH',city:'เจนีวา',dom:[4]},
{id:'6100030',n:'IEC 61000-4-30',d:'วิธีวัดคุณภาพไฟฟ้า (Class A/S) ที่เครื่องวิเคราะห์กำลังต้องทำตาม',o:'IEC',c:'CH',city:'เจนีวา',dom:[4]},
{id:'ieee519',n:'IEEE 519',d:'ขีดจำกัดฮาร์มอนิกที่จุดต่อร่วม (PCC) — ใช้คู่กับ THD/TDD ที่เซนเซอร์กระแสวัดได้',o:'IEEE',c:'US',city:'Piscataway, NJ',dom:[4]},
{id:'nimt',n:'NIMT — สถาบันมาตรวิทยาแห่งชาติ',d:'ห้องปฏิบัติการมาตรฐานแห่งชาติของไทย เก็บรักษามาตรฐานอ้างอิงและให้บริการสอบเทียบที่สอบกลับได้ต่อ SI',o:'สถาบันมาตรวิทยาแห่งชาติ (NIMT)',c:'TH',city:'ปทุมธานี',dom:[0,5]},
{id:'tis',n:'มอก. (TIS)',d:'มาตรฐานผลิตภัณฑ์อุตสาหกรรมของไทย มีทั้งที่รับมาตรฐานสากลมาใช้ เช่น ชุด 17025',o:'สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม (สมอ.)',c:'TH',city:'กรุงเทพฯ',dom:[0,5]},
{id:'eit',n:'มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย',d:'แนวทางติดตั้งไฟฟ้าในอาคาร จัดทำโดย วสท. อ้างอิง IEC 60364 เป็นหลัก — เกี่ยวกับการติดตั้งเซนเซอร์/ตู้ควบคุม',o:'สภาวิศวกร/วสท. (EIT)',c:'TH',city:'กรุงเทพฯ',dom:[3,5]}
];
var SEL={
 'RTD / Pt100':['60751','din','its90','61298','17025'],
 'เทอร์โมคัปเปิล':['60584','astm230','its90','jis','17025'],
 'ทรานสมิตเตอร์ (ความดัน อัตราไหล ระดับ)':['61298','60381','ne43','hart','60079','61508','60529','isa51'],
 'โหลดเซลล์ / เครื่องชั่ง':['oiml','17025','60529','61000'],
 'เซนเซอร์กระแส/แรงดัน (CT, Hall, Rogowski)':['61869','c5713','61010','61000','62053'],
 'เซนเซอร์อัจฉริยะ / IoT / ฟิลด์บัส':['1451','61131','modbus','61158','11898','hart'],
 'มิเตอร์พลังงาน / คุณภาพไฟฟ้า':['62053','6100030','ieee519','61010','61869']
};
var fd=-1,fc='';
function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild}
function card(s){
  return '<div class="sx-sc"><b>'+s.n+'</b><div>'+s.d+'</div>'+(s.orig?'<div style="color:var(--acc2);font-size:14px">⟲ '+s.orig+'</div>':'')+
  '<div class="sx-meta"><span class="sx-tag">'+s.c+'</span> '+C[s.c]+' · '+s.city+' · '+s.o+'</div></div>';
}
var list=$('std-list');
if(list){
  var fdb=$('std-dom'),fcb=$('std-cty');
  function btns(box,arr,get,set){box.innerHTML='';arr.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x.t;b.setAttribute('aria-pressed',get()===x.v);b.onclick=function(){set(x.v);render()};box.appendChild(b)})}
  function render(){
    btns(fdb,[{t:'ทุกหมวด',v:-1}].concat(DOM.map(function(d,i){return {t:d,v:i}})),function(){return fd},function(v){fd=v});
    var cs=Object.keys(C);btns(fcb,[{t:'ทุกประเทศ',v:''}].concat(cs.map(function(c){return {t:C[c]+' ('+c+')',v:c}})),function(){return fc},function(v){fc=v});
    var q=($('std-q').value||'').toLowerCase();
    var r=S.filter(function(s){return (fd<0||s.dom.indexOf(fd)>=0)&&(!fc||s.c===fc)&&(!q||(s.n+' '+s.d+' '+s.o).toLowerCase().indexOf(q)>=0)});
    list.innerHTML=r.map(card).join('')||'<p>ไม่พบรายการที่ตรงเงื่อนไข</p>';
    list.style.cssText='display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))';
    var cnt={};S.forEach(function(s){cnt[s.c]=(cnt[s.c]||0)+1});
    $('std-count').textContent='แสดง '+r.length+' จาก '+S.length+' รายการ · จำนวนตามประเทศต้นแบบในตารางนี้: '+Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]}).map(function(c){return C[c]+' '+cnt[c]}).join(', ');
  }
  $('std-q').oninput=render;render();
}
var ss=$('sel-sensor');
if(ss){
  Object.keys(SEL).forEach(function(k){var o=document.createElement('option');o.textContent=k;ss.appendChild(o)});
  function ru(){var ids=SEL[ss.value];var by={};S.forEach(function(s){by[s.id]=s});$('sel-out').innerHTML=ids.map(function(i){return by[i]?card(by[i]):''}).join('');$('sel-out').style.cssText='display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:10px'}
  ss.onchange=ru;ru();
}
/* live-zero bar */
var lz=$('lz-slider');
if(lz){
  function up(){var i=parseFloat(lz.value);$('lz-v').textContent=i.toFixed(1)+' mA';
   var z=i<=3.6?'สัญญาณล้มเหลว (≤ 3.6)':i<3.8?'ไม่นิยาม':i<4?'under-range':i<=20?'ช่วงวัดปกติ (4–20): '+((i-4)/16*100).toFixed(1)+' %':i<=20.5?'over-range':i<21?'ไม่นิยาม':'สัญญาณล้มเหลว (≥ 21)';
   $('lz-z').textContent=z;$('lz-m').setAttribute('x',(30+(i/24)*540).toFixed(1))}
  lz.oninput=up;up();
}
})();
