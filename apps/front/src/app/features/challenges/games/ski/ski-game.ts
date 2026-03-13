import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { GameCompleteModalComponent } from '../../components/game-complete-modal/game-complete-modal';

interface Obstacle {
  id: number;
  type: 'tree' | 'rock' | 'snowman';
  emoji: string;
  x: number;
  y: number;
  hitbox: number;
}

interface VisibleObstacle extends Obstacle {
  screenY: number;
  hit: boolean;
}

const COURSE_LENGTH = 5000;
const SCROLL_SPEED = 140;
const VIEWPORT_UNITS = 700;
const SKIER_Y_RATIO = 0.5;
const SKIER_HITBOX = 5;
const COLLISION_THRESHOLD_Y = 18;
const HIT_INVINCIBILITY_MS = 1500;
const MAX_LIVES = 3;

const COURSE_OBSTACLES: Obstacle[] = [
  // Warm-up
  { id: 1, type: 'tree', emoji: '🌲', x: 20, y: 400, hitbox: 5 },
  { id: 2, type: 'tree', emoji: '🌲', x: 78, y: 650, hitbox: 5 },
  { id: 3, type: 'rock', emoji: '🪨', x: 50, y: 950, hitbox: 4 },
  { id: 4, type: 'snowman', emoji: '⛄', x: 85, y: 1150, hitbox: 5 },
  // Medium
  { id: 5, type: 'tree', emoji: '🌲', x: 35, y: 1350, hitbox: 5 },
  { id: 6, type: 'rock', emoji: '🪨', x: 65, y: 1500, hitbox: 4 },
  { id: 7, type: 'tree', emoji: '🌲', x: 15, y: 1700, hitbox: 5 },
  { id: 8, type: 'tree', emoji: '🌲', x: 55, y: 1780, hitbox: 5 },
  { id: 9, type: 'snowman', emoji: '⛄', x: 42, y: 2000, hitbox: 5 },
  { id: 10, type: 'tree', emoji: '🌲', x: 82, y: 2150, hitbox: 5 },
  { id: 11, type: 'rock', emoji: '🪨', x: 28, y: 2350, hitbox: 4 },
  // Dense
  { id: 12, type: 'tree', emoji: '🌲', x: 48, y: 2500, hitbox: 5 },
  { id: 13, type: 'tree', emoji: '🌲', x: 72, y: 2620, hitbox: 5 },
  { id: 14, type: 'rock', emoji: '🪨', x: 18, y: 2750, hitbox: 4 },
  { id: 15, type: 'snowman', emoji: '⛄', x: 58, y: 2900, hitbox: 5 },
  { id: 16, type: 'tree', emoji: '🌲', x: 32, y: 3020, hitbox: 5 },
  { id: 17, type: 'tree', emoji: '🌲', x: 75, y: 3120, hitbox: 5 },
  { id: 18, type: 'rock', emoji: '🪨', x: 50, y: 3280, hitbox: 4 },
  { id: 19, type: 'tree', emoji: '🌲', x: 12, y: 3420, hitbox: 5 },
  { id: 20, type: 'tree', emoji: '🌲', x: 62, y: 3480, hitbox: 5 },
  { id: 21, type: 'snowman', emoji: '⛄', x: 88, y: 3620, hitbox: 5 },
  { id: 22, type: 'rock', emoji: '🪨', x: 38, y: 3780, hitbox: 4 },
  // Final stretch
  { id: 23, type: 'tree', emoji: '🌲', x: 22, y: 3950, hitbox: 5 },
  { id: 24, type: 'rock', emoji: '🪨', x: 68, y: 4100, hitbox: 4 },
  { id: 25, type: 'tree', emoji: '🌲', x: 48, y: 4300, hitbox: 5 },
  { id: 26, type: 'snowman', emoji: '⛄', x: 35, y: 4500, hitbox: 5 },
  { id: 27, type: 'tree', emoji: '🌲', x: 62, y: 4700, hitbox: 5 },
];

@Component({
  selector: 'app-ski-game',
  imports: [TranslateModule, DecimalPipe, GameCompleteModalComponent],
  templateUrl: './ski-game.html',
  styleUrl: './ski-game.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkiGameComponent implements OnInit, OnDestroy {
  private gameRoomService = inject(GameRoomService);

  gameCompleted = output<void>();
  private controlsRef = viewChild<ElementRef>('controlsRef');

  // --- Game phase ---
  phase = signal<'intro' | 'countdown' | 'playing' | 'gameover' | 'completed'>(
    'intro',
  );
  countdownValue = signal<number | null>(null);
  introClosing = signal(false);

  // --- Positions ---
  myX = signal(50);
  partnerX = signal(50);
  scrollY = signal(0);

  // --- State ---
  lives = signal(MAX_LIVES);
  hitObstacleIds = signal<Set<number>>(new Set());
  isInvincible = signal(false);
  shakeActive = signal(false);
  showCompleteModal = signal(false);

  // --- Constants for template ---
  readonly SKIER_Y_PERCENT = SKIER_Y_RATIO * 100;

  // --- Role ---
  readonly role = computed(() => {
    const players = this.gameRoomService.players();
    const name = this.gameRoomService.localPlayerName();
    if (!name || players.length < 2) return null;
    return players.indexOf(name) === 0 ? 'blue' : 'red';
  });

  // --- Progress ---
  readonly progressPercent = computed(() => {
    const maxScroll = COURSE_LENGTH - VIEWPORT_UNITS * SKIER_Y_RATIO;
    return Math.min(100, (this.scrollY() / maxScroll) * 100);
  });

  // --- Visible obstacles ---
  readonly visibleObstacles = computed<VisibleObstacle[]>(() => {
    const sy = this.scrollY();
    const hitIds = this.hitObstacleIds();
    return COURSE_OBSTACLES.filter((o) => {
      const screenY = ((o.y - sy) / VIEWPORT_UNITS) * 100;
      return screenY > -15 && screenY < 115;
    }).map((o) => ({
      ...o,
      screenY: ((o.y - sy) / VIEWPORT_UNITS) * 100,
      hit: hitIds.has(o.id),
    }));
  });

  // --- Finish line ---
  readonly finishLineScreenY = computed(
    () => ((COURSE_LENGTH - this.scrollY()) / VIEWPORT_UNITS) * 100,
  );
  readonly showFinishLine = computed(() => {
    const y = this.finishLineScreenY();
    return y > -10 && y < 120;
  });

  // --- Lives display ---
  readonly livesArray = computed(() =>
    Array.from({ length: MAX_LIVES }, (_, i) => i < this.lives()),
  );

  // --- Slope bg scroll ---
  readonly slopeBgOffsetY = computed(() => -((this.scrollY() * 0.5) % 60));

  // --- Rope ---
  readonly ropeLeft = computed(() => Math.min(this.myX(), this.partnerX()));
  readonly ropeWidth = computed(() =>
    Math.abs(this.myX() - this.partnerX()),
  );
  readonly ropeColor = computed(() => {
    const dist = this.ropeWidth();
    if (dist < 25) return '#22c55e';
    if (dist < 45) return '#eab308';
    return '#ef4444';
  });

  private animFrameId = 0;
  private lastTimestamp = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private musicCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;

  ngOnInit(): void {
    this.gameRoomService.onGameEvent((data) => {
      const payload = data.payload as Record<string, unknown>;

      if (data.event === 'ski-move') {
        this.partnerX.set(payload['x'] as number);
      } else if (data.event === 'ski-hit') {
        const obsId = payload['obstacleId'] as number;
        this.hitObstacleIds.update((set) => {
          const ns = new Set(set);
          ns.add(obsId);
          return ns;
        });
        this.applyHit(false);
      }
    });

    this.gameRoomService.onGameReset(() => this.resetLocalState());
    this.startIntro();
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    this.stopMusic();
    this.timers.forEach(clearTimeout);
  }

  onMoveX(value: number): void {
    this.myX.set(+value);
    this.gameRoomService.sendGameEvent('ski-move', { x: +value });
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
    this.gameCompleted.emit();
  }

  retryGame(): void {
    this.gameRoomService.resetGame();
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
      this.startGameLoop();
      this.startMusic();
      this.scrollToControls();
    }, 5000);

    this.timers.push(t1, t2, t3, t4, t5);
  }

  private scrollToControls(): void {
    setTimeout(() => {
      this.controlsRef()?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  // --- Game loop ---

  private startGameLoop(): void {
    this.lastTimestamp = 0;
    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private gameLoop(timestamp: number): void {
    if (this.phase() !== 'playing') return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }

    const deltaMs = Math.min(timestamp - this.lastTimestamp, 50);
    this.lastTimestamp = timestamp;
    const dt = deltaMs / 1000;

    this.scrollY.update((y) => y + SCROLL_SPEED * dt);

    if (!this.isInvincible()) {
      this.checkCollisions();
    }

    const skierWorldY = this.scrollY() + VIEWPORT_UNITS * SKIER_Y_RATIO;
    if (skierWorldY >= COURSE_LENGTH) {
      this.onCourseComplete();
      return;
    }

    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private stopGameLoop(): void {
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
  }

  // --- Collisions ---

  private checkCollisions(): void {
    const myX = this.myX();
    const skierWorldY = this.scrollY() + VIEWPORT_UNITS * SKIER_Y_RATIO;
    const hitIds = this.hitObstacleIds();

    for (const obs of COURSE_OBSTACLES) {
      if (hitIds.has(obs.id)) continue;

      const dx = Math.abs(myX - obs.x);
      const dy = Math.abs(skierWorldY - obs.y);

      if (dx < SKIER_HITBOX + obs.hitbox && dy < COLLISION_THRESHOLD_Y) {
        this.hitObstacleIds.update((set) => {
          const ns = new Set(set);
          ns.add(obs.id);
          return ns;
        });
        this.gameRoomService.sendGameEvent('ski-hit', {
          obstacleId: obs.id,
        });
        this.applyHit(true);
        break;
      }
    }
  }

  private applyHit(isLocal: boolean): void {
    this.lives.update((l) => l - 1);
    this.shakeActive.set(true);

    if (isLocal) {
      this.isInvincible.set(true);
      this.playCrashSound();
      const t1 = setTimeout(
        () => this.isInvincible.set(false),
        HIT_INVINCIBILITY_MS,
      );
      this.timers.push(t1);
    }

    const t2 = setTimeout(() => this.shakeActive.set(false), 400);
    this.timers.push(t2);

    if (this.lives() <= 0) {
      this.stopGameLoop();
      this.stopMusic();
      const t3 = setTimeout(() => this.phase.set('gameover'), 600);
      this.timers.push(t3);
    }
  }

  // --- Completion ---

  private onCourseComplete(): void {
    this.stopGameLoop();
    this.stopMusic();
    this.phase.set('completed');
    this.playSuccessSound();
    const t = setTimeout(() => this.showCompleteModal.set(true), 800);
    this.timers.push(t);
  }

  // --- Music ---

  private startMusic(): void {
    this.stopMusic();
    const ctx = new AudioContext();
    this.musicCtx = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(ctx.destination);
    this.musicGain = masterGain;

    // BPM 150 = 0.4s per beat
    const bps = 150 / 60;
    const beat = 1 / bps;
    const barLen = beat * 4;
    const loopLen = barLen * 4; // 4 bars per loop

    // Melody (square wave, catchy action theme)
    const melodyNotes = [
      // Bar 1
      { t: 0, f: 523, d: beat * 0.5 },         // C5
      { t: beat * 0.5, f: 587, d: beat * 0.5 }, // D5
      { t: beat, f: 659, d: beat },              // E5
      { t: beat * 2, f: 784, d: beat },          // G5
      { t: beat * 3, f: 659, d: beat * 0.5 },   // E5
      { t: beat * 3.5, f: 587, d: beat * 0.5 }, // D5
      // Bar 2
      { t: barLen, f: 523, d: beat },            // C5
      { t: barLen + beat, f: 440, d: beat },     // A4
      { t: barLen + beat * 2, f: 523, d: beat * 2 }, // C5
      // Bar 3
      { t: barLen * 2, f: 587, d: beat * 0.5 },         // D5
      { t: barLen * 2 + beat * 0.5, f: 659, d: beat * 0.5 }, // E5
      { t: barLen * 2 + beat, f: 784, d: beat },         // G5
      { t: barLen * 2 + beat * 2, f: 880, d: beat },     // A5
      { t: barLen * 2 + beat * 3, f: 784, d: beat * 0.5 }, // G5
      { t: barLen * 2 + beat * 3.5, f: 659, d: beat * 0.5 }, // E5
      // Bar 4
      { t: barLen * 3, f: 587, d: beat },        // D5
      { t: barLen * 3 + beat, f: 523, d: beat },  // C5
      { t: barLen * 3 + beat * 2, f: 440, d: beat * 2 }, // A4
    ];

    // Bass line (triangle wave)
    const bassNotes = [
      { t: 0, f: 131, d: beat * 2 },                // C3
      { t: beat * 2, f: 165, d: beat * 2 },          // E3
      { t: barLen, f: 110, d: beat * 2 },             // A2
      { t: barLen + beat * 2, f: 131, d: beat * 2 },  // C3
      { t: barLen * 2, f: 147, d: beat * 2 },         // D3
      { t: barLen * 2 + beat * 2, f: 165, d: beat * 2 }, // E3
      { t: barLen * 3, f: 147, d: beat * 2 },         // D3
      { t: barLen * 3 + beat * 2, f: 110, d: beat * 2 }, // A2
    ];

    // Hi-hat rhythm (noise bursts)
    const hihatTimes: number[] = [];
    for (let i = 0; i < 16; i++) {
      hihatTimes.push(i * beat);
    }

    const scheduleLoop = (startTime: number) => {
      if (!this.musicCtx || this.musicCtx !== ctx) return;

      // Melody
      for (const note of melodyNotes) {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = note.f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, startTime + note.t);
        g.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + note.t + note.d,
        );
        osc.connect(g).connect(masterGain);
        osc.start(startTime + note.t);
        osc.stop(startTime + note.t + note.d + 0.02);
      }

      // Bass
      for (const note of bassNotes) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = note.f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5, startTime + note.t);
        g.gain.exponentialRampToValueAtTime(
          0.01,
          startTime + note.t + note.d,
        );
        osc.connect(g).connect(masterGain);
        osc.start(startTime + note.t);
        osc.stop(startTime + note.t + note.d + 0.02);
      }

      // Hi-hat
      for (const t of hihatTimes) {
        const bufLen = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 4);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 8000;
        const g = ctx.createGain();
        g.gain.value = 0.15;
        src.connect(hpf).connect(g).connect(masterGain);
        src.start(startTime + t);
      }

      // Schedule next loop
      const nextStart = startTime + loopLen;
      const scheduleTimer = setTimeout(
        () => scheduleLoop(nextStart),
        (nextStart - ctx.currentTime - 0.5) * 1000,
      );
      this.timers.push(scheduleTimer);
    };

    scheduleLoop(ctx.currentTime + 0.05);
  }

  private stopMusic(): void {
    if (this.musicGain) {
      try {
        this.musicGain.gain.setValueAtTime(
          this.musicGain.gain.value,
          this.musicCtx!.currentTime,
        );
        this.musicGain.gain.linearRampToValueAtTime(
          0,
          this.musicCtx!.currentTime + 0.3,
        );
      } catch {
        // Context may already be closed
      }
    }
    if (this.musicCtx) {
      const ctxRef = this.musicCtx;
      this.musicCtx = null;
      this.musicGain = null;
      setTimeout(() => ctxRef.close().catch(() => {}), 400);
    }
  }

  // --- Sounds ---

  private playCrashSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + 0.15);

    setTimeout(() => ctx.close(), 300);
  }

  private playSuccessSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.setValueAtTime(659, now + 0.15);
    osc.frequency.setValueAtTime(784, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    setTimeout(() => ctx.close(), 600);
  }

  // --- Reset ---

  private resetLocalState(): void {
    this.stopGameLoop();
    this.stopMusic();
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.myX.set(50);
    this.partnerX.set(50);
    this.scrollY.set(0);
    this.lives.set(MAX_LIVES);
    this.hitObstacleIds.set(new Set());
    this.isInvincible.set(false);
    this.shakeActive.set(false);
    this.showCompleteModal.set(false);
    this.countdownValue.set(null);
    this.startIntro();
  }
}
