// 小工具：更公平的亂數索引（優先用 crypto）
function randomIndex(n){
  if (window.crypto && n > 0){
    const buf = new Uint32Array(1);
    let x;
    do{ window.crypto.getRandomValues(buf); x = buf[0] } while (x === 0xFFFFFFFF);
    return x % n;
  }
  return Math.floor(Math.random() * n);
}

const state = {
  site: null,
  all: [],
  remaining: [],
  winners: []
};

const els = {
  aboutText: document.getElementById('about-text'),
  skills: document.getElementById('skills'),
  jsonDump: document.getElementById('jsonDump'),
  participantCount: document.getElementById('participantCount'),
  roulette: document.getElementById('roulette'),
  winnersList: document.getElementById('winnersList'),
  winnerCount: document.getElementById('winnerCount'),
  drawOne: document.getElementById('drawOne'),
  drawMany: document.getElementById('drawMany'),
  reset: document.getElementById('reset'),
  exportWinners: document.getElementById('exportWinners')
};

document.getElementById('year').textContent = new Date().getFullYear();

// 載入網站資料（可保留你原本的 data.json 結構）
async function loadSiteData(){
  try{
    const res = await fetch('data.json', {cache:'no-store'});
    const data = await res.json();
    state.site = data;

    els.aboutText.textContent = `${data.name ?? '我的網站'} · ${data.website ?? 'GitHub Pages 範例'}`;
    els.skills.innerHTML = '';
    (data.skills ?? []).forEach(s=>{
      const li = document.createElement('li');
      li.textContent = s;
      els.skills.appendChild(li);
    });

    els.jsonDump.textContent = JSON.stringify(data, null, 2);
  }catch(e){
    els.aboutText.textContent = '無法讀取 data.json（可忽略，如果你沒放這個檔案）';
    els.jsonDump.textContent = '(沒有 data.json)';
  }
}

// 載入參加者名單
async function loadParticipants(){
  const res = await fetch('participants.json', {cache:'no-store'});
  const json = await res.json();

  // 支援兩種格式：["Alice","Bob"] 或 [{name:"Alice"}]
  const list = (json.participants || []).map(p => typeof p === 'string' ? p : p?.name).filter(Boolean);

  state.all = list.slice();
  state.remaining = list.slice();
  state.winners = [];
  updateCounts();
  renderWinners();
  els.roulette.textContent = list.length ? '準備開始！' : '名單是空的';
}

function updateCounts(){
  els.participantCount.textContent = `${state.remaining.length} / 總 ${state.all.length}`;
}
function renderWinners(){
  els.winnersList.innerHTML = '';
  state.winners.forEach((name, idx)=>{
    const li = document.createElement('li');
    li.textContent = `${idx+1}. ${name}`;
    els.winnersList.appendChild(li);
  });
}

function confettiOnce(){
  if (window.confetti){
    window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }
}

// 抽 1 位：帶滾動動畫
async function drawOne(){
  if (state.remaining.length === 0){
    els.roulette.textContent = '已無可抽名單，請重置或更新 participants.json';
    return;
  }

  // 1) 轉輪動效：快速顯示隨機名字 ~1.2 秒
  const spinMs = 1200;
  const interval = 50;
  const start = performance.now();
  const spinTimer = setInterval(()=>{
    const i = randomIndex(state.remaining.length);
    els.roulette.textContent = state.remaining[i];
  }, interval);

  await new Promise(r => setTimeout(r, spinMs));
  clearInterval(spinTimer);

  // 2) 真正抽取
  const idx = randomIndex(state.remaining.length);
  const winner = state.remaining.splice(idx, 1)[0];
  state.winners.push(winner);

  els.roulette.textContent = `🎉 ${winner} 🎉`;
  confettiOnce();
  updateCounts();
  renderWinners();
}

// 連抽 N 位（依序動起來）
async function drawMany(){
  const n = Math.max(1, parseInt(els.winnerCount.value || '1', 10));
  for (let i=0; i<n; i++){
    if (state.remaining.length === 0) break;
    // 每位之間稍等，避免動畫重疊
    await drawOne();
    await new Promise(r => setTimeout(r, 300));
  }
}

// 重置（把已抽回填）
function resetAll(){
  state.remaining = state.all.slice();
  state.winners = [];
  updateCounts();
  renderWinners();
  els.roulette.textContent = '已重置，可重新抽獎';
}

// 匯出中獎名單 CSV
function exportWinners(){
  if (!state.winners.length){
    alert('目前沒有中獎名單');
    return;
  }
  const csv = 'rank,name\n' + state.winners.map((n,i)=>`${i+1},${n}`).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'winners.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// 綁定事件
els.drawOne.addEventListener('click', drawOne);
els.drawMany.addEventListener('click', drawMany);
els.reset.addEventListener('click', resetAll);
els.exportWinners.addEventListener('click', exportWinners);

// 啟動
loadSiteData().finally(loadParticipants);
