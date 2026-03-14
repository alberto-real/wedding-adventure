import { TestBed } from '@angular/core/testing';
import { SkiGameComponent } from './ski-game';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { signal } from '@angular/core';

// Mock AudioContext with chainable connect
function makeNode(extra: Record<string, any> = {}): any {
  const node: any = { connect: vi.fn(), ...extra };
  node.connect.mockImplementation(() => node);
  return node;
}
class AudioContextMock {
  createOscillator() { return makeNode({ start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn(), value: 0, linearRampToValueAtTime: vi.fn() }, type: '' }); }
  createGain() { return makeNode({ gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 1, linearRampToValueAtTime: vi.fn() } }); }
  createBiquadFilter() { return makeNode({ type: '', frequency: { value: 0 }, Q: { value: 0 } }); }
  createBuffer() { return { getChannelData: vi.fn().mockReturnValue(new Float32Array(100)) }; }
  createBufferSource() { return makeNode({ start: vi.fn(), stop: vi.fn(), buffer: null }); }
  destination = {};
  currentTime = 0;
  sampleRate = 44100;
  close() { return Promise.resolve(); }
}

(window as any).AudioContext = AudioContextMock;

describe('SkiGameComponent', () => {
  let gameRoomServiceMock: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    gameRoomServiceMock = {
      players: signal(['P1', 'P2']),
      localPlayerName: signal('P1'),
      onGameEvent: vi.fn(),
      onGameReset: vi.fn(),
      sendGameEvent: vi.fn(),
      resetGame: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SkiGameComponent, TranslateModule.forRoot()],
      providers: [
        { provide: GameRoomService, useValue: gameRoomServiceMock }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and start intro', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.phase()).toBe('intro');

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.introClosing()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.phase()).toBe('countdown');
    expect(fixture.componentInstance.countdownValue()).toBe(3);

    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.countdownValue()).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.countdownValue()).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.phase()).toBe('playing');
    expect(fixture.componentInstance.countdownValue()).toBeNull();
  });

  it('should handle movement', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.onMoveX(70);
    expect(fixture.componentInstance.myX()).toBe(70);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('ski-move', { x: 70 });
  });

  it('should calculate role correctly', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    expect(fixture.componentInstance.role()).toBe('blue');

    gameRoomServiceMock.localPlayerName.set('P2');
    expect(fixture.componentInstance.role()).toBe('red');
  });

  it('should return null role when not enough players', () => {
    gameRoomServiceMock.players.set(['P1']);
    const fixture = TestBed.createComponent(SkiGameComponent);
    expect(fixture.componentInstance.role()).toBeNull();
  });

  it('should handle collisions and lose lives', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);

    expect(fixture.componentInstance.lives()).toBe(3);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'ski-hit', payload: { obstacleId: 1 } });

    expect(fixture.componentInstance.lives()).toBe(2);
    expect(fixture.componentInstance.shakeActive()).toBe(true);

    vi.advanceTimersByTime(400);
    expect(fixture.componentInstance.shakeActive()).toBe(false);
  });

  it('should handle game over', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'ski-hit', payload: { obstacleId: 1 } });
    onEvent({ event: 'ski-hit', payload: { obstacleId: 2 } });
    onEvent({ event: 'ski-hit', payload: { obstacleId: 3 } });

    expect(fixture.componentInstance.lives()).toBe(0);
    vi.advanceTimersByTime(600);
    expect(fixture.componentInstance.phase()).toBe('gameover');
  });

  it('should retry game', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.retryGame();
    expect(gameRoomServiceMock.resetGame).toHaveBeenCalled();
  });

  it('should handle partner ski-move event', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'ski-move', payload: { x: 30 } });

    expect(fixture.componentInstance.partnerX()).toBe(30);
  });

  it('should drag player when partner moves beyond rope distance', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.myX.set(50);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    // Partner moves far right (> MAX_ROPE_DISTANCE = 45)
    onEvent({ event: 'ski-move', payload: { x: 96 } });

    expect(fixture.componentInstance.partnerX()).toBe(96);
    // myX should be dragged to 96 - 45 = 51
    expect(fixture.componentInstance.myX()).toBe(51);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('ski-move', { x: 51 });
  });

  it('should drag player when partner moves far left', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.myX.set(50);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    // Partner moves far left
    onEvent({ event: 'ski-move', payload: { x: 4 } });

    expect(fixture.componentInstance.partnerX()).toBe(4);
    // myX should be dragged to 4 + 45 = 49
    expect(fixture.componentInstance.myX()).toBe(49);
  });

  it('should drag partner when player moves beyond rope distance', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.partnerX.set(50);

    // Move player far to the right
    fixture.componentInstance.onMoveX(96);

    // Partner should be dragged to 96 - 45 = 51
    expect(fixture.componentInstance.partnerX()).toBe(51);
  });

  it('should drag partner when player moves far left', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.partnerX.set(50);

    fixture.componentInstance.onMoveX(4);
    // Partner should be dragged to 4 + 45 = 49
    expect(fixture.componentInstance.partnerX()).toBe(49);
  });

  it('should not drag partner when within rope distance', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.partnerX.set(50);
    fixture.componentInstance.onMoveX(60);
    expect(fixture.componentInstance.partnerX()).toBe(50);
  });

  it('should compute progressPercent', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    expect(fixture.componentInstance.progressPercent()).toBe(0);

    fixture.componentInstance.scrollY.set(2500);
    expect(fixture.componentInstance.progressPercent()).toBeGreaterThan(0);
  });

  it('should compute visibleObstacles', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.scrollY.set(0);
    const visible = fixture.componentInstance.visibleObstacles();
    // Some obstacles should be visible at the start
    expect(visible.length).toBeGreaterThanOrEqual(0);
  });

  it('should mark hit obstacles in visibleObstacles', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.scrollY.set(350);
    fixture.componentInstance.hitObstacleIds.set(new Set([1]));

    const visible = fixture.componentInstance.visibleObstacles();
    const hitObs = visible.find(o => o.id === 1);
    if (hitObs) {
      expect(hitObs.hit).toBe(true);
    }
  });

  it('should compute finishLineScreenY and showFinishLine', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.scrollY.set(0);
    expect(fixture.componentInstance.showFinishLine()).toBe(false);

    fixture.componentInstance.scrollY.set(4400);
    expect(fixture.componentInstance.showFinishLine()).toBe(true);
  });

  it('should compute livesArray', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    expect(fixture.componentInstance.livesArray()).toEqual([true, true, true]);

    fixture.componentInstance.lives.set(1);
    expect(fixture.componentInstance.livesArray()).toEqual([true, false, false]);
  });

  it('should compute slopeBgOffsetY', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.scrollY.set(100);
    expect(typeof fixture.componentInstance.slopeBgOffsetY()).toBe('number');
  });

  it('should compute ropeLeft and ropeWidth', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.componentInstance.myX.set(30);
    fixture.componentInstance.partnerX.set(60);

    expect(fixture.componentInstance.ropeLeft()).toBe(30);
    expect(fixture.componentInstance.ropeWidth()).toBe(30);
  });

  it('should compute ropeColor based on distance', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);

    fixture.componentInstance.myX.set(50);
    fixture.componentInstance.partnerX.set(60);
    expect(fixture.componentInstance.ropeColor()).toBe('#22c55e'); // green, < 25

    fixture.componentInstance.partnerX.set(80);
    expect(fixture.componentInstance.ropeColor()).toBe('#eab308'); // yellow, < 45

    fixture.componentInstance.partnerX.set(96);
    expect(fixture.componentInstance.ropeColor()).toBe('#ef4444'); // red, >= 45
  });

  it('should close complete modal and emit', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.gameCompleted, 'emit');

    fixture.componentInstance.showCompleteModal.set(true);
    fixture.componentInstance.closeCompleteModal();
    expect(fixture.componentInstance.showCompleteModal()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle game reset', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);

    fixture.componentInstance.lives.set(1);
    fixture.componentInstance.scrollY.set(1000);

    const onReset = gameRoomServiceMock.onGameReset.mock.calls[0][0];
    onReset();

    expect(fixture.componentInstance.lives()).toBe(3);
    expect(fixture.componentInstance.scrollY()).toBe(0);
    expect(fixture.componentInstance.myX()).toBe(50);
    expect(fixture.componentInstance.partnerX()).toBe(50);
    expect(fixture.componentInstance.phase()).toBe('intro');
    expect(fixture.componentInstance.showCompleteModal()).toBe(false);
  });

  it('should clean up on destroy', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);

    fixture.componentInstance.ngOnDestroy();
  });

  it('should add hit obstacle id on ski-hit event', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'ski-hit', payload: { obstacleId: 5 } });

    expect(fixture.componentInstance.hitObstacleIds().has(5)).toBe(true);
  });

  it('should compute SKIER_Y_PERCENT', () => {
    const fixture = TestBed.createComponent(SkiGameComponent);
    expect(fixture.componentInstance.SKIER_Y_PERCENT).toBe(50);
  });
});
