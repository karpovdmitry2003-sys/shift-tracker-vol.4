const KEY='shiftTrackerV3';
const $=i=>document.getElementById(i);
let db=JSON.parse(localStorage.getItem(KEY)||'{"history":[],"active":null}');

db.history=(db.history||[]).map(s=>({note:'',...s}));

function save(){localStorage.setItem(KEY,JSON.stringify(db));}
function now(){return new Date().toISOString()}
function ms(v){const m=Math.floor(v/60000);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function sumBreaks(arr){return (arr||[]).reduce((a,b)=>a+(new Date(b.end)-new Date(b.start)),0)}

$('month').value=new Date().toISOString().slice(0,7);

startShift.onclick=()=>{if(db.active)return;db.active={id:crypto.randomUUID(),start:now(),breaks:[],activeBreak:null};save();render();};
startBreak.onclick=()=>{if(db.active&&!db.active.activeBreak){db.active.activeBreak=now();save();render();}};
endBreak.onclick=()=>{if(db.active?.activeBreak){db.active.breaks.push({start:db.active.activeBreak,end:now()});db.active.activeBreak=null;save();render();}};
endShift.onclick=()=>{
if(!db.active)return;
if(db.active.activeBreak){db.active.breaks.push({start:db.active.activeBreak,end:now()});}
db.history.push({...db.active,end:now(),note:$('shiftNote').value||''});
db.active=null;$('shiftNote').value='';save();render();
};

document.querySelectorAll('.qb').forEach(b=>b.onclick=()=>{
if(!db.active)return;
const m=+b.dataset.m;
const end=new Date(); const start=new Date(end.getTime()-m*60000);
db.active.breaks.push({start:start.toISOString(),end:end.toISOString()});
save();render();
});

exportBtn.onclick=()=>{
const a=document.createElement('a');
a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));
a.download='shift-backup.json';a.click();
};

importFile.onchange=e=>{
const f=e.target.files[0]; if(!f)return;
const r=new FileReader();
r.onload=()=>{db=JSON.parse(r.result);save();render();};
r.readAsText(f);
};

function render(){
unfinishedAlert.hidden=!db.active;
let total=0;
const month=$('month').value;
const data=db.history.filter(x=>x.start.startsWith(month)).reverse();

history.innerHTML=data.map(s=>{
const w=(new Date(s.end)-new Date(s.start))-sumBreaks(s.breaks);
total+=w;
return `<div class="item"><b>${new Date(s.start).toLocaleDateString()}</b><br>Работа: ${ms(w)}<br>${s.note||''}</div>`;
}).join('');

summary.textContent=`Смен: ${data.length} · Часов: ${ms(total)}`;

const weeks={};
data.forEach(s=>{
const d=new Date(s.start); const monday=new Date(d);
monday.setDate(d.getDate()-((d.getDay()+6)%7));
const k=monday.toISOString().slice(0,10);
const w=(new Date(s.end)-new Date(s.start))-sumBreaks(s.breaks);
weeks[k]??={shifts:0,work:0}; weeks[k].shifts++; weeks[k].work+=w;
});
weeklyStats.innerHTML=Object.entries(weeks).map(([k,v])=>`<div>${k}: ${v.shifts} смен, ${ms(v.work)}</div>`).join('');

if(db.active){
let sh=new Date()-new Date(db.active.start);
let br=sumBreaks(db.active.breaks);
if(db.active.activeBreak) br+=new Date()-new Date(db.active.activeBreak);
status.textContent='Смена идёт';
shift.textContent=ms(sh); breaks.textContent=ms(br); work.textContent=ms(sh-br);
}
save();
}
month.onchange=render;
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js')}
setInterval(render,1000);render();