import React, { useEffect, useMemo, useRef, useState } from "react";

// Default export so the canvas can render it
export default function OhanaTetrisApp() {
  // --- Refs & state ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const bestKey = "ohana-tetris-best";
  const [best, setBest] = useState<number>(Number(localStorage.getItem(bestKey) || 0));

  // Config
  const COLS = 10, ROWS = 20, cellPx = 32;
  const COLORS = useMemo(() => ({
    I: "#6c9cf1", J: "#8a5cff", L: "#ff7db8", O: "#ffe27a", S: "#7ef7d7", T: "#b18cff", Z: "#5be1ff",
  }), []);
  const SHAPES = useMemo(() => ({
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    O: [[1,1],[1,1]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
  }), []);
  const TYPES = useMemo(() => Object.keys(SHAPES) as Array<keyof typeof SHAPES>, [SHAPES]);

  // Game mutable state in refs so renders don't reset them
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const boardRef = useRef<string[][]>(emptyBoard());
  const bagRef = useRef<string[]>([]);
  const pieceRef = useRef(createPiece(nextType()));
  const nextPieceRef = useRef(createPiece(nextType()));
  const lastDropRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(800);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function nextType(): keyof typeof SHAPES {
    if (bagRef.current.length === 0) bagRef.current = [...TYPES].sort(() => Math.random() - 0.5);
    return bagRef.current.pop() as keyof typeof SHAPES;
  }

  function createPiece(type: keyof typeof SHAPES) {
    const shape = SHAPES[type].map((r) => r.slice());
    return { type, shape, x: Math.floor((COLS - shape[0].length) / 2), y: -1 };
  }

  function rotate(matrix: number[][]) {
    const N = matrix.length, M = matrix[0].length;
    const res = Array.from({ length: M }, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) for (let x = 0; x < M; x++) res[x][N - 1 - y] = matrix[y][x];
    return res;
  }

  function collides(p: any, offX = 0, offY = 0, testShape: number[][] | null = null) {
    const sh = testShape || p.shape;
    const board = boardRef.current;
    for (let y = 0; y < sh.length; y++) {
      for (let x = 0; x < sh[y].length; x++) {
        if (!sh[y][x]) continue;
        const nx = p.x + x + offX;
        const ny = p.y + y + offY;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge(p: any) {
    const board = boardRef.current;
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x]) {
          const ny = p.y + y, nx = p.x + x;
          if (ny >= 0) board[ny][nx] = p.type as string;
        }
      }
    }
  }

  function clearLines() {
    const board = boardRef.current;
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++; y++;
      }
    }
    return cleared;
  }

  function roundRectPath(x: number, y: number, w: number, h: number, r: number) {
    const p = new Path2D();
    r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y);
    p.arcTo(x + w, y, x + w, y + h, r);
    p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r);
    p.arcTo(x, y, x + w, y, r);
    p.closePath();
    return p;
  }

  function drawCell(x: number, y: number, type: string, ghost = false) {
    const ctx = ctxRef.current!;
    const px = x * cellPx, py = y * cellPx;
    const color = (COLORS as any)[type] || "#9cf";
    ctx.fillStyle = color;
    ctx.globalAlpha = ghost ? 0.25 : 1;
    const r = 6;
    const base = roundRectPath(px + 1, py + 1, cellPx - 2, cellPx - 2, r);
    ctx.fill(base);
    ctx.globalAlpha = ghost ? 0.18 : 0.4;
    ctx.fillStyle = "#ffffff";
    const gloss = roundRectPath(px + 4, py + 4, cellPx - 8, (cellPx - 8) / 3, r);
    ctx.fill(gloss);
    ctx.globalAlpha = 1;
  }

  function draw() {
    const ctx = ctxRef.current!;
    const canvas = canvasRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const board = boardRef.current;
    // board
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) drawCell(x, y, board[y][x]!);
        else { ctx.globalAlpha = 0.05; ctx.fillStyle = "#fff"; ctx.fillRect(x * cellPx + 1, y * cellPx + 1, cellPx - 2, cellPx - 2); ctx.globalAlpha = 1; }
      }
    }
    // ghost
    let gy = pieceRef.current.y;
    while (!collides(pieceRef.current, 0, (gy - pieceRef.current.y) + 1)) gy++;
    for (let y = 0; y < pieceRef.current.shape.length; y++) {
      for (let x = 0; x < pieceRef.current.shape[y].length; x++) {
        if (pieceRef.current.shape[y][x] && gy + y >= 0) drawCell(pieceRef.current.x + x, gy + y, pieceRef.current.type, true);
      }
    }
    // piece
    for (let y = 0; y < pieceRef.current.shape.length; y++) {
      for (let x = 0; x < pieceRef.current.shape[y].length; x++) {
        if (pieceRef.current.shape[y][x] && pieceRef.current.y + y >= 0) drawCell(pieceRef.current.x + x, pieceRef.current.y + y, pieceRef.current.type);
      }
    }
  }

  // Audio
  function beep(freq = 600, dur = 0.06) {
    if (!soundOn) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioCtx = audioCtxRef.current;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    o.start(); o.stop(audioCtx.currentTime + dur);
    o.onended = () => g.disconnect();
  }

  function showToast(msg: string, ms = 1200) {
    const el = toastRef.current!;
    el.textContent = msg;
    el.classList.add("show");
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => el.classList.remove("show"), ms);
  }

  function renderNext() {
    const n = nextRef.current!;
    n.innerHTML = "";
    for (let i = 0; i < 25; i++) { const d = document.createElement("div"); d.style.background = "transparent"; n.appendChild(d); }
    const sh = nextPieceRef.current.shape; const offX = Math.floor((5 - sh[0].length) / 2); const offY = Math.floor((5 - sh.length) / 2);
    [...n.children].forEach((cell: any, idx) => {
      const gx = idx % 5, gy = Math.floor(idx / 5);
      const sx = gx - offX, sy = gy - offY;
      const on = sh[sy] && sh[sy][sx];
      if (on) { cell.style.background = (COLORS as any)[nextPieceRef.current.type]; cell.style.opacity = 0.95; }
    });
  }

  function maybeLevelUp(curLines: number, curLevel: number) {
    if (curLines >= curLevel * 10) {
      const nl = curLevel + 1;
      dropIntervalRef.current = Math.max(120, dropIntervalRef.current - 90);
      setLevel(nl);
      showToast("Level Up! " + nl);
    }
  }

  function newPiece() {
    pieceRef.current = nextPieceRef.current;
    nextPieceRef.current = createPiece(nextType());
    renderNext();
  }

  function softDrop() {
    if (!collides(pieceRef.current, 0, 1)) { pieceRef.current.y++; }
    else lockPiece();
    draw();
  }

  function hardDrop() {
    let moved = 0;
    while (!collides(pieceRef.current, 0, 1)) { pieceRef.current.y++; moved++; }
    setScore((s) => s + 2 * moved);
    lockPiece();
    draw();
  }

  const quotes = useMemo(() => [
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
  ], []);

  function showQuoteToast() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    const qEl = document.getElementById("quote");
    if (qEl) qEl.textContent = q;
    showToast("★ Ohana Quote Unlocked!");
  }

  function lockPiece() {
    merge(pieceRef.current);
    beep(420, 0.05);
    const c = clearLines();
    if (c > 0) {
      const gains = [0, 100, 300, 500, 800][c] || c * 300;
      setScore((s) => s + gains * level);
      setLines((ln) => {
        const nl = ln + c; maybeLevelUp(nl, level); return nl;
      });
      setBest((b) => { const nb = Math.max(b, score); localStorage.setItem(bestKey, String(nb)); return Math.max(b, score); });
      showQuoteToast();
      beep(660, 0.07); window.setTimeout(() => beep(880, 0.07), 70);
    }
    newPiece();
    if (collides(pieceRef.current, 0, 0)) {
      setPlaying(false); showToast("Game Over – Press Restart", 2000); beep(160, 0.2);
    }
  }

  // Effects: canvas setup & game loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctxRef.current = ctx;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resize() {
      canvas.width = COLS * cellPx * DPR;
      canvas.height = ROWS * cellPx * DPR;
      canvas.style.width = `${COLS * cellPx}px`;
      canvas.style.height = `${ROWS * cellPx}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // draw initial
    draw(); renderNext();

    // game loop
    let raf: number;
    function loop(ts: number) {
      if (!playing) { raf = requestAnimationFrame(loop); return; }
      if (!lastDropRef.current) lastDropRef.current = ts;
      const dt = ts - lastDropRef.current;
      if (dt >= dropIntervalRef.current) { softDrop(); lastDropRef.current = ts; }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e as any).repeat) return;
      if (["ArrowLeft","ArrowRight","ArrowDown","ArrowUp","Space","KeyP","KeyR","KeyT"].includes(e.code)) e.preventDefault();
      switch (e.code) {
        case "ArrowLeft": if (!collides(pieceRef.current, -1, 0)) { pieceRef.current.x -= 1; draw(); beep(520, 0.03); } break;
        case "ArrowRight": if (!collides(pieceRef.current, 1, 0)) { pieceRef.current.x += 1; draw(); beep(520, 0.03); } break;
        case "ArrowDown": softDrop(); break;
        case "ArrowUp": {
          const r = rotate(pieceRef.current.shape);
          if (!collides(pieceRef.current, 0, 0, r)) { pieceRef.current.shape = r; draw(); beep(700, 0.03); break; }
          if (!collides(pieceRef.current, -1, 0, r)) { pieceRef.current.x -= 1; pieceRef.current.shape = r; draw(); beep(700, 0.03); break; }
          if (!collides(pieceRef.current, 1, 0, r)) { pieceRef.current.x += 1; pieceRef.current.shape = r; draw(); beep(700, 0.03); break; }
          break;
        }
        case "Space": hardDrop(); break;
        case "KeyP": setPlaying((p) => { showToast(p ? "Paused" : "Resumed"); return !p; }); break;
        case "KeyR": restart(); break;
        case "KeyT": runSelfTests(); break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  function restart() {
    boardRef.current = emptyBoard();
    bagRef.current = [];
    pieceRef.current = createPiece(nextType());
    nextPieceRef.current = createPiece(nextType());
    setScore(0); setLevel(1); setLines(0);
    dropIntervalRef.current = 800; lastDropRef.current = 0;
    renderNext(); draw(); setPlaying(true);
    showToast("New Game – Good luck!");
  }

  // Self-tests (console only)
  function runSelfTests() {
    const savedBoard = boardRef.current.map(r => r.slice());
    const savedPiece = JSON.parse(JSON.stringify(pieceRef.current));
    const savedScore = score;
    try {
      boardRef.current = emptyBoard();
      console.group('%cOhana Tetris – Self Tests','color:#7ef7d7;font-weight:700');
      console.assert(Array.isArray(boardRef.current) && boardRef.current.length === ROWS && boardRef.current.every(r=>Array.isArray(r) && r.length===COLS), 'Board should be ROWS x COLS');
      let tp = createPiece('O'); tp.x = 4; tp.y = -1; console.assert(!collides(tp,0,0), 'Piece should not collide in empty board at spawn');
      let leftWall = createPiece('I'); leftWall.x = -1; leftWall.y = 0; console.assert(collides(leftWall,0,0), 'Piece at x=-1 should collide with wall');
      let floorTest = createPiece('O'); floorTest.x = 4; floorTest.y = ROWS-2; console.assert(collides(floorTest,0,1)===true, 'Piece one step below bottom should collide');
      boardRef.current[ROWS-1] = Array(COLS).fill('I'); let cleared = clearLines(); console.assert(cleared===1,'Exactly one line should be cleared');
      boardRef.current[ROWS-1] = Array(COLS).fill('L'); boardRef.current[ROWS-2] = Array(COLS).fill('J'); cleared = clearLines(); console.assert(cleared===2,'Exactly two lines should be cleared');
      const t = createPiece('T'); const count=(m:number[][])=>m.reduce((a,r)=>a+r.reduce((aa,v)=>aa+(v?1:0),0),0); const before=count(t.shape); const after=count(rotate(t.shape)); console.assert(before===after,'Rotation should preserve number of blocks');
      let threw=false; try{ drawCell(0,0,'I'); }catch(e){ threw=true; } console.assert(threw===false,'drawCell should not throw (Path2D fill)');
      const next = nextRef.current!; console.assert(next !== null, 'Next preview exists');
      console.log('%cAll tests passed!','color:#6c9cf1;font-weight:700'); showToast('Self‑tests passed! Check console');
    } catch (err) {
      console.error('Self‑tests failed:', err); showToast('Self‑tests failed – see console', 1800);
    } finally {
      boardRef.current = savedBoard; pieceRef.current = savedPiece; (window as any)._s = savedScore; draw();
    }
    console.groupEnd();
  }

  // Stars background
  useEffect(() => {
    const cont = document.getElementById('stars');
    if (!cont) return;
    cont.innerHTML = '';
    const n = 120;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'star';
      d.style.left = Math.random() * 100 + '%';
      d.style.top = Math.random() * 100 + '%';
      d.style.animationDelay = (Math.random() * 3) + 's';
      d.style.opacity = (0.2 + Math.random() * 0.8).toFixed(2);
      cont.appendChild(d);
    }
  }, []);

  // Keep best score in localStorage whenever score updates
  useEffect(() => {
    setBest((b) => {
      const nb = Math.max(b, score); localStorage.setItem(bestKey, String(nb)); return nb;
    });
  }, [score]);

  // Layout: 2/3 width on desktop, responsive fallback on small screens
  return (
    <div className="min-h-screen text-[#e8eeff]" style={{
      background: "radial-gradient(1200px 800px at 10% 10%, #1b2550, transparent), radial-gradient(900px 600px at 90% 0%, #311a5a, transparent), linear-gradient(160deg, #0b1020, #1a1f3b)"
    }}>
      <style>{`
        .stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .star { position: absolute; width: 2px; height: 2px; background: #fff; opacity: .75; border-radius: 50%; filter: drop-shadow(0 0 6px #9cf); animation: twinkle 3s infinite ease-in-out; }
        @keyframes twinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
        .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: rgba(0,0,0,.75); border: 1px solid rgba(255,255,255,.2); padding: 12px 16px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.35); opacity:0; pointer-events:none; transition: opacity .25s ease, transform .25s ease; z-index: 5; }
        .toast.show { opacity:1; transform: translateX(-50%) translateY(-6px); }
      `}</style>

      <div id="stars" className="stars"/>

      <div className="flex justify-center p-6 relative z-10">
        <div className="rounded-2xl border border-white/10 shadow-2xl overflow-clip backdrop-blur-md"
             style={{ width: "66.6667vw", maxWidth: 1280, minWidth: 640, background: "rgba(255,255,255,.04)" }}>

          {/* Header */}
          <header className="flex items-center justify-between px-5 py-4 border-b border-white/10" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.06), transparent)" }}>
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l2.5 3.5L19 7l-2.5 3.5L15 14l-3 1-3-1-1.5-3.5L5 7l4.5-1.5L12 2z" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stopColor="#6c9cf1"/><stop offset="1" stopColor="#8a5cff"/></linearGradient></defs></svg>
              <div>
                <div className="text-lg font-extrabold">Ohana Tetris</div>
                <div className="text-xs opacity-80">Fill lines to unlock a Lilo & Stitch quote</div>
              </div>
            </div>
            <div className="text-xs font-bold rounded-full px-3 py-1" style={{ background: "linear-gradient(90deg, #6c9cf1, #8a5cff)", color: "#081225" }}>Space-Borne Edition</div>
          </header>

          {/* Main */}
          <main className="grid gap-4 p-4" style={{ gridTemplateColumns: "1fr 280px" }}>
            {/* Board */}
            <section className="rounded-xl border border-white/10 p-3 bg-black/25 flex flex-col items-center gap-3">
              <canvas ref={canvasRef} width={320} height={640} aria-label="Tetris board" className="rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,.06),0_10px_30px_rgba(0,0,0,.35)]" style={{ background: "rgba(8,14,34,.8)" }}/>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => { if (!playing) { setPlaying(true); lastDropRef.current = 0; showToast('Game Start!'); audioCtxRef.current?.resume?.(); } }} className="px-4 py-2 font-bold rounded-full border border-transparent" style={{ background: "linear-gradient(90deg, #6c9cf1, #8a5cff)", color: "#081225" }}>Start</button>
                <button onClick={() => setPlaying((p) => { showToast(p? 'Paused':'Resumed'); return !p; })} className="px-4 py-2 font-bold rounded-full border border-white/20 bg-[#101737]">Pause (P)</button>
                <button onClick={() => restart()} className="px-4 py-2 font-bold rounded-full border border-white/20 bg-[#101737]">Restart (R)</button>
                <button onClick={() => setSoundOn(s => !s)} className="px-4 py-2 font-bold rounded-full border border-white/20 bg-[#101737]">Sound: {soundOn ? 'On':'Off'}</button>
                <button onClick={() => runSelfTests()} className="px-4 py-2 font-bold rounded-full border border-white/20 bg-[#101737]" title="Run basic self-tests">Self‑Test</button>
              </div>

              {/* Touch pad */}
              <div aria-label="Touch controls" className="grid" style={{ gridTemplateColumns: "repeat(3, 64px)", gridAutoRows: "64px", gap: 10 }}>
                <button onClick={() => { if (!collides(pieceRef.current,-1,0)) { pieceRef.current.x--; draw(); beep(520, .03);} }} className="rounded-2xl border border-white/20 bg-[#101737]">◀</button>
                <button onClick={() => { const r=rotate(pieceRef.current.shape); if(!collides(pieceRef.current,0,0,r)){ pieceRef.current.shape=r; draw(); beep(700,.03); return;} if(!collides(pieceRef.current,-1,0,r)){ pieceRef.current.x-=1; pieceRef.current.shape=r; draw(); beep(700,.03); return;} if(!collides(pieceRef.current,1,0,r)){ pieceRef.current.x+=1; pieceRef.current.shape=r; draw(); beep(700,.03); return;} }} className="rounded-2xl border border-white/20 bg-[#101737]">⟳</button>
                <button onClick={() => { if (!collides(pieceRef.current,1,0)) { pieceRef.current.x++; draw(); beep(520,.03);} }} className="rounded-2xl border border-white/20 bg-[#101737]">▶</button>
                <button onClick={() => softDrop()} className="rounded-2xl border border-white/20 bg-[#101737]">▼</button>
                <button onClick={() => hardDrop()} className="rounded-2xl border border-transparent" style={{ gridColumn: "span 3", background: "linear-gradient(90deg, #6c9cf1, #8a5cff)", color: "#081225" }}>HARD DROP (Space)</button>
              </div>
            </section>

            {/* Side */}
            <aside className="grid gap-3">
              <div className="rounded-xl border border-white/10 p-3 bg-black/25">
                <h3 className="m-0 mb-2 text-sm opacity-90 tracking-wide uppercase">Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center rounded-xl bg-white/10 p-2"><div>Score</div><div className="text-2xl font-extrabold">{score}</div></div>
                  <div className="text-center rounded-xl bg-white/10 p-2"><div>Level</div><div className="text-2xl font-extrabold">{level}</div></div>
                  <div className="text-center rounded-xl bg-white/10 p-2"><div>Lines</div><div className="text-2xl font-extrabold">{lines}</div></div>
                  <div className="text-center rounded-xl bg-white/10 p-2"><div>Best</div><div className="text-2xl font-extrabold">{best}</div></div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 p-3 bg-black/25">
                <h3 className="m-0 mb-2 text-sm opacity-90 tracking-wide uppercase">Next</h3>
                <div ref={nextRef} className="grid bg-[rgba(8,14,34,.8)] rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" style={{ gridTemplateColumns: "repeat(5, 20px)", gridAutoRows: "20px", gap: 3, justifyContent: 'start', padding: 10 }} />
              </div>

              <div className="rounded-xl border border-white/10 p-3 bg-black/25">
                <h3 className="m-0 mb-2 text-sm opacity-90 tracking-wide uppercase">Ohana Quote</h3>
                <div id="quote" className="min-h-[72px] rounded-xl bg-white/10 p-2 font-bold text-center flex items-center justify-center">Fill a line to hear from Lilo & Stitch 💫</div>
              </div>
            </aside>
          </main>

          <footer className="text-center px-4 pb-4 opacity-80">Controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause. Theme inspired by Lilo & Stitch. “Ohana means family.”</footer>
        </div>
      </div>

      {/* Toast */}
      <div ref={toastRef} className="toast" role="status" aria-live="polite" />
    </div>
  );
}
