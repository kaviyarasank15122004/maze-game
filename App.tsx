
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Cell, Position, Direction } from './types';
import { generateMaze } from './services/mazeGenerator';

// Constants
const INITIAL_SIZE = 8;
const MAX_SIZE = 24;

const App: React.FC = () => {
  // Game State
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ r: 0, c: 0 });
  const [goalPos, setGoalPos] = useState<Position>({ r: 0, c: 0 });
  const [timer, setTimer] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});
  
  // Refs for timer
  const timerRef = useRef<number | null>(null);

  // Initialize level
  const initLevel = useCallback((lvl: number) => {
    const size = Math.min(INITIAL_SIZE + (lvl - 1) * 2, MAX_SIZE);
    const newMaze = generateMaze(size, size);
    setMaze(newMaze);
    setPlayerPos({ r: 0, c: 0 });
    setGoalPos({ r: size - 1, c: size - 1 });
    setStatus(GameStatus.PLAYING);
    setTimer(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, []);

  // Load best times from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('maze_best_times');
    if (saved) {
      try {
        setBestTimes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse best times", e);
      }
    }
  }, []);

  // Movement Logic
  const movePlayer = useCallback((dir: Direction) => {
    if (status !== GameStatus.PLAYING) return;

    setPlayerPos(current => {
      const cell = maze[current.r][current.c];
      let nextPos = { ...current };

      if (dir === 'UP' && !cell.walls.top) nextPos.r--;
      else if (dir === 'DOWN' && !cell.walls.bottom) nextPos.r++;
      else if (dir === 'LEFT' && !cell.walls.left) nextPos.c--;
      else if (dir === 'RIGHT' && !cell.walls.right) nextPos.c++;

      // Check win condition
      if (nextPos.r === goalPos.r && nextPos.c === goalPos.c) {
        // Use a timeout to allow the player to physically move into the goal visually first
        setTimeout(() => handleWin(), 50);
      }

      return nextPos;
    });
  }, [maze, status, goalPos, timer, level]);

  const handleWin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(GameStatus.WON);
    
    // Play win sound
    playTone(440, 0.1);
    setTimeout(() => playTone(880, 0.2), 100);

    // Save best time using the current timer value
    setTimer(currentTimer => {
      setBestTimes(prev => {
        const currentBest = prev[level];
        if (!currentBest || currentTimer < currentBest) {
          const newBests = { ...prev, [level]: currentTimer };
          localStorage.setItem('maze_best_times', JSON.stringify(newBests));
          return newBests;
        }
        return prev;
      });
      return currentTimer;
    });
  };

  const playTone = (freq: number, duration: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked by browser policy until interaction
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer('UP'); break;
        case 'ArrowDown': case 's': case 'S': movePlayer('DOWN'); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, status]);

  const nextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    initLevel(nextLvl);
  };

  const restartGame = () => {
    setLevel(1);
    initLevel(1);
  };

  const formattedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 font-sans select-none overflow-hidden text-slate-100">
      {/* HUD */}
      <div className="w-full max-w-md mb-6 flex justify-between items-end bg-slate-800/60 p-5 rounded-2xl backdrop-blur-md border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-cyan-400 tracking-tighter uppercase leading-tight">Neon Runner</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Stage {level}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono text-emerald-400 leading-none drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            {formattedTime(timer)}
          </p>
          <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">
            Personal Best: {bestTimes[level] ? formattedTime(bestTimes[level]) : '--:--'}
          </p>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="relative bg-slate-900 p-2 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-800">
        {maze.length > 0 && (
          <div 
            className="maze-grid"
            style={{ 
              gridTemplateColumns: `repeat(${maze[0].length}, 1fr)`,
              width: 'min(90vw, 500px)',
              height: 'min(90vw, 500px)'
            }}
          >
            {maze.flat().map((cell) => {
              const isPlayer = playerPos.r === cell.r && playerPos.c === cell.c;
              const isGoal = goalPos.r === cell.r && goalPos.c === cell.c;
              
              return (
                <div
                  key={`${cell.r}-${cell.c}`}
                  className={`cell relative flex items-center justify-center
                    ${cell.walls.top ? 'wall-top' : ''} 
                    ${cell.walls.right ? 'wall-right' : ''} 
                    ${cell.walls.bottom ? 'wall-bottom' : ''} 
                    ${cell.walls.left ? 'wall-left' : ''}
                  `}
                >
                  {isPlayer && (
                    <div className="w-4/5 h-4/5 bg-cyan-500 rounded-sm shadow-[0_0_20px_rgba(6,182,212,0.9)] player-anim z-20" />
                  )}
                  {isGoal && (
                    <div className="w-3/4 h-3/4 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center z-10">
                       <div className="w-1/2 h-1/2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Overlays */}
        {status === GameStatus.START && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-lg p-6 text-center">
            <div className="mb-6">
               <div className="w-20 h-20 bg-cyan-500/20 border-2 border-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <div className="w-10 h-10 bg-cyan-400 rounded-sm" />
               </div>
               <h2 className="text-4xl font-black text-white tracking-tighter mb-2">NEON RUNNER</h2>
               <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Escape the digital labyrinth. Every stage grows harder.</p>
            </div>
            <button 
              onClick={() => initLevel(1)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-4 rounded-full font-black tracking-widest transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] active:scale-95 uppercase"
            >
              Begin Sequence
            </button>
          </div>
        )}

        {status === GameStatus.WON && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-xl rounded-lg p-6 text-center border-4 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="bg-emerald-500/20 p-6 rounded-full mb-6 border-2 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-white mb-1 tracking-tighter">LEVEL CLEAR</h2>
            <p className="text-emerald-300 mb-8 font-mono text-xl">{formattedTime(timer)}</p>
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <button 
                onClick={nextLevel}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-4 rounded-xl font-black transition-all shadow-xl active:scale-95 uppercase tracking-widest"
              >
                Next Stage
              </button>
              <button 
                onClick={restartGame}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
              >
                Reset Progress
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-8 grid grid-cols-3 gap-3 sm:hidden">
        <div />
        <ControlButton onClick={() => movePlayer('UP')} icon="↑" />
        <div />
        <ControlButton onClick={() => movePlayer('LEFT')} icon="←" />
        <ControlButton onClick={() => movePlayer('DOWN')} icon="↓" />
        <ControlButton onClick={() => movePlayer('RIGHT')} icon="→" />
      </div>

      {/* Desktop Helper */}
      <div className="mt-10 flex items-center gap-6 text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] hidden sm:flex">
        <div className="flex items-center gap-2">
           <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">WASD</span>
           <span>Move</span>
        </div>
        <div className="w-1 h-1 bg-slate-700 rounded-full" />
        <div className="flex items-center gap-2">
           <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">ARROWS</span>
           <span>Navigate</span>
        </div>
      </div>

      {/* Persistent Reset */}
      <button 
        onClick={restartGame}
        className="fixed bottom-6 right-6 p-3 bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-600 transition-all border border-slate-700/50 backdrop-blur-sm group"
        title="Reset Game"
      >
        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

interface ControlButtonProps {
  onClick: () => void;
  icon: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, icon }) => (
  <button 
    onPointerDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className="w-16 h-16 bg-slate-800/80 active:bg-cyan-600 active:scale-90 rounded-2xl flex items-center justify-center text-3xl text-white border border-slate-700 shadow-lg touch-none transition-all"
  >
    {icon}
  </button>
);

export default App;
