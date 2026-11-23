/* SOUND: key sounds, WebAudio only, no audio files.  Ported verbatim from legacy/src/app3.js (no tests). */
import { S } from "./state";

/* ---- key sounds: WebAudio only, no audio files. No steady tones anywhere: a steady sine reads as a beep. ---- */
export let actx:any=null,nbuf:any=null,mgain:any=null;
export function audio(){
  if(!actx){const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return null;
    try{actx=new C({latencyHint:"interactive"})}catch(e){actx=new C()}
    mgain=actx.createGain();mgain.gain.value=.5;
    const comp=actx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;comp.attack.value=.001;comp.release.value=.05;
    mgain.connect(comp);comp.connect(actx.destination);
    nbuf=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(actx.state==="suspended")actx.resume();return actx;
}
export const jit=(x?:any,p?:any)=>x*(1+(Math.random()*2-1)*p);
/* gain envelope: 1.5 ms attack, exponential decay */
export function env(t?:any,dur?:any,vol?:any){const g=actx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.0015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(mgain);return g}
/* filtered noise from a random slice of a 1 s buffer, so no two presses are identical */
export function noise(type?:any,f?:any,q?:any,dur?:any,vol?:any,t?:any){const s=actx.createBufferSource(),fl=actx.createBiquadFilter();s.buffer=nbuf;fl.type=type;fl.frequency.value=f;fl.Q.value=q;s.connect(fl);fl.connect(env(t,dur,vol));s.start(t,Math.random()*.8,dur+.02)}
/* the body of a key: a sine that falls fast in pitch, heard as a short thud, never as a beep */
export function knock(f0?:any,f1?:any,dur?:any,vol?:any,t?:any){const o=actx.createOscillator();o.type="sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.8);o.connect(env(t,dur,vol));o.start(t);o.stop(t+dur+.02)}
export const KEYPACKS:any={
  soft:(sp?:any,t?:any)=>{noise("lowpass",jit(sp?900:1300,.08),.6,sp?.045:.03,sp?.6:.5,t);knock(jit(sp?150:190,.06),70,sp?.05:.035,.24,t)},
  /* creamy: lubed linear switches. Deep muffled thock, almost no high click, a soft release a moment later */
  cream:(sp?:any,t?:any)=>{knock(jit(sp?150:205,.05),sp?70:95,sp?.07:.045,jit(sp?.34:.28,.12),t);noise("bandpass",jit(sp?260:380,.06),2.2,sp?.07:.05,jit(sp?.42:.34,.12),t);noise("bandpass",jit(sp?850:1150,.08),1.2,sp?.024:.018,jit(.2,.15),t+.001);noise("lowpass",2400,.7,.006,.07,t);const r=t+jit(sp?.11:.085,.15);noise("bandpass",jit(sp?1000:1450,.08),1.5,.012,jit(.07,.2),r);knock(jit(sp?220:300,.06),sp?140:180,.014,.04,r)},
  click:(sp?:any,t?:any)=>{noise("highpass",jit(3200,.1),.5,.004,.35,t);noise("bandpass",jit(sp?1500:2300,.08),3,sp?.04:.028,.22,t+.002);knock(jit(sp?170:240,.06),90,sp?.05:.035,.18,t+.001)},
  type:(sp?:any,t?:any)=>{noise("highpass",jit(2600,.1),.6,.006,.4,t);noise("bandpass",jit(sp?700:1100,.08),6,sp?.06:.04,.25,t+.003);noise("lowpass",jit(500,.1),.7,sp?.07:.05,.3,t+.004)}
};
/* a short burst of keys, to preview a pack in Settings and in the welcome */
export function soundPreview(pk?:any){
  if(!KEYPACKS[pk])return;
  try{const a=audio();if(!a)return;let t=a.currentTime+.02;
    [0,0,0,1,0,0].forEach(sp=>{KEYPACKS[pk](!!sp,t);t+=.1+Math.random()*.05});
  }catch(e){}
}
export function keySound(kind?:any){
  const pk=S.settings.soundPack;if(!pk||pk==="off"||!KEYPACKS[pk])return;
  try{const a=audio();if(!a)return;const t=a.currentTime+.001;
    if(kind==="error"){noise("lowpass",jit(320,.05),.7,.06,.26,t);knock(jit(120,.04),60,.05,.12,t);return}
    KEYPACKS[pk](kind==="space",t);
  }catch(e){}
}
/* test hook (legacy App.snd.use): inject a fake AudioContext / master gain / noise buffer */
export const sndTest = { KEYPACKS, noise, knock, jit, use: (c: any, g: any, b: any) => { actx = c; mgain = g; nbuf = b; } };
