(() => {
  const D = window.SERIE_A_DATA;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const teams = Object.keys(D.meta).sort((a,b) => D.meta[a].position - D.meta[b].position);
  const homeSel = $('#homeTeam'), awaySel = $('#awayTeam');
  const predHomeSel = $('#predictionHomeTeam'), predAwaySel = $('#predictionAwayTeam');
  let view = 'general';

  const fmt = {
    pct: v => v == null ? '—' : `${(v*100).toFixed(v*100 % 1 === 0 ? 0 : 1)}%`,
    n1: v => v == null ? '—' : Number(v).toFixed(1),
    n2: v => v == null ? '—' : Number(v).toFixed(2),
    signed1: v => v == null ? '—' : `${v>0?'+':''}${Number(v).toFixed(1)}`,
    score: v => v == null ? '—' : String(Math.round(v))
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
  const clean = s => (s || '').replace(/SegnaCasa\s*/i,'').replace(/SegnaTrasferta\s*/i,'').replace(/Multigoal\s*/i,'').replace(/totale\s*/i,'').replace(/Casa\s*/i,'').replace(/Trasferta\s*/i,'').trim();
  const groups = [
    {title:'Risultati', metrics:[
      ['winPct','Vittorie','pct','high'],['drawPct','Pareggi','pct','neutral'],['lossPct','Sconfitte','pct','low'],['possession','Possesso medio','pct','neutral']
    ]},
    {title:'Gol', metrics:[
      ['gf','Gol fatti / partita','n2','high'],['ga','Gol subiti / partita','n2','low'],['cleanSheet','Clean sheet','pct','high'],['scored1','Segna almeno 1 gol','pct','high'],['scored2','Segna almeno 2 gol','pct','high']
    ]},
    {title:'Tiri', metrics:[
      ['shots','Tiri / partita','n1','neutral'],['shotsAgainst','Tiri subiti / partita','n1','low'],
      ['sot','Tiri in porta / partita','n1','high'],['sotAgainst','Tiri in porta subiti','n1','low'],
      ['conversion','Conversione tiri → gol','pct','high'],['sotShare','Quota tiri in porta','pct','high']
    ]},
    {title:'Angoli', metrics:[
      ['corners','Angoli / partita','n1','neutral'],['cornersAgainst','Angoli concessi','n1','low']
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
  if(predHomeSel && predAwaySel){
    predHomeSel.innerHTML=teams.map(opt).join(''); predAwaySel.innerHTML=teams.map(opt).join('');
    const fp=(D.predictions||[])[0];
    predHomeSel.value=fp?.home || homeSel.value; predAwaySel.value=fp?.away || awaySel.value;
  }
  $('#snapshot').textContent=`Snapshot Excel • dati fino alla giornata ${D.lastRound}`;

  function metaLine(team){ const m=D.meta[team]; return `<strong>${m.position}°</strong> • ${m.points} pt • ${m.played} giocate • livello ${m.level}`; }
  function nextFixture(team){
    const cal=(D.calendar||[]).filter(x=>+x.round>(+D.lastRound||0) && (x.home===team || x.away===team)).sort((a,b)=>+a.round-+b.round || String(a.date||'').localeCompare(String(b.date||'')));
    const f=cal[0]; if(!f) return null;
    return {round:+f.round,date:f.date||'',opponent:f.home===team?f.away:f.home,venue:f.home===team?'Casa':'Trasferta'};
  }
  function renderNextFixtures(home,away){
    const host=$('#nextFixtures'); if(!host) return;
    const H=nextFixture(home), A=nextFixture(away);
    const round=H?.round || A?.round || null;
    const card=(team,f)=>f?`<div class="next-team"><span>${esc(team)}</span><strong>${f.venue==='Casa'?'vs':'@'} ${esc(f.opponent)}</strong><small>${f.venue}${f.date?` • ${new Date(f.date+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'})}`:''}</small></div>`:`<div class="next-team"><span>${esc(team)}</span><strong>—</strong><small>Calendario non disponibile</small></div>`;
    host.innerHTML=`<div class="next-fixtures-head"><div><div class="kicker">PROSSIMA GIORNATA</div><h3>${round?`Giornata ${round}`:'Prossimo turno'}</h3></div></div><div class="next-fixtures-grid">${card(home,H)}${card(away,A)}</div>`;
  }
  function renderMatch(){
    let home=homeSel.value, away=awaySel.value;
    if(home===away){ away=teams.find(t=>t!==home); awaySel.value=away; }
    $('#homeMeta').innerHTML=metaLine(home); $('#awayMeta').innerHTML=metaLine(away);
    renderNextFixtures(home,away);
    const H=getData(home,away,true), A=getData(away,home,false);
    const labels={
      general:['Dati generali','Tutte le partite giocate nello snapshot.'],
      last5:[H.games===A.games?`Dati ultime ${H.games} gare`:'Dati ultime gare disponibili',`${home}: ultime ${H.games} gare • ${away}: ultime ${A.games} gare`],
      venue5:['Casa / Fuori',`<span class="context-line"><strong>${home}</strong> – Dati ultime ${H.games} gare giocate in casa</span><span class="context-line"><strong>${away}</strong> – Dati ultime ${A.games} gare giocate in trasferta</span>`],
      level:['Livello avversario',`<span class="context-line">Dati <strong>${home}</strong> contro squadre con livello di forza simile a <strong>${away}</strong></span><span class="context-line">Dati <strong>${away}</strong> contro squadre con livello di forza simile a <strong>${home}</strong></span>`]
    };
    $('#contextTitle').textContent=labels[view][0]; $('#contextNote').innerHTML=labels[view][1];
    $('#sampleInfo').textContent=`${home} ${H.games} • ${away} ${A.games}`;
    renderIdeaBox('matchIdeas',home,away);
    if(!H.games && !A.games){ $('#comparison').innerHTML='<div class="empty">Nessun dato disponibile per questo confronto.</div>'; return; }
    $('#comparison').innerHTML=groups.map(g=>{
      const rows=g.metrics.map(([key,label,kind,dir])=>{
        const hv=H.games?H[key]:null, av=A.games?A[key]:null, [hb,ab]=isBetter(hv,av,dir);
        return `<div class="metric-row"><div class="metric-value home ${hb?'better':''}"><span>${fmt[kind](hv)}</span></div><div class="metric-label">${label}</div><div class="metric-value away ${ab?'better':''}"><span>${fmt[kind](av)}</span></div></div>`;
      }).join('');
      return `<div class="metric-group"><div class="group-title">${g.title}</div><div class="metric-list">${rows}</div></div>`;
    }).join('');
  }

  const IDEAS_KEY='serieADataLab.ideas.v1';
  const SLIP_KEY='serieADataLab.slip.v1';
  function loadSlip(){ try { return JSON.parse(localStorage.getItem(SLIP_KEY)||'[]').map(String); } catch(e){ return []; } }
  function saveSlip(ids){ localStorage.setItem(SLIP_KEY,JSON.stringify([...new Set(ids.map(String))])); }
  function removeIdeaEverywhere(id){
    const sid=String(id);
    saveIdeas(loadIdeas().filter(x=>String(x.id)!==sid));
    saveSlip(loadSlip().filter(x=>x!==sid));
  }
  function loadIdeas(){
    try { return JSON.parse(localStorage.getItem(IDEAS_KEY)||'[]'); } catch(e){ return []; }
  }
  function saveIdeas(rows){ localStorage.setItem(IDEAS_KEY,JSON.stringify(rows)); }
  function ideaStatusLabel(v){ return v==='interesting'?'Interessante':v==='discarded'?'Scartata':'Da valutare'; }
  function ideaConfidenceLabel(v){ return v==='high'?'Alta':v==='low'?'Bassa':'Media'; }
  function matchIdeas(home,away){ return loadIdeas().filter(x=>x.home===home && x.away===away); }
  function refreshIdeaViews(){
    if(homeSel?.value && awaySel?.value) renderIdeaBox('matchIdeas',homeSel.value,awaySel.value);
    if(predHomeSel?.value && predAwaySel?.value) renderIdeaBox('predictionIdeas',predHomeSel.value,predAwaySel.value);
    renderCalendar();
    renderIdeasPage();
  }
  function renderIdeaBox(hostId,home,away){
    const host=$(`#${hostId}`); if(!host || !home || !away) return;
    const rows=matchIdeas(home,away).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    host.innerHTML=`<section class="ideas-card card">
      <div class="ideas-head">
        <div><div class="kicker">APPUNTI OPERATIVI</div><h3>Possibili puntate</h3><p>${esc(home)} vs ${esc(away)} · le annotazioni sono condivise tra Dati Match e Pronostici.</p></div>
        <span class="idea-count">${rows.length} ${rows.length===1?'idea':'idee'}</span>
      </div>
      <form class="idea-form">
        <label>Pronostico / mercato<input name="market" required placeholder="Es. Gol, 1X, Over 2,5"></label>
        <label>Quota<input name="odds" type="number" min="1" step="0.01" inputmode="decimal" placeholder="1,75"></label>
        <label>Fiducia<select name="confidence"><option value="high">Alta</option><option value="medium" selected>Media</option><option value="low">Bassa</option></select></label>
        <label>Stato<select name="status"><option value="evaluate">Da valutare</option><option value="interesting">Interessante</option><option value="discarded">Scartata</option></select></label>
        <label class="idea-note">Nota<input name="note" placeholder="Perché potrebbe essere interessante"></label>
        <button class="primary-action idea-save" type="submit">Salva idea</button>
      </form>
      <div class="idea-list">${rows.length?rows.map(x=>`<article class="idea-row ${esc(x.status)}">
        <div class="idea-main"><strong>${esc(x.market)}</strong>${x.odds?`<span class="idea-odds">@ ${Number(x.odds).toFixed(2).replace('.',',')}</span>`:''}<span class="idea-trust ${esc(x.confidence)}">Fiducia ${ideaConfidenceLabel(x.confidence)}</span><span class="idea-status ${esc(x.status)}">${ideaStatusLabel(x.status)}</span></div>
        ${x.note?`<div class="idea-text">${esc(x.note)}</div>`:''}
        <button class="idea-delete" data-id="${esc(x.id)}" type="button" aria-label="Elimina idea">×</button>
      </article>`).join(''):'<div class="idea-empty">Nessuna possibile puntata annotata per questo match.</div>'}</div>
      <div class="idea-local-note">Per ora queste annotazioni restano salvate sul browser. Più avanti verranno sincronizzate nel database.</div>
    </section>`;
    const form=host.querySelector('.idea-form');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(form), market=String(fd.get('market')||'').trim(); if(!market) return;
      const all=loadIdeas(); all.push({id:String(Date.now())+Math.random().toString(16).slice(2),home,away,market,odds:Number(fd.get('odds')||0)||null,confidence:String(fd.get('confidence')||'medium'),status:String(fd.get('status')||'evaluate'),note:String(fd.get('note')||'').trim(),createdAt:Date.now()});
      saveIdeas(all); refreshIdeaViews();
    });
    host.querySelectorAll('.idea-delete').forEach(b=>b.addEventListener('click',()=>{ removeIdeaEverywhere(b.dataset.id); refreshIdeaViews(); }));
  }

  function ideaRound(x){
    const m=(D.calendar||[]).find(g=>g.home===x.home && g.away===x.away);
    return m?.round || null;
  }
  function renderIdeasPage(){
    const allHost=$('#ideasOverview'), slipHost=$('#slipOverview'); if(!allHost || !slipHost) return;
    const all=loadIdeas().slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const validIds=new Set(all.map(x=>String(x.id)));
    let slipIds=loadSlip().filter(id=>validIds.has(String(id)));
    saveSlip(slipIds);
    const slipSet=new Set(slipIds);
    const slip=slipIds.map(id=>all.find(x=>String(x.id)===String(id))).filter(Boolean);
    const odds=slip.map(x=>+x.odds||0);
    const combined=slip.length && odds.every(v=>v>=1) ? odds.reduce((a,b)=>a*b,1) : null;
    slipHost.innerHTML=`<section class="slip-card card"><div class="ideas-page-head"><div><div class="kicker">SCHEDINA IN PREPARAZIONE</div><h3>${slip.length?`${slip.length} ${slip.length===1?'selezione':'selezioni'}`:'Vuota'}</h3><p>Qui raccogli le idee che vuoi valutare insieme. Non modifica ancora il portafoglio.</p></div>${combined?`<div class="slip-odds"><span>Quota combinata</span><strong>${combined.toFixed(2).replace('.',',')}</strong></div>`:''}</div><div class="slip-list">${slip.length?slip.map(x=>`<article class="slip-row"><div><strong>${esc(x.home)} – ${esc(x.away)}</strong><span>${esc(x.market)}${x.odds?` @ ${Number(x.odds).toFixed(2).replace('.',',')}`:''}</span></div><button class="slip-remove" data-id="${esc(x.id)}" type="button">Rimuovi</button></article>`).join(''):'<div class="idea-empty">Nessuna puntata inserita nella schedina.</div>'}</div></section>`;
    allHost.innerHTML=`<section class="all-ideas-card card"><div class="ideas-page-head"><div><div class="kicker">TUTTE LE IDEE</div><h3>Puntate pensate</h3><p>${all.length} ${all.length===1?'annotazione':'annotazioni'} salvate da Dati Match e Pronostici.</p></div><button id="clearAllIdeas" class="ghost-danger" type="button" ${all.length?'':'disabled'}>Cancella tutto</button></div><div class="all-ideas-list">${all.length?all.map(x=>{const r=ideaRound(x);return `<article class="all-idea-row ${esc(x.status)}"><div class="all-idea-top"><div><span class="idea-match">${r?`G${r} • `:''}${esc(x.home)} – ${esc(x.away)}</span><div class="idea-main"><strong>${esc(x.market)}</strong>${x.odds?`<span class="idea-odds">@ ${Number(x.odds).toFixed(2).replace('.',',')}</span>`:''}<span class="idea-trust ${esc(x.confidence)}">Fiducia ${ideaConfidenceLabel(x.confidence)}</span><span class="idea-status ${esc(x.status)}">${ideaStatusLabel(x.status)}</span></div>${x.note?`<div class="idea-text">${esc(x.note)}</div>`:''}</div></div><div class="idea-page-actions"><button data-idea-action="slip" data-id="${esc(x.id)}" ${slipSet.has(String(x.id))?'disabled':''}>${slipSet.has(String(x.id))?'In schedina':'Porta in schedina'}</button><button data-idea-action="match" data-home="${esc(x.home)}" data-away="${esc(x.away)}">Dati Match</button><button data-idea-action="pred" data-home="${esc(x.home)}" data-away="${esc(x.away)}">Pronostici</button><button class="idea-page-delete" data-idea-action="delete" data-id="${esc(x.id)}">Elimina</button></div></article>`}).join(''):'<div class="idea-empty">Non hai ancora annotato possibili puntate.</div>'}</div><div class="idea-local-note">Per ora puntate e schedina restano salvate sul browser del dispositivo.</div></section>`;
    slipHost.querySelectorAll('.slip-remove').forEach(b=>b.addEventListener('click',()=>{saveSlip(loadSlip().filter(id=>id!==String(b.dataset.id)));renderIdeasPage();}));
    allHost.querySelector('#clearAllIdeas')?.addEventListener('click',()=>{if(confirm('Vuoi cancellare tutte le puntate pensate?')){saveIdeas([]);saveSlip([]);refreshIdeaViews();}});
    allHost.querySelectorAll('[data-idea-action="slip"]').forEach(b=>b.addEventListener('click',()=>{const ids=loadSlip();if(!ids.includes(String(b.dataset.id)))ids.push(String(b.dataset.id));saveSlip(ids);renderIdeasPage();renderCalendar();}));
    allHost.querySelectorAll('[data-idea-action="delete"]').forEach(b=>b.addEventListener('click',()=>{removeIdeaEverywhere(b.dataset.id);refreshIdeaViews();}));
    allHost.querySelectorAll('[data-idea-action="match"]').forEach(b=>b.addEventListener('click',()=>{homeSel.value=b.dataset.home;awaySel.value=b.dataset.away;renderMatch();showPage('match');window.scrollTo({top:0,behavior:'smooth'});}));
    allHost.querySelectorAll('[data-idea-action="pred"]').forEach(b=>b.addEventListener('click',()=>{predHomeSel.value=b.dataset.home;predAwaySel.value=b.dataset.away;renderPredictions();showPage('predictions');window.scrollTo({top:0,behavior:'smooth'});}));
  }

  function formatCalendarDate(v){
    if(!v) return 'Data non disponibile';
    const d=new Date(v+'T12:00:00');
    const txt=d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
    return txt.charAt(0).toUpperCase()+txt.slice(1);
  }
  function renderCalendar(){
    const sel=$('#calendarRound'), grid=$('#calendarGrid'), summary=$('#calendarSummary');
    if(!sel || !grid || !summary) return;
    const rounds=(D.calendarRounds||[...new Set((D.calendar||[]).map(x=>x.round))]).slice().sort((a,b)=>a-b);
    if(!sel.options.length){
      sel.innerHTML=rounds.map(r=>`<option value="${r}">Giornata ${r}</option>`).join('');
      const preferred=(D.predictionRounds||[]).slice().sort((a,b)=>b-a)[0] || Math.min(38,(D.lastRound||0)+1) || rounds[0];
      if(rounds.includes(preferred)) sel.value=String(preferred);
    }
    const round=Number(sel.value||rounds[0]);
    const list=(D.calendar||[]).filter(x=>+x.round===round);
    const ideaCount=list.reduce((n,m)=>n+matchIdeas(m.home,m.away).length,0);
    const predCount=list.filter(m=>(D.predictions||[]).some(p=>p.home===m.home&&p.away===m.away)).length;
    summary.innerHTML=`<div><span>GIORNATA ${round}</span><strong>${list.length} partite</strong></div><div><span>PRONOSTICI SALVATI</span><strong>${predCount}</strong></div><div><span>POSSIBILI PUNTATE</span><strong>${ideaCount}</strong></div>`;
    const dates=[...new Set(list.map(x=>x.date||''))];
    grid.innerHTML=dates.map(date=>`<section class="calendar-day"><div class="calendar-day-title">${formatCalendarDate(date)}</div><div class="calendar-match-list">${list.filter(x=>(x.date||'')===date).map(m=>{
      const n=matchIdeas(m.home,m.away).length, hasPred=(D.predictions||[]).some(p=>p.home===m.home&&p.away===m.away);
      return `<article class="calendar-match card"><div class="calendar-teams"><strong>${esc(m.home)}</strong><span>vs</span><strong>${esc(m.away)}</strong></div><div class="calendar-badges">${hasPred?'<span class="calendar-badge pred">Pronostico disponibile</span>':''}${n?`<span class="calendar-badge idea">${n} ${n===1?'idea':'idee'}</span>`:''}</div><div class="calendar-actions"><button data-cal-action="match" data-home="${esc(m.home)}" data-away="${esc(m.away)}">Dati Match</button><button data-cal-action="pred" data-home="${esc(m.home)}" data-away="${esc(m.away)}" ${hasPred?'':'disabled'}>Pronostici</button></div></article>`;
    }).join('')}</div></section>`).join('') || '<div class="empty">Nessuna partita disponibile.</div>';
    grid.querySelectorAll('[data-cal-action="match"]').forEach(b=>b.addEventListener('click',()=>{homeSel.value=b.dataset.home;awaySel.value=b.dataset.away;renderMatch();showPage('match');window.scrollTo({top:0,behavior:'smooth'});}));
    grid.querySelectorAll('[data-cal-action="pred"]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;predHomeSel.value=b.dataset.home;predAwaySel.value=b.dataset.away;renderPredictions();showPage('predictions');window.scrollTo({top:0,behavior:'smooth'});}));
  }

  function confClass(v){ return v>=.70?'conf-high':v>=.58?'conf-mid':'conf-low'; }
  function market(label,value,conf,emph=false){
    return `<div class="market ${emph?'market-emph':''}"><span class="market-label">${label}</span><strong>${value||'—'}</strong>${conf!=null?`<span class="confidence ${confClass(conf)}">${fmt.pct(conf)}</span>`:''}</div>`;
  }
  function renderPredictions(){
    if(!predHomeSel || !predAwaySel) return;
    let home=predHomeSel.value, away=predAwaySel.value;
    if(home===away){ away=teams.find(t=>t!==home); predAwaySel.value=away; }
    $('#predictionHomeMeta').innerHTML=metaLine(home); $('#predictionAwayMeta').innerHTML=metaLine(away);
    const p=(D.predictions||[]).find(x=>x.home===home&&x.away===away);
    const target=$('#predictionSingle');
    if(!p){
      target.innerHTML=`<div class="empty prediction-empty"><strong>Nessun pronostico salvato per ${esc(home)} – ${esc(away)}.</strong><span>Puoi comunque analizzare i dati e annotare una possibile puntata.</span><button class="compare-btn" id="emptyCompare">Apri Dati Match</button></div>`;
      $('#emptyCompare')?.addEventListener('click',()=>{homeSel.value=home;awaySel.value=away;renderMatch();showPage('match');});
      renderIdeaBox('predictionIdeas',home,away); return;
    }
    const score=(p.scoreHome==null||p.scoreAway==null)?'—':`${Math.round(p.scoreHome)}-${Math.round(p.scoreAway)}`;
    target.innerHTML=`<article class="prediction-card prediction-card-single card">
      <div class="prediction-head"><div><span class="round-tag">GIORNATA ${p.round}</span><h3>${esc(p.home)} <span>vs</span> ${esc(p.away)}</h3></div><button class="compare-btn" id="singleCompare">Confronta dati</button></div>
      <div class="primary-markets">
        ${market('1X2 modello',p.oneXtwo,p.oneXtwoConf,true)}${market('1X2 Poisson',p.poisson,p.poissonConf,true)}${market('Doppia chance',p.doubleChance,p.doubleChanceConf)}${market('Gol / No Gol',p.btts,p.bttsConf)}${market('U/O 2,5',p.uo25,p.uo25Conf)}${market('Score',score,p.scoreConf)}
      </div>
      <details><summary>Altri mercati e dati attesi</summary><div class="details-grid">
        ${market('Doppia chance Poisson',p.doubleChancePoisson,p.doubleChancePoissonConf)}${market('U/O 1,5',p.uo15,p.uo15Conf)}${market('U/O 3,5',p.uo35,p.uo35Conf)}${market(`${p.home} segna`,clean(p.scoreHomeYN),p.scoreHomeYNConf)}${market(`${p.away} segna`,clean(p.scoreAwayYN),p.scoreAwayYNConf)}${market('Multigol totale',clean(p.multiTotal),p.multiTotalConf)}${market(`Multigol ${p.home}`,clean(p.multiHome),p.multiHomeConf)}${market(`Multigol ${p.away}`,clean(p.multiAway),p.multiAwayConf)}
      </div><div class="expected-box"><div><span>Gol attesi</span><strong>${fmt.n2(p.xgHome)} – ${fmt.n2(p.xgAway)}</strong></div><div><span>Tiri attesi</span><strong>${fmt.n1(p.shotsHome)} – ${fmt.n1(p.shotsAway)}</strong></div><div><span>Tiri in porta attesi</span><strong>${fmt.n1(p.sotHome)} – ${fmt.n1(p.sotAway)}</strong></div></div></details>
    </article>`;
    $('#singleCompare').addEventListener('click',()=>{homeSel.value=home;awaySel.value=away;renderMatch();showPage('match');window.scrollTo({top:0,behavior:'smooth'});});
    renderIdeaBox('predictionIdeas',home,away);
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


  const WALLET_KEY='serieADataLab.wallet.v3';
  const WALLET_OLD_KEY='serieADataLab.wallet.v2';
  const euro = v => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
  function walletSeed(){
    return [
      {id:6001,round:6,date:'2026-10-04',type:'topup',description:'Ricarica',amount:10,status:null,payout:0},
      {id:6002,round:6,date:'2026-10-04',type:'bet',description:'Schedina giornata 6',amount:10,status:'won',payout:65},
      {id:6003,round:7,date:'2026-10-16',type:'bet',description:'Giocate giornata 7',amount:25,status:'open',payout:0}
    ];
  }
  function loadWallet(){
    try {
      const raw=localStorage.getItem(WALLET_KEY);
      if(raw!==null) return JSON.parse(raw || '[]');
      const old=localStorage.getItem(WALLET_OLD_KEY);
      if(old!==null){
        const migrated=JSON.parse(old||'[]').map(x=>({...x,round:x.round||null}));
        const isOldDemo=migrated.length===2 && migrated.some(x=>+x.id===6001) && migrated.some(x=>+x.id===6002);
        if(isOldDemo) migrated.push({id:6003,round:7,date:'2026-10-16',type:'bet',description:'Giocate giornata 7',amount:25,status:'open',payout:0});
        localStorage.setItem(WALLET_KEY,JSON.stringify(migrated));
        return migrated;
      }
      const seed=walletSeed();
      localStorage.setItem(WALLET_KEY,JSON.stringify(seed));
      return seed;
    } catch(e){ return []; }
  }
  function saveWallet(rows){ localStorage.setItem(WALLET_KEY,JSON.stringify(rows)); }
  function walletStatusLabel(v){ return v==='won'?'Vinta':v==='lost'?'Persa':v==='open'?'Aperta':'—'; }
  function walletTypeLabel(v){ return v==='topup'?'Ricarica':v==='withdrawal'?'Ritiro':'Schedina'; }

  function walletStats(rows){
    const topups=rows.filter(x=>x.type==='topup').reduce((s,x)=>s+(+x.amount||0),0);
    const withdrawals=rows.filter(x=>x.type==='withdrawal').reduce((s,x)=>s+(+x.amount||0),0);
    const bets=rows.filter(x=>x.type==='bet');
    const staked=bets.reduce((s,x)=>s+(+x.amount||0),0);
    const won=bets.filter(x=>x.status==='won').reduce((s,x)=>s+(+x.payout||0),0);
    const lost=bets.filter(x=>x.status==='lost').reduce((s,x)=>s+(+x.amount||0),0);
    const net=won-staked;
    const balance=topups-staked+won-withdrawals;
    return {topups,withdrawals,bets,staked,won,lost,net,balance,active:Math.max(net,0),passive:Math.max(-net,0)};
  }

  function renderWalletChart(rows){
    const bets=rows.filter(x=>x.type==='bet' && Number.isFinite(+x.round) && +x.round>0);
    const currentRound=Math.max(1,...Object.values(D.meta||{}).map(x=>+x.played||0),...bets.map(x=>+x.round||0));
    let cumulative=0;
    const points=[];
    for(let r=1;r<=currentRound;r++){
      const roundBets=bets.filter(x=>+x.round===r);
      const stake=roundBets.reduce((s,x)=>s+(+x.amount||0),0);
      const win=roundBets.filter(x=>x.status==='won').reduce((s,x)=>s+(+x.payout||0),0);
      cumulative += win-stake;
      points.push({r,v:cumulative});
    }
    $('#walletTrendValue').textContent=euro(cumulative);
    $('#walletTrendValue').classList.toggle('positive',cumulative>0);
    $('#walletTrendValue').classList.toggle('negative',cumulative<0);
    const el=$('#walletChart');
    if(!points.length){ el.innerHTML='<div class="chart-empty">Inserisci una schedina per vedere l’andamento.</div>'; return; }
    const W=720,H=190,padL=42,padR=16,padT=16,padB=32;
    const vals=points.map(p=>p.v); let min=Math.min(0,...vals), max=Math.max(0,...vals);
    if(min===max){ min-=10; max+=10; }
    const span=max-min || 1;
    const x=i=>points.length===1?W/2:padL+i*(W-padL-padR)/(points.length-1);
    const y=v=>padT+(max-v)*(H-padT-padB)/span;
    const zeroY=y(0);
    const line=points.map((p,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    const area=`${line} L ${x(points.length-1).toFixed(1)} ${zeroY.toFixed(1)} L ${x(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;
    const gridVals=[max,(max+min)/2,min];
    el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento cumulato per giornata">
      <defs><linearGradient id="walletArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f9d6a" stop-opacity=".24"/><stop offset="100%" stop-color="#1f9d6a" stop-opacity=".02"/></linearGradient></defs>
      ${gridVals.map(v=>`<g><line x1="${padL}" x2="${W-padR}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/><text x="${padL-8}" y="${y(v)+4}" text-anchor="end" class="chart-label">${Math.round(v)}€</text></g>`).join('')}
      <line x1="${padL}" x2="${W-padR}" y1="${zeroY}" y2="${zeroY}" class="chart-zero"/>
      <path d="${area}" fill="url(#walletArea)"/>
      <path d="${line}" class="chart-line"/>
      ${points.map((p,i)=>`<g><circle cx="${x(i)}" cy="${y(p.v)}" r="3.5" class="chart-dot"/><text x="${x(i)}" y="${H-9}" text-anchor="middle" class="chart-round">G${p.r}</text></g>`).join('')}
    </svg>`;
  }

  function renderWallet(){
    const rows=loadWallet();
    const s=walletStats(rows);
    $('#walletActive').textContent=euro(s.active);
    $('#walletPassive').textContent=euro(s.passive);
    $('#walletTopups').textContent=euro(s.topups);
    $('#walletStaked').textContent=euro(s.staked);
    $('#walletWon').textContent=euro(s.won);
    $('#walletLost').textContent=euro(s.lost);
    $('#walletBalance').textContent=euro(s.balance);
    $('#walletWithdrawn').textContent=euro(s.withdrawals);
    $('#walletBalance').classList.toggle('negative',s.balance<0);
    renderWalletChart(rows);
    $('#walletEmpty').hidden=rows.length>0; $('#walletTableWrap').hidden=rows.length===0;
    $('#walletBody').innerHTML=rows.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (+b.id||0)-(+a.id||0)).map(x=>`<tr>
      <td>${x.round?`G${x.round}`:'—'}</td>
      <td>${x.date?new Date(x.date+'T12:00:00').toLocaleDateString('it-IT'):'—'}</td>
      <td><span class="wallet-type ${x.type}">${walletTypeLabel(x.type)}</span></td>
      <td class="wallet-desc">${x.description||'—'}</td>
      <td>${x.type==='bet'?`<span class="bet-status ${x.status}">${walletStatusLabel(x.status)}</span>`:'—'}</td>
      <td>${euro(x.amount)}</td><td>${x.type==='bet'&&x.status==='won'?euro(x.payout):'—'}</td>
      <td><button class="delete-move" data-id="${x.id}" aria-label="Elimina movimento">×</button></td>
    </tr>`).join('');
    $$('.delete-move').forEach(b=>b.addEventListener('click',()=>{
      const id=Number(b.dataset.id); saveWallet(loadWallet().filter(x=>+x.id!==id)); renderWallet();
    }));
  }
  function syncWalletFields(){
    const isBet=$('#walletType').value==='bet';
    $('#walletStatusWrap').hidden=!isBet;
    $('#walletPayoutWrap').hidden=!isBet || $('#walletStatus').value!=='won';
  }

  function showPage(page){
    $$('.page').forEach(p=>p.classList.remove('active'));
    $(`#page-${page}`).classList.add('active');
    $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    if(page==='calendar') renderCalendar();
    if(page==='predictions') renderPredictions();
    if(page==='ideas') renderIdeasPage();
    if(page==='standings') renderStandings();
    if(page==='wallet') renderWallet();
  }

  homeSel.addEventListener('change',renderMatch); awaySel.addEventListener('change',renderMatch);
  $$('.tab').forEach(b=>b.addEventListener('click',()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); view=b.dataset.view; renderMatch(); }));
  $$('.nav-btn').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  predHomeSel?.addEventListener('change',renderPredictions); predAwaySel?.addEventListener('change',renderPredictions);
  $('#calendarRound')?.addEventListener('change',renderCalendar);

  $('#walletDate').value=new Date().toISOString().slice(0,10);
  $('#walletRound').value=Math.max(...Object.values(D.meta||{}).map(x=>+x.played||0),1);
  $('#walletType').addEventListener('change',syncWalletFields);
  $('#walletStatus').addEventListener('change',()=>{ $('#walletPayoutWrap').hidden=$('#walletType').value!=='bet'||$('#walletStatus').value!=='won'; });
  $('#walletForm').addEventListener('submit',e=>{
    e.preventDefault();
    const type=$('#walletType').value, amount=Number($('#walletAmount').value||0);
    if(amount<=0) return;
    const status=type==='bet'?$('#walletStatus').value:null;
    const payout=type==='bet'&&status==='won'?Number($('#walletPayout').value||0):0;
    const round=Number($('#walletRound').value||0)||null;
    const rows=loadWallet();
    rows.push({id:Date.now(),round,date:$('#walletDate').value,type,description:$('#walletDescription').value.trim(),amount,status,payout});
    saveWallet(rows);
    const keepRound=$('#walletRound').value;
    e.target.reset(); $('#walletDate').value=new Date().toISOString().slice(0,10); $('#walletRound').value=keepRound; syncWalletFields(); $('#walletPayoutWrap').hidden=true; renderWallet();
  });
  $('#walletClear').addEventListener('click',()=>{
    if(confirm('Vuoi cancellare tutti i movimenti salvati in questa bozza?')){ saveWallet([]); renderWallet(); }
  });
  syncWalletFields(); $('#walletPayoutWrap').hidden=true;

  renderMatch();
  renderPredictions();
  renderCalendar();
  renderIdeasPage();
  renderStandings();
  renderWallet();
})();
