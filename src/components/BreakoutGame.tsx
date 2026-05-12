import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Ball, 
  Paddle, 
  Brick, 
  GameStatus, 
  GameState, 
  Point 
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_BOTTOM_MARGIN,
  BALL_RADIUS,
  BALL_SPEED_START,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_PADDING,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  COLORS,
  INITIAL_LIVES
} from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Play, RefreshCcw, Pause } from 'lucide-react';

const BreakoutGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game state held in refs for 60fps logic
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_BOTTOM_MARGIN - PADDLE_HEIGHT - BALL_RADIUS,
    dx: BALL_SPEED_START,
    dy: -BALL_SPEED_START,
    radius: BALL_RADIUS,
    color: COLORS.BALL
  });

  const paddleRef = useRef<Paddle>({
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: CANVAS_HEIGHT - PADDLE_BOTTOM_MARGIN - PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: COLORS.PADDLE
  });

  const bricksRef = useRef<Brick[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // React state for UI components
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: INITIAL_LIVES,
    status: GameStatus.START,
    level: 1
  });

  // Track state in ref for logic access without closure issues
  const statusRef = useRef<GameStatus>(GameStatus.START);

  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: COLORS.BRICKS[r % COLORS.BRICKS.length],
          points: (BRICK_ROWS - r) * 10,
          isDestroyed: false,
          strength: 1
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const resetBallAndPaddle = useCallback(() => {
    paddleRef.current.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    ballRef.current.x = CANVAS_WIDTH / 2;
    ballRef.current.y = CANVAS_HEIGHT - PADDLE_BOTTOM_MARGIN - PADDLE_HEIGHT - BALL_RADIUS;
    
    // Set random-ish initial direction
    const angle = (Math.random() * Math.PI / 4) + Math.PI / 4; // 45 to 90 degrees
    const sign = Math.random() > 0.5 ? 1 : -1;
    ballRef.current.dx = sign * BALL_SPEED_START * Math.cos(angle);
    ballRef.current.dy = -BALL_SPEED_START * Math.sin(angle);
  }, []);

  const startGame = () => {
    if (statusRef.current === GameStatus.GAMEOVER || statusRef.current === GameStatus.WON) {
      setGameState(prev => ({ ...prev, score: 0, lives: INITIAL_LIVES, status: GameStatus.PLAYING }));
      initBricks();
    } else {
      setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
    }
    statusRef.current = GameStatus.PLAYING;
    resetBallAndPaddle();
  };

  const togglePause = () => {
    const nextStatus = statusRef.current === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING;
    setGameState(prev => ({ ...prev, status: nextStatus }));
    statusRef.current = nextStatus;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current[e.key] = true;
    if (e.key === ' ' || e.key === 'Enter') {
      if (statusRef.current === GameStatus.START || statusRef.current === GameStatus.GAMEOVER || statusRef.current === GameStatus.WON) {
        startGame();
      } else {
        togglePause();
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== GameStatus.PLAYING) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const root = document.documentElement;
    const mouseX = e.clientX - rect.left - root.scrollLeft;
    
    // Center paddle on mouse
    let nextX = mouseX - paddleRef.current.width / 2;
    
    // Constrain to canvas
    if (nextX < 0) nextX = 0;
    if (nextX > CANVAS_WIDTH - paddleRef.current.width) nextX = CANVAS_WIDTH - paddleRef.current.width;
    
    paddleRef.current.x = nextX;
  };

  const update = () => {
    if (statusRef.current !== GameStatus.PLAYING) return;

    const ball = ballRef.current;
    const paddle = paddleRef.current;
    const bricks = bricksRef.current;

    // Movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      paddle.x -= 10;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      paddle.x += 10;
    }

    // Paddle boundaries
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x > CANVAS_WIDTH - paddle.width) paddle.x = CANVAS_WIDTH - paddle.width;

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    // Paddle collision
    if (
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.x + ball.radius > paddle.x &&
      ball.x - ball.radius < paddle.x + paddle.width
    ) {
      // Rebound with angle based on where it hit the paddle
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPos * (Math.PI / 3); // Max 60 degree angle
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
      
      // Ensure it doesn't get stuck in the paddle
      ball.y = paddle.y - ball.radius;
    }

    // Brick collision
    let allDestroyed = true;
    for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (!b.isDestroyed) {
            allDestroyed = false;
            // Simple AABB collision
            if (
                ball.x + ball.radius > b.x &&
                ball.x - ball.radius < b.x + b.width &&
                ball.y + ball.radius > b.y &&
                ball.y - ball.radius < b.y + b.height
            ) {
                b.isDestroyed = true;
                ball.dy = -ball.dy;
                setGameState(prev => ({ ...prev, score: prev.score + b.points }));
                break; // Only hit one brick per frame
            }
        }
    }

    if (allDestroyed && bricks.length > 0) {
        statusRef.current = GameStatus.WON;
        setGameState(prev => ({ ...prev, status: GameStatus.WON }));
    }

    // Bottom collision (Lose Life)
    if (ball.y + ball.radius > CANVAS_HEIGHT) {
      setGameState(prev => {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          statusRef.current = GameStatus.GAMEOVER;
          return { ...prev, lives: 0, status: GameStatus.GAMEOVER };
        } else {
          resetBallAndPaddle();
          return { ...prev, lives: newLives };
        }
      });
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Draw background with radial gradient
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
    );
    gradient.addColorStop(0, COLORS.CANVAS_GRADIENT_START!);
    gradient.addColorStop(1, COLORS.CANVAS_GRADIENT_END!);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines background (Technical mood)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Bricks
    bricksRef.current.forEach(b => {
      if (!b.isDestroyed) {
        ctx.fillStyle = b.color;
        // Draw with rounded corners or glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        
        // Inner detail
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(b.x + 2, b.y + 2, b.width - 4, b.height - 4);
      }
    });

    // Paddle
    const paddle = paddleRef.current;
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;

    // Ball
    const ball = ballRef.current;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ball.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    initBricks();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop, initBricks]);

  return (
    <div className="w-[1024px] h-[768px] bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden select-none border border-slate-800 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)]">
      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <div className="w-4 h-1 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">
            NEON<span className="text-emerald-400 font-extralight">BREAK</span>
          </span>
        </div>
        
        <div className="flex items-center gap-12 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Score</span>
            <span className="text-xl text-emerald-400">{gameState.score.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Level</span>
            <span className="text-xl text-violet-400">{gameState.level.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Lives</span>
            <div className="flex gap-1.5 mt-1">
              {[...Array(INITIAL_LIVES)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i < gameState.lives 
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={togglePause}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold tracking-widest border border-slate-700 transition-colors uppercase"
          >
            {gameState.status === GameStatus.PAUSED ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={startGame}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-501 text-white rounded-md text-[10px] font-bold tracking-widest border border-emerald-500/50 shadow-lg shadow-emerald-900/20 transition-colors uppercase"
          >
            Restart
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 flex flex-col gap-6">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Instructions</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 bg-slate-800 rounded flex items-center justify-center text-[10px] border border-slate-700 font-mono text-slate-300 shadow-inner">←</div>
                <span className="text-xs text-slate-400 leading-tight">Move platform to the left</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 bg-slate-800 rounded flex items-center justify-center text-[10px] border border-slate-700 font-mono text-slate-300 shadow-inner">→</div>
                <span className="text-xs text-slate-400 leading-tight">Move platform to the right</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 shrink-0 bg-slate-800 rounded flex items-center justify-center text-[10px] border border-slate-700 font-mono text-slate-300 shadow-inner">SP</div>
                <span className="text-xs text-slate-400 leading-tight">Initialize system protocol</span>
              </li>
            </ul>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex-1 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Active Buffs</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
                <span className="text-xs text-emerald-300">Kinetic Precision</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-800/30 border border-slate-700 rounded-lg opacity-40">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                <span className="text-xs text-slate-500 italic">No Active Signal</span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-800/50">
                <div className="text-[9px] text-slate-600 uppercase tracking-tighter leading-tight font-mono">
                  System diagnostic: nominal<br/>
                  Buffer status: optimized<br/>
                  Thermal output: 34°c
                </div>
            </div>
          </div>
        </aside>

        {/* GAME CANVAS AREA */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseMove={handleMouseMove}
              className="w-full h-full block cursor-none"
            />
            
            {/* Visual enhancements over canvas */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900/60 rounded-2xl"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* OVERLAYS */}
            <AnimatePresence>
              {gameState.status !== GameStatus.PLAYING && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
                >
                  <div className="text-center p-12 max-w-lg">
                    {gameState.status === GameStatus.START && (
                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="space-y-8">
                            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-[0.3em] text-emerald-400 uppercase mb-2">
                              Neural Interface Active
                            </div>
                            <h1 className="text-7xl font-black tracking-tighter uppercase leading-[0.8] mb-6 text-white">
                                NEON<br/><span className="text-emerald-500 font-extralight italic">BREAKOUT</span>
                            </h1>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto font-mono opacity-60">
                                [STRICT PROTOCOL]: RECLAIM THE GRID<br/>
                                [THREAT LEVEL]: OPTIMIZED CONTRAINED
                            </p>
                            <button 
                                onClick={startGame}
                                className="relative mt-8 px-10 py-5 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                            >
                                START SESSION
                            </button>
                        </motion.div>
                    )}

                    {gameState.status === GameStatus.PAUSED && (
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-6">
                            <Pause className="w-16 h-16 mx-auto text-violet-400" />
                            <h2 className="text-4xl font-bold uppercase tracking-tighter text-white">System Standby</h2>
                            <button 
                                onClick={togglePause}
                                className="px-10 py-4 bg-white text-slate-950 font-black uppercase tracking-widest hover:bg-white/90"
                            >
                                Resume
                            </button>
                        </motion.div>
                    )}

                    {gameState.status === GameStatus.GAMEOVER && (
                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="space-y-6">
                            <div className="text-rose-500 text-xs font-black uppercase tracking-[0.4em] mb-2 animate-pulse">Critical Signal Loss</div>
                            <h2 className="text-7xl font-black uppercase tracking-tight text-white mb-6">FAILED</h2>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-8 flex justify-center gap-12">
                                <div className="text-center">
                                    <span className="block text-slate-600 text-[10px] uppercase mb-1 tracking-widest">Efficiency</span>
                                    <span className="text-3xl font-mono text-emerald-400">{gameState.score}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-slate-600 text-[10px] uppercase mb-1 tracking-widest">Target Path</span>
                                    <span className="text-3xl font-mono text-violet-400">{gameState.level}</span>
                                </div>
                            </div>
                            <button 
                                onClick={startGame}
                                className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-rose-600 text-white font-black uppercase tracking-[0.2em] hover:bg-rose-500 transition-colors shadow-[0_0_30px_rgba(225,29,72,0.3)]"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Initiate Reboot
                            </button>
                        </motion.div>
                    )}

                    {gameState.status === GameStatus.WON && (
                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="space-y-6">
                            <Trophy className="w-20 h-20 mx-auto text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-7xl font-black uppercase tracking-tight text-white mb-2">CLEARED</h2>
                            <p className="text-slate-400 mb-8 uppercase tracking-[0.3em] font-mono text-[10px]">Territory integrated successfully.</p>
                            <button 
                                onClick={startGame}
                                className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-colors"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Next Sector
                            </button>
                        </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-20 mt-6 flex items-center justify-between px-2">
            <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">High Score</span>
                <span className="text-lg font-mono text-slate-300">012,400</span>
              </div>
              <div className="w-px h-8 bg-slate-800 self-center"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Accuracy</span>
                <span className="text-lg font-mono text-slate-300">94.2%</span>
              </div>
              <div className="w-px h-8 bg-slate-800 self-center"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">CPU LOAD</span>
                <span className="text-lg font-mono text-emerald-500">12%</span>
              </div>
            </div>
            <div className="flex gap-3">
               <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors">
                  <Play className="w-4 h-4 text-slate-400" />
               </div>
               <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors">
                  <Pause className="w-4 h-4 text-slate-400" />
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-12 border-t border-slate-900 bg-black/40 flex items-center justify-between px-8 text-[10px] text-slate-600 font-mono tracking-widest">
        <span>STABLE_REBUILD_V0.4.12-ALPHA</span>
        <span>© 2026 NEON_GAME_LABS // SECTOR_7</span>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-1.5 text-emerald-500/70">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            NEURAL_LINK_ESTABLISHED
          </div>
          <span className="text-slate-800">|</span>
          <span>LATENCY: 24MS</span>
        </div>
      </footer>
    </div>
  );
};

export default BreakoutGame;
