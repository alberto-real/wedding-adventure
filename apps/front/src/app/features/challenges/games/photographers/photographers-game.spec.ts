import { TestBed } from '@angular/core/testing';
import { PhotographersGameComponent } from './photographers-game';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { signal } from '@angular/core';

// Mock AudioContext with chainable connect
function makeNode(extra: Record<string, unknown> = {}) {
  const node = { connect: vi.fn(), ...extra };
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

(window as unknown as Record<string, unknown>)['AudioContext'] = AudioContextMock;

describe('PhotographersGameComponent', () => {
  let gameRoomServiceMock: {
    players: ReturnType<typeof signal>;
    localPlayerName: ReturnType<typeof signal<string>>;
    onGameEvent: ReturnType<typeof vi.fn>;
    onGameReset: ReturnType<typeof vi.fn>;
    onGameStart: ReturnType<typeof vi.fn>;
    sendGameEvent: ReturnType<typeof vi.fn>;
    markReady: ReturnType<typeof vi.fn>;
    readyPlayers: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    gameRoomServiceMock = {
      players: signal(['P1', 'P2']),
      localPlayerName: signal('P1'),
      onGameEvent: vi.fn(),
      onGameReset: vi.fn(),
      onGameStart: vi.fn(),
      sendGameEvent: vi.fn(),
      markReady: vi.fn(),
      readyPlayers: signal([])
    };

    await TestBed.configureTestingModule({
      imports: [PhotographersGameComponent, TranslateModule.forRoot()],
      providers: [
        { provide: GameRoomService, useValue: gameRoomServiceMock }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function triggerGameStart(component: PhotographersGameComponent): void {
    component.startGame();
    const onStartCb = gameRoomServiceMock.onGameStart.mock.calls[0][0];
    onStartCb();
  }

  it('should create and start intro', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.phase()).toBe('intro');
    expect(fixture.componentInstance.introClosing()).toBe(false);

    // User clicks "Start"
    triggerGameStart(fixture.componentInstance);
    expect(fixture.componentInstance.introClosing()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.phase()).toBe('playing');
  });

  it('should compute role correctly', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.role()).toBe('horizontal');

    gameRoomServiceMock.localPlayerName.set('P2');
    expect(fixture.componentInstance.role()).toBe('vertical');
  });

  it('should return null role when not enough players', () => {
    gameRoomServiceMock.players.set(['P1']);
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.role()).toBeNull();
  });

  it('should compute roleLabelKey', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.roleLabelKey()).toContain('HORIZONTAL');

    gameRoomServiceMock.localPlayerName.set('P2');
    expect(fixture.componentInstance.roleLabelKey()).toContain('VERTICAL');
  });

  it('should handle camera X change', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.onCameraXChange(30);
    expect(fixture.componentInstance.cameraX()).toBe(30);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('camera-update', expect.objectContaining({ role: 'horizontal', x: 30 }));
  });

  it('should handle camera Y change', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    gameRoomServiceMock.localPlayerName.set('P2');
    fixture.detectChanges();

    fixture.componentInstance.onCameraYChange(40);
    expect(fixture.componentInstance.cameraY()).toBe(40);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('camera-update', expect.objectContaining({ role: 'vertical', y: 40 }));
  });

  it('should handle zoom change', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.onZoomChange(3);
    expect(fixture.componentInstance.cameraZoom()).toBe(3);
  });

  it('should handle focus change', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    gameRoomServiceMock.localPlayerName.set('P2');
    fixture.detectChanges();

    fixture.componentInstance.onFocusChange(80);
    expect(fixture.componentInstance.cameraFocus()).toBe(80);
  });

  it('should not send camera update for null role', () => {
    gameRoomServiceMock.players.set(['P1']);
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.onCameraXChange(30);
    expect(gameRoomServiceMock.sendGameEvent).not.toHaveBeenCalled();
  });

  it('should handle camera updates from partner (horizontal)', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    gameRoomServiceMock.localPlayerName.set('P2');
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'camera-update', payload: { role: 'horizontal', x: 30, zoom: 3 } });

    expect(fixture.componentInstance.cameraX()).toBe(30);
    expect(fixture.componentInstance.cameraZoom()).toBe(3);
  });

  it('should handle camera updates from partner (vertical)', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'camera-update', payload: { role: 'vertical', y: 30, focus: 100 } });

    expect(fixture.componentInstance.cameraY()).toBe(30);
    expect(fixture.componentInstance.cameraFocus()).toBe(100);
  });

  it('should not apply own camera updates from partner', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'camera-update', payload: { role: 'horizontal', x: 99, zoom: 9 } });
    expect(fixture.componentInstance.cameraX()).toBe(50);
  });

  it('should validate photo capture when target is in range', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const target = fixture.componentInstance.targets[0];
    fixture.componentInstance.cameraX.set(target.x);
    fixture.componentInstance.cameraY.set(target.y);
    fixture.componentInstance.cameraZoom.set(target.zoom);
    fixture.componentInstance.cameraFocus.set(target.zoom * 14);

    expect(fixture.componentInstance.isTargetInRange()).toBe(true);

    fixture.componentInstance.takePhoto();
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('take-photo', { targetId: target.id });
  });

  it('should handle wrong photo capture', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.cameraX.set(0);
    expect(fixture.componentInstance.isTargetInRange()).toBe(false);

    fixture.componentInstance.takePhoto();
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('take-photo', { targetId: null });
  });

  it('should handle take-photo miss event', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'take-photo', payload: { targetId: null } });

    expect(fixture.componentInstance.lastPhotoWrong()).toBe(true);
    expect(fixture.componentInstance.showFlash()).toBe(true);
    expect(fixture.componentInstance.toastMessage()).toBeTruthy();

    vi.advanceTimersByTime(600);
    expect(fixture.componentInstance.showFlash()).toBe(false);
    expect(fixture.componentInstance.lastPhotoWrong()).toBe(false);

    vi.advanceTimersByTime(2400);
    expect(fixture.componentInstance.toastMessage()).toBeNull();
  });

  it('should handle take-photo success event', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const target = fixture.componentInstance.targets[0];
    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'take-photo', payload: { targetId: target.id } });

    expect(fixture.componentInstance.capturedTargets()).toContain(target.id);
    expect(fixture.componentInstance.showFlash()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.showFlash()).toBe(false);
  });

  it('should not capture same target twice', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const target = fixture.componentInstance.targets[0];
    fixture.componentInstance.capturedTargets.set([target.id]);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'take-photo', payload: { targetId: target.id } });

    expect(fixture.componentInstance.capturedTargets().length).toBe(1);
  });

  it('should complete game when all targets captured', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();

    const targets = fixture.componentInstance.targets;
    fixture.componentInstance.capturedTargets.set(targets.slice(0, -1).map(t => t.id));

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'take-photo', payload: { targetId: targets[targets.length - 1].id } });

    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.phase()).toBe('completed');
    expect(fixture.componentInstance.showCompleteModal()).toBe(true);
  });

  it('should close complete modal and emit', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.gameCompleted, 'emit');

    fixture.componentInstance.showCompleteModal.set(true);
    fixture.componentInstance.closeCompleteModal();
    expect(fixture.componentInstance.showCompleteModal()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle game reset', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();
    triggerGameStart(fixture.componentInstance);
    vi.advanceTimersByTime(500);

    fixture.componentInstance.capturedTargets.set(['wedding']);

    const onReset = gameRoomServiceMock.onGameReset.mock.calls[0][0];
    onReset();

    expect(fixture.componentInstance.capturedTargets()).toEqual([]);
    expect(fixture.componentInstance.phase()).toBe('intro');
    expect(fixture.componentInstance.cameraFocus()).toBe(0);
  });

  it('should compute currentTarget', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.currentTarget()?.id).toBe('wedding');

    fixture.componentInstance.capturedTargets.set(['wedding']);
    expect(fixture.componentInstance.currentTarget()?.id).toBe('van');
  });

  it('should return null currentTarget when all captured', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.capturedTargets.set(fixture.componentInstance.targets.map(t => t.id));
    expect(fixture.componentInstance.currentTarget()).toBeNull();
  });

  it('should compute currentTargetIndex', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.currentTargetIndex()).toBe(0);
    fixture.componentInstance.capturedTargets.set(['wedding', 'van']);
    expect(fixture.componentInstance.currentTargetIndex()).toBe(2);
  });

  it('should compute blur and focus mechanics', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.cameraZoom.set(5);
    expect(fixture.componentInstance.correctFocus()).toBe(5 * 14);

    fixture.componentInstance.cameraFocus.set(5 * 14);
    expect(fixture.componentInstance.blurAmount()).toBe(0);
    expect(fixture.componentInstance.isInFocus()).toBe(true);
    expect(fixture.componentInstance.focusBarWidth()).toBe(100);
  });

  it('should compute blurAmount when out of focus', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.cameraZoom.set(5);
    fixture.componentInstance.cameraFocus.set(50);
    const blur = fixture.componentInstance.blurAmount();
    expect(blur).toBeGreaterThan(0);
    expect(fixture.componentInstance.isInFocus()).toBe(false);
  });

  it('should compute imageStyle', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    const style = fixture.componentInstance.imageStyle();
    expect(style.transform).toContain('scale');
    expect(style['transform-origin']).toContain('%');
    expect(style.filter).toContain('blur');
  });

  it('should compute isTargetInRange false when not in focus', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    const target = fixture.componentInstance.targets[0];
    fixture.componentInstance.cameraX.set(target.x);
    fixture.componentInstance.cameraY.set(target.y);
    fixture.componentInstance.cameraZoom.set(target.zoom);
    fixture.componentInstance.cameraFocus.set(0);

    expect(fixture.componentInstance.isTargetInRange()).toBe(false);
  });

  it('should compute isTargetInRange false when no target', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.capturedTargets.set(fixture.componentInstance.targets.map(t => t.id));
    expect(fixture.componentInstance.isTargetInRange()).toBe(false);
  });

  it('should check isTargetCaptured', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.isTargetCaptured('wedding')).toBe(false);
    fixture.componentInstance.capturedTargets.set(['wedding']);
    expect(fixture.componentInstance.isTargetCaptured('wedding')).toBe(true);
  });

  it('should check isTargetRevealed', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.isTargetRevealed(0)).toBe(true);
    expect(fixture.componentInstance.isTargetRevealed(1)).toBe(false);
    fixture.componentInstance.capturedTargets.set(['wedding']);
    expect(fixture.componentInstance.isTargetRevealed(1)).toBe(true);
  });

  it('should compute isCompleted', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    expect(fixture.componentInstance.isCompleted()).toBe(false);
    fixture.componentInstance.capturedTargets.set(fixture.componentInstance.targets.map(t => t.id));
    expect(fixture.componentInstance.isCompleted()).toBe(true);
  });

  it('should not take photo when no current target', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.capturedTargets.set(fixture.componentInstance.targets.map(t => t.id));
    fixture.componentInstance.takePhoto();
    expect(gameRoomServiceMock.sendGameEvent).not.toHaveBeenCalledWith('take-photo', expect.anything());
  });

  it('should compute focusBarWidth minimum', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.componentInstance.cameraZoom.set(5);
    fixture.componentInstance.cameraFocus.set(0);
    const width = fixture.componentInstance.focusBarWidth();
    expect(width).toBeGreaterThanOrEqual(5);
  });

  it('should clean up on destroy', () => {
    const fixture = TestBed.createComponent(PhotographersGameComponent);
    fixture.detectChanges();
    triggerGameStart(fixture.componentInstance);
    vi.advanceTimersByTime(500);

    fixture.componentInstance.ngOnDestroy();
  });
});
