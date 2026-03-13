import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { GameCompleteModalComponent } from '../../components/game-complete-modal/game-complete-modal';

interface Checkpoint {
  row: number;
  col: number;
  emoji: string;
}

interface GridCell {
  isWall: boolean;
  emoji: string;
  isPlayer: boolean;
  isCheckpoint: boolean;
  isBaseFlashing: boolean;
  isFogged: boolean;
  isFoggedBeacon: boolean;
}

interface QuizItem {
  questionKey: string;
  optionKeys: string[];
  correct: number;
}

const LOGICAL_SIZE = 7;
const GRID_SIZE = LOGICAL_SIZE * 2 + 1; // 15
const START_ROW = 1;
const START_COL = 1;
const TIME_LIMIT = 180;
const PENALTY_SECONDS = 20;
const VISION_RADIUS = 1;

const CHECKPOINT_DEFS: { emoji: string }[] = [
  { emoji: '🏔️' },
  { emoji: '🚵' },
  { emoji: '🧗' },
  { emoji: '🌊' },
];

const QUIZ: QuizItem[] = [
  {
    questionKey: 'CHALLENGES.GAMES.MAZE.QUIZ.Q1_QUESTION',
    optionKeys: [
      'CHALLENGES.GAMES.MAZE.QUIZ.Q1_A',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q1_B',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q1_C',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q1_D',
    ],
    correct: 0,
  },
  {
    questionKey: 'CHALLENGES.GAMES.MAZE.QUIZ.Q2_QUESTION',
    optionKeys: [
      'CHALLENGES.GAMES.MAZE.QUIZ.Q2_A',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q2_B',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q2_C',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q2_D',
    ],
    correct: 1,
  },
  {
    questionKey: 'CHALLENGES.GAMES.MAZE.QUIZ.Q3_QUESTION',
    optionKeys: [
      'CHALLENGES.GAMES.MAZE.QUIZ.Q3_A',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q3_B',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q3_C',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q3_D',
    ],
    correct: 0,
  },
  {
    questionKey: 'CHALLENGES.GAMES.MAZE.QUIZ.Q4_QUESTION',
    optionKeys: [
      'CHALLENGES.GAMES.MAZE.QUIZ.Q4_A',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q4_B',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q4_C',
      'CHALLENGES.GAMES.MAZE.QUIZ.Q4_D',
    ],
    correct: 0,
  },
];

@Component({
  selector: 'app-maze-game',
  imports: [TranslateModule, GameCompleteModalComponent],
  templateUrl: './maze-game.html',
  styleUrl: './maze-game.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MazeGameComponent implements OnInit, OnDestroy {
  private gameRoomService = inject(GameRoomService);

  gameCompleted = output<void>();

  // --- Phase & UI ---
  phase = signal<'intro' | 'countdown' | 'playing' | 'gameover' | 'completed'>(
    'intro',
  );
  countdownValue = signal<number | null>(null);
  introClosing = signal(false);
  showCompleteModal = signal(false);

  // --- Maze state ---
  maze = signal<number[][]>([]);
  checkpoints = signal<Checkpoint[]>([]);
  playerRow = signal(START_ROW);
  playerCol = signal(START_COL);
  collectedIds = signal<Set<number>>(new Set());
  revealedCells = signal<Set<string>>(new Set());
  moveCount = signal(0);
  elapsed = signal(0);

  // --- Quiz state ---
  quizActive = signal(false);
  quizCpIndex = signal(-1);
  quizResult = signal<'pending' | 'correct' | 'wrong'>('pending');

  // --- PRNG ---
  private prng!: () => number;

  // --- Template constants ---
  readonly GRID_SIZE = GRID_SIZE;

  // --- Computed ---

  readonly role = computed(() => {
    const players = this.gameRoomService.players();
    const name = this.gameRoomService.localPlayerName();
    if (!name || players.length < 2) return null;
    return players.indexOf(name) === 0 ? 'blue' : 'red';
  });

  readonly allCollected = computed(
    () =>
      this.checkpoints().length > 0 &&
      this.collectedIds().size === this.checkpoints().length,
  );

  readonly timeRemaining = computed(
    () => Math.max(0, TIME_LIMIT - this.elapsed()),
  );

  readonly timeDisplay = computed(() => {
    const t = this.timeRemaining();
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  readonly checkpointsStatus = computed(() => {
    const collected = this.collectedIds();
    return this.checkpoints().map((cp, i) => ({
      ...cp,
      collected: collected.has(i),
    }));
  });

  readonly activeQuiz = computed<QuizItem | null>(() => {
    const idx = this.quizCpIndex();
    return idx >= 0 && idx < QUIZ.length ? QUIZ[idx] : null;
  });

  readonly activeQuizEmoji = computed(() => {
    const idx = this.quizCpIndex();
    const cps = this.checkpoints();
    return idx >= 0 && idx < cps.length ? cps[idx].emoji : '';
  });

  readonly gridCells = computed<GridCell[][]>(() => {
    const mazeGrid = this.maze();
    if (!mazeGrid.length) return [];

    const pRow = this.playerRow();
    const pCol = this.playerCol();
    const collected = this.collectedIds();
    const allDone = this.allCollected();
    const revealed = this.revealedCells();
    const cps = this.checkpoints();

    return mazeGrid.map((row, r) =>
      row.map((cell, c) => {
        const isRevealed = revealed.has(`${r},${c}`);
        const isWall = cell === 1;
        const isPlayer = pRow === r && pCol === c;
        const cpIndex = cps.findIndex((cp) => cp.row === r && cp.col === c);
        const isUncollectedCp = cpIndex >= 0 && !collected.has(cpIndex);
        const isBase = r === START_ROW && c === START_COL;

        // Fogged cells: only show checkpoint/base beacons
        if (!isRevealed && !isPlayer) {
          let fogEmoji = '';
          if (isUncollectedCp) fogEmoji = cps[cpIndex].emoji;
          else if (isBase && allDone) fogEmoji = '🏁';
          return {
            isWall: false,
            emoji: fogEmoji,
            isPlayer: false,
            isCheckpoint: false,
            isBaseFlashing: false,
            isFogged: true,
            isFoggedBeacon: fogEmoji !== '',
          };
        }

        // Revealed cells
        let emoji = '';
        if (isPlayer) emoji = '🧭';
        else if (isUncollectedCp) emoji = cps[cpIndex].emoji;
        else if (isBase && allDone) emoji = '🏁';
        else if (isBase) emoji = '🏕️';

        return {
          isWall,
          emoji,
          isPlayer,
          isCheckpoint: isUncollectedCp,
          isBaseFlashing: isBase && allDone && !isPlayer,
          isFogged: false,
          isFoggedBeacon: false,
        };
      }),
    );
  });

  private timers: ReturnType<typeof setTimeout>[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private musicCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;

  ngOnInit(): void {
    this.initMaze();

    this.gameRoomService.onGameEvent((data) => {
      const payload = data.payload as Record<string, unknown>;

      if (data.event === 'maze-move') {
        if ('col' in payload)
          this.playerCol.set(payload['col'] as number);
        if ('row' in payload)
          this.playerRow.set(payload['row'] as number);
        this.moveCount.update((c) => c + 1);
        this.revealAround(this.playerRow(), this.playerCol());
        this.checkCheckpoint();
      } else if (data.event === 'maze-quiz-answer') {
        const optionIndex = payload['optionIndex'] as number;
        const quiz = this.activeQuiz();
        if (quiz) {
          this.resolveQuiz(optionIndex === quiz.correct);
        }
      }
    });

    this.gameRoomService.onGameReset(() => this.resetLocalState());
    this.startIntro();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopMusic();
    this.timers.forEach(clearTimeout);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const dir = keyMap[event.key];
    if (dir) {
      event.preventDefault();
      this.move(dir);
    }
  }

  move(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.phase() !== 'playing' || this.quizActive()) return;

    const mazeGrid = this.maze();
    if (!mazeGrid.length) return;

    const role = this.role();
    if ((direction === 'left' || direction === 'right') && role !== 'blue')
      return;
    if ((direction === 'up' || direction === 'down') && role !== 'red')
      return;

    let newRow = this.playerRow();
    let newCol = this.playerCol();

    switch (direction) {
      case 'up':
        newRow--;
        break;
      case 'down':
        newRow++;
        break;
      case 'left':
        newCol--;
        break;
      case 'right':
        newCol++;
        break;
    }

    if (
      newRow < 0 ||
      newRow >= GRID_SIZE ||
      newCol < 0 ||
      newCol >= GRID_SIZE
    )
      return;
    if (mazeGrid[newRow][newCol] === 1) {
      this.playBumpSound();
      return;
    }

    this.playerRow.set(newRow);
    this.playerCol.set(newCol);
    this.moveCount.update((c) => c + 1);
    this.revealAround(newRow, newCol);

    const payload: Record<string, number> =
      direction === 'left' || direction === 'right'
        ? { col: newCol }
        : { row: newRow };
    this.gameRoomService.sendGameEvent('maze-move', payload);

    this.checkCheckpoint();
    this.playMoveSound();
  }

  submitAnswer(optionIndex: number): void {
    if (this.role() !== 'red' || this.quizResult() !== 'pending') return;
    this.gameRoomService.sendGameEvent('maze-quiz-answer', { optionIndex });
    const quiz = this.activeQuiz();
    if (quiz) {
      this.resolveQuiz(optionIndex === quiz.correct);
    }
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
    this.gameCompleted.emit();
  }

  retryGame(): void {
    this.gameRoomService.resetGame();
  }

  // --- Maze generation ---

  private initMaze(): void {
    const roomId = this.gameRoomService.roomId() || 'default';
    const seed = this.seedFromString(roomId);
    this.prng = this.createPrng(seed);
    this.maze.set(this.generateMaze());
    this.checkpoints.set(this.placeCheckpoints());
    this.revealAround(START_ROW, START_COL);
  }

  private createPrng(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private seedFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) || 1;
  }

  private generateMaze(): number[][] {
    const grid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(1),
    );

    const visited = new Set<string>();
    const stack: [number, number][] = [];

    const carve = (lc: number, lr: number) => {
      grid[lr * 2 + 1][lc * 2 + 1] = 0;
      visited.add(`${lc},${lr}`);
    };

    // Start at logical (0,0) = grid (1,1)
    carve(0, 0);
    stack.push([0, 0]);

    const dirs: [number, number][] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors = dirs
        .map(([dx, dy]) => [cx + dx, cy + dy] as [number, number])
        .filter(
          ([nx, ny]) =>
            nx >= 0 &&
            nx < LOGICAL_SIZE &&
            ny >= 0 &&
            ny < LOGICAL_SIZE &&
            !visited.has(`${nx},${ny}`),
        );

      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }

      const idx = Math.floor(this.prng() * neighbors.length);
      const [nx, ny] = neighbors[idx];

      // Carve wall between current and neighbor
      grid[cy * 2 + 1 + (ny - cy)][cx * 2 + 1 + (nx - cx)] = 0;
      carve(nx, ny);
      stack.push([nx, ny]);
    }

    return grid;
  }

  private placeCheckpoints(): Checkpoint[] {
    // Place in 4 spread-out positions (corners + center of logical grid)
    const positions = [
      { lr: 0, lc: LOGICAL_SIZE - 1 }, // top-right
      { lr: LOGICAL_SIZE - 1, lc: 0 }, // bottom-left
      { lr: LOGICAL_SIZE - 1, lc: LOGICAL_SIZE - 1 }, // bottom-right
      { lr: Math.floor(LOGICAL_SIZE / 2), lc: Math.floor(LOGICAL_SIZE / 2) }, // center
    ];

    return positions.map((pos, i) => ({
      row: pos.lr * 2 + 1,
      col: pos.lc * 2 + 1,
      emoji: CHECKPOINT_DEFS[i].emoji,
    }));
  }

  // --- Fog of war ---

  private revealAround(row: number, col: number): void {
    this.revealedCells.update((set) => {
      const ns = new Set(set);
      for (let dr = -VISION_RADIUS; dr <= VISION_RADIUS; dr++) {
        for (let dc = -VISION_RADIUS; dc <= VISION_RADIUS; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            ns.add(`${r},${c}`);
          }
        }
      }
      return ns;
    });
  }

  // --- Checkpoints & quiz ---

  private checkCheckpoint(): void {
    const row = this.playerRow();
    const col = this.playerCol();
    const cps = this.checkpoints();

    cps.forEach((cp, i) => {
      if (cp.row === row && cp.col === col && !this.collectedIds().has(i)) {
        this.collectedIds.update((s) => {
          const ns = new Set(s);
          ns.add(i);
          return ns;
        });
        this.startQuiz(i);
      }
    });

    // Check return to base (only if no quiz active)
    if (
      !this.quizActive() &&
      this.allCollected() &&
      row === START_ROW &&
      col === START_COL
    ) {
      this.onComplete();
    }
  }

  private startQuiz(cpIndex: number): void {
    if (cpIndex >= QUIZ.length) return;
    this.quizCpIndex.set(cpIndex);
    this.quizResult.set('pending');
    this.quizActive.set(true);
    this.playCollectSound();
  }

  private resolveQuiz(correct: boolean): void {
    this.quizResult.set(correct ? 'correct' : 'wrong');

    if (correct) {
      this.playCorrectSound();
    } else {
      this.elapsed.update((e) => e + PENALTY_SECONDS);
      this.playWrongSound();
    }

    const delay = correct ? 1500 : 2000;
    const t = setTimeout(() => {
      this.quizActive.set(false);
      this.quizResult.set('pending');
      this.quizCpIndex.set(-1);

      // Check return to base after quiz closes
      if (
        this.allCollected() &&
        this.playerRow() === START_ROW &&
        this.playerCol() === START_COL
      ) {
        this.onComplete();
      }
    }, delay);
    this.timers.push(t);
  }

  // --- Intro & countdown ---

  private startIntro(): void {
    this.phase.set('intro');
    this.introClosing.set(false);

    const t1 = setTimeout(() => this.introClosing.set(true), 1500);
    const t2 = setTimeout(() => {
      this.phase.set('countdown');
      this.countdownValue.set(3);
    }, 2000);
    const t3 = setTimeout(() => this.countdownValue.set(2), 3000);
    const t4 = setTimeout(() => this.countdownValue.set(1), 4000);
    const t5 = setTimeout(() => {
      this.countdownValue.set(null);
      this.phase.set('playing');
      this.startTimer();
      this.startMusic();
    }, 5000);

    this.timers.push(t1, t2, t3, t4, t5);
  }

  // --- Timer ---

  private startTimer(): void {
    this.elapsed.set(0);
    this.timerInterval = setInterval(() => {
      this.elapsed.update((e) => e + 1);
      if (this.elapsed() >= TIME_LIMIT) {
        this.onTimeUp();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private onTimeUp(): void {
    this.stopTimer();
    this.stopMusic();
    this.quizActive.set(false);
    this.phase.set('gameover');
  }

  private onComplete(): void {
    this.stopTimer();
    this.stopMusic();
    this.phase.set('completed');
    this.playSuccessSound();
    const t = setTimeout(() => this.showCompleteModal.set(true), 800);
    this.timers.push(t);
  }

  // --- Music (mysterious exploration loop) ---

  private startMusic(): void {
    this.stopMusic();
    const ctx = new AudioContext();
    this.musicCtx = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.14;
    masterGain.connect(ctx.destination);
    this.musicGain = masterGain;

    const bpm = 60;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 4;

    // Mysterious minor key pad (Am → Dm → Em → Am)
    const chords = [
      [220, 261, 330], // Am
      [147, 175, 220], // Dm
      [165, 196, 247], // Em
      [220, 261, 330], // Am
    ];

    // Eerie melody (sine, sparse)
    const melodyNotes = [
      { t: 0, f: 660, d: beat * 2 },
      { t: beat * 2.5, f: 587, d: beat },
      { t: beat * 3.5, f: 523, d: beat * 0.5 },
      { t: barLen + beat, f: 440, d: beat * 2 },
      { t: barLen + beat * 3, f: 494, d: beat },
      { t: barLen * 2, f: 523, d: beat * 1.5 },
      { t: barLen * 2 + beat * 2, f: 440, d: beat * 2 },
      { t: barLen * 3 + beat, f: 494, d: beat },
      { t: barLen * 3 + beat * 2.5, f: 440, d: beat * 1.5 },
    ];

    const scheduleLoop = (startTime: number) => {
      if (!this.musicCtx || this.musicCtx !== ctx) return;

      // Pad chords
      chords.forEach((chord, barIdx) => {
        const t0 = startTime + barIdx * barLen;
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(0.12, t0 + beat * 0.5);
          g.gain.setValueAtTime(0.12, t0 + barLen - beat * 0.5);
          g.gain.linearRampToValueAtTime(0, t0 + barLen);
          osc.connect(g).connect(masterGain);
          osc.start(t0);
          osc.stop(t0 + barLen + 0.05);
        });
      });

      // Melody
      for (const note of melodyNotes) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = note.f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2, startTime + note.t);
        g.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + note.t + note.d,
        );
        osc.connect(g).connect(masterGain);
        osc.start(startTime + note.t);
        osc.stop(startTime + note.t + note.d + 0.02);
      }

      const nextStart = startTime + loopLen;
      const timer = setTimeout(
        () => scheduleLoop(nextStart),
        (nextStart - ctx.currentTime - 0.5) * 1000,
      );
      this.timers.push(timer);
    };

    scheduleLoop(ctx.currentTime + 0.05);
  }

  private stopMusic(): void {
    if (this.musicGain && this.musicCtx) {
      try {
        this.musicGain.gain.setValueAtTime(
          this.musicGain.gain.value,
          this.musicCtx.currentTime,
        );
        this.musicGain.gain.linearRampToValueAtTime(
          0,
          this.musicCtx.currentTime + 0.4,
        );
      } catch {
        // Context may already be closed
      }
    }
    if (this.musicCtx) {
      const ctxRef = this.musicCtx;
      this.musicCtx = null;
      this.musicGain = null;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setTimeout(() => ctxRef.close().catch(() => {}), 500);
    }
  }

  // --- Sounds ---

  private playMoveSound(): void {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
    setTimeout(() => ctx.close(), 100);
  }

  private playBumpSound(): void {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    setTimeout(() => ctx.close(), 200);
  }

  private playCollectSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
    setTimeout(() => ctx.close(), 600);
  }

  private playCorrectSound(): void {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 400);
  }

  private playWrongSound(): void {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 200;
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 400);
  }

  private playSuccessSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
    setTimeout(() => ctx.close(), 1000);
  }

  // --- Reset ---

  private resetLocalState(): void {
    this.stopTimer();
    this.stopMusic();
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.playerRow.set(START_ROW);
    this.playerCol.set(START_COL);
    this.collectedIds.set(new Set());
    this.revealedCells.set(new Set());
    this.moveCount.set(0);
    this.elapsed.set(0);
    this.quizActive.set(false);
    this.quizCpIndex.set(-1);
    this.quizResult.set('pending');
    this.showCompleteModal.set(false);
    this.countdownValue.set(null);
    // Re-generate maze with new seed
    this.initMaze();
    this.startIntro();
  }
}
