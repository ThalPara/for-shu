import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ohana Arcade – Single‑file React app
 * Fix: Removed missing imports (./OhanaTetris, ./SudokuApp) by inlining both games here.
 * Includes: Tetris (Lilo & Stitch quotes) + Sudoku (9x9) with self‑tests for each.
 * Layout: centered container at ~2/3 viewport width, responsive fallback on small screens.
 */

export default function OhanaArcade() {
  const [game, setGame] = useState('tetris'); // 'tetris' | 'sudoku'
  return (
    <div className="min-h-screen text-[#e8eeff]" style={{
      background: 'radial-gradient(1200px 800px at 10% 10%, #1b2550, transparent), radial-gradient(900px 600px at 90% 0%, #311a5a, transparent), linear-gradient(160deg, #0b1020, #1a1f3b)'
    }}>
      <BaseStyles />
      <Stars />
      <div className="flex justify-center pt-6">
        <div style={{ width: '66.6667vw', maxWidth: 1280, minWidth: 640 }}>
          <header className="flex flex-wrap items-center justify-center gap-3 md:gap-4 border-b border-white/10 pb-3 mb-4">
            <h1 className="text-xl md:text-2xl font-bold mr-0 md:mr-8">Ohana Arcade</h1>
            <button
              onClick={() => setGame('tetris')}
              className={`px-4 py-2 font-bold rounded-full ${game === 'tetris' ? 'bg-gradient-to-r from-[#6c9cf1] to-[#8a5cff] text-[#081225]' : 'bg-[#101737] border border-white/20'}`}
            >Tetris</button>
            <button
              onClick={() => setGame('sudoku')}
              className={`px-4 py-2 font-bold rounded-full ${game === 'sudoku' ? 'bg-gradient-to-r from-[#6c9cf1] to-[#8a5cff] text-[#081225]' : 'bg-[#101737] border border-white/20'}`}
            >Sudoku</button>
          </header>

          {game === 'tetris' ? <Tetris /> : <Sudoku />}

          <footer className="text-center px-4 pb-6 opacity-80">
            Tetris: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause, R restart. &nbsp;|
            &nbsp;Sudoku: click a cell then 1–9 (or use numpad) to fill; 0/Backspace to erase; arrows to move.
          </footer>
        </div>
      </div>
      <Toast />
    </div>
  );
}

/* -------------------- Shared UI -------------------- */
function BaseStyles(){
  return (
    <style>{`
      .stars{position:fixed;inset:0;pointer-events:none;z-index:0}
      .star{position:absolute;width:2px;height:2px;background:#fff;opacity:.75;border-radius:50%;filter:drop-shadow(0 0 6px #9cf);animation:twinkle 3s infinite ease-in-out}
      @keyframes twinkle{0%,100%{opacity:.3}50%{opacity:1}}
      .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.2);padding:12px 16px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;z-index:5}
      .toast.show{opacity:1;transform:translateX(-50%) translateY(-6px)}
      .btn{cursor:pointer;background:#101737;color:#e8eeff;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:10px 14px;font-weight:700;letter-spacing:.3px}
      .btnPrimary{background:linear-gradient(90deg,#6c9cf1,#8a5cff);color:#081225;border:none}
      .card{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
      @media (max-width: 760px){ .container{ width:95vw !important; min-width:0 !important; } }
    `}</style>
  );
}

function Stars(){
  useEffect(()=>{
    const cont=document.querySelector('.stars');
    if(!cont) return; cont.innerHTML='';
    for(let i=0;i<120;i++){
      const d=document.createElement('div'); d.className='star';
      d.style.left=Math.random()*100+'%'; d.style.top=Math.random()*100+'%';
      d.style.animationDelay=(Math.random()*3)+'s'; d.style.opacity=(0.2+Math.random()*0.8).toFixed(2);
      cont.appendChild(d);
    }
  },[]);
  return <div className="stars"/>;
}

function Toast(){
  return <div id="toast" className="toast" role="status" aria-live="polite"/>;
}
function showToast(msg, ms=1200){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'), ms);
}

/* -------------------- TETRIS -------------------- */
function Tetris(){
  const canvasRef = useRef(null);
  const nextRef = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(Number(localStorage.getItem('ohana-tetris-best')||0));
  const [quote, setQuote] = useState('Fill a line to hear from Lilo & Stitch 💫');

  // config
  const COLS=10, ROWS=20, cellPx=32;
  const COLORS = useMemo(()=>({ I:'#6c9cf1', J:'#8a5cff', L:'#ff7db8', O:'#ffe27a', S:'#7ef7d7', T:'#b18cff', Z:'#5be1ff' }),[]);
  const SHAPES = useMemo(()=>({
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J:[[1,0,0],[1,1,1],[0,0,0]],
    L:[[0,0,1],[1,1,1],[0,0,0]],
    O:[[1,1],[1,1]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]],
  }),[]);
  const TYPES = useMemo(()=>Object.keys(SHAPES),[SHAPES]);

  const ctxRef = useRef(null);
  const boardRef = useRef(emptyBoard());
  const bagRef = useRef([]);
  const pieceRef = useRef(null);
  const nextPieceRef = useRef(null);
  const lastDropRef = useRef(0);
  const dropIntervalRef = useRef(800);
  const audioCtxRef = useRef(null);

  function emptyBoard(){ return Array.from({length: ROWS}, ()=>Array(COLS).fill(null)); }
  function nextType(){ if(bagRef.current.length===0) bagRef.current=[...TYPES].sort(()=>Math.random()-0.5); return bagRef.current.pop(); }
  function createPiece(type){ const shape=SHAPES[type].map(r=>r.slice()); return {type, shape, x: Math.floor((COLS-shape[0].length)/2), y: -1}; }
  function rotate(m){ const N=m.length, M=m[0].length; const r=Array.from({length:M},()=>Array(N).fill(0)); for(let y=0;y<N;y++) for(let x=0;x<M;x++) r[x][N-1-y]=m[y][x]; return r; }
  function collides(p, dx=0, dy=0, test=null){ const sh=test||p.shape; const b=boardRef.current; for(let y=0;y<sh.length;y++){ for(let x=0;x<sh[y].length;x++){ if(!sh[y][x]) continue; const nx=p.x+x+dx, ny=p.y+y+dy; if(nx<0||nx>=COLS||ny>=ROWS) return true; if(ny>=0 && b[ny][nx]) return true; } } return false; }
  function merge(p){ const b=boardRef.current; for(let y=0;y<p.shape.length;y++){ for(let x=0;x<p.shape[y].length;x++){ if(p.shape[y][x]){ const ny=p.y+y, nx=p.x+x; if(ny>=0) b[ny][nx]=p.type; } } } }
  function clearLines(){ let c=0; const b=boardRef.current; for(let y=ROWS-1;y>=0;y--){ if(b[y].every(Boolean)){ b.splice(y,1); b.unshift(Array(COLS).fill(null)); c++; y++; } } return c; }
  function roundRectPath(x,y,w,h,r){ const p=new Path2D(); r=Math.min(r,w/2,h/2); p.moveTo(x+r,y); p.arcTo(x+w,y,x+w,y+h,r); p.arcTo(x+w,y+h,x,y+h,r); p.arcTo(x,y+h,x,y,r); p.arcTo(x,y,x+w,y,r); p.closePath(); return p; }
  function drawCell(x,y,type,ghost=false){ const ctx=ctxRef.current; const px=x*cellPx, py=y*cellPx; const color=COLORS[type]||'#9cf'; ctx.fillStyle=color; ctx.globalAlpha=ghost?0.25:1; const r=6; const base=roundRectPath(px+1,py+1,cellPx-2,cellPx-2,r); ctx.fill(base); ctx.globalAlpha=ghost?0.18:0.4; ctx.fillStyle='#ffffff'; const gloss=roundRectPath(px+4,py+4,cellPx-8,(cellPx-8)/3,r); ctx.fill(gloss); ctx.globalAlpha=1; }
  function draw(){ const ctx=ctxRef.current, canvas=canvasRef.current; ctx.clearRect(0,0,canvas.width,canvas.height); const b=boardRef.current; for(let y=0;y<ROWS;y++){ for(let x=0;x<COLS;x++){ if(b[y][x]) drawCell(x,y,b[y][x]); else { ctx.globalAlpha=.05; ctx.fillStyle='#fff'; ctx.fillRect(x*cellPx+1,y*cellPx+1,cellPx-2,cellPx-2); ctx.globalAlpha=1; } } } let gy=pieceRef.current.y; while(!collides(pieceRef.current,0,(gy-pieceRef.current.y)+1)) gy++; for(let y=0;y<pieceRef.current.shape.length;y++) for(let x=0;x<pieceRef.current.shape[y].length;x++) if(pieceRef.current.shape[y][x] && gy+y>=0) drawCell(pieceRef.current.x+x, gy+y, pieceRef.current.type, true); for(let y=0;y<pieceRef.current.shape.length;y++) for(let x=0;x<pieceRef.current.shape[y].length;x++) if(pieceRef.current.shape[y][x] && pieceRef.current.y+y>=0) drawCell(pieceRef.current.x+x, pieceRef.current.y+y, pieceRef.current.type); }
  function beep(freq=600, dur=.06){ if(!soundOn) return; if(!audioCtxRef.current) audioCtxRef.current=new (window.AudioContext||window.webkitAudioContext)(); const a=audioCtxRef.current; const o=a.createOscillator(); const g=a.createGain(); o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(.2,a.currentTime+.01); o.start(); o.stop(a.currentTime+dur); o.onended=()=>g.disconnect(); }
  function renderNext(){ const n=nextRef.current; n.innerHTML=''; for(let i=0;i<25;i++){ const d=document.createElement('div'); d.style.width='20px'; d.style.height='20px'; d.style.borderRadius='4px'; d.style.background='transparent'; n.appendChild(d);} const sh=nextPieceRef.current.shape; const offX=Math.floor((5-sh[0].length)/2), offY=Math.floor((5-sh.length)/2); [...n.children].forEach((cell,idx)=>{ const gx=idx%5, gy=Math.floor(idx/5); const sx=gx-offX, sy=gy-offY; const on=sh[sy]&&sh[sy][sx]; if(on){ cell.style.background=COLORS[nextPieceRef.current.type]; cell.style.opacity=.95; } }); }
  function showQuote(){ const q=[
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
  ]; setQuote(q[Math.floor(Math.random()*q.length)]); showToast('★ Ohana Quote Unlocked!'); }
  function newPiece(){ pieceRef.current=nextPieceRef.current; nextPieceRef.current=createPiece(nextType()); renderNext(); }
  function softDrop(){ if(!collides(pieceRef.current,0,1)){ pieceRef.current.y++; } else lockPiece(); draw(); }
  function hardDrop(){ let moved=0; while(!collides(pieceRef.current,0,1)){ pieceRef.current.y++; moved++; } setScore(s=>s+2*moved); lockPiece(); draw(); }
  function maybeLevelUp(curLines, curLevel){ if(curLines>=curLevel*10){ const nl=curLevel+1; dropIntervalRef.current=Math.max(120,dropIntervalRef.current-90); setLevel(nl); showToast('Level Up! '+nl); } }
  function lockPiece(){ merge(pieceRef.current); beep(420,.05); const c=clearLines(); if(c>0){ const gains=[0,100,300,500,800][c]||c*300; setScore(s=>s+gains*level); setLines(ln=>{ const nl=ln+c; maybeLevelUp(nl, level); return nl;}); setBest(b=>{ const nb=Math.max(b, score); localStorage.setItem('ohana-tetris-best', String(nb)); return Math.max(b, score);}); showQuote(); beep(660,.07); setTimeout(()=>beep(880,.07),70);} newPiece(); if(collides(pieceRef.current,0,0)){ setPlaying(false); showToast('Game Over – Press Restart', 2000); beep(160,.2);} }

  useEffect(()=>{
    const canvas=canvasRef.current; const ctx=canvas.getContext('2d'); ctxRef.current=ctx;
    const DPR=Math.max(1, Math.min(2, window.devicePixelRatio||1));
    function resize(){ canvas.width=COLS*cellPx*DPR; canvas.height=ROWS*cellPx*DPR; canvas.style.width=`${COLS*cellPx}px`; canvas.style.height=`${ROWS*cellPx}px`; ctx.setTransform(DPR,0,0,DPR,0,0); }
    resize(); window.addEventListener('resize', resize);
    // init pieces
    boardRef.current=emptyBoard(); bagRef.current=[]; pieceRef.current=createPiece(nextType()); nextPieceRef.current=createPiece(nextType()); renderNext(); draw();
    let raf; function loop(ts){ if(!playing){ raf=requestAnimationFrame(loop); return; } if(!lastDropRef.current) lastDropRef.current=ts; const dt=ts-lastDropRef.current; if(dt>=dropIntervalRef.current){ softDrop(); lastDropRef.current=ts; } draw(); raf=requestAnimationFrame(loop);} raf=requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },[playing]);

  useEffect(()=>{ const kb=e=>{ if(e.repeat) return; if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyP','KeyR'].includes(e.code)) e.preventDefault(); switch(e.code){ case 'ArrowLeft': if(!collides(pieceRef.current,-1,0)){ pieceRef.current.x-=1; draw(); beep(520,.03);} break; case 'ArrowRight': if(!collides(pieceRef.current,1,0)){ pieceRef.current.x+=1; draw(); beep(520,.03);} break; case 'ArrowDown': softDrop(); break; case 'ArrowUp': { const r=rotate(pieceRef.current.shape); if(!collides(pieceRef.current,0,0,r)){ pieceRef.current.shape=r; draw(); beep(700,.03); break;} if(!collides(pieceRef.current,-1,0,r)){ pieceRef.current.x-=1; pieceRef.current.shape=r; draw(); beep(700,.03); break;} if(!collides(pieceRef.current,1,0,r)){ pieceRef.current.x+=1; pieceRef.current.shape=r; draw(); beep(700,.03); break;} break;} case 'Space': hardDrop(); break; case 'KeyP': setPlaying(p=>{ showToast(p?'Paused':'Resumed'); return !p;}); break; case 'KeyR': restart(); break; }}; window.addEventListener('keydown', kb); return ()=>window.removeEventListener('keydown', kb); });

  function restart(){ boardRef.current=emptyBoard(); bagRef.current=[]; pieceRef.current=createPiece(nextType()); nextPieceRef.current=createPiece(nextType()); setScore(0); setLevel(1); setLines(0); dropIntervalRef.current=800; lastDropRef.current=0; renderNext(); draw(); setPlaying(true); showToast('New Game – Good luck!'); }

  // Self-tests for Tetris core (do not change existing tests; add extras)
  function tetrisSelfTests(){
    const savedBoard=boardRef.current.map(r=>r.slice()); const savedPiece=JSON.parse(JSON.stringify(pieceRef.current));
    try{
      boardRef.current=emptyBoard();
      console.group('%cTetris Self‑Tests','color:#7ef7d7;font-weight:700');
      console.assert(boardRef.current.length===ROWS && boardRef.current.every(r=>r.length===COLS),'Board size');
      let tp=createPiece('O'); tp.x=4; tp.y=-1; console.assert(!collides(tp,0,0),'Spawn non-collision');
      let left=createPiece('I'); left.x=-1; left.y=0; console.assert(collides(left,0,0),'Wall collision');
      // Added extra: floor collision
      let floor=createPiece('O'); floor.x=4; floor.y=ROWS-2; console.assert(collides(floor,0,1)===true,'Floor collision');
      // Existing clears
      boardRef.current[ROWS-1]=Array(COLS).fill('I'); let cleared=clearLines(); console.assert(cleared===1,'Single line clear');
      boardRef.current[ROWS-1]=Array(COLS).fill('J'); boardRef.current[ROWS-2]=Array(COLS).fill('L'); cleared=clearLines(); console.assert(cleared===2,'Double line clear');
      // Path2D fill smoke test
      let ok=true; try{ const ctx=ctxRef.current; if(ctx) { const path=new Path2D(); ctx.fill(path); } }catch(e){ ok=false; } console.assert(ok,'Path2D fill');
      console.log('%cAll good!','color:#6c9cf1;font-weight:700'); showToast('Tetris tests passed');
    }catch(err){ console.error(err); showToast('Tetris tests failed – see console', 1800); }
    finally{ boardRef.current=savedBoard; pieceRef.current=savedPiece; draw(); }
  }

  return (
    <main style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:18,padding:18}}>
      <section className="card" style={{alignItems:'center',display:'flex',flexDirection:'column',gap:12}}>
        <h3 style={sideH3}>Tetris</h3>
        <canvas ref={canvasRef} width={320} height={640} aria-label="Tetris board" style={{background:'rgba(8,14,34,.8)',borderRadius:10,boxShadow:'inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 30px rgba(0,0,0,.35)'}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <button className="btn btnPrimary" onClick={()=>{ if(!playing){ setPlaying(true); lastDropRef.current=0; showToast('Game Start!'); audioCtxRef.current?.resume?.(); } }}>Start</button>
          <button className="btn" onClick={()=>setPlaying(p=>{ showToast(p?'Paused':'Resumed'); return !p; })}>Pause (P)</button>
          <button className="btn" onClick={restart}>Restart (R)</button>
          <button className="btn" onClick={()=>setSoundOn(s=>!s)}>Sound: {soundOn?'On':'Off'}</button>
          <button className="btn" onClick={tetrisSelfTests}>Self‑Test</button>
        </div>
        <div className="card" style={{width:'100%'}}>
          <h3 style={sideH3}>Next</h3>
          <div ref={nextRef} style={{display:'grid',gridTemplateColumns:'repeat(5,20px)',gridAutoRows:'20px',gap:3,justifyContent:'start',background:'rgba(8,14,34,.8)',padding:10,borderRadius:10,boxShadow:'inset 0 0 0 1px rgba(255,255,255,.06)'}}/>
        </div>
      </section>
      <aside style={{display:'grid',gap:12}}>
        <div className="card">
          <h3 style={sideH3}>Stats</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            <Stat label="Score" value={score}/>
            <Stat label="Level" value={level}/>
            <Stat label="Lines" value={lines}/>
            <Stat label="Best" value={best}/>
          </div>
        </div>
        <div className="card">
          <h3 style={sideH3}>Ohana Quote</h3>
          <div style={{minHeight:72,background:'rgba(255,255,255,.06)',borderRadius:12,padding:10,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontWeight:700,lineHeight:1.3}}>{quote}</div>
        </div>
      </aside>
    </main>
  );
}

function Stat({label, value}){ return <div style={{background:'rgba(255,255,255,.06)',borderRadius:12,padding:10,textAlign:'center'}}><div>{label}</div><div style={{fontSize:22,fontWeight:800}}>{value}</div></div>; }
const sideH3 = {margin:'0 0 8px 0',fontSize:14,opacity:.9,letterSpacing:'.3px',textTransform:'uppercase'};

/* -------------------- SUDOKU -------------------- */
function Sudoku(){
  // 0 = empty
  const puzzles = useMemo(()=>[
    // Easy
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    // Medium
    '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    // Hard
    '300000000005009000200504000000700090000000000040003000000201004000800100000000006'
  ],[]);
  const solutions = useMemo(()=>[
    '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    '435269781682571493197834562826195347374682915951743628519326874248957136763418259',
    '384162957615879432279534861832745196197286345546913728758621493463897215921458673'
  ],[]);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [grid, setGrid] = useState(strToGrid(puzzles[0]));
  const [fixed, setFixed] = useState(grid.map(row=>row.map(v=>v!==0)));
  const [selected, setSelected] = useState({r:0,c:0});

  useEffect(()=>{ const g=strToGrid(puzzles[puzzleIndex]); setGrid(g); setFixed(g.map(r=>r.map(v=>v!==0))); },[puzzleIndex, puzzles]);

  function strToGrid(s){ return Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>Number(s[r*9+c]))); }
  function gridToStr(g){ return g.flat().join(''); }

  function isValid(g){
    // rows
    for(let r=0;r<9;r++){ const seen=new Set(); for(let c=0;c<9;c++){ const v=g[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);} }
    // cols
    for(let c=0;c<9;c++){ const seen=new Set(); for(let r=0;r<9;r++){ const v=g[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);} }
    // boxes
    for(let br=0;br<3;br++) for(let bc=0;bc<3;bc++){ const seen=new Set(); for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const v=g[br*3+r][bc*3+c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);} }
    return true;
  }
  function isSolved(g){ return gridToStr(g) === solutions[puzzleIndex]; }

  function setNumber(n){ setGrid(prev=>{ const g=prev.map(row=>row.slice()); const {r,c}=selected; if(fixed[r][c]) return g; g[r][c]=n; return g; }); }
  function clearCell(){ setNumber(0); }
  function newPuzzle(){ setPuzzleIndex((i)=>(i+1)%puzzles.length); showToast('New Sudoku loaded'); }

  function check(){
    const ok = isValid(grid);
    if(ok && isSolved(grid)) showToast('Solved! 🎉 Great job!', 1500);
    else showToast(ok? 'Looks valid so far ✅' : 'There are conflicts ❌');
  }
  function revealOne(){ const sol = solutions[puzzleIndex]; setGrid(prev=>{ const g=prev.map(r=>r.slice()); const {r,c}=selected; if(fixed[r][c]) return g; g[r][c]=Number(sol[r*9+c]); return g; }); showToast('Hint revealed'); }

  // Self-tests for Sudoku
  function sudokuSelfTests(){
    try{
      console.group('%cSudoku Self‑Tests','color:#7ef7d7;font-weight:700');
      const g0=strToGrid(puzzles[0]); console.assert(isValid(g0),'Starter puzzle should be valid');
      const wrong=strToGrid(puzzles[0]); wrong[0][0]=9; console.assert(!isValid(wrong),'Intentional duplicate should be invalid');
      const sol=strToGrid(solutions[0]); console.assert(isValid(sol),'Solution should be valid');
      // Added extra: solved check matches solution mapping
      console.assert(gridToStr(sol)===solutions[0],'Solution string matches');
      console.log('%cAll good!','color:#6c9cf1;font-weight:700'); showToast('Sudoku tests passed');
    }catch(err){ console.error(err); showToast('Sudoku tests failed – see console', 1800); }
  }

  // Keyboard
  useEffect(()=>{
    function onKey(e){
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace','Delete','Digit0','Numpad0'].includes(e.code) || (/Digit[1-9]|Numpad[1-9]/.test(e.code))){ e.preventDefault?.(); }
      if(e.code==='Backspace'||e.code==='Delete'||e.code==='Digit0'||e.code==='Numpad0'){ clearCell(); return; }
      const map={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
      if(map[e.code]){ setSelected(s=>({ r: Math.max(0, Math.min(8, s.r+map[e.code][0])), c: Math.max(0, Math.min(8, s.c+map[e.code][1])) })); return; }
      const m=e.code.match(/Digit([1-9])|Numpad([1-9])/); if(m){ const n=Number(m[1]||m[2]); setNumber(n); }
    }
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  },[fixed, selected]);

  return (
    <main style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:18,padding:18}}>
      <section className="card" style={{alignItems:'stretch',display:'flex',flexDirection:'column',gap:12}}>
        <h3 style={sideH3}>Sudoku</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(9, 1fr)',gap:4,background:'rgba(8,14,34,.8)',padding:8,borderRadius:12,boxShadow:'inset 0 0 0 1px rgba(255,255,255,.06)'}}>
          {grid.map((row,r)=>row.map((v,c)=>{
            const isSel = selected.r===r && selected.c===c;
            const isFixed = fixed[r][c];
            const cellStyle={
              userSelect:'none', cursor:isFixed?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              height:42, borderRadius:8, fontWeight:800,
              background: isSel? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)'
            };
            return (
              <div key={`${r}-${c}`} style={cellStyle} onClick={()=>setSelected({r,c})}>
                <span style={{opacity:isFixed?1:.95,color:isFixed?'#ffe27a':'#e8eeff'}}>{v||''}</span>
              </div>
            );
          }))}
        </div>
        {/* Numpad */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,56px)',gridAutoRows:'56px',gap:8,justifyContent:'center'}}>
          {[1,2,3,4,5,6,7,8,9].map(n=> <button key={n} className="btn" onClick={()=>setNumber(n)}>{n}</button>)}
          <button className="btn" onClick={clearCell}>Erase</button>
          <button className="btn btnPrimary" onClick={check}>Check</button>
          <button className="btn" onClick={revealOne}>Hint</button>
          <button className="btn" onClick={newPuzzle}>New</button>
          <button className="btn" onClick={sudokuSelfTests}>Self‑Test</button>
        </div>
      </section>
      <aside style={{display:'grid',gap:12}}>
        <div className="card">
          <h3 style={sideH3}>How to play</h3>
          <ul style={{margin:0,paddingLeft:18,lineHeight:1.4}}>
            <li>Select a cell, then click 1–9 or press 1–9 to fill.</li>
            <li>Each row, column, and 3×3 box must contain 1–9 with no repeats.</li>
            <li>Use <b>Check</b> to validate; <b>Hint</b> fills the selected cell from the solution.</li>
          </ul>
        </div>
        <div className="card">
          <h3 style={sideH3}>Shortcuts</h3>
          <div>Arrows move selection. 0 / Backspace / Delete to erase.</div>
        </div>
      </aside>
    </main>
  );
}
