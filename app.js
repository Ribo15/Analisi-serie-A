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
      ['winPct','% Vittorie','pct','high'],['drawPct','% Pareggi','pct','neutral'],['lossPct','% Sconfitte','pct','low'],['possession','Possesso medio','pct','neutral']
    ]},
    {title:'Gol', metrics:[
      ['gf','Gol fatti per partita','n2','high'],['ga','Gol subiti per partita','n2','low'],['cleanSheet','% Clean sheet','pct','high']
    ]},
    {title:'Tiri', metrics:[
      ['shots','Tiri per partita','n1','high'],['shotsAgainst','Tiri subiti per partita','n1','low'],
      ['sot','Tiri in porta per partita','n1','high'],['sotAgainst','Tiri in porta subiti per partita','n1','low'],
      ['conversion','Conversione tiri → gol','pct','high']
    ]},
    {title:'Angoli', metrics:[
      ['corners','Angoli per partita','n1','high'],['cornersAgainst','Angoli concessi per partita','n1','low']
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
  if($('#snapshot')) $('#snapshot').textContent=`Snapshot Excel • dati fino alla giornata ${D.lastRound}`;

  function pointsAtPosition(pos){ const row=Object.values(D.meta||{}).find(x=>+x.position===+pos); return row?+row.points||0:0; }
  function targetLine(team){
    const m=D.meta[team], pos=+m.position, pts=+m.points||0;
    if(pos===1) return `<strong>${pos}°</strong> • In vetta`;
    if(pos>=2 && pos<=4) return `<strong>${pos}°</strong> • Zona Champions`;
    if(pos===5) return `<strong>${pos}°</strong> • Zona Europa League`;
    if(pos===6) return `<strong>${pos}°</strong> • Zona Conference`;
    if(pos>=18) return `<strong>${pos}°</strong> • Zona retrocessione`;
    const diff=Math.max(0,pointsAtPosition(6)-pts);
    return diff===0 ? `<strong>${pos}°</strong> • Zona Conference` : `<strong>${pos}°</strong> • -${diff} pt dalla Conference`;
  }
  function metaLine(team){ return targetLine(team); }
  function selectedMatchRound(home,away){
    const fixture=(D.calendar||[]).find(x=>x.home===home && x.away===away && +x.round>(+D.lastRound||0));
    return fixture ? +fixture.round : (+D.lastRound||0);
  }
  function nextFixture(team,afterRound){
    const cal=(D.calendar||[]).filter(x=>+x.round>afterRound && (x.home===team || x.away===team)).sort((a,b)=>+a.round-+b.round || String(a.date||'').localeCompare(String(b.date||'')));
    const f=cal[0]; if(!f) return null;
    return {round:+f.round,date:f.date||'',home:f.home,away:f.away};
  }
  function shortDate(v){ return v?new Date(v+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'}):'—'; }
  function renderNextFixtures(home,away){
    const host=$('#nextFixtures'); if(!host) return;
    const afterRound=selectedMatchRound(home,away);
    const fixtures=[nextFixture(home,afterRound),nextFixture(away,afterRound)].filter(Boolean);
    const round=fixtures[0]?.round || null;
    const row=f=>`<div class="next-fixture-row"><div class="next-fixture-team home">${logoImg(f.home)}<strong>${esc(f.home)}</strong></div><div class="next-fixture-date">${shortDate(f.date)}</div><div class="next-fixture-team away"><strong>${esc(f.away)}</strong>${logoImg(f.away)}</div></div>`;
    host.innerHTML=`<div class="next-fixtures-title"><strong>Prossima giornata</strong>${round?`<span>Giornata ${round}</span>`:''}</div><div class="next-fixture-lines">${fixtures.map(row).join('')||'<div class="idea-empty">Calendario non disponibile.</div>'}</div>`;
  }
  function renderMatch(){
    let home=homeSel.value, away=awaySel.value;
    if(home===away){ away=teams.find(t=>t!==home); awaySel.value=away; }
    $('#homeMeta').innerHTML=metaLine(home); $('#awayMeta').innerHTML=metaLine(away);
    const hLogo=teamLogo(home), aLogo=teamLogo(away);
    const setLogo=(id,src)=>{ const el=$(id); if(!el) return; el.src=src||''; el.style.display=src?'block':'none'; };
    setLogo('#homeLogo',hLogo); setLogo('#awayLogo',aLogo); setLogo('#contextHomeLogo',hLogo); setLogo('#contextAwayLogo',aLogo); setLogo('#stickyHomeLogo',hLogo); setLogo('#stickyAwayLogo',aLogo);
    const H=getData(home,away,true), A=getData(away,home,false);
    const labels={
      general:['Dati generali','Tutte le partite giocate nella stagione in corso.'],
      last5:['Dati ultime partite','Confronto sulle ultime partite disponibili per ciascuna squadra.'],
      venue5:['Casa / Fuori',`${home}: partite recenti giocate in casa • ${away}: partite recenti giocate in trasferta`],
      level:['Livello avversario',`${home} contro squadre con livello di forza simile a ${away} • ${away} contro squadre con livello di forza simile a ${home}`]
    };
    const sampleLabel=(which,n)=>{
      if(view==='general') return `${n} ${n===1?'partita':'partite'}`;
      if(view==='last5') return `Ultime ${n} ${n===1?'partita':'partite'}`;
      if(view==='venue5') return `Ultime ${n} ${n===1?'partita':'partite'} ${which==='home'?'in casa':'in trasferta'}`;
      return `${n} ${n===1?'partita':'partite'} nel campione`;
    };
    $('#contextTitle').textContent=labels[view][0]; $('#contextNote').textContent=labels[view][1];
    $('#contextHomeName').textContent=home; $('#contextAwayName').textContent=away;
    $('#contextHomeGames').textContent=sampleLabel('home',H.games); $('#contextAwayGames').textContent=sampleLabel('away',A.games);
    if($('#stickyHomeName')) $('#stickyHomeName').textContent=home;
    if($('#stickyAwayName')) $('#stickyAwayName').textContent=away;
    if(!H.games && !A.games){ $('#comparison').innerHTML='<div class="empty">Nessun dato disponibile per questo confronto.</div>'; renderNextFixtures(home,away); renderIdeaBox('matchIdeas',home,away); return; }
    $('#comparison').innerHTML=groups.map(g=>{
      const rows=g.metrics.map(([key,label,kind,dir])=>{
        const hv=H.games?H[key]:null, av=A.games?A[key]:null, [hb,ab]=isBetter(hv,av,dir);
        return `<div class="metric-row"><div class="metric-value home ${hb?'better':''}"><span>${fmt[kind](hv)}</span></div><div class="metric-label">${label}</div><div class="metric-value away ${ab?'better':''}"><span>${fmt[kind](av)}</span></div></div>`;
      }).join('');
      return `<div class="metric-group"><div class="group-title">${g.title}</div><div class="metric-list">${rows}</div></div>`;
    }).join('');
    renderNextFixtures(home,away);
    renderIdeaBox('matchIdeas',home,away);
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
    const isPredictionHost=hostId==='predictionIdeas';
    host.innerHTML=`<section class="ideas-card card">
      <div class="ideas-head compact"><div><div class="kicker">PRONOSTICO</div><h3>Possibile puntata</h3></div></div>
      <form class="idea-form idea-form-v9">
        <label>Pronostico<input name="market" required placeholder="Es. Gol, 1X, Over 2,5"></label>
        <label>Quota<input name="odds" type="number" min="1" step="0.01" inputmode="decimal" placeholder="1,75"></label>
        <label>Fiducia<select name="confidence"><option value="high">Alta</option><option value="medium" selected>Media</option><option value="low">Bassa</option></select></label>
        <label class="idea-note">Nota<input name="note" placeholder="Aggiungi una nota"></label>
        <button class="primary-action idea-save" type="submit">${isPredictionHost?'Salva in Puntate':'Salva idea'}</button>
        <button class="ghost-danger idea-clear" type="button">Elimina tutto</button>
      </form>
      ${rows.length?`<div class="idea-list">${rows.map(x=>`<article class="idea-row"><div class="idea-main"><strong>${esc(x.market)}</strong>${x.odds?`<span class="idea-odds">@ ${Number(x.odds).toFixed(2).replace('.',',')}</span>`:''}<span class="idea-trust ${esc(x.confidence)}">Fiducia ${ideaConfidenceLabel(x.confidence)}</span></div>${x.note?`<div class="idea-text">${esc(x.note)}</div>`:''}<button class="idea-delete" data-id="${esc(x.id)}" type="button" aria-label="Elimina puntata">×</button></article>`).join('')}</div>`:''}
    </section>`;
    const form=host.querySelector('.idea-form');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(form), market=String(fd.get('market')||'').trim(); if(!market) return;
      const all=loadIdeas(); all.push({id:String(Date.now())+Math.random().toString(16).slice(2),home,away,market,odds:Number(fd.get('odds')||0)||null,confidence:String(fd.get('confidence')||'medium'),status:'evaluate',note:String(fd.get('note')||'').trim(),createdAt:Date.now()});
      saveIdeas(all); refreshIdeaViews();
    });
    host.querySelector('.idea-clear')?.addEventListener('click',()=>{
      const ids=new Set(matchIdeas(home,away).map(x=>String(x.id))); if(!ids.size) return;
      if(confirm(`Eliminare tutte le puntate salvate per ${home} – ${away}?`)){
        saveIdeas(loadIdeas().filter(x=>!ids.has(String(x.id)))); saveSlip(loadSlip().filter(id=>!ids.has(String(id)))); refreshIdeaViews();
      }
    });
    host.querySelectorAll('.idea-delete').forEach(b=>b.addEventListener('click',()=>{ removeIdeaEverywhere(b.dataset.id); refreshIdeaViews(); }));
  }

  function predictionFor(home,away){ return (D.predictions||[]).find(p=>p.home===home && p.away===away) || null; }
  function normalizeMarket(v){ return String(v||'').trim().toUpperCase().replace(/\s+/g,' '); }
  function ideaBand(x){
    const p=predictionFor(x.home,x.away); if(!p) return null;
    const m=normalizeMarket(x.market);
    if(m.includes('POISSON')) return p.poissonBand ? {label:p.poissonBand,type:'poisson'} : null;
    const outcome=normalizeMarket(p.oneXtwo);
    if(m===outcome || m==='1X2 '+outcome || m==='1X2' || ['1','X','2'].includes(m)) return p.band ? {label:p.band,type:'model'} : null;
    return null;
  }
  function bandClass(v){ return `band-${String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}`; }
  function bandBadge(v,prefix='Fascia'){
    if(!v) return '';
    return `<span class="band-badge ${bandClass(v)}">${prefix} ${esc(v)}</span>`;
  }
  function csvCell(v){ const t=String(v??''); return `"${t.replace(/"/g,'""')}"`; }
  function downloadCsv(filename,rows){
    const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function downloadIdeas(){
    const all=loadIdeas().slice().sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    const rows=[['Giornata','Match','Pronostico','Quota','Fiducia','Fascia 1X2']];
    all.forEach(x=>{const b=ideaBand(x);rows.push([ideaRound(x)||'',`${x.home} - ${x.away}`,x.market,x.odds||'',ideaConfidenceLabel(x.confidence),b?.label||'']);});
    downloadCsv('puntate-pensate.csv',rows);
  }
  function downloadSlip(){
    const all=loadIdeas(), ids=loadSlip(), slip=ids.map(id=>all.find(x=>String(x.id)===String(id))).filter(Boolean);
    const rows=[['Giornata','Match','Pronostico','Quota','Fascia 1X2']];
    slip.forEach(x=>{const b=ideaBand(x);rows.push([ideaRound(x)||'',`${x.home} - ${x.away}`,x.market,x.odds||'',b?.label||'']);});
    downloadCsv('schedina-in-preparazione.csv',rows);
  }
  function slipRound(slip){ const rs=[...new Set(slip.map(ideaRound).filter(Boolean))]; return rs.length===1?rs[0]:null; }
  function playedSlipRows(){ return loadWallet().filter(x=>x.type==='bet' && x.source==='slip').slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (+b.id||0)-(+a.id||0)); }
  function renderPlayedSlips(){
    const host=$('#playedSlipsOverview'); if(!host) return;
    const rows=playedSlipRows();
    host.innerHTML=`<section class="played-slips-card card"><div class="ideas-page-head"><div><div class="kicker">SCHEDINE GIOCATE</div><h3>${rows.length?`${rows.length} registrate`:'Nessuna'}</h3></div></div><div class="played-slip-list">${rows.length?rows.slice(0,8).map(x=>`<article class="played-slip-row"><div class="played-slip-main"><strong>${x.round?`G${x.round} • `:''}${esc(x.description||'Schedina')}</strong><span>${x.selections?.length||0} selezioni${x.combinedOdds?` • quota ${Number(x.combinedOdds).toFixed(2).replace('.',',')}`:''}${x.potentialPayout?` • potenziale ${euro(x.potentialPayout)}`:''}</span><button class="view-slip" data-view-slip="${x.id}" type="button">Visualizza schedina</button><div class="played-slip-detail" id="playedSlipDetail${x.id}" hidden>${(x.selections||[]).map(sel=>`<div><strong>${esc(sel.home)} – ${esc(sel.away)}</strong><span>${esc(sel.market)}${sel.odds?` @ ${Number(sel.odds).toFixed(2).replace('.',',')}`:''}</span></div>`).join('')||'<span>Nessun dettaglio disponibile.</span>'}</div></div><div class="played-slip-status"><strong>${euro(x.amount)}</strong><span class="bet-status ${esc(x.status||'open')}">${walletStatusLabel(x.status||'open')}</span>${x.status==='open'?`<div class="played-slip-actions"><button data-slip-result="won" data-id="${x.id}">Vinta</button><button data-slip-result="lost" data-id="${x.id}">Persa</button></div>`:''}</div></article>`).join(''):'<div class="idea-empty">Le schedine registrate con “Gioca schedina” compariranno qui.</div>'}</div></section>`;
    host.querySelectorAll('[data-view-slip]').forEach(b=>b.addEventListener('click',()=>{const d=host.querySelector(`#playedSlipDetail${b.dataset.viewSlip}`);if(!d)return;d.hidden=!d.hidden;b.textContent=d.hidden?'Visualizza schedina':'Nascondi schedina';}));
    host.querySelectorAll('[data-slip-result]').forEach(b=>b.addEventListener('click',()=>{
      const id=Number(b.dataset.id), result=b.dataset.slipResult, wallet=loadWallet(), row=wallet.find(x=>+x.id===id); if(!row) return;
      if(result==='lost'){
        if(!confirm('Segnare questa schedina come persa?')) return;
        row.status='lost'; row.payout=0;
      } else {
        const suggested=Number(row.potentialPayout||0); const raw=prompt('Totale accreditato dalla schedina vinta?',suggested?suggested.toFixed(2):''); if(raw===null) return;
        const payout=Number(String(raw).replace(',','.')); if(!(payout>=0)) return alert('Importo non valido.');
        row.status='won'; row.payout=payout;
      }
      saveWallet(wallet); renderWallet(); renderIdeasPage();
    }));
  }

  function playCurrentSlip(){
    const all=loadIdeas(), ids=loadSlip(), slip=ids.map(id=>all.find(x=>String(x.id)===String(id))).filter(Boolean);
    if(!slip.length) return alert('La schedina è vuota.');
    const stake=Number($('#slipStake')?.value||0); if(!(stake>0)) return alert('Inserisci l’importo da giocare.');
    const rows=loadWallet(), stats=walletStats(rows); if(stake>stats.balance+1e-9) return alert(`Saldo SNAI insufficiente: ${euro(stats.balance)}.`);
    const odds=slip.map(x=>+x.odds||0), combined=odds.length&&odds.every(v=>v>=1)?odds.reduce((a,b)=>a*b,1):null;
    const potential=combined?stake*combined:null; const round=slipRound(slip);
    const msg=`Registrare questa schedina come giocata per ${euro(stake)}${combined?` a quota ${combined.toFixed(2).replace('.',',')}`:''}?`;
    if(!confirm(msg)) return;
    rows.push({id:Date.now(),round,date:new Date().toISOString().slice(0,10),type:'bet',description:`Schedina ${slip.length} selezioni`,amount:stake,status:'open',payout:0,source:'slip',combinedOdds:combined,potentialPayout:potential,selections:slip.map(x=>({id:x.id,home:x.home,away:x.away,market:x.market,odds:x.odds||null,band:ideaBand(x)?.label||null}))});
    saveWallet(rows); saveSlip([]); renderIdeasPage(); renderWallet(); alert('Schedina registrata. Il saldo SNAI è stato aggiornato.');
  }

  function ideaRound(x){
    const m=(D.calendar||[]).find(g=>g.home===x.home && g.away===x.away);
    return m?.round || null;
  }
  function renderIdeasPage(){
    const allHost=$('#ideasOverview'), slipHost=$('#slipOverview'); if(!allHost || !slipHost) return;
    const all=loadIdeas().slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const validIds=new Set(all.map(x=>String(x.id)));
    let slipIds=loadSlip().filter(id=>validIds.has(String(id))); saveSlip(slipIds);
    const slipSet=new Set(slipIds), slip=slipIds.map(id=>all.find(x=>String(x.id)===String(id))).filter(Boolean);
    const odds=slip.map(x=>+x.odds||0), combined=slip.length&&odds.every(v=>v>=1)?odds.reduce((a,b)=>a*b,1):null;
    const balance=walletStats(loadWallet()).balance;
    slipHost.innerHTML=`<section class="slip-card card"><div class="ideas-page-head"><div><div class="kicker">SCHEDINA IN PREPARAZIONE</div><h3>${slip.length?`${slip.length} ${slip.length===1?'selezione':'selezioni'}`:'Vuota'}</h3></div><div class="slip-top-actions"><button id="downloadSlip" class="secondary-action" type="button" ${slip.length?'':'disabled'}>Scarica schedina</button><button id="clearSlip" class="ghost-danger" type="button" ${slip.length?'':'disabled'}>Elimina tutto</button>${combined?`<div class="slip-odds"><span>Quota combinata</span><strong>${combined.toFixed(2).replace('.',',')}</strong></div>`:''}</div></div><div class="slip-list">${slip.length?slip.map(x=>{const b=ideaBand(x);return `<article class="slip-row"><div><strong>${esc(x.home)} – ${esc(x.away)}</strong><span>${esc(x.market)}${x.odds?` @ ${Number(x.odds).toFixed(2).replace('.',',')}`:''}${b?` ${bandBadge(b.label)}`:''}</span></div><button class="slip-remove" data-id="${esc(x.id)}" type="button">Rimuovi</button></article>`}).join(''):'<div class="idea-empty">Nessuna puntata inserita nella schedina.</div>'}</div>${slip.length?`<div class="slip-play-box"><div class="slip-balance"><span>Saldo SNAI</span><strong>${euro(balance)}</strong></div><label>Puntata €<input id="slipStake" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="10,00"></label><div class="slip-potential"><span>Vincita potenziale</span><strong id="slipPotential">${combined?'€ 0,00':'—'}</strong></div><button id="playSlip" class="primary-action" type="button">Gioca schedina</button></div>`:''}</section>`;
    allHost.innerHTML=`<section class="all-ideas-card card"><div class="ideas-page-head"><div><div class="kicker">PUNTATE</div><h3>Puntate pensate</h3><p>Seleziona quelle che vuoi copiare nella schedina in preparazione. Le puntate originali restano qui finché non le cancelli.</p></div><div class="ideas-head-actions"><button id="addSelectedToSlip" class="primary-action" type="button" ${all.length?'':'disabled'}>Aggiungi selezionate alla schedina</button><button id="downloadIdeas" class="secondary-action" type="button" ${all.length?'':'disabled'}>Scarica lista</button><button id="clearAllIdeas" class="ghost-danger" type="button" ${all.length?'':'disabled'}>Cancella tutto</button></div></div><div class="all-ideas-list">${all.length?all.map(x=>{const r=ideaRound(x),b=ideaBand(x),inSlip=slipSet.has(String(x.id));return `<article class="all-idea-row ${esc(x.status)}"><label class="idea-select-wrap"><input class="idea-select" type="checkbox" value="${esc(x.id)}" ${inSlip?'disabled':''}><span>${inSlip?'In schedina':'Seleziona'}</span></label><div class="all-idea-top"><div><span class="idea-match">${r?`G${r} • `:''}${esc(x.home)} – ${esc(x.away)}</span><div class="idea-main"><strong>${esc(x.market)}</strong>${x.odds?`<span class="idea-odds">@ ${Number(x.odds).toFixed(2).replace('.',',')}</span>`:''}${b?bandBadge(b.label):''}<span class="idea-trust ${esc(x.confidence)}">Fiducia ${ideaConfidenceLabel(x.confidence)}</span></div>${x.note?`<div class="idea-text">${esc(x.note)}</div>`:''}</div></div><div class="idea-page-actions"><button data-idea-action="match" data-home="${esc(x.home)}" data-away="${esc(x.away)}">Dati Match</button><button data-idea-action="pred" data-home="${esc(x.home)}" data-away="${esc(x.away)}">Pronostici</button><button class="idea-page-delete" data-idea-action="delete" data-id="${esc(x.id)}">Elimina</button></div></article>`}).join(''):'<div class="idea-empty">Non hai ancora annotato possibili puntate.</div>'}</div></section>`
    slipHost.querySelectorAll('.slip-remove').forEach(b=>b.addEventListener('click',()=>{saveSlip(loadSlip().filter(id=>id!==String(b.dataset.id)));renderIdeasPage();}));
    slipHost.querySelector('#downloadSlip')?.addEventListener('click',downloadSlip);
    slipHost.querySelector('#clearSlip')?.addEventListener('click',()=>{
      if(!loadSlip().length) return;
      if(confirm('Vuoi eliminare tutte le selezioni dalla schedina in preparazione?')){
        saveSlip([]);
        renderIdeasPage();
        renderCalendar();
      }
    });
    slipHost.querySelector('#playSlip')?.addEventListener('click',playCurrentSlip);
    const stakeInput=slipHost.querySelector('#slipStake'); if(stakeInput && combined){ stakeInput.addEventListener('input',()=>{const v=Number(stakeInput.value||0); const out=slipHost.querySelector('#slipPotential'); if(out) out.textContent=v>0?euro(v*combined):euro(0);}); }
    allHost.querySelector('#downloadIdeas')?.addEventListener('click',downloadIdeas);
    allHost.querySelector('#clearAllIdeas')?.addEventListener('click',()=>{if(confirm('Vuoi cancellare tutte le puntate pensate?')){saveIdeas([]);saveSlip([]);refreshIdeaViews();}});
    allHost.querySelector('#addSelectedToSlip')?.addEventListener('click',()=>{const selected=[...allHost.querySelectorAll('.idea-select:checked')].map(x=>String(x.value));if(!selected.length)return alert('Seleziona almeno una puntata.');const ids=loadSlip();selected.forEach(id=>{if(!ids.includes(id))ids.push(id)});saveSlip(ids);renderIdeasPage();renderCalendar();});
    allHost.querySelectorAll('[data-idea-action="delete"]').forEach(b=>b.addEventListener('click',()=>{removeIdeaEverywhere(b.dataset.id);refreshIdeaViews();}));
    allHost.querySelectorAll('[data-idea-action="match"]').forEach(b=>b.addEventListener('click',()=>{homeSel.value=b.dataset.home;awaySel.value=b.dataset.away;renderMatch();showPage('match');window.scrollTo({top:0,behavior:'smooth'});}));
    allHost.querySelectorAll('[data-idea-action="pred"]').forEach(b=>b.addEventListener('click',()=>{predHomeSel.value=b.dataset.home;predAwaySel.value=b.dataset.away;renderPredictions();showPage('predictions');window.scrollTo({top:0,behavior:'smooth'});}));
    renderPlayedSlips();
  }

  const TEAM_LOGOS = {
    "Atalanta":"https://assets.football-logos.cc/logos/italy/256x256/atalanta.45225436.png",
    "Bologna":"https://assets.football-logos.cc/logos/italy/256x256/bologna.a78d435f.png",
    "Cagliari":"https://assets.football-logos.cc/logos/italy/256x256/cagliari.1c3353f1.png",
    "Como":"https://assets.football-logos.cc/logos/italy/256x256/como-1907.1a1430cd.png",
    "Fiorentina":"https://assets.football-logos.cc/logos/italy/256x256/fiorentina.7ba101c2.png",
    "Frosinone":"https://assets.football-logos.cc/logos/italy/256x256/frosinone.8cc89626.png",
    "Genoa":"https://assets.football-logos.cc/logos/italy/256x256/genoa.a5ec9be4.png",
    "Inter":"https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png",
    "Juventus":"https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png",
    "Lazio":"https://assets.football-logos.cc/logos/italy/256x256/lazio.2386d28d.png",
    "Lecce":"https://assets.football-logos.cc/logos/italy/256x256/lecce.18baee06.png",
    "Milan":"https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png",
    "Monza":"https://assets.football-logos.cc/logos/italy/256x256/monza.a0b0c166.png",
    "Napoli":"https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png",
    "Parma":"https://assets.football-logos.cc/logos/italy/256x256/parma.ca4e3120.png",
    "Roma":"https://assets.football-logos.cc/logos/italy/256x256/roma.034a933e.png",
    "Sassuolo":"https://assets.football-logos.cc/logos/italy/256x256/sassuolo.1b38db1d.png",
    "Torino":"https://assets.football-logos.cc/logos/italy/256x256/torino.a6c78dd6.png",
    "Udinese":"https://assets.football-logos.cc/logos/italy/256x256/udinese.a69e0bef.png",
    "Venezia":"https://assets.football-logos.cc/logos/italy/256x256/venezia.b006ee57.png"
  };
  function teamLogo(name){ return TEAM_LOGOS[name] || ''; }
  function logoImg(name){ const src=teamLogo(name); return src?`<img class="calendar-logo" src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`:''; }
  function calIcon(type){
    return type==='match'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10h4v10H4Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M22 12h-4"/></svg>';
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
    grid.innerHTML=dates.map(date=>`<section class="calendar-day"><div class="calendar-day-title">${formatCalendarDate(date)}</div><div class="calendar-match-list">${list.filter(x=>(x.date||'')===date).map(m=>`
      <article class="calendar-match card">
        <div class="calendar-teams">
          <div class="calendar-team home">${logoImg(m.home)}<strong>${esc(m.home)}</strong></div>
          <span class="calendar-vs">vs</span>
          <div class="calendar-team away">${logoImg(m.away)}<strong>${esc(m.away)}</strong></div>
        </div>
        <div class="calendar-actions">
          <button data-cal-action="match" data-home="${esc(m.home)}" data-away="${esc(m.away)}"><span>Dati Match</span></button>
          <button class="calendar-primary" data-cal-action="pred" data-home="${esc(m.home)}" data-away="${esc(m.away)}"><span>Pronostici</span></button>
        </div>
      </article>`).join('')}</div></section>`).join('') || '<div class="empty">Nessuna partita disponibile.</div>';
    grid.querySelectorAll('[data-cal-action="match"]').forEach(b=>b.addEventListener('click',()=>{homeSel.value=b.dataset.home;awaySel.value=b.dataset.away;renderMatch();showPage('match');window.scrollTo({top:0,behavior:'smooth'});}));
    grid.querySelectorAll('[data-cal-action="pred"]').forEach(b=>b.addEventListener('click',()=>{predHomeSel.value=b.dataset.home;predAwaySel.value=b.dataset.away;renderPredictions();showPage('predictions');window.scrollTo({top:0,behavior:'smooth'});}));
  }

  function confClass(v){ return v>=.70?'conf-high':v>=.58?'conf-mid':'conf-low'; }
  const clamp01=v=>v==null?null:Math.max(0,Math.min(1,Number(v)));
  function ynLabel(v){ const t=String(clean(v)||'').toLowerCase(); return t.includes('no')?'No':'Sì'; }
  function complementPair(label,conf,positiveWord){
    const c=clamp01(conf), txt=String(label||'').toLowerCase();
    if(c==null) return [null,null];
    return txt.includes(String(positiveWord).toLowerCase()) ? [c,1-c] : [1-c,c];
  }
  function derive1x2(sign,signProb,dc,dcProb){
    const out={p1:null,px:null,p2:null,p1x:null,px2:null};
    const s=String(sign??'').toUpperCase(), sp=clamp01(signProb), d=String(dc??'').toUpperCase(), dp=clamp01(dcProb);
    if(s==='1') out.p1=sp; else if(s==='X') out.px=sp; else if(s==='2') out.p2=sp;
    if(d==='1X') out.p1x=dp; if(d==='X2') out.px2=dp;
    if(out.p1!=null && out.p1x!=null){ out.px=clamp01(out.p1x-out.p1); out.p2=clamp01(1-out.p1x); }
    else if(out.p2!=null && out.px2!=null){ out.px=clamp01(out.px2-out.p2); out.p1=clamp01(1-out.px2); }
    else if(out.px!=null && out.p1x!=null){ out.p1=clamp01(out.p1x-out.px); out.p2=clamp01(1-out.p1x); }
    else if(out.px!=null && out.px2!=null){ out.p2=clamp01(out.px2-out.px); out.p1=clamp01(1-out.px2); }
    if(out.p1x==null && out.p1!=null && out.px!=null) out.p1x=clamp01(out.p1+out.px);
    if(out.px2==null && out.px!=null && out.p2!=null) out.px2=clamp01(out.px+out.p2);
    return out;
  }
  function confToTrust(v){ return v>=.65?'high':v>=.50?'medium':'low'; }
  function pickButton(label,prob,extra=''){
    if(prob==null) return `<span class="pred-prob muted">—</span>`;
    return `<button type="button" class="pred-pick ${extra}" data-market="${esc(label)}" data-conf="${Number(prob)}"><span>${esc(label)}</span><strong>${fmt.pct(prob)}</strong></button>`;
  }
  function principalCard(title,value,prob,source=''){
    const savedMarket=(source==='Poisson' && (title==='1X2'||title==='Doppia chance'))?`${value} Poisson`:value;
    return `<article class="principal-pred-card" role="button" tabindex="0" data-market="${esc(savedMarket)}" data-conf="${Number(prob)}"><span class="principal-family">${esc(title)}</span><strong>${esc(value)}</strong><small class="principal-source ${source?'':'is-empty'}">${source?esc(source):'&nbsp;'}</small><div class="principal-prob"><span>Probabilità</span><b>${fmt.pct(prob)}</b></div></article>`;
  }
  function sectionTable(title,rows,open=false){
    return `<details class="pred-section card" ${open?'open':''}><summary>${esc(title)}</summary><div class="pred-section-body">${rows.map(r=>`<div class="pred-table-row"><span class="pred-row-label">${esc(r.label)}</span>${pickButton(r.market||r.label,r.prob)}</div>`).join('')}</div></details>`;
  }
  function sectionOneXtwoCombined(std,poi,open=true){
    const outcomes=[['1','p1'],['X','px'],['2','p2'],['1X','p1x'],['X2','px2']];
    const line=(label,model,prob,market,klass)=>prob==null
      ? `<div class="pred-1x2-line ${klass}"><span class="pred-1x2-sign">${label}</span><span class="pred-1x2-model">${model}</span><span class="pred-1x2-prob muted">—</span></div>`
      : `<button type="button" class="pred-1x2-line ${klass}" data-market="${esc(market)}" data-conf="${Number(prob)}"><span class="pred-1x2-sign">${label}</span><span class="pred-1x2-model">${model}</span><strong class="pred-1x2-prob">${fmt.pct(prob)}</strong></button>`;
    const body=outcomes.map(([label,key])=>`${line(label,'Standard',std[key],label,'standard-pick')}${line(label,'Poisson',poi[key],`${label} Poisson`,'poisson-pick')}`).join('');
    return `<details class="pred-section card pred-1x2-combined" ${open?'open':''}><summary>1X2 · Standard + Poisson</summary><div class="pred-section-body pred-1x2-list">${body}</div></details>`;
  }
  function poissonRange(lambda,min,max){
    const l=Number(lambda); if(!Number.isFinite(l)||l<0) return null;
    let sum=0, term=Math.exp(-l);
    for(let k=0;k<=max;k++){
      if(k>=min) sum+=term;
      term=term*l/(k+1);
    }
    return clamp01(sum);
  }
  function multigoalAllRows(p,home,away){
    const ranges=[[1,2],[1,3],[1,4],[2,3],[2,4]];
    const groups=[
      ['Totale',Number(p.xgHome)+Number(p.xgAway),'Multigoal totale'],
      [home,Number(p.xgHome),`Multigoal ${home}`],
      [away,Number(p.xgAway),`Multigoal ${away}`]
    ];
    return groups.flatMap(([group,lambda,prefix])=>ranges.map(([a,b])=>({label:`${group} · ${a}-${b}`,market:`${prefix} ${a}-${b}`,prob:poissonRange(lambda,a,b)})));
  }
  function primePredictionIdea(home,away,market,conf){
    const host=$('#predictionIdeas'), form=host?.querySelector('.idea-form'); if(!form) return;
    const marketInput=form.querySelector('[name="market"]'), trust=form.querySelector('[name="confidence"]'), odds=form.querySelector('[name="odds"]');
    if(marketInput) marketInput.value=market;
    if(trust) trust.value=confToTrust(Number(conf)||0);
    host.classList.add('prediction-idea-highlight'); setTimeout(()=>host.classList.remove('prediction-idea-highlight'),900);
    host.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>odds?.focus(),450);
  }
  function attachPredictionPickHandlers(root,home,away){
    root.querySelectorAll('[data-market][data-conf]').forEach(b=>{
      const activate=()=>primePredictionIdea(home,away,b.dataset.market,Number(b.dataset.conf));
      b.addEventListener('click',activate);
      if(b.classList.contains('principal-pred-card')) b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    });
  }
  function renderPredictions(){
    if(!predHomeSel || !predAwaySel) return;
    let home=predHomeSel.value, away=predAwaySel.value;
    if(home===away){ away=teams.find(t=>t!==home); predAwaySel.value=away; }
    $('#predictionHomeMeta').innerHTML=metaLine(home); $('#predictionAwayMeta').innerHTML=metaLine(away);
    const setLogo=(id,src)=>{ const el=$(id); if(!el) return; el.src=src||''; el.style.display=src?'block':'none'; };
    setLogo('#predictionHomeLogo',teamLogo(home)); setLogo('#predictionAwayLogo',teamLogo(away));
    const p=(D.predictions||[]).find(x=>x.home===home&&x.away===away);
    const target=$('#predictionSingle');
    renderIdeaBox('predictionIdeas',home,away);
    if(!p){
      target.innerHTML=`<div class="empty prediction-empty"><strong>Nessun pronostico disponibile per ${esc(home)} – ${esc(away)}.</strong><button class="compare-btn" id="emptyCompare">Apri Dati Match</button></div>`;
      $('#emptyCompare')?.addEventListener('click',()=>{homeSel.value=home;awaySel.value=away;renderMatch();showPage('match');});
      return;
    }
    const std=derive1x2(p.oneXtwo,p.oneXtwoConf,p.doubleChance,p.doubleChanceConf);
    const poi=derive1x2(p.poisson,p.poissonConf,p.doubleChancePoisson,p.doubleChancePoissonConf);
    const score=(p.scoreHome==null||p.scoreAway==null)?'—':`${Math.round(p.scoreHome)}-${Math.round(p.scoreAway)}`;
    const [golProb,noGolProb]=complementPair(p.btts,p.bttsConf,'Gol');
    const overUnderRows=[];
    [[p.uo15,p.uo15Conf,'1,5'],[p.uo25,p.uo25Conf,'2,5'],[p.uo35,p.uo35Conf,'3,5']].forEach(([lab,conf,t])=>{
      const [over,under]=complementPair(lab,conf,'Over');
      overUnderRows.push({label:`Over ${t}`,market:`Over ${t}`,prob:over},{label:`Under ${t}`,market:`Under ${t}`,prob:under});
    });
    const homeYes=String(clean(p.scoreHomeYN)).toLowerCase().includes('no')?1-p.scoreHomeYNConf:p.scoreHomeYNConf;
    const awayYes=String(clean(p.scoreAwayYN)).toLowerCase().includes('no')?1-p.scoreAwayYNConf:p.scoreAwayYNConf;
    const oneXtwoBest=p.oneXtwoConf>=p.poissonConf?{value:String(p.oneXtwo),prob:p.oneXtwoConf,source:'Standard'}:{value:String(p.poisson),prob:p.poissonConf,source:'Poisson'};
    const dcBest=p.doubleChanceConf>=p.doubleChancePoissonConf?{value:p.doubleChance,prob:p.doubleChanceConf,source:'Standard'}:{value:p.doubleChancePoisson,prob:p.doubleChancePoissonConf,source:'Poisson'};
    const ouCandidates=[[p.uo15,p.uo15Conf],[p.uo25,p.uo25Conf],[p.uo35,p.uo35Conf]].sort((a,b)=>b[1]-a[1]);
    const multiRowsAll=multigoalAllRows(p,home,away);
    const multiCandidates=multiRowsAll.filter(x=>x.prob!=null).sort((a,b)=>b.prob-a.prob);
    const scoreTeamCandidates=[[`${home} segna ${ynLabel(p.scoreHomeYN)}`,p.scoreHomeYNConf],[`${away} segna ${ynLabel(p.scoreAwayYN)}`,p.scoreAwayYNConf]].sort((a,b)=>b[1]-a[1]);
    const principal=[
      ['1X2',oneXtwoBest.value,oneXtwoBest.prob,oneXtwoBest.source],
      ['Doppia chance',dcBest.value,dcBest.prob,dcBest.source],
      ['Gol / NoGol',p.btts,p.bttsConf,''],
      ['Over / Under',ouCandidates[0][0],ouCandidates[0][1],''],
      ['Multigol',multiCandidates[0]?.market?.replace(/^Multigoal (totale|[^ ]+) /i,'')||clean(p.multiTotal),multiCandidates[0]?.prob??p.multiTotalConf,multiCandidates[0]?.label?.split(' · ')[0]||''],
      ['Segna squadra',scoreTeamCandidates[0][0],scoreTeamCandidates[0][1],'']
    ];
    const bttsRows=[{label:'Gol',market:'Gol',prob:golProb},{label:'NoGol',market:'NoGol',prob:noGolProb}];
    const scoreRows=[{label:`Risultato esatto ${score}`,market:`Risultato esatto ${score}`,prob:p.scoreConf}];
    const scoreTeamRows=[
      {label:`${home} segna Sì`,market:`${home} segna Sì`,prob:homeYes},{label:`${home} segna No`,market:`${home} segna No`,prob:1-homeYes},
      {label:`${away} segna Sì`,market:`${away} segna Sì`,prob:awayYes},{label:`${away} segna No`,market:`${away} segna No`,prob:1-awayYes}
    ];
    const multiRows=multiRowsAll;
    target.innerHTML=`
      <section class="principal-preds card"><div class="pred-block-title">Principali pronostici</div><div class="principal-grid">${principal.map(x=>principalCard(...x)).join('')}</div></section>
      <section class="all-preds"><div class="pred-block-title">Tutti i pronostici</div>
        ${sectionOneXtwoCombined(std,poi,true)}
        ${sectionTable('Gol / NoGol',bttsRows,false)}
        ${sectionTable('Over / Under',overUnderRows,false)}
        ${sectionTable('Segna squadra',scoreTeamRows,false)}
        ${sectionTable('Multigol',multiRows,false)}
        ${sectionTable('Risultato esatto',scoreRows,false)}
      </section>`;
    attachPredictionPickHandlers(target,home,away);
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
      const id=Number(b.dataset.id); saveWallet(loadWallet().filter(x=>+x.id!==id)); renderWallet(); renderPlayedSlips();
    }));
    renderPlayedSlips();
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


  let stickyTick=false;
  function updateMatchSticky(){
    stickyTick=false;
    const sticky=$('#matchSticky'), picker=document.querySelector('#page-match .match-picker-v9'), page=$('#page-match'), nav=document.querySelector('.main-nav');
    if(!sticky||!picker||!page) return;
    const active=page.classList.contains('active');
    const navRect=nav?nav.getBoundingClientRect():{bottom:0};
    const navBottom=Math.max(0,navRect.bottom);
    const pickerRect=picker.getBoundingClientRect();
    const pageRect=page.getBoundingClientRect();
    const shouldFix=active && pickerRect.bottom <= navBottom + 2 && pageRect.bottom > navBottom + 100;
    sticky.classList.toggle('is-fixed',shouldFix);
    sticky.style.top=shouldFix?`${Math.round(navBottom+6)}px`:'';
    document.body.classList.toggle('match-sticky-active',shouldFix);
  }
  function scheduleSticky(){
    if(stickyTick) return;
    stickyTick=true;
    requestAnimationFrame(updateMatchSticky);
  }
  window.addEventListener('scroll',scheduleSticky,{passive:true});
  window.addEventListener('resize',scheduleSticky);
  document.addEventListener('click',scheduleSticky);
  scheduleSticky();
})();
