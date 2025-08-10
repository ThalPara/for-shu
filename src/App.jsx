<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lilo & Stitch Tetris – Ohana Mode</title>
  <style>
    :root {
      --bg1: #0b1020;
      --bg2: #1a1f3b;
      --accent: #6c9cf1;
      --accent-2: #8a5cff;
      --pink: #ff7db8;
      --green: #7ef7d7;
      --yellow: #ffe27a;
      --cell: 32px; /* base size; canvas scales with DPR */
      --shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
      background: radial-gradient(1200px 800px at 10% 10%, #1b2550, transparent),
                  radial-gradient(900px 600px at 90% 0%, #311a5a, transparent),
                  linear-gradient(160deg, var(--bg1), var(--bg2));
      color: #e8eeff;
      overflow-x: hidden;
    }
    /* twinkling stars */
    .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .star { position: absolute; width: 2px; height: 2px; background: #fff; opacity: .75; border-radius: 50%; filter: drop-shadow(0 0 6px #9cf); animation: twinkle 3s infinite ease-in-out; }
    @keyframes twinkle { 0%,100%{opacity:.3} 50%{opacity:1} }

    .wrap { display: grid; grid-template-columns: 1fr minmax(320px, 440px) 1fr; padding: 24px; gap: 24px; }
    .app { grid-column: 2; backdrop-filter: blur(6px); background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; box-shadow: var(--shadow); overflow: clip; position: relative; z-index: 1; }

    header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), transparent); }
    .title { display:flex; align-items:center; gap:12px; letter-spacing:.3px; }
    .badge { font-size: 12px; padding: 4px 10px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); color:#081225; font-weight:700; }

    main { display: grid; grid-template-columns: 1fr 280px; gap: 18px; padding: 18px; }
    @media (max-width: 820px) { main { grid-template-columns: 1fr; } }

    .board-wrap { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 12px; display:flex; flex-direction:column; align-items:center; gap: 12px; }
    canvas { background: rgba(8,14,34,.8); border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), var(--shadow); }

    .side { display: grid; gap: 12px; }
    .card { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 12px; box-shadow: var(--shadow); }
    .card h3 { margin: 0 0 8px 0; font-size: 14px; opacity:.9; letter-spacing:.3px; text-transform: uppercase; }
    .stats { display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; }
    .stat { background: rgba(255,255,255,.06); border-radius: 12px; padding: 10px; text-align:center; }
    .stat .v { font-size: 22px; font-weight: 800; }

    .controls { display:flex; flex-wrap: wrap; gap: 8px; }
    button { cursor: pointer; background: #101737; color:#e8eeff; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: 10px 14px; font-weight: 700; letter-spacing:.3px; transition: transform .08s ease, background .2s ease; }
    button:hover { transform: translateY(-1px); background: #17204b; }
    .primary { background: linear-gradient(90deg, var(--accent), var(--accent-2)); color:#081225; border: none; }

    .next { display:grid; grid-template-columns: repeat(5, 20px); grid-auto-rows: 20px; gap: 3px; justify-content: start; background: rgba(8,14,34,.8); padding: 10px; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
    .next div { width: 20px; height: 20px; border-radius: 4px; }

    .quote { min-height: 72px; background: rgba(255,255,255,.06); border-radius: 12px; padding: 10px; display:flex; align-items:center; justify-content:center; text-align:center; font-weight: 700; line-height:1.3; }

    /* on-screen mobile pad */
    .pad { display:grid; grid-template-columns: repeat(3, 64px); grid-auto-rows: 64px; gap:10px; justify-content:center; margin-top: 8px; }
    .pad button { border-radius: 16px; }

    /* toast */
    .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: rgba(0,0,0,.75); border: 1px solid rgba(255,255,255,.2); padding: 12px 16px; border-radius: 12px; box-shadow: var(--shadow); opacity:0; pointer-events:none; transition: opacity .25s ease, transform .25s ease; z-index: 5; }
    .toast.show { opacity:1; transform: translateX(-50%) translateY(-6px); }

    footer { text-align:center; padding: 8px 16px 16px; opacity:.8; }
    a { color: var(--green); text-decoration: none; }
  </style>
</head>
<body>
  <div class="stars" id="stars"></div>
  <div class="wrap">
    <div class="app">
      <header>
        <div class="title">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2l2.5 3.5L19 7l-2.5 3.5L15 14l-3 1-3-1-1.5-3.5L5 7l4.5-1.5L12 2z" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#6c9cf1"/><stop offset="1" stop-color="#8a5cff"/></linearGradient></defs></svg>
          <div>
            <div style="font-size:18px;font-weight:900;">Ohana Tetris</div>
            <div style="font-size:12px;opacity:.8">Fill lines to unlock a Lilo & Stitch quote</div>
          </div>
        </div>
        <div class="badge">Space-Borne Edition</div>
      </header>

      <main>
        <section class="board-wrap">
          <canvas id="board" width="320" height="640" aria-label="Tetris board"></canvas>
          <div class="controls">
            <button id="btn-start" class="primary">Start</button>
            <button id="btn-pause">Pause (P)</button>
            <button id="btn-restart">Restart (R)</button>
            <button id="btn-mute">Sound: On</button>
            <button id="btn-test" title="Run basic self-tests">Self‑Test</button>
          </div>

          <div class="pad" aria-label="Touch controls">
            <button id="left">◀</button>
            <button id="rotate">⟳</button>
            <button id="right">▶</button>
            <button id="soft">▼</button>
            <button id="drop" class="primary" style="grid-column: span 3;">HARD DROP (Space)</button>
          </div>
        </section>

        <aside class="side">
          <div class="card">
            <h3>Stats</h3>
            <div class="stats">
              <div class="stat"><div>Score</div><div class="v" id="score">0</div></div>
              <div class="stat"><div>Level</div><div class="v" id="level">1</div></div>
              <div class="stat"><div>Lines</div><div class="v" id="lines">0</div></div>
              <div class="stat"><div>Best</div><div class="v" id="best">0</div></div>
            </div>
          </div>
          <div class="card">
            <h3>Next</h3>
            <div class="next" id="next"></div>
          </div>
          <div class="card">
            <h3>Ohana Quote</h3>
            <div class="quote" id="quote">Fill a line to hear from Lilo & Stitch 💫</div>
          </div>
        </aside>
      </main>

      <footer>
        Controls: ← → to move, ↑ rotate, ↓ soft drop, Space hard drop, P pause. Theme inspired by Lilo & Stitch. “Ohana means family.”
      </footer>
    </div>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>
    // --- Star field background ---
    (function makeStars(){
      const cont = document.getElementById('stars');
      const n = 120;
      for(let i=0;i<n;i++){
        const d=document.createElement('div');
        d.className='star';
        d.style.left = Math.random()*100 + '%';
        d.style.top = Math.random()*100 + '%';
        d.style.animationDelay = (Math.random()*3)+'s';
        d.style.opacity = (0.2 + Math.random()*0.8).toFixed(2);
        cont.appendChild(d);
      }
    })();

    // --- Audio (simple bleep) ---
    const audioCtx = (typeof window !== 'undefined') ? new (window.AudioContext || window.webkitAudioContext)() : null;
    let soundEnabled = true;
    function beep(freq=600, dur=0.06){
      if(!soundEnabled || !audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      o.start(); o.stop(audioCtx.currentTime + dur);
      o.onended = () => g.disconnect();
    }

    // --- Tetris core ---
    const COLS = 10, ROWS = 20;
    const cellPx = 32; // logical size, we'll scale for DPR
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    // handle DPR crispness
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resizeCanvas(){
      canvas.width = COLS * cellPx * DPR;
      canvas.height = ROWS * cellPx * DPR;
      canvas.style.width = (COLS * cellPx) + 'px';
      canvas.style.height = (ROWS * cellPx) + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // IMPORTANT: don't draw here; board may not be ready yet.
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const COLORS = {
      I: '#6c9cf1', J: '#8a5cff', L: '#ff7db8', O: '#ffe27a', S: '#7ef7d7', T: '#b18cff', Z: '#5be1ff'
    };
    const SHAPES = {
      I: [ [0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0] ],
      J: [ [1,0,0], [1,1,1], [0,0,0] ],
      L: [ [0,0,1], [1,1,1], [0,0,0] ],
      O: [ [1,1], [1,1] ],
      S: [ [0,1,1], [1,1,0], [0,0,0] ],
      T: [ [0,1,0], [1,1,1], [0,0,0] ],
      Z: [ [1,1,0], [0,1,1], [0,0,0] ],
    };
    const TYPES = Object.keys(SHAPES);

    function emptyBoard(){ return Array.from({length: ROWS}, () => Array(COLS).fill(null)); }

    // Initialize board BEFORE any draw attempts
    let board = emptyBoard();
    let bag = [];
    function nextType(){
      if(bag.length === 0){ bag = [...TYPES].sort(()=>Math.random()-0.5); }
      return bag.pop();
    }

    function createPiece(type){
      const shape = SHAPES[type].map(r => r.slice());
      return { type, shape, x: Math.floor((COLS - shape[0].length)/2), y: -1 };
    }

    let piece = createPiece(nextType());
    let nextPiece = createPiece(nextType());

    function rotate(matrix){
      const N = matrix.length;
      const M = matrix[0].length;
      const res = Array.from({length: M}, () => Array(N).fill(0));
      for(let y=0;y<N;y++) for(let x=0;x<M;x++) res[x][N-1-y] = matrix[y][x];
      return res;
    }

    function collides(p, offX=0, offY=0, testShape=null){
      const sh = testShape || p.shape;
      for(let y=0;y<sh.length;y++){
        for(let x=0;x<sh[y].length;x++){
          if(!sh[y][x]) continue;
          const nx = p.x + x + offX;
          const ny = p.y + y + offY;
          if(nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if(ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function merge(p){
      for(let y=0;y<p.shape.length;y++){
        for(let x=0;x<p.shape[y].length;x++){
          if(p.shape[y][x]){
            const ny = p.y + y; const nx = p.x + x;
            if(ny >= 0) board[ny][nx] = p.type;
          }
        }
      }
    }

    function clearLines(){
      let cleared = 0;
      for(let y=ROWS-1;y>=0;y--){
        if(board[y].every(Boolean)){
          board.splice(y,1);
          board.unshift(Array(COLS).fill(null));
          cleared++; y++;
        }
      }
      return cleared;
    }

    function roundRect(ctx, x, y, w, h, r){
      const p = new Path2D();
      r = Math.min(r, w/2, h/2);
      p.moveTo(x+r, y);
      p.arcTo(x+w, y, x+w, y+h, r);
      p.arcTo(x+w, y+h, x, y+h, r);
      p.arcTo(x, y+h, x, y, r);
      p.arcTo(x, y, x+w, y, r);
      p.closePath();
      return p;
    }

    function drawCell(x,y,type,ghost=false){
      const px = x*cellPx, py = y*cellPx;
      const color = COLORS[type] || '#9cf';
      ctx.fillStyle = color;
      ctx.globalAlpha = ghost ? 0.25 : 1;
      const r = 6; // rounded
      // FIX: Path2D doesn't have .fill(); use ctx.fill(path)
      const basePath = roundRect(ctx, px+1, py+1, cellPx-2, cellPx-2, r);
      ctx.fill(basePath);
      // glossy highlight
      ctx.globalAlpha = ghost ? 0.18 : 0.4;
      ctx.fillStyle = '#ffffff';
      const glossPath = roundRect(ctx, px+4, py+4, cellPx-8, (cellPx-8)/3, r);
      ctx.fill(glossPath);
      ctx.globalAlpha = 1;
    }

    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // board
      for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
          if(board[y][x]) drawCell(x,y,board[y][x]);
          else {
            ctx.globalAlpha = .05; ctx.fillStyle = '#fff'; ctx.fillRect(x*cellPx+1, y*cellPx+1, cellPx-2, cellPx-2); ctx.globalAlpha = 1;
          }
        }
      }
      // ghost
      let gy = piece.y; while(!collides(piece, 0, (gy-piece.y)+1)) gy++; // find landing row
      for(let y=0;y<piece.shape.length;y++) for(let x=0;x<piece.shape[y].length;x++) if(piece.shape[y][x] && gy+y>=0) drawCell(piece.x+x, gy+y, piece.type, true);
      // piece
      for(let y=0;y<piece.shape.length;y++){
        for(let x=0;x<piece.shape[y].length;x++){
          if(piece.shape[y][x] && piece.y+y>=0) drawCell(piece.x+x, piece.y+y, piece.type);
        }
      }
    }

    // --- Game state ---
    let dropInterval = 800; // ms
    let lastDrop = 0;
    let playing = false;
    let score = 0, level = 1, lines = 0;
    const bestKey = 'ohana-tetris-best';
    document.getElementById('best').textContent = localStorage.getItem(bestKey) || 0;

    function updateStats(){
      document.getElementById('score').textContent = score;
      document.getElementById('level').textContent = level;
      document.getElementById('lines').textContent = lines;
      const best = Math.max(Number(localStorage.getItem(bestKey)||0), score);
      localStorage.setItem(bestKey, best);
      document.getElementById('best').textContent = best;
    }

    function newPiece(){ piece = nextPiece; nextPiece = createPiece(nextType()); renderNext(); }

    function renderNext(){
      const n = document.getElementById('next');
      n.innerHTML = '';
      // clear grid
      for(let i=0;i<25;i++){ const d=document.createElement('div'); d.style.background='transparent'; n.appendChild(d); }
      // draw next piece centered-ish in 5x5
      const sh = nextPiece.shape; const offX = Math.floor((5 - sh[0].length)/2); const offY = Math.floor((5 - sh.length)/2);
      [...n.children].forEach((cell, idx)=>{
        const gx = idx % 5, gy = Math.floor(idx/5);
        const sx = gx - offX, sy = gy - offY;
        const on = sh[sy] && sh[sy][sx];
        if(on){ cell.style.background = COLORS[nextPiece.type]; cell.style.opacity = .95; }
      });
    }

    function softDrop(){ if(!collides(piece,0,1)){ piece.y++; } else lockPiece(); draw(); }

    function hardDrop(){
      let moved = 0;
      while(!collides(piece,0,1)){ piece.y++; moved++; }
      score += 2*moved; // reward
      lockPiece();
      draw();
    }

    function lockPiece(){
      merge(piece); beep(420, .05);
      const c = clearLines();
      if(c>0){
        const gains = [0,100,300,500,800][c] || c*300; // Tetris-ish
        score += gains * level; lines += c; maybeLevelUp(); updateStats();
        showQuoteToast();
        beep(660, .07); setTimeout(()=>beep(880, .07), 70);
      }
      newPiece();
      if(collides(piece,0,0)){
        playing = false; showToast('Game Over – Press Restart', 2000); beep(160, .2);
      }
    }

    function maybeLevelUp(){
      const nextLevelAt = level*10; // every 10 lines
      if(lines >= nextLevelAt){ level++; dropInterval = Math.max(120, dropInterval - 90); showToast('Level Up! '+level); }
    }

    function gameLoop(ts){
      if(!playing){ requestAnimationFrame(gameLoop); return; }
      if(!lastDrop) lastDrop = ts;
      const dt = ts - lastDrop;
      if(dt >= dropInterval){ softDrop(); lastDrop = ts; }
      draw();
      requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);

    // --- Input ---
    function tryMove(dx, dy){ if(!collides(piece,dx,dy)){ piece.x += dx; piece.y += dy; draw(); beep(520, .03);} }
    function tryRotate(){
      const r = rotate(piece.shape);
      if(!collides(piece,0,0,r)){ piece.shape = r; draw(); beep(700, .03); return; }
      // wall kicks (simple)
      if(!collides(piece,-1,0,r)){ piece.x -= 1; piece.shape = r; draw(); beep(700, .03); return; }
      if(!collides(piece,1,0,r)){ piece.x += 1; piece.shape = r; draw(); beep(700, .03); return; }
    }

    document.addEventListener('keydown', (e)=>{
      if(e.repeat) return;
      if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyP','KeyR','KeyT'].includes(e.code)) e.preventDefault();
      switch(e.code){
        case 'ArrowLeft': tryMove(-1,0); break;
        case 'ArrowRight': tryMove(1,0); break;
        case 'ArrowDown': tryMove(0,1); break;
        case 'ArrowUp': tryRotate(); break;
        case 'Space': hardDrop(); break;
        case 'KeyP': togglePause(); break;
        case 'KeyR': restart(); break;
        case 'KeyT': runSelfTests(); break; // quick dev shortcut
      }
    });

    // touch controls
    const qs = id => document.getElementById(id);
    qs('left').onclick = ()=>tryMove(-1,0);
    qs('right').onclick = ()=>tryMove(1,0);
    qs('soft').onclick = ()=>tryMove(0,1);
    qs('rotate').onclick = ()=>tryRotate();
    qs('drop').onclick = ()=>hardDrop();

    // buttons
    document.getElementById('btn-start').onclick = ()=>{ if(!playing){ playing = true; lastDrop = 0; showToast('Game Start!'); audioCtx && audioCtx.resume && audioCtx.resume(); } };
    document.getElementById('btn-pause').onclick = ()=>togglePause();
    document.getElementById('btn-restart').onclick = ()=>restart();
    document.getElementById('btn-mute').onclick = (e)=>{ soundEnabled = !soundEnabled; e.target.textContent = 'Sound: ' + (soundEnabled? 'On':'Off'); };
    document.getElementById('btn-test').onclick = ()=>runSelfTests();

    function togglePause(){ playing = !playing; showToast(playing? 'Resumed' : 'Paused'); }
    function restart(){ board = emptyBoard(); score=0; lines=0; level=1; dropInterval=800; bag=[]; piece=createPiece(nextType()); nextPiece=createPiece(nextType()); renderNext(); updateStats(); draw(); playing=true; lastDrop=0; showToast('New Game – Good luck!'); }

    // --- Quotes ---
    const quotes = [
      'Ohana means family. Family means nobody gets left behind or forgotten.',
      'I like you. You be my friend?',
      'Aloha! 🌺',
      'This is my family. It’s little, and broken, but still good. Yeah, still good.',
      'Blue punch buggy! No punch back!',
      'You can be happy with me.',
      'Stitch understands. Stitch is good. 🍪',
      'Family is your superpower.',
      'We’re a good team, you and me.',
      'If you want to leave, you can. I’ll remember you though. I remember everyone that leaves.'
    ];

    function showQuoteToast(){
      const q = quotes[Math.floor(Math.random()*quotes.length)];
      document.getElementById('quote').textContent = q;
      showToast('★ Ohana Quote Unlocked!');
    }

    // --- Toast ---
    const toast = document.getElementById('toast');
    let toastTimer;
    function showToast(msg, ms=1200){
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(()=> toast.classList.remove('show'), ms);
    }

    // --- Basic self-tests (console) ---
    function runSelfTests(){
      const savedBoard = board;
      const savedPiece = { type: piece.type, shape: piece.shape.map(r=>r.slice()), x: piece.x, y: piece.y };
      const savedScore = score;
      try {
        let tBoard = emptyBoard();
        board = tBoard; // use test board for isolated checks

        console.group('%cOhana Tetris – Self Tests','color:#7ef7d7;font-weight:700');

        // Test: board shape
        console.assert(Array.isArray(board) && board.length === ROWS && board.every(r=>Array.isArray(r) && r.length===COLS), 'Board should be ROWS x COLS');

        // Test: collision in empty board should be false
        let tp = createPiece('O');
        tp.x = 4; tp.y = -1; // entering from top
        console.assert(!collides(tp,0,0), 'Piece should not collide in empty board at spawn');

        // Test: wall collision
        let leftWall = createPiece('I');
        leftWall.x = -1; leftWall.y = 0;
        console.assert(collides(leftWall,0,0), 'Piece at x=-1 should collide with wall');

        // Test: floor collision
        let floorTest = createPiece('O');
        floorTest.x = 4; floorTest.y = ROWS - 2; // O is 2 tall
        console.assert(collides(floorTest,0,1) === true, 'Piece one step below bottom should collide');

        // Test: merge then clear line (1 line)
        board[ROWS-1] = Array(COLS).fill('I');
        let cleared = clearLines();
        console.assert(cleared === 1, 'Exactly one line should be cleared');
        console.assert(board[0].every(v=>v===null), 'Top row should be empty after clear');

        // Test: multi-line clear (2 lines)
        board[ROWS-1] = Array(COLS).fill('L');
        board[ROWS-2] = Array(COLS).fill('J');
        cleared = clearLines();
        console.assert(cleared === 2, 'Exactly two lines should be cleared');

        // Test: rotation keeps block count
        const t = createPiece('T');
        const count = (m)=>m.reduce((a,r)=>a+r.reduce((aa,v)=>aa+(v?1:0),0),0);
        const before = count(t.shape);
        const after = count(rotate(t.shape));
        console.assert(before === after, 'Rotation should preserve number of blocks');

        // Test: Path2D fill smoke test (drawCell should not throw)
        let threw = false; try { drawCell(0,0,'I'); } catch(e){ threw = true; }
        console.assert(threw === false, 'drawCell should not throw (Path2D fill)');

        // Test: next preview grid size
        const next = document.getElementById('next');
        console.assert(next.children.length === 25, 'Next preview should have 25 cells');

        console.log('%cAll tests passed!','color:#6c9cf1;font-weight:700');
        showToast('Self‑tests passed! Check console');
      } catch(err){
        console.error('Self‑tests failed:', err);
        showToast('Self‑tests failed – see console', 1800);
      } finally {
        board = savedBoard;
        piece = savedPiece;
        score = savedScore;
        draw();
      }
      console.groupEnd();
    }

    // initial draw AFTER board has been initialized
    draw(); renderNext(); updateStats();
  </script>
</body>
</html>
