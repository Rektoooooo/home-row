/* SHARE CARD + LOGO geometry.  Ported verbatim from legacy/src/app9.js (logo) and app10.js (canvas drawing). No tests. */
import { S, C } from "./state";
import { dateKey } from "./stats";
import { t as tr, speed, speedUnit, pct, monthShort } from "@/i18n";
import { POOL_NAME, poolName } from "./generate";
import { mondayOf, weekStats } from "./rewards";

export const LOGO_F="M-4-8V4M-4-8h8M-4-2.5h6.5",LOGO_J="M3.5-8v8a3.75 3.75 0 0 1-7.5 0";
export const LOGO_KEYS:any[]=[[21,25,-8,LOGO_F],[43,36,6,LOGO_J]]; /* [centre x, centre y, tilt in degrees, letter] */
export const LOGO_INK="#161A26",LOGO_EDGE="#9C9486",LOGO_BUMP="#F5A524",LOGO_GAP="#1B1F2E";
export let logoN=0;
export function logoBody(g?:any){
  const key=(k?:any,i?:any)=>'<g transform="translate('+k[0]+' '+k[1]+') rotate('+k[2]+')">'+(i?'<rect x="-15.75" y="-15.75" width="31.5" height="35.5" rx="8.75" fill="'+LOGO_GAP+'"/>':'')+
    '<rect x="-14" y="-10" width="28" height="28" rx="7" fill="'+LOGO_EDGE+'"/><rect x="-14" y="-14" width="28" height="28" rx="7" fill="url(#'+g+'c)"/>'+
    '<path d="'+k[3]+'" fill="none" stroke="'+LOGO_INK+'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="-4" y="6.6" width="8" height="2.4" rx="1.2" fill="'+LOGO_BUMP+'"/></g>';
  return '<defs><linearGradient id="'+g+'t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3147"/><stop offset="1" stop-color="#0C0F18"/></linearGradient>'+
    '<linearGradient id="'+g+'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3DED3"/></linearGradient></defs>'+
    '<rect width="64" height="64" rx="15" fill="url(#'+g+'t)"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>'+LOGO_KEYS.map(key).join("");
}
export function logoSVG(size?:any){return '<svg class="logo" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+logoBody("lg"+(++logoN))+'</svg>'}
export function addFavicon(){
  if(document.head.querySelector('link[rel~="icon"]'))return;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+logoBody("f")+'</svg>';
  const l=document.createElement("link");l.rel="icon";l.type="image/svg+xml";l.href="data:image/svg+xml,"+encodeURIComponent(svg);document.head.appendChild(l);
}
export const SW=1200,SH=630;
export function rrect(c?:any,x?:any,y?:any,w?:any,h?:any,r?:any){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
/* the logo on a canvas: same geometry as logoSVG (64 unit grid) */
export function drawLogo(c?:any,x?:any,y?:any,s?:any){
  c.save();c.translate(x,y);c.scale(s/64,s/64);
  const t=c.createLinearGradient(0,0,64,64);t.addColorStop(0,"#2B3147");t.addColorStop(1,"#0C0F18");
  rrect(c,0,0,64,64,15);c.fillStyle=t;c.fill();c.strokeStyle="rgba(255,255,255,.14)";c.lineWidth=1.5;rrect(c,.75,.75,62.5,62.5,14.25);c.stroke();
  LOGO_KEYS.forEach(([cx,cy,a,p],i)=>{
    c.save();c.translate(cx,cy);c.rotate(a*Math.PI/180);
    if(i){rrect(c,-15.75,-15.75,31.5,35.5,8.75);c.fillStyle=LOGO_GAP;c.fill()}
    rrect(c,-14,-10,28,28,7);c.fillStyle=LOGO_EDGE;c.fill();
    const f=c.createLinearGradient(0,-14,0,14);f.addColorStop(0,"#FFFFFF");f.addColorStop(1,"#E3DED3");rrect(c,-14,-14,28,28,7);c.fillStyle=f;c.fill();
    c.strokeStyle=LOGO_INK;c.lineWidth=3.2;c.lineCap="round";c.lineJoin="round";c.stroke(new Path2D(p));
    rrect(c,-4,6.6,8,2.4,1.2);c.fillStyle=LOGO_BUMP;c.fill();
    c.restore();
  });
  c.restore();
}
/* a big 3D keycap with a glowing home bump */
export function drawKey(c?:any,x?:any,y?:any,s?:any,ch?:any,ang?:any,disp?:any){
  const h=s*.9,r=s*.2;
  c.save();c.translate(x,y);c.rotate(ang);
  c.save();c.shadowColor="rgba(0,0,0,.6)";c.shadowBlur=60;c.shadowOffsetY=30;rrect(c,-s/2,-h/2+s*.08,s,h,r);c.fillStyle="#8F887B";c.fill();c.restore();
  const f=c.createLinearGradient(0,-h/2,0,h/2);f.addColorStop(0,"#FFFFFF");f.addColorStop(1,"#E2DCCF");rrect(c,-s/2,-h/2,s,h,r);c.fillStyle=f;c.fill();
  const d=c.createLinearGradient(0,-h/2,0,h/2);d.addColorStop(0,"rgba(0,0,0,0)");d.addColorStop(1,"rgba(0,0,0,.07)");rrect(c,-s/2+s*.09,-h/2+s*.07,s-s*.18,h-s*.17,r*.75);c.fillStyle=d;c.fill();
  c.fillStyle=LOGO_INK;c.font="800 "+Math.round(s*.44)+"px "+disp;c.textAlign="center";c.textBaseline="middle";c.fillText(ch,0,-s*.06);
  c.save();c.shadowColor="rgba(255,176,59,.95)";c.shadowBlur=s*.12;rrect(c,-s*.15,s*.2,s*.3,s*.06,s*.03);c.fillStyle=LOGO_BUMP;c.fill();c.restore();
  c.restore();
}
/* o={kind:"test"|"week", big, unit, items:[[label,value]], tag}. One premium dark look in every theme. */
export async function drawShareCard(o?:any,quick?:boolean){
  const cs=getComputedStyle(document.documentElement),disp=cs.getPropertyValue("--font-display").trim(),mono=cs.getPropertyValue("--font-mono").trim();
  if(!quick)try{await document.fonts.ready;await Promise.all(["800 250px ","800 86px ","700 34px ","700 30px ","700 52px "].map(f=>document.fonts.load(f+disp)).concat(["600 18px ","600 15px "].map(f=>document.fonts.load(f+mono))))}catch(e){}
  const cv=document.createElement("canvas");cv.width=SW;cv.height=SH;const c:any=cv.getContext("2d"),M=72;
  const ls=(px?:any)=>{if("letterSpacing" in c)c.letterSpacing=px+"px"};
  /* background: deep indigo, finger-colour glows, a faint dot grid */
  const bg=c.createLinearGradient(0,0,SW,SH);bg.addColorStop(0,"#0A0D18");bg.addColorStop(1,"#17113A");c.fillStyle=bg;c.fillRect(0,0,SW,SH);
  const glow=(x?:any,y?:any,r?:any,col?:any)=>{const q=c.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,col);q.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=q;c.fillRect(0,0,SW,SH)};
  glow(1010,40,560,"rgba(124,77,219,.55)");glow(90,660,480,"rgba(13,143,132,.42)");glow(960,600,380,"rgba(47,111,224,.30)");glow(330,330,360,"rgba(245,165,36,.13)");
  c.fillStyle="rgba(255,255,255,.045)";for(let y=14;y<SH;y+=28)for(let x=14;x<SW;x+=28){c.beginPath();c.arc(x,y,1.2,0,7);c.fill()}
  /* the F and J keys */
  glow(940,300,270,"rgba(245,165,36,.22)");
  drawKey(c,852,262,196,"F",-.16,disp);drawKey(c,1042,318,196,"J",.12,disp);
  /* top row: logo, wordmark, glass tag */
  drawLogo(c,M,58,64);
  c.textBaseline="alphabetic";c.textAlign="left";ls(0);c.fillStyle="#FFFFFF";c.font="700 34px "+disp;c.fillText("Home Row",M+82,58+44);
  c.font="600 18px "+mono;ls(3);const tg=o.tag.toUpperCase(),tw=c.measureText(tg).width,pw=tw+40,px=SW-M-pw,py=67;
  rrect(c,px,py,pw,46,23);c.fillStyle="rgba(255,255,255,.08)";c.fill();c.strokeStyle="rgba(255,255,255,.18)";c.lineWidth=1.5;c.stroke();
  c.fillStyle="rgba(255,255,255,.92)";c.fillText(tg,px+22,py+30);ls(0);
  /* the big number, glowing */
  c.font="800 250px "+disp;const bx=M-8,by=408,bw=c.measureText(o.big).width;
  c.save();c.shadowColor="rgba(167,139,250,.65)";c.shadowBlur=64;c.fillStyle="#E9E4FF";c.fillText(o.big,bx,by);c.restore();
  const ng=c.createLinearGradient(0,by-190,0,by);ng.addColorStop(0,"#FFFFFF");ng.addColorStop(1,"#C8BCFF");c.fillStyle=ng;c.fillText(o.big,bx,by);
  c.font="700 52px "+disp;c.fillStyle="rgba(255,255,255,.62)";c.fillText(o.unit,bx+bw+22,by);
  /* glass stat chips */
  let x=M;const cy=462,ch=94;
  o.items.forEach((it?:any)=>{
    c.font="600 15px "+mono;ls(2);const lw=c.measureText(it[0].toUpperCase()).width;ls(0);
    c.font="700 30px "+disp;const vw=c.measureText(it[1]).width,w=Math.max(lw,vw)+48;
    if(x+w>SW-M)return;
    rrect(c,x,cy,w,ch,20);c.fillStyle="rgba(255,255,255,.07)";c.fill();c.strokeStyle="rgba(255,255,255,.15)";c.lineWidth=1.5;c.stroke();
    c.fillStyle="rgba(255,255,255,.58)";c.font="600 15px "+mono;ls(2);c.fillText(it[0].toUpperCase(),x+24,cy+35);ls(0);
    c.fillStyle="#FFFFFF";c.font="700 30px "+disp;c.fillText(it[1],x+24,cy+74);
    x+=w+16;
  });
  c.fillStyle="rgba(255,255,255,.42)";c.font="600 15px "+mono;ls(2);c.textAlign="right";c.fillText(tr("TOUCH TYPING · ALL TEN FINGERS"),SW-M,SH-42);ls(0);c.textAlign="left";
  /* glowing finger-colour line */
  const bar=c.createLinearGradient(0,0,SW,0);[["#7C4DDB",0],["#2F6FE0",.34],["#0D8F84",.67],["#F5A524",1]].forEach(([col,p])=>bar.addColorStop(p,col));
  c.save();c.shadowColor="rgba(124,77,219,.85)";c.shadowBlur=26;c.fillStyle=bar;c.fillRect(0,SH-8,SW,8);c.restore();
  return new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error("no blob")),"image/png"));
}
export const longDate=(ts?:any)=>{const d=new Date(ts);return tr("{d} {m} {y}",{d:d.getDate(),m:monthShort(d.getMonth()),mn:d.getMonth()+1,y:d.getFullYear()})};
export function testCard(t?:any){
  const items=[];
  if(t.acc!=null)items.push([tr("Accuracy"),pct(Math.round(t.acc*100)+"%")]);
  items.push([tr("Test"),tr("{dur} s test · {pool}",{dur:t.dur,pool:poolName(t.pool)})],[tr("Date"),longDate(t.ts)]);
  return {kind:"test",big:String(speed(t.wpm)),unit:speedUnit(),tag:tr("Typing test"),items,name:"home-row-"+Math.round(t.wpm)+"-wpm.png",alt:t.acc!=null?tr("Share card: {speed} {unit} at {acc} accuracy",{speed:speed(t.wpm),unit:speedUnit(),acc:pct(Math.round(t.acc*100)+"%")}):tr("Share card: {speed} {unit}",{speed:speed(t.wpm),unit:speedUnit()})};
}
export function weekCard(){
  const mon=mondayOf(new Date()),c=weekStats(mon),items=[];
  if(c.wpm!=null)items.push([tr("Average speed"),speed(c.wpm)+" "+speedUnit()]);
  if(c.acc!=null)items.push([tr("Accuracy"),pct(Math.round(c.acc*100)+"%")]);
  items.push([tr("Week"),tr("Week of {d} {m}",{d:mon.getDate(),m:monthShort(mon.getMonth()),mn:mon.getMonth()+1})]);
  return {kind:"week",big:String(Math.round(c.min)),unit:tr("MIN"),tag:tr("This week"),items,name:"home-row-week-"+dateKey(mon)+".png",alt:tr("Share card: {n} minutes of practice this week",{n:Math.round(c.min)})};
}
export function bestCard(){
  const d=S.settings.tDur,w=C().bests["test"+d]||0,t=C().tests.filter((x?:any)=>x.dur===d).sort((x?:any,y?:any)=>y.wpm-x.wpm)[0];
  return testCard({wpm:w,acc:t?t.acc:null,dur:d,pool:t?t.pool:S.settings.tPool,ts:t?t.ts:Date.now()});
}
