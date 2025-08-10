import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ohana Arcade – Single‑file React App (Sky‑Blue Theme)
 * Games: Tetris (Lilo & Stitch quotes) + Sudoku + Marvel Quiz
 * - Responsive layout (2/3 width on desktop, single column on mobile)
 * - Mobile Tetris touch controls
 * - Path2D fill fix for rounded cells
 * - Self‑tests for all games
 */

export default function OhanaArcade() {
  const [game, setGame] = useState('tetris'); // 'tetris' | 'sudoku' | 'marvel'
  return (
    <div className="min-h-screen text-[#0f3554]" style={{
      background: 'linear-gradient(180deg, #e0f7ff 0%, #f9fdff 40%, #ffffff 100%)'
    }}>
      <BaseStyles />
      <Stars />

      <div className="flex justify-center pt-6">
        <div className="container" style={{ width: '66.6667vw', maxWidth: 1280, minWidth: 640 }}>
          <header className="flex flex-wrap items-center justify-center gap-3 md:gap-4 border-b border-[#cfe9ff] pb-3 mb-4">
            <h1 className="text-xl md:text-2xl font-bold m-0">Ohana Arcade</h1>
            <nav className="seg" role="tablist" aria-label="Choose game">
              <button
                role="tab"
                aria-selected={game === 'tetris'}
                className={`seg-btn ${game === 'tetris' ? 'is-active' : ''}`}
                onClick={() => setGame('tetris')}
              >
                <span className="seg-ico" aria-hidden>🎮</span>
                <span className="seg-label">Tetris</span>
              </button>
              <button
                role="tab"
                aria-selected={game === 'sudoku'}
                className={`seg-btn ${game === 'sudoku' ? 'is-active' : ''}`}
                onClick={() => setGame('sudoku')}
              >
                <span className="seg-ico" aria-hidden>🧩</span>
                <span className="seg-label">Sudoku</span>
              </button>
              <button
                role="tab"
                aria-selected={game === 'marvel'}
                className={`seg-btn ${game === 'marvel' ? 'is-active' : ''}`}
                onClick={() => setGame('marvel')}
              >
                <span className="seg-ico" aria-hidden>🦸‍♂️</span>
                <span className="seg-label">Marvel Quiz</span>
              </button>
            </nav>
          </header>

          {game === 'tetris' ? <Tetris /> : game === 'sudoku' ? <Sudoku /> : <MarvelQuiz />}

          <footer className="text-center px-4 pb-6 opacity-80">
            Tetris: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause, R restart. &nbsp;|
            &nbsp;Sudoku: tap a cell then 1–9 (or use the pad). 0/Backspace to erase; arrows to move. |
            &nbsp;Marvel Quiz: pick an answer, use Skip, aim for a perfect score.
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
      .star{position:absolute;width:2px;height:2px;background:#79c5ff;opacity:.6;border-radius:50%;filter:drop-shadow(0 0 6px #96d6ff);animation:twinkle 3s infinite ease-in-out}
      @keyframes twinkle{0%,100%{opacity:.3}50%{opacity:1}}
      .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#ffffff;border:1px solid #cfe9ff;color:#0f3554;padding:12px 16px;border-radius:12px;box-shadow:0 10px 30px rgba(30,136,229,.12);opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;z-index:5}
      .toast.show{opacity:1;transform:translateX(-50%) translateY(-6px)}
      .btn{cursor:pointer;background:#e6f3ff;color:#0f3554;border:1px solid #b9e0ff;border-radius:999px;padding:12px 16px;font-weight:700;letter-spacing:.3px;touch-action:manipulation}
      .btnPrimary{background:linear-gradient(90deg,#4fc3f7,#2196f3);color:#ffffff;border:none}
      .card{background:#ffffff;border:1px solid #dbeafe;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(30,136,229,.08)}
      .two-col{display:grid;grid-template-columns:1fr 280px;gap:18px;padding:18px}
      .mobile-pad{display:grid;grid-template-columns:repeat(3, minmax(56px, 1fr));grid-auto-rows:56px;gap:10px;justify-content:center;width:100%}
      .mobile-pad .btn{border-radius:16px}
      /* --- Fancy segmented tabs --- */
      .seg{display:inline-flex;align-items:center;gap:6px;padding:6px;background:#eaf5ff;border:1px solid #cfe9ff;border-radius:999px;box-shadow:0 6px 20px rgba(30,136,229,.08)}
      .seg-btn{position:relative;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:none;border-radius:999px;font-weight:800;letter-spacing:.2px;cursor:pointer;color:#0f3554;background:#ffffff;transition:transform .08s ease, box-shadow .2s ease, background .2s ease}
      .seg-btn .seg-ico{font-size:1.1em;line-height:1}
      .seg-btn.is-active{color:#ffffff;background:linear-gradient(90deg,#4fc3f7,#2196f3);box-shadow:0 6px 18px rgba(33,150,243,.25)}
      .seg-btn:focus-visible{outline:none;box-shadow:0 0 0 2px #90caf9, 0 0 0 4px rgba(33,150,243,.45)}
      .seg-btn:active{transform:translateY(1px)}
      @media (max-width: 760px){
        .container{ width:95vw !important; min-width:0 !important; }
        .two-col{ grid-template-columns: 1fr; padding: 12px; gap: 12px; }
        h1{ font-size: 1.125rem !important; }
        .seg{width:100%;justify-content:space-between}
        .seg-btn{flex:1;justify-content:center}
      }
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
  const el = document.getElementById('toast'); if(!el) return;
  // @ts-ignore store timeout id on element
  const old = el._t; if(old) clearTimeout(old);
  el.textContent=msg; el.classList.add('show');
  // @ts-ignore
  el._t=setTimeout(()=>el.classList.remove('show'), ms);
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
  const [best, setBest] = useState(Number(typeof window!=='undefined' ? (localStorage.getItem('ohana-tetris-best')||0) : 0));
  const [quote, setQuote] = useState('Fill a line to hear from Lilo & Stitch 💫');

  const COLS=10, ROWS=20, cellPx=32;
  const COLORS = useMemo(()=>({ I:'#4fc3f7', J:'#64b5f6', L:'#90caf9', O:'#ffd54f', S:'#81d4fa', T:'#42a5f5', Z:'#29b6f6' }),[]);
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
  function drawCell(x,y,type,ghost=false){ const ctx=ctxRef.current; if(!ctx) return; const px=x*cellPx, py=y*cellPx; const color=COLORS[type]||'#4fc3f7'; ctx.fillStyle=color; ctx.globalAlpha=ghost?0.25:1; const r=6; const base=roundRectPath(px+1,py+1,cellPx-2,cellPx-2,r); ctx.fill(base); ctx.globalAlpha=ghost?0.18:0.4; ctx.fillStyle='#ffffff'; const gloss=roundRectPath(px+4,py+4,cellPx-8,(cellPx-8)/3,r); ctx.fill(gloss); ctx.globalAlpha=1; }
  function draw(){ const ctx=ctxRef.current, canvas=canvasRef.current; if(!ctx||!canvas) return; ctx.clearRect(0,0,canvas.width,canvas.height); const b=boardRef.current; for(let y=0;y<ROWS;y++){ for(let x=0;x<COLS;x++){ if(b[y][x]) drawCell(x,y,b[y][x]); else { ctx.globalAlpha=.12; ctx.fillStyle='#1e88e5'; ctx.fillRect(x*cellPx+1,y*cellPx+1,cellPx-2,cellPx-2); ctx.globalAlpha=1; } } } let gy=pieceRef.current.y; while(!collides(pieceRef.current,0,(gy-pieceRef.current.y)+1)) gy++; for(let y=0;y<pieceRef.current.shape.length;y++) for(let x=0;x<pieceRef.current.shape[y].length;x++) if(pieceRef.current.shape[y][x] && gy+y>=0) drawCell(pieceRef.current.x+x, gy+y, pieceRef.current.type, true); for(let y=0;y<pieceRef.current.shape.length;y++) for(let x=0;x<pieceRef.current.shape[y].length;x++) if(pieceRef.current.shape[y][x] && pieceRef.current.y+y>=0) drawCell(pieceRef.current.x+x, pieceRef.current.y+y, pieceRef.current.type); }
  function beep(freq=600, dur=.06){ if(!soundOn) return; if(!audioCtxRef.current) audioCtxRef.current=new (window.AudioContext||window.webkitAudioContext)(); const a=audioCtxRef.current; const o=a.createOscillator(); const g=a.createGain(); o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(.2,a.currentTime+.01); o.start(); o.stop(a.currentTime+dur); o.onended=()=>g.disconnect(); }
  function renderNext(){ const n=nextRef.current; if(!n||!nextPieceRef.current) return; n.innerHTML=''; for(let i=0;i<25;i++){ const d=document.createElement('div'); d.style.width='20px'; d.style.height='20px'; d.style.borderRadius='4px'; d.style.background='transparent'; n.appendChild(d);} const sh=nextPieceRef.current.shape; const offX=Math.floor((5-sh[0].length)/2), offY=Math.floor((5-sh.length)/2); [...n.children].forEach((cell,idx)=>{ const gx=idx%5, gy=Math.floor(idx/5); const sx=gx-offX, sy=gy-offY; const on=sh[sy]&&sh[sy][sx]; if(on){ cell.style.background=COLORS[nextPieceRef.current.type]; cell.style.opacity=.95; } }); }
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
  function lockPiece(){ merge(pieceRef.current); beep(420,.05); const c=clearLines(); if(c>0){ const gains=[0,100,300,500,800][c]||c*300; setScore(prev=>{ const nextScore=prev + gains*level; setBest(b=>{ const nb=Math.max(b, nextScore); if(typeof window!=='undefined') localStorage.setItem('ohana-tetris-best', String(nb)); return nb; }); return nextScore;}); setLines(ln=>{ const nl=ln+c; maybeLevelUp(nl, level); return nl;}); showQuote(); beep(660,.07); setTimeout(()=>beep(880,.07),70);} newPiece(); if(collides(pieceRef.current,0,0)){ setPlaying(false); showToast('Game Over – Press Restart', 2000); beep(160,.2);} }

  useEffect(()=>{
    const canvas=canvasRef.current; const ctx=canvas?.getContext('2d'); if(!canvas||!ctx) return; ctxRef.current=ctx;
    const DPR=Math.max(1, Math.min(2, window.devicePixelRatio||1));
    function resize(){
      const maxCssW = COLS * cellPx;
      const targetCssW = Math.min(maxCssW, Math.floor(window.innerWidth * 0.95));
      const cssH = Math.floor(targetCssW * (ROWS / COLS));
      canvas.width = COLS * cellPx * DPR;
      canvas.height = ROWS * cellPx * DPR;
      canvas.style.width = `${targetCssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    resize(); window.addEventListener('resize', resize);
    boardRef.current=emptyBoard(); bagRef.current=[]; pieceRef.current=createPiece(nextType()); nextPieceRef.current=createPiece(nextType()); renderNext(); draw();
    let raf; function loop(ts){ if(!playing){ raf=requestAnimationFrame(loop); return; } if(!lastDropRef.current) lastDropRef.current=ts; const dt=ts-lastDropRef.current; if(dt>=dropIntervalRef.current){ softDrop(); lastDropRef.current=ts; } draw(); raf=requestAnimationFrame(loop);} raf=requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },[playing]);

  useEffect(()=>{
    const kb=(e)=>{ if(e.repeat) return; if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyP','KeyR'].includes(e.code)) e.preventDefault(); switch(e.code){ case 'ArrowLeft': if(!collides(pieceRef.current,-1,0)){ pieceRef.current.x-=1; draw(); } break; case 'ArrowRight': if(!collides(pieceRef.current,1,0)){ pieceRef.current.x+=1; draw(); } break; case 'ArrowDown': softDrop(); break; case 'ArrowUp': { const r=rotate(pieceRef.current.shape); if(!collides(pieceRef.current,0,0,r)){ pieceRef.current.shape=r; draw(); break;} if(!collides(pieceRef.current,-1,0,r)){ pieceRef.current.x-=1; pieceRef.current.shape=r; draw(); break;} if(!collides(pieceRef.current,1,0,r)){ pieceRef.current.x+=1; pieceRef.current.shape=r; draw(); break;} break;} case 'Space': hardDrop(); break; case 'KeyP': setPlaying(p=>{ showToast(p?'Paused':'Resumed'); return !p;}); break; case 'KeyR': restart(); break; }};
    window.addEventListener('keydown', kb);
    return ()=>window.removeEventListener('keydown', kb);
  }, []);

  function restart(){ boardRef.current=emptyBoard(); bagRef.current=[]; pieceRef.current=createPiece(nextType()); nextPieceRef.current=createPiece(nextType()); setScore(0); setLevel(1); setLines(0); dropIntervalRef.current=800; lastDropRef.current=0; renderNext(); draw(); setPlaying(true); showToast('New Game – Good luck!'); }

  return (
    <main className="two-col">
      <section className="card" style={{alignItems:'center',display:'flex',flexDirection:'column',gap:12}}>
        <h3 style={sideH3}>Tetris</h3>
        <canvas ref={canvasRef} width={320} height={640} aria-label="Tetris board" style={{background:'#ffffff',borderRadius:10,boxShadow:'inset 0 0 0 1px #dbeafe, 0 10px 30px rgba(30,136,229,.10)'}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <button className="btn btnPrimary" onClick={()=>{ if(!playing){ setPlaying(true); lastDropRef.current=0; showToast('Game Start!'); if(audioCtxRef.current && audioCtxRef.current.resume) audioCtxRef.current.resume(); } }}>Start</button>
          <button className="btn" onClick={()=>setPlaying(p=>{ showToast(p?'Paused':'Resumed'); return !p; })}>Pause (P)</button>
          <button className="btn" onClick={restart}>Restart (R)</button>
          <button className="btn" onClick={()=>setSoundOn(s=>!s)}>Sound: {soundOn?'On':'Off'}</button>

        </div>

        <div className="mobile-pad">
          <button className="btn" onClick={()=>{ if(!collides(pieceRef.current,-1,0)){ pieceRef.current.x--; draw(); } }}>◀</button>
          <button className="btn" onClick={()=>{ const r=rotate(pieceRef.current.shape); if(!collides(pieceRef.current,0,0,r)){ pieceRef.current.shape=r; draw(); return;} if(!collides(pieceRef.current,-1,0,r)){ pieceRef.current.x--; pieceRef.current.shape=r; draw(); return;} if(!collides(pieceRef.current,1,0,r)){ pieceRef.current.x++; pieceRef.current.shape=r; draw(); return;} }}>⟳</button>
          <button className="btn" onClick={()=>{ if(!collides(pieceRef.current,1,0)){ pieceRef.current.x++; draw(); } }}>▶</button>
          <button className="btn" onClick={()=>softDrop()}>▼</button>
          <button className="btn btnPrimary" style={{gridColumn:'span 3'}} onClick={()=>hardDrop()}>HARD DROP</button>
        </div>

        <div className="card" style={{width:'100%'}}>
          <h3 style={sideH3}>Next</h3>
          <div ref={nextRef} style={{display:'grid',gridTemplateColumns:'repeat(5,20px)',gridAutoRows:'20px',gap:3,justifyContent:'start',background:'#ffffff',padding:10,borderRadius:10,boxShadow:'inset 0 0 0 1px #dbeafe'}}/>
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
          <div style={{minHeight:72,background:'#e9f4ff',borderRadius:12,padding:10,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontWeight:700,lineHeight:1.3,fontSize:'clamp(12px, 2.4vw, 16px)'}}>{quote}</div>
        </div>
      </aside>
    </main>
  );
}

function Stat({label, value}){ return <div style={{background:'#e9f4ff',borderRadius:12,padding:10,textAlign:'center'}}><div>{label}</div><div style={{fontSize:22,fontWeight:800}}>{value}</div></div>; }
const sideH3 = {margin:'0 0 8px 0',fontSize:14,opacity:.9,letterSpacing:'.3px',textTransform:'uppercase'};

/* -------------------- SUDOKU -------------------- */
function Sudoku(){
  const puzzles = useMemo(()=>[
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    '300000000005009000200504000000700090000000000040003000000201004000800100000000006'
  ],[]);
  const solutions = useMemo(()=>[
    '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    '435269781682571493197834562826195347374682915951743628519326874248957136763418259',
    '384162957615879432279534861832745196197286345546913728758621493463897215921458673'
  ],[]);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [grid, setGrid] = useState(strToGrid(puzzles[0]));
  const [fixed, setFixed] = useState(strToGrid(puzzles[0]).map(row=>row.map(v=>v!==0)));
  const [selected, setSelected] = useState({r:0,c:0});

  useEffect(()=>{ const g=strToGrid(puzzles[puzzleIndex]); setGrid(g); setFixed(g.map(r=>r.map(v=>v!==0))); },[puzzleIndex, puzzles]);

  function strToGrid(s){ return Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>Number(s[r*9+c]))); }
  function gridToStr(g){ return g.flat().join(''); }

  function isValid(g){
    for(let r=0;r<9;r++){ const seen=new Set(); for(let c=0;c<9;c++){ const v=g[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);} }
    for(let c=0;c<9;c++){ const seen=new Set(); for(let r=0;r<9;r++){ const v=g[r][c]; if(v===0) continue; if(seen.has(v)) return false; seen.add(v);} }
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

  useEffect(()=>{
    function onKey(e){
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace','Delete','Digit0','Numpad0'].includes(e.code) || (/Digit[1-9]|Numpad[1-9]/.test(e.code))){ e.preventDefault?.(); }
      if(e.code==='Backspace'||e.code==='Delete'||e.code==='Digit0'||e.code==='Numpad0'){ clearCell(); return; }
      const map={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
      if(map[e.code]){ setSelected(s=>({ r: Math.max(0, Math.min(8, s.r+map[e.code][0])), c: Math.max(0, Math.min(8, s.c+map[e.code][1])) })); return; }
      const m=e.code.match(/Digit([1-9])|Numpad([1-9])/); if(m){ const n=Number(m[1]||m[2]); setNumber(n); }
    }
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="two-col">
      <section className="card" style={{alignItems:'stretch',display:'flex',flexDirection:'column',gap:12}}>
        <h3 style={sideH3}>Sudoku</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(9, minmax(0, 1fr))',gap:4,background:'#ffffff',padding:8,borderRadius:12,boxShadow:'inset 0 0 0 1px #dbeafe'}}>
          {grid.map((row,r)=>row.map((v,c)=>{
            const isSel = selected.r===r && selected.c===c;
            const isFixed = fixed[r][c];
            const cellStyle = {
              userSelect:'none', cursor:isFixed?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              height:'auto', aspectRatio:'1 / 1', borderRadius:8, fontWeight:800,
              background: isSel? '#e3f2ff' : '#f3f8ff',
              border: '1px solid #e1efff',
              color: '#0f3554'
            };
            return (
              <div key={`${r}-${c}`} style={cellStyle} onClick={()=>setSelected({r,c})}>
                <span style={{opacity:isFixed?1:.95,color:isFixed?'#ffb300':'#0f3554'}}>{v||''}</span>
              </div>
            );
          }))}
        </div>
        <div className="mobile-pad" style={{gridTemplateColumns:'repeat(5, minmax(56px, 1fr))'}}>
          {[1,2,3,4,5,6,7,8,9].map(n=> <button key={n} className="btn" onClick={()=>setNumber(n)}>{n}</button>)}
          <button className="btn" onClick={clearCell}>Erase</button>
          <button className="btn btnPrimary" onClick={check}>Check</button>
          <button className="btn" onClick={revealOne}>Hint</button>
          <button className="btn" onClick={newPuzzle}>New</button>

        </div>
      </section>
      <aside style={{display:'grid',gap:12}}>
        <div className="card">
          <h3 style={sideH3}>How to play</h3>
          <ul style={{margin:0,paddingLeft:18,lineHeight:1.4}}>
            <li>Tap a cell, then tap 1–9 or press 1–9 to fill.</li>
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

/* -------------------- MARVEL QUIZ -------------------- */
function MarvelQuiz(){
  // Base bank (we'll add new ones and sample 10 randomly per playthrough)
  const QUESTIONS = useMemo(()=>[
    { q: 'Which metal is bonded to Wolverine\'s skeleton?', choices: ['Vibranium','Adamantium','Uru','Carbonadium'], a: 1 },
    { q: 'What is the name of Thor\'s hammer (primary in many stories)?', choices: ['Gungnir','Stormbreaker','Hofund','Mjolnir'], a: 3 },
    { q: 'T\'Challa is the king of which nation?', choices: ['Genosha','Wakanda','Latveria','Sokovia'], a: 1 },
    { q: 'Which Infinity Stone controls time?', choices: ['Blue','Green','Red','Purple'], a: 1 },
    { q: 'Natasha Romanoff is also known as…', choices: ['Black Widow','Scarlet Witch','Wasp','Gamora'], a: 0 },
    { q: 'Peter Parker works as a photographer for which newspaper (classic canon)?', choices: ['Daily Planet','Daily Bugle','The Post','Clarion'], a: 1 },
    { q: 'Which hero famously says “I can do this all day”?', choices: ['Iron Man','Captain America','Hawkeye','Star-Lord'], a: 1 },
    { q: 'What kind of scientist is Bruce Banner primarily?', choices: ['Biochemist','Nuclear physicist','Astrophysicist','Engineer'], a: 1 },
    { q: 'Which city is Daredevil strongly associated with?', choices: ['Gotham','Metropolis','Hell\'s Kitchen','Star City'], a: 2 },
    { q: 'Which team is Logan (Wolverine) most associated with?', choices: ['Avengers','X‑Men','Fantastic Four','Inhumans'], a: 1 },
    // Added questions
    { q: 'Doctor Strange\'s Sanctum Sanctorum is in which city?', choices: ['Los Angeles','London','New York City','Miami'], a: 2 },
    { q: 'What is the name of the Guardians of the Galaxy\'s primary ship (early films)?', choices: ['Benatar','Milano','Razor Crest','Quinjet'], a: 1 },
    { q: 'What is Ant‑Man\'s civilian name (MCU, primary)?', choices: ['Scott Lang','Hank Pym','Darren Cross','Sam Wilson'], a: 0 },
    { q: 'Which eye does Nick Fury wear an eyepatch over (most depictions)?', choices: ['Right eye','Left eye'], a: 1 },
    { q: "What is the real name of Spider-Man?", choices: ["Peter Parker","Bruce Banner","Steve Rogers","Tony Stark"], a: 0 },
    { q: "What metal is Captain America's shield primarily made from?", choices: ["Vibranium","Adamantium","Uru","Steel"], a: 0 },
    { q: "Thor wields a hammer called what?", choices: ["Mjolnir","Stormbreaker","Gungnir","Hofund"], a: 0 },
    { q: "Which city does Spider-Man primarily protect?", choices: ["New York City","Los Angeles","Chicago","London"], a: 0 },
    { q: "Daredevil primarily protects which New York neighborhood?", choices: ["Hell's Kitchen","Harlem","Queens","Brooklyn"], a: 0 },
    { q: "Who often leads the Guardians of the Galaxy?", choices: ["Star-Lord","Rocket Raccoon","Gamora","Drax"], a: 0 },
    { q: "Black Panther rules which fictional African nation?", choices: ["Wakanda","Latveria","Genosha","Sokovia"], a: 0 },
    { q: "What is the name of Thor's axe crafted after Mjolnir?", choices: ["Stormbreaker","Mjolnir","Jarnbjorn","Gungnir"], a: 0 },
    { q: "What is the name of Tony Stark's original suit AI?", choices: ["JARVIS","FRIDAY","KAREN","ULTRON"], a: 0 },
    { q: "Who is T'Challa's sister?", choices: ["Shuri","Okoye","Nakia","Ramonda"], a: 0 },
    { q: "Nick Fury directs which organization?", choices: ["S.H.I.E.L.D.","HYDRA","AIM","The Hand"], a: 0 },
    { q: "Thanos seeks which powerful set of artifacts?", choices: ["Infinity Stones","Mother Boxes","Chaos Emeralds","Norn Stones"], a: 0 },
    { q: "What is the real name of Iron Man?", choices: ["Tony Stark","Steve Rogers","Bruce Banner","Peter Parker"], a: 0 },
    { q: "Who is the alter ego of Captain America?", choices: ["Steve Rogers","Bucky Barnes","Sam Wilson","Clint Barton"], a: 0 },
    { q: "What best describes Hulk's abilities?", choices: ["Super strength that increases with rage","Weather manipulation","Magnetism control","Telepathy"], a: 0 },
    { q: "Whose powers are described as: 'Sorcery and mystic arts'?", choices: ["Doctor Strange","Scarlet Witch","Loki","Vision"], a: 0 },
    { q: "What is Hawkeye's signature weapon?", choices: ["Bow and arrows","Shield","Hammer","Repulsors"], a: 0 },
    { q: "Spider-Man's Aunt is named?", choices: ["May Parker","June Parker","Mary Parker","Anna Watson"], a: 0 },
    { q: "Black Widow's first name is?", choices: ["Natasha","Carol","Wanda","Maria"], a: 0 },
    { q: "Which of the following is a member of the X-Men?", choices: ["Cyclops","Rocket Raccoon","Black Widow","Loki"], a: 0 },
    { q: "Who is NOT a member of the Avengers?", choices: ["Magneto","Thor","Hawkeye","Iron Man"], a: 0 },
    { q: "Which city houses Doctor Strange's Sanctum Sanctorum?", choices: ["New York City","Hong Kong","London","Kamar-Taj"], a: 0 },
    { q: "What is the real name of Black Panther?", choices: ["T'Challa","M'Baku","Erik Killmonger","Shuri"], a: 0 },
    { q: "Whose powers are described as: 'Optic blasts'?", choices: ["Cyclops","Storm","Iron Man","Doctor Strange"], a: 0 },
    { q: "What is the name of Thor's enchanted hammer?", choices: ["Mjolnir","Stormbreaker","Jarnbjorn","Gungnir"], a: 0 },
    { q: "Who is Loki's brother?", choices: ["Thor","Balder","Heimdall","Hela"], a: 0 },
    { q: "What best describes Captain Marvel's abilities?", choices: ["Cosmic energy projection and flight","Wall-crawling","Magnetism control","Super-soldier strength"], a: 0 },
    { q: "Whose powers are described as: 'Weather manipulation'?", choices: ["Storm","Thor","Loki","Scarlet Witch"], a: 0 },
    { q: "Which fictional African nation is protected by Black Panther?", choices: ["Wakanda","Genosha","Sokovia","Latveria"], a: 0 },
    { q: "Who often leads the Guardians of the Galaxy?", choices: ["Star-Lord","Gamora","Rocket Raccoon","Drax"], a: 0 },
    { q: "What is the name of Tony Stark's later AI assistant?", choices: ["FRIDAY","JARVIS","EDITH","KAREN"], a: 0 },
    { q: "What is Daredevil's real name?", choices: ["Matt Murdock","Frank Castle","Peter Parker","Stephen Strange"], a: 0 },
  ],[]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [usedSkip, setUsedSkip] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // shuffle helper
  const shuffle = (arr) => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  // choose 10 random questions per run
  const ACTIVE = useMemo(()=> shuffle(QUESTIONS).slice(0,10), [QUESTIONS, runKey]);

  function pick(i){
    if(done) return;
    setReveal(true);
    const correct = i === ACTIVE[index].a;
    if(correct) { setScore(s=>s+1); showToast('Correct! ✨'); }
    else showToast('Not quite.');
    setTimeout(()=>{
      setReveal(false);
      if(index+1>=ACTIVE.length){ setDone(true); showToast('Quiz complete!'); }
      else setIndex(index+1);
    }, 650);
  }

  function skip(){ if(usedSkip||done) return; setUsedSkip(true); showToast('Skipped ➡️'); setIndex(i=>Math.min(i+1, ACTIVE.length-1)); }
  function restart(){ setRunKey(k=>k+1); setIndex(0); setScore(0); setDone(false); setUsedSkip(false); setReveal(false); showToast('New Quiz!'); }

  const q = ACTIVE[index];
  const progressPct = Math.round(((index) / ACTIVE.length) * 100);

  return (
    <main className="two-col">
      <section className="card" style={{display:'grid',gap:12}}>
        <h3 style={sideH3}>Marvel Quiz</h3>
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:8,lineHeight:1.3}}>{q.q}</div>
          <div style={{display:'grid',gap:10}}>
            {q.choices.map((c,i)=>{
              const isCorrect = i===q.a;
              const show = reveal;
              const bg = show ? (isCorrect? 'linear-gradient(90deg,#4fc3f7,#2196f3)' : '#e9f4ff') : '#e9f4ff';
              const color = show && isCorrect ? '#ffffff' : '#0f3554';
              const border = show ? (isCorrect? 'transparent' : '#cfe9ff') : '#cfe9ff';
              return (
                <button key={i} className="btn" style={{textAlign:'left',justifyContent:'flex-start',background:bg,color, borderColor:border}} onClick={()=>pick(i)} disabled={done}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{display:'grid',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1,height:8,background:'#e6f3ff',borderRadius:999,overflow:'hidden'}}>
              <div style={{width:progressPct+'%',height:'100%',background:'linear-gradient(90deg,#4fc3f7,#2196f3)'}}/>
            </div>
            <div style={{opacity:.8,fontWeight:700}}>{index+1} / {ACTIVE.length}</div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            <button className="btn" onClick={restart}>Restart</button>
            <button className="btn btnPrimary" onClick={skip} disabled={usedSkip}>Skip {usedSkip?'✓':''}</button>
          </div>
        </div>
      </section>
      <aside style={{display:'grid',gap:12}}>
        <div className="card">
          <h3 style={sideH3}>Score</h3>
          <div style={{fontSize:28,fontWeight:900,textAlign:'center'}}>{score} / {ACTIVE.length}</div>
          {done && (
            <div style={{marginTop:8,textAlign:'center',fontWeight:700}}>
              {score===ACTIVE.length? 'Flawless victory! ✨' : score>ACTIVE.length/2? 'Nice work! 🦸' : 'Good try — play again!'}
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={sideH3}>Tips</h3>
          <ul style={{margin:0,paddingLeft:18,lineHeight:1.4}}>
            <li>Pick the best answer. We reveal the correct one briefly.</li>
            <li>Use <b>Skip</b> once per run.</li>
            <li>Restart anytime to get a fresh random set of questions.</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
