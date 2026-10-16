(() => {
  const D = window.SERIE_A_DATA;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const teams = Object.keys(D.meta).sort((a,b) => D.meta[a].position - D.meta[b].position);
  const homeSel = $('#homeTeam'), awaySel = $('#awayTeam');
  let view = 'general';

  const fmt = {
    pct: v => v == null ? '—' : `${(v*100).toFixed(v*100 % 1 === 0 ? 0 : 1)}%`,
    n1: v => v == null ? '—' : Number(v).toFixed(1),
    n2: v => v == null ? '—' : Number(v).toFixed(2),
    signed1: v => v == null ? '—' : `${v>0?'+':''}${Number(v).toFixed(1)}`,
    score: v => v == null ? '—' : String(Math.round(v))
  };

  const clean = s => (s || '').replace(/SegnaCasa\s*/i,'').replace(/SegnaTrasferta\s*/i,'').replace(/Multigoal\s*/i,'').replace(/totale\s*/i,'').replace(/Casa\s*/i,'').replace(/Trasferta\s*/i,'').trim();
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
  function renderMatch(){
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

  function confClass(v){ return v>=.70?'conf-high':v>=.58?'conf-mid':'conf-low'; }
  function market(label,value,conf,emph=false){
    return `<div class="market ${emph?'market-emph':''}"><span class="market-label">${label}</span><strong>${value||'—'}</strong>${conf!=null?`<span class="confidence ${confClass(conf)}">${fmt.pct(conf)}</span>`:''}</div>`;
  }
  function renderPredictions(){
    const sel=$('#predictionRound');
    const rounds=(D.predictionRounds||[]).slice().sort((a,b)=>b-a);
    if(!sel.options.length){ sel.innerHTML=rounds.map(r=>`<option value="${r}">Giornata ${r}</option>`).join(''); }
    const round=Number(sel.value || rounds[0]);
    const list=(D.predictions||[]).filter(p=>p.round===round);
    $('#predictionGrid').innerHTML=list.map(p=>{
      const score=(p.scoreHome==null||p.scoreAway==null)?'—':`${Math.round(p.scoreHome)}-${Math.round(p.scoreAway)}`;
      return `<article class="prediction-card card">
        <div class="prediction-head"><div><span class="round-tag">G${p.round}</span><h3>${p.home} <span>vs</span> ${p.away}</h3></div><button class="compare-btn" data-home="${p.home}" data-away="${p.away}">Confronta dati</button></div>
        <div class="primary-markets">
          ${market('1X2 modello',p.oneXtwo,p.oneXtwoConf,true)}
          ${market('1X2 Poisson',p.poisson,p.poissonConf,true)}
          ${market('Doppia chance',p.doubleChance,p.doubleChanceConf)}
          ${market('Gol / No Gol',p.btts,p.bttsConf)}
          ${market('U/O 2,5',p.uo25,p.uo25Conf)}
          ${market('Score',score,p.scoreConf)}
        </div>
        <details>
          <summary>Altri mercati e dati attesi</summary>
          <div class="details-grid">
            ${market('Doppia chance Poisson',p.doubleChancePoisson,p.doubleChancePoissonConf)}
            ${market('U/O 1,5',p.uo15,p.uo15Conf)}
            ${market('U/O 3,5',p.uo35,p.uo35Conf)}
            ${market(`${p.home} segna`,clean(p.scoreHomeYN),p.scoreHomeYNConf)}
            ${market(`${p.away} segna`,clean(p.scoreAwayYN),p.scoreAwayYNConf)}
            ${market('Multigol totale',clean(p.multiTotal),p.multiTotalConf)}
            ${market(`Multigol ${p.home}`,clean(p.multiHome),p.multiHomeConf)}
            ${market(`Multigol ${p.away}`,clean(p.multiAway),p.multiAwayConf)}
          </div>
          <div class="expected-box">
            <div><span>Gol attesi</span><strong>${fmt.n2(p.xgHome)} – ${fmt.n2(p.xgAway)}</strong></div>
            <div><span>Tiri attesi</span><strong>${fmt.n1(p.shotsHome)} – ${fmt.n1(p.shotsAway)}</strong></div>
            <div><span>Tiri in porta attesi</span><strong>${fmt.n1(p.sotHome)} – ${fmt.n1(p.sotAway)}</strong></div>
          </div>
        </details>
      </article>`;
    }).join('') || '<div class="empty">Nessun pronostico salvato per questa giornata.</div>';
    $$('.compare-btn').forEach(b=>b.addEventListener('click',()=>{
      homeSel.value=b.dataset.home; awaySel.value=b.dataset.away; renderMatch(); showPage('match'); window.scrollTo({top:0,behavior:'smooth'});
    }));
  }

  function formBadge(g){ return g.win?'V':g.draw?'N':'P'; }
  function renderStandings(){
    const rows=teams.map(team=>{
      const games=allGames(team), a=aggregate(games), m=D.meta[team];
      const gf=games.reduce((s,g)=>s+g.gf,0), ga=games.reduce((s,g)=>s+g.ga,0), gd=gf-ga;
      const form=games.slice(-5).map(g=>`<span class="form-dot ${g.win?'w':g.draw?'d':'l'}">${formBadge(g)}</span>`).join('');
      return {team,m,games,a,gf,ga,gd,form};
    }).sort((a,b)=>a.m.position-b.m.position);
    $('#standingsBody').innerHTML=rows.map(r=>`<tr>
      <td class="pos">${r.m.position}</td><td class="team-name">${r.team}</td><td>${r.m.played}</td><td class="points">${r.m.points}</td>
      <td>${Math.round(r.a.winPct*r.a.games)}</td><td>${Math.round(r.a.drawPct*r.a.games)}</td><td>${Math.round(r.a.lossPct*r.a.games)}</td>
      <td>${r.gf}</td><td>${r.ga}</td><td class="${r.gd>0?'pos-gd':r.gd<0?'neg-gd':''}">${r.gd>0?'+':''}${r.gd}</td><td><div class="form">${r.form}</div></td>
    </tr>`).join('');
  }

  function showPage(page){
    $$('.page').forEach(p=>p.classList.remove('active'));
    $(`#page-${page}`).classList.add('active');
    $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    if(page==='predictions') renderPredictions();
    if(page==='standings') renderStandings();
  }

  homeSel.addEventListener('change',renderMatch); awaySel.addEventListener('change',renderMatch);
  $$('.tab').forEach(b=>b.addEventListener('click',()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); view=b.dataset.view; renderMatch(); }));
  $$('.nav-btn').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  $('#predictionRound').addEventListener('change',renderPredictions);

  renderMatch();
  renderStandings();
})();
