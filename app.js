(() => {
  const D = window.SERIE_A_DATA;
  const teams = Object.keys(D.meta).sort((a,b) => D.meta[a].position - D.meta[b].position);
  const $ = s => document.querySelector(s);
  const homeSel = $('#homeTeam'), awaySel = $('#awayTeam');
  let view = 'general';

  const fmt = {
    pct: v => v == null ? '—' : `${(v*100).toFixed(v*100 % 1 === 0 ? 0 : 1)}%`,
    n1: v => v == null ? '—' : Number(v).toFixed(1),
    n2: v => v == null ? '—' : Number(v).toFixed(2),
    signed1: v => v == null ? '—' : `${v>0?'+':''}${Number(v).toFixed(1)}`
  };

  const groups = [
    {title:'Risultati', metrics:[
      ['winPct','Vittorie','pct','high'],['drawPct','Pareggi','pct','neutral'],['lossPct','Sconfitte','pct','low'],['possession','Possesso medio','pct','neutral']
    ]},
    {title:'Gol', metrics:[
      ['gf','Gol fatti / partita','n2','high'],['ga','Gol subiti / partita','n2','low'],['cleanSheet','Clean sheet','pct','high'],['scored1','Segna almeno 1 gol','pct','high'],['scored2','Segna almeno 2 gol','pct','high']
    ]},
    {title:'Tiri', metrics:[
      ['shots','Tiri / partita','n1','neutral'],['shotsAgainst','Tiri subiti / partita','n1','low'],['shotsDiff','Differenza tiri','signed1','high'],
      ['sot','Tiri in porta / partita','n1','high'],['sotAgainst','Tiri in porta subiti','n1','low'],['sotDiff','Differenza tiri in porta','signed1','high'],
      ['conversion','Conversione tiri → gol','pct','high'],['sotShare','Quota tiri in porta','pct','high']
    ]},
    {title:'Angoli', metrics:[
      ['corners','Angoli / partita','n1','neutral'],['cornersAgainst','Angoli concessi','n1','low'],['cornersDiff','Differenza angoli','signed1','high']
    ]},
    {title:'Disciplina', metrics:[
      ['yellow','Gialli / partita','n2','neutral'],['oppYellow','Gialli avversari','n2','neutral'],['red','Rossi / partita','n2','neutral'],['oppRed','Rossi avversari','n2','neutral']
    ]}
  ];

  function aggregate(arr){
    const n = arr.length; if(!n) return {games:0};
    const sum = k => arr.reduce((a,x)=>a+(+x[k]||0),0), avg = k => sum(k)/n;
    const sSot=sum('sot'), sSotA=sum('sotAgainst'), shots=sum('shots');
    return {games:n,winPct:sum('win')/n,drawPct:sum('draw')/n,lossPct:sum('loss')/n,possession:avg('possession'),
      gf:avg('gf'),ga:avg('ga'),shots:avg('shots'),shotsAgainst:avg('shotsAgainst'),shotsDiff:avg('shots')-avg('shotsAgainst'),
      sot:avg('sot'),sotAgainst:avg('sotAgainst'),sotDiff:avg('sot')-avg('sotAgainst'),conversion:shots?sum('gf')/shots:0,
      sotShare:(sSot+sSotA)?sSot/(sSot+sSotA):0,cleanSheet:arr.filter(x=>x.ga===0).length/n,
      scored1:arr.filter(x=>x.gf>=1).length/n,scored2:arr.filter(x=>x.gf>=2).length/n,corners:avg('corners'),
      cornersAgainst:avg('cornersAgainst'),cornersDiff:avg('corners')-avg('cornersAgainst'),yellow:avg('yellow'),oppYellow:avg('oppYellow'),red:avg('red'),oppRed:avg('oppRed')};
  }
  const allGames = team => D.games.filter(g=>g.team===team).sort((a,b)=>a.round-b.round);
  function getData(team, opponent, isHome){
    const arr=allGames(team), targetLevel=D.meta[opponent].level;
    if(view==='general') return aggregate(arr);
    if(view==='last5') return aggregate(arr.slice(-5));
    if(view==='venue5') return aggregate(arr.filter(g=>g.venue===(isHome?'Casa':'Trasferta')).slice(-5));
    return aggregate(arr.filter(g=>g.oppLevel===targetLevel));
  }
  function isBetter(a,b,dir){
    if(dir==='neutral'||a==null||b==null||Math.abs(a-b)<1e-9) return [false,false];
    return dir==='high' ? [a>b,b>a] : [a<b,b<a];
  }
  function opt(team){ return `<option value="${team}">${team}</option>`; }
  homeSel.innerHTML=teams.map(opt).join(''); awaySel.innerHTML=teams.map(opt).join('');
  homeSel.value = teams.includes('Monza') ? 'Monza' : teams[0];
  awaySel.value = teams.includes('Cagliari') ? 'Cagliari' : teams[1];
  $('#snapshot').textContent=`Snapshot Excel • dati fino alla giornata ${D.lastRound}`;

  function metaLine(team){ const m=D.meta[team]; return `<strong>${m.position}°</strong> • ${m.points} pt • ${m.played} giocate • livello ${m.level}`; }
  function render(){
    let home=homeSel.value, away=awaySel.value;
    if(home===away){ away=teams.find(t=>t!==home); awaySel.value=away; }
    $('#homeMeta').innerHTML=metaLine(home); $('#awayMeta').innerHTML=metaLine(away);
    const H=getData(home,away,true), A=getData(away,home,false);
    const labels={
      general:['Andamento generale','Tutte le partite giocate nello snapshot.'],
      last5:['Forma recente','Ultime 5 gare, senza distinzione casa/trasferta.'],
      venue5:['Casa / Fuori',`${home}: ultime gare in casa • ${away}: ultime gare in trasferta.`],
      level:['Livello avversario',`${home} contro squadre di livello ${D.meta[away].level} • ${away} contro squadre di livello ${D.meta[home].level}.`]
    };
    $('#contextTitle').textContent=labels[view][0]; $('#contextNote').textContent=labels[view][1];
    $('#sampleInfo').textContent=`${home} ${H.games} • ${away} ${A.games}`;
    if(!H.games && !A.games){ $('#comparison').innerHTML='<div class="empty">Nessun dato disponibile per questo confronto.</div>'; return; }
    $('#comparison').innerHTML=groups.map(g=>{
      const rows=g.metrics.map(([key,label,kind,dir])=>{
        const hv=H.games?H[key]:null, av=A.games?A[key]:null, [hb,ab]=isBetter(hv,av,dir);
        return `<div class="metric-row"><div class="metric-value home ${hb?'better':''}"><span>${fmt[kind](hv)}</span></div><div class="metric-label">${label}</div><div class="metric-value away ${ab?'better':''}"><span>${fmt[kind](av)}</span></div></div>`;
      }).join('');
      return `<div class="metric-group"><div class="group-title">${g.title}</div><div class="metric-list">${rows}</div></div>`;
    }).join('');
  }
  homeSel.addEventListener('change',render); awaySel.addEventListener('change',render);
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');view=b.dataset.view;render();}));
  render();
})();
