import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DecimalPipe, NgOptimizedImage, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { GameCompleteModalComponent } from '../../components/game-complete-modal/game-complete-modal';
import { GameRulesModalComponent } from '../../components/game-rules-modal/game-rules-modal';

interface PhotoTarget {
  id: string;
  nameKey: string;
  hintKey: string;
  icon: string;
  x: number;
  y: number;
  zoom: number;
  toleranceXY: number;
  toleranceZoom: number;
}

const TOLERANCE_XY = 2;
const TOLERANCE_ZOOM = 0;

/**
 * Proposed target positions – adjust these values
 * once the actual mountain.png image is in place.
 */
const PHOTO_TARGETS: PhotoTarget[] = [
  {
    id: 'wedding',
    nameKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TARGETS.WEDDING',
    hintKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.HINTS.WEDDING',
    icon: '💒',
    x: 53,
    y: 24,
    zoom: 7,
    toleranceXY: TOLERANCE_XY,
    toleranceZoom: TOLERANCE_ZOOM,
  },
  {
    id: 'van',
    nameKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TARGETS.VAN',
    hintKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.HINTS.VAN',
    icon: '🚐',
    x: 3,
    y: 43,
    zoom: 7,
    toleranceXY: TOLERANCE_XY,
    toleranceZoom: TOLERANCE_ZOOM,
  },
  {
    id: 'climber',
    nameKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TARGETS.CLIMBER',
    hintKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.HINTS.CLIMBER',
    icon: '🧗',
    x: 93,
    y: 36,
    zoom: 7,
    toleranceXY: TOLERANCE_XY,
    toleranceZoom: TOLERANCE_ZOOM,
  },
  {
    id: 'bbq',
    nameKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TARGETS.BBQ',
    hintKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.HINTS.BBQ',
    icon: '🍖',
    x: 100,
    y: 70,
    zoom: 7,
    toleranceXY: TOLERANCE_XY,
    toleranceZoom: TOLERANCE_ZOOM,
  },
];

@Component({
  selector: 'app-photographers-game',
  imports: [FormsModule, TranslateModule, DecimalPipe, NgStyle, NgOptimizedImage, GameCompleteModalComponent, GameRulesModalComponent],
  templateUrl: './photographers-game.html',
  styleUrl: './photographers-game.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotographersGameComponent implements OnInit, OnDestroy {
  private gameRoomService = inject(GameRoomService);
  private translate = inject(TranslateService);

  gameCompleted = output<void>();

  readonly targets = PHOTO_TARGETS;

  // --- Game phase ---
  phase = signal<'intro' | 'playing' | 'completed'>('intro');
  introClosing = signal(false);

  // --- Camera state: Start at Max Zoom (7) and Focus 0 (Borracho) ---
  cameraX = signal(50);
  cameraY = signal(50);
  cameraZoom = signal(5);
  cameraFocus = signal(0);

  // --- Progress ---
  capturedTargets = signal<string[]>([]);
  showFlash = signal(false);
  lastPhotoWrong = signal(false);
  toastMessage = signal<string | null>(null);
  showCompleteModal = signal(false);
  showRulesModal = signal(false);
  waitingForPartner = signal(false);
  activeHint = signal<string | null>(null);

  readonly partnerReady = computed(() => {
    const ready = this.gameRoomService.readyPlayers();
    const localName = this.gameRoomService.localPlayerName();
    return ready.some((name) => name !== localName);
  });

  // --- Sequential target: only the current one is revealed ---
  readonly currentTarget = computed(() => {
    const captured = this.capturedTargets();
    return this.targets[captured.length] ?? null;
  });

  readonly currentTargetIndex = computed(() => this.capturedTargets().length);

  // --- Role assignment ---
  readonly role = computed(() => {
    const players = this.gameRoomService.players();
    const name = this.gameRoomService.localPlayerName();
    if (!name || players.length < 2) return null;
    return players.indexOf(name) === 0 ? 'horizontal' : 'vertical';
  });

  readonly roleLabelKey = computed(() =>
    this.role() === 'horizontal'
      ? 'CHALLENGES.GAMES.PHOTOGRAPHERS.ROLE_HORIZONTAL'
      : 'CHALLENGES.GAMES.PHOTOGRAPHERS.ROLE_VERTICAL',
  );

  // --- Focus / blur mechanics ---
  // El punto nítido depende del zoom. A zoom 7, el punto nítido es 98.
  readonly correctFocus = computed(() => this.cameraZoom() * 14);

  // El desenfoque es la distancia entre el foco actual y el punto nítido.
  readonly blurAmount = computed(
    () => Math.abs(this.cameraFocus() - this.correctFocus()) * 0.3,
  );

  readonly isInFocus = computed(() => this.blurAmount() < 1.5);

  readonly focusBarWidth = computed(() =>
    Math.max(5, 100 - this.blurAmount() * 5),
  );

  // --- Image CSS ---
  readonly imageStyle = computed(() => ({
    transform: `scale(${this.cameraZoom()})`,
    'transform-origin': `${this.cameraX()}% ${this.cameraY()}%`,
    filter: `blur(${this.blurAmount()}px)`,
  }));

  // --- Check if current target is in range (for visual feedback only) ---
  readonly isTargetInRange = computed(() => {
    const target = this.currentTarget();
    if (!target || !this.isInFocus()) return false;
    const x = this.cameraX();
    const y = this.cameraY();
    const zoom = this.cameraZoom();
    return (
      Math.abs(x - target.x) <= target.toleranceXY &&
      Math.abs(y - target.y) <= target.toleranceXY &&
      Math.abs(zoom - target.zoom) <= target.toleranceZoom
    );
  });

  readonly isMaxZoom = computed(() => this.cameraZoom() >= 7);

  readonly isCompleted = computed(
    () => this.capturedTargets().length === this.targets.length,
  );

  private timers: ReturnType<typeof setTimeout>[] = [];
  private musicCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;

  ngOnInit(): void {
    this.gameRoomService.onGameEvent((data) => {
      const payload = data.payload as Record<string, unknown>;

      if (data.event === 'camera-update') {
        if (payload['role'] === 'horizontal' && this.role() !== 'horizontal') {
          this.cameraX.set(payload['x'] as number);
          this.cameraZoom.set(payload['zoom'] as number);
        } else if (
          payload['role'] === 'vertical' &&
          this.role() !== 'vertical'
        ) {
          this.cameraY.set(payload['y'] as number);
          this.cameraFocus.set(payload['focus'] as number);
        }
      } else if (data.event === 'take-photo') {
        this.onPhotoResult(payload['targetId'] as string | null);
      }
    });

    this.gameRoomService.onGameReset(() => this.resetLocalState());
    this.gameRoomService.onGameStart(() => this.beginCountdown());

    this.startIntro();
  }

  ngOnDestroy(): void {
    this.stopMusic();
    this.timers.forEach(clearTimeout);
  }

  private startIntro(): void {
    this.phase.set('intro');
    this.introClosing.set(false);
  }

  startGame(): void {
    this.waitingForPartner.set(true);
    this.gameRoomService.markReady();
  }

  private beginCountdown(): void {
    this.waitingForPartner.set(false);
    this.introClosing.set(true);

    const t1 = setTimeout(() => {
      this.phase.set('playing');
      this.startMusic();
    }, 500);
    this.timers.push(t1);
  }

  onCameraXChange(value: number): void {
    this.cameraX.set(+value);
    this.sendCameraUpdate();
  }

  onCameraYChange(value: number): void {
    this.cameraY.set(+value);
    this.sendCameraUpdate();
  }

  onZoomChange(value: number): void {
    this.cameraZoom.set(+value);
    this.sendCameraUpdate();
  }

  onFocusChange(value: number): void {
    this.cameraFocus.set(+value);
    this.sendCameraUpdate();
  }

  /** Always-visible button: validates if current target is in range */
  takePhoto(): void {
    this.playShutterSound();
    this.lastPhotoWrong.set(false);
    const target = this.currentTarget();
    if (!target) return;

    if (this.isTargetInRange()) {
      // Correct! Broadcast to both players
      this.gameRoomService.sendGameEvent('take-photo', {
        targetId: target.id,
      });
    } else {
      // Wrong position – broadcast miss so both see feedback
      this.gameRoomService.sendGameEvent('take-photo', {
        targetId: null,
      });
    }
  }

  isTargetCaptured(targetId: string): boolean {
    return this.capturedTargets().includes(targetId);
  }

  isTargetRevealed(index: number): boolean {
    return index <= this.capturedTargets().length;
  }

  private playShutterSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Click burst (white noise)
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 10);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass to shape it like a mechanical click
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);

    // Second click (mirror slap)
    const buffer2 = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const data2 = buffer2.getChannelData(0);
    for (let i = 0; i < data2.length; i++) {
      data2[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data2.length, 15);
    }
    const noise2 = ctx.createBufferSource();
    noise2.buffer = buffer2;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.3, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise2.connect(gain2).connect(ctx.destination);
    noise2.start(now + 0.06);
    noise2.stop(now + 0.1);

    // Cleanup
    setTimeout(() => ctx.close(), 200);
  }

  // --- Music (ambient exploration loop) ---

  private startMusic(): void {
    this.stopMusic();
    const ctx = new AudioContext();
    this.musicCtx = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(ctx.destination);
    this.musicGain = masterGain;

    const bpm = 70;
    const beat = 60 / bpm;
    const barLen = beat * 4;
    const loopLen = barLen * 4;

    // Ambient pad chords (sine waves, soft)
    const chords = [
      [261, 329, 392],  // C maj
      [220, 277, 329],  // Am
      [246, 311, 370],  // Bm-ish
      [196, 261, 329],  // G/C
    ];

    // Gentle melody (triangle wave)
    const melodyNotes = [
      { t: 0, f: 659, d: beat * 2 },
      { t: beat * 2, f: 587, d: beat },
      { t: beat * 3, f: 523, d: beat },
      { t: barLen, f: 440, d: beat * 3 },
      { t: barLen + beat * 3, f: 494, d: beat },
      { t: barLen * 2, f: 523, d: beat * 2 },
      { t: barLen * 2 + beat * 2, f: 587, d: beat * 2 },
      { t: barLen * 3, f: 523, d: beat * 2 },
      { t: barLen * 3 + beat * 2, f: 440, d: beat * 2 },
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
          g.gain.linearRampToValueAtTime(0.15, t0 + beat);
          g.gain.setValueAtTime(0.15, t0 + barLen - beat);
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
        g.gain.setValueAtTime(0.25, startTime + note.t);
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
          this.musicCtx.currentTime + 0.5,
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
      setTimeout(() => ctxRef.close().catch(() => {}), 600);
    }
  }

  private playSuccessSound(): void {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.2);
    });
    setTimeout(() => ctx.close(), 600);
  }

  private sendCameraUpdate(): void {
    const r = this.role();
    if (r === 'horizontal') {
      this.gameRoomService.sendGameEvent('camera-update', {
        role: 'horizontal',
        x: this.cameraX(),
        zoom: this.cameraZoom(),
      });
    } else if (r === 'vertical') {
      this.gameRoomService.sendGameEvent('camera-update', {
        role: 'vertical',
        y: this.cameraY(),
        focus: this.cameraFocus(),
      });
    }
  }

  private onPhotoResult(targetId: string | null): void {
    if (!targetId) {
      // Miss – shake feedback + toast
      this.lastPhotoWrong.set(true);
      this.showFlash.set(true);
      this.toastMessage.set(
        this.translate.instant('CHALLENGES.GAMES.PHOTOGRAPHERS.MISS_TOAST'),
      );
      const t = setTimeout(() => {
        this.showFlash.set(false);
        this.lastPhotoWrong.set(false);
      }, 600);
      const t2 = setTimeout(() => this.toastMessage.set(null), 3000);
      this.timers.push(t, t2);
      return;
    }

    if (this.capturedTargets().includes(targetId)) return;

    this.capturedTargets.update((arr) => [...arr, targetId]);
    this.showFlash.set(true);
    this.playSuccessSound();
    const t1 = setTimeout(() => this.showFlash.set(false), 500);
    this.timers.push(t1);

    if (this.capturedTargets().length === this.targets.length) {
      this.stopMusic();
      const t2 = setTimeout(() => {
        this.phase.set('completed');
        this.showCompleteModal.set(true);
      }, 1000);
      this.timers.push(t2);
    }
  }

  toggleHint(targetId: string): void {
    this.activeHint.update((current) =>
      current === targetId ? null : targetId,
    );
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
    this.gameCompleted.emit();
  }

  private resetLocalState(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.cameraX.set(50);
    this.cameraY.set(50);
    this.cameraZoom.set(7);
    this.cameraFocus.set(0);
    this.capturedTargets.set([]);
    this.showFlash.set(false);
    this.lastPhotoWrong.set(false);
    this.toastMessage.set(null);
    this.showCompleteModal.set(false);
    this.waitingForPartner.set(false);
    this.startIntro();
  }
}
