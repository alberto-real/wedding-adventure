import { TestBed } from '@angular/core/testing';
import { MazeGameComponent } from './maze-game';
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

describe('MazeGameComponent', () => {
  let gameRoomServiceMock: {
    players: ReturnType<typeof signal>;
    localPlayerName: ReturnType<typeof signal<string>>;
    roomId: ReturnType<typeof signal>;
    onGameEvent: ReturnType<typeof vi.fn>;
    onGameReset: ReturnType<typeof vi.fn>;
    onGameStart: ReturnType<typeof vi.fn>;
    sendGameEvent: ReturnType<typeof vi.fn>;
    resetGame: ReturnType<typeof vi.fn>;
    markReady: ReturnType<typeof vi.fn>;
    readyPlayers: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    gameRoomServiceMock = {
      players: signal(['P1', 'P2']),
      localPlayerName: signal('P1'),
      roomId: signal('TEST'),
      onGameEvent: vi.fn(),
      onGameReset: vi.fn(),
      onGameStart: vi.fn(),
      sendGameEvent: vi.fn(),
      resetGame: vi.fn(),
      markReady: vi.fn(),
      readyPlayers: signal([])
    };

    await TestBed.configureTestingModule({
      imports: [MazeGameComponent, TranslateModule.forRoot()],
      providers: [
        { provide: GameRoomService, useValue: gameRoomServiceMock }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function triggerGameStart(component: MazeGameComponent): void {
    component.startGame();
    const onStartCb = gameRoomServiceMock.onGameStart.mock.calls[0][0];
    onStartCb();
  }

  it('should create and generate maze', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.maze().length).toBeGreaterThan(0);
    expect(fixture.componentInstance.checkpoints().length).toBe(4);
  });

  it('should start with intro phase', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.phase()).toBe('intro');
  });

  it('should transition through phases', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.introClosing()).toBe(false);

    // User clicks "Start"
    triggerGameStart(fixture.componentInstance);
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

  it('should handle movement according to role (blue = horizontal)', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));
    fixture.componentInstance.phase.set('playing');

    const initialCol = fixture.componentInstance.playerCol();
    fixture.componentInstance.move('right');
    expect(fixture.componentInstance.playerCol()).toBe(initialCol + 1);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('maze-move', { col: initialCol + 1 });

    const initialRow = fixture.componentInstance.playerRow();
    fixture.componentInstance.move('down');
    expect(fixture.componentInstance.playerRow()).toBe(initialRow);
  });

  it('should handle movement for red role (vertical)', () => {
    gameRoomServiceMock.localPlayerName.set('P2');
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));
    fixture.componentInstance.phase.set('playing');

    const initialRow = fixture.componentInstance.playerRow();
    fixture.componentInstance.move('down');
    expect(fixture.componentInstance.playerRow()).toBe(initialRow + 1);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('maze-move', { row: initialRow + 1 });

    const initialCol = fixture.componentInstance.playerCol();
    fixture.componentInstance.move('left');
    expect(fixture.componentInstance.playerCol()).toBe(initialCol);
  });

  it('should handle up movement for red role', () => {
    gameRoomServiceMock.localPlayerName.set('P2');
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.playerRow.set(5);

    fixture.componentInstance.move('up');
    expect(fixture.componentInstance.playerRow()).toBe(4);
  });

  it('should handle left movement for blue role', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.playerCol.set(5);

    fixture.componentInstance.move('left');
    expect(fixture.componentInstance.playerCol()).toBe(4);
  });

  it('should not move when not playing', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('intro');

    const initialCol = fixture.componentInstance.playerCol();
    fixture.componentInstance.move('right');
    expect(fixture.componentInstance.playerCol()).toBe(initialCol);
  });

  it('should not move when quiz is active', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.quizActive.set(true);

    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));
    const initialCol = fixture.componentInstance.playerCol();
    fixture.componentInstance.move('right');
    expect(fixture.componentInstance.playerCol()).toBe(initialCol);
  });

  it('should not move when maze is empty', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.maze.set([]);

    fixture.componentInstance.move('right');
    // Should not throw
  });

  it('should not move into walls', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');

    const maze = Array.from({ length: 15 }, () => Array(15).fill(0));
    maze[1][2] = 1;
    fixture.componentInstance.maze.set(maze);

    const initialCol = fixture.componentInstance.playerCol();
    fixture.componentInstance.move('right');
    expect(fixture.componentInstance.playerCol()).toBe(initialCol);
  });

  it('should not move out of bounds', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));

    fixture.componentInstance.playerCol.set(0);
    fixture.componentInstance.move('left');
    expect(fixture.componentInstance.playerCol()).toBe(0);
  });

  it('should not move out of bounds (top)', () => {
    gameRoomServiceMock.localPlayerName.set('P2');
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));

    fixture.componentInstance.playerRow.set(0);
    fixture.componentInstance.move('up');
    expect(fixture.componentInstance.playerRow()).toBe(0);
  });

  it('should show quiz when reaching checkpoint', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const cp = fixture.componentInstance.checkpoints()[0];
    fixture.componentInstance.playerRow.set(cp.row);
    fixture.componentInstance.playerCol.set(cp.col);

    (fixture.componentInstance as any).checkCheckpoint();

    expect(fixture.componentInstance.quizActive()).toBe(true);
    expect(fixture.componentInstance.quizCpIndex()).toBe(0);
  });

  it('should submit answer if red role', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    gameRoomServiceMock.localPlayerName.set('P2');
    fixture.detectChanges();

    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizActive.set(true);
    fixture.componentInstance.submitAnswer(0);

    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('maze-quiz-answer', { optionIndex: 0 });
  });

  it('should not submit answer if blue role', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.submitAnswer(0);

    expect(gameRoomServiceMock.sendGameEvent).not.toHaveBeenCalledWith('maze-quiz-answer', expect.anything());
  });

  it('should not submit answer if quiz result is not pending', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    gameRoomServiceMock.localPlayerName.set('P2');
    fixture.detectChanges();

    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizResult.set('correct');
    fixture.componentInstance.submitAnswer(0);

    expect(gameRoomServiceMock.sendGameEvent).not.toHaveBeenCalledWith('maze-quiz-answer', expect.anything());
  });

  it('should resolve quiz correctly', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizActive.set(true);
    (fixture.componentInstance as any).resolveQuiz(true);

    expect(fixture.componentInstance.quizResult()).toBe('correct');

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.quizActive()).toBe(false);
    expect(fixture.componentInstance.quizResult()).toBe('pending');
    expect(fixture.componentInstance.quizCpIndex()).toBe(-1);
  });

  it('should resolve quiz incorrectly with penalty', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const elapsed = fixture.componentInstance.elapsed();
    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizActive.set(true);
    (fixture.componentInstance as any).resolveQuiz(false);

    expect(fixture.componentInstance.quizResult()).toBe('wrong');
    expect(fixture.componentInstance.elapsed()).toBe(elapsed + 20);

    vi.advanceTimersByTime(2000);
    expect(fixture.componentInstance.quizActive()).toBe(false);
  });

  it('should handle game event for maze-move with col', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'maze-move', payload: { col: 5 } });

    expect(fixture.componentInstance.playerCol()).toBe(5);
  });

  it('should handle game event for maze-move with row', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'maze-move', payload: { row: 7 } });

    expect(fixture.componentInstance.playerRow()).toBe(7);
  });

  it('should handle game event for maze-quiz-answer', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizActive.set(true);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'maze-quiz-answer', payload: { optionIndex: 0 } });

    expect(fixture.componentInstance.quizResult()).toBe('correct');
  });

  it('should handle game reset', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.elapsed.set(50);

    const onReset = gameRoomServiceMock.onGameReset.mock.calls[0][0];
    onReset();

    expect(fixture.componentInstance.phase()).toBe('intro');
    expect(fixture.componentInstance.elapsed()).toBe(0);
  });

  it('should handle keydown events', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.maze.set(Array.from({ length: 15 }, () => Array(15).fill(0)));

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.onKeydown(event);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('should ignore non-arrow keydown events', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Space' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.onKeydown(event);
    expect(preventSpy).not.toHaveBeenCalled();
  });

  it('should handle time up (game over)', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    triggerGameStart(fixture.componentInstance);
    vi.advanceTimersByTime(3500);

    fixture.componentInstance.elapsed.set(179);
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.phase()).toBe('gameover');
  });

  it('should compute role correctly', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    expect(fixture.componentInstance.role()).toBe('blue');

    gameRoomServiceMock.localPlayerName.set('P2');
    expect(fixture.componentInstance.role()).toBe('red');
  });

  it('should return null role if not enough players', () => {
    gameRoomServiceMock.players.set(['P1']);
    const fixture = TestBed.createComponent(MazeGameComponent);
    expect(fixture.componentInstance.role()).toBeNull();
  });

  it('should compute allCollected', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.allCollected()).toBe(false);

    fixture.componentInstance.collectedIds.set(new Set([0, 1, 2, 3]));
    expect(fixture.componentInstance.allCollected()).toBe(true);
  });

  it('should compute allCollected false with no checkpoints', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.checkpoints.set([]);
    expect(fixture.componentInstance.allCollected()).toBe(false);
  });

  it('should compute timeRemaining and timeDisplay', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.elapsed.set(60);
    expect(fixture.componentInstance.timeRemaining()).toBe(120);
    expect(fixture.componentInstance.timeDisplay()).toBe('2:00');
  });

  it('should compute timeRemaining at 0 minimum', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.elapsed.set(999);
    expect(fixture.componentInstance.timeRemaining()).toBe(0);
  });

  it('should compute checkpointsStatus', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    const status = fixture.componentInstance.checkpointsStatus();
    expect(status.length).toBe(4);
    expect(status[0].collected).toBe(false);

    fixture.componentInstance.collectedIds.set(new Set([0]));
    const updated = fixture.componentInstance.checkpointsStatus();
    expect(updated[0].collected).toBe(true);
  });

  it('should compute activeQuiz', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    expect(fixture.componentInstance.activeQuiz()).toBeNull();

    fixture.componentInstance.quizCpIndex.set(0);
    expect(fixture.componentInstance.activeQuiz()).toBeTruthy();
  });

  it('should return null activeQuiz for out-of-range index', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.quizCpIndex.set(99);
    expect(fixture.componentInstance.activeQuiz()).toBeNull();
  });

  it('should compute activeQuizEmoji', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.quizCpIndex.set(0);
    expect(fixture.componentInstance.activeQuizEmoji()).toBeTruthy();
  });

  it('should return empty activeQuizEmoji for out-of-range index', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.quizCpIndex.set(99);
    expect(fixture.componentInstance.activeQuizEmoji()).toBe('');
  });

  it('should compute gridCells with fog of war', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    const cells = fixture.componentInstance.gridCells();
    expect(cells.length).toBe(15);

    const playerRow = fixture.componentInstance.playerRow();
    const playerCol = fixture.componentInstance.playerCol();
    expect(cells[playerRow][playerCol].isPlayer).toBe(true);
    expect(cells[playerRow][playerCol].isFogged).toBe(false);
  });

  it('should return empty gridCells when no maze', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.maze.set([]);
    expect(fixture.componentInstance.gridCells()).toEqual([]);
  });

  it('should complete game when returning to base with all collected', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');

    fixture.componentInstance.collectedIds.set(new Set([0, 1, 2, 3]));
    fixture.componentInstance.playerRow.set(1);
    fixture.componentInstance.playerCol.set(1);
    (fixture.componentInstance as any).checkCheckpoint();

    expect(fixture.componentInstance.phase()).toBe('completed');

    vi.advanceTimersByTime(800);
    expect(fixture.componentInstance.showCompleteModal()).toBe(true);
  });

  it('should close complete modal and emit', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.gameCompleted, 'emit');

    fixture.componentInstance.showCompleteModal.set(true);
    fixture.componentInstance.closeCompleteModal();
    expect(fixture.componentInstance.showCompleteModal()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('should retry game via service', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.componentInstance.retryGame();
    expect(gameRoomServiceMock.resetGame).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    triggerGameStart(fixture.componentInstance);
    vi.advanceTimersByTime(3500);

    fixture.componentInstance.ngOnDestroy();
  });

  it('should not start quiz if cpIndex >= QUIZ.length', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    (fixture.componentInstance as any).startQuiz(99);
    expect(fixture.componentInstance.quizActive()).toBe(false);
  });

  it('should check return to base after quiz closes if all collected', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();
    fixture.componentInstance.phase.set('playing');
    fixture.componentInstance.collectedIds.set(new Set([0, 1, 2, 3]));
    fixture.componentInstance.playerRow.set(1);
    fixture.componentInstance.playerCol.set(1);
    fixture.componentInstance.quizCpIndex.set(0);
    fixture.componentInstance.quizActive.set(true);

    (fixture.componentInstance as any).resolveQuiz(true);
    vi.advanceTimersByTime(1500);

    expect(fixture.componentInstance.phase()).toBe('completed');
  });

  it('should show fogged beacons for uncollected checkpoints', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    const cells = fixture.componentInstance.gridCells();
    const cp = fixture.componentInstance.checkpoints()[0];
    const cell = cells[cp.row][cp.col];
    if (cell.isFogged) {
      expect(cell.isFoggedBeacon).toBe(true);
      expect(cell.emoji).toBe(cp.emoji);
    }
  });

  it('should show base emoji on revealed base when not all collected', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    // Player starts at base (1,1), so base is revealed
    const cells = fixture.componentInstance.gridCells();
    const baseCell = cells[1][1];
    // Player is on the base, so emoji is player emoji
    expect(baseCell.emoji).toBe('🧭');
    expect(baseCell.isPlayer).toBe(true);
  });

  it('should show finish flag on base when all collected and player not on base', () => {
    const fixture = TestBed.createComponent(MazeGameComponent);
    fixture.detectChanges();

    fixture.componentInstance.collectedIds.set(new Set([0, 1, 2, 3]));
    fixture.componentInstance.playerRow.set(3);
    fixture.componentInstance.playerCol.set(3);
    // Reveal the base
    (fixture.componentInstance as any).revealAround(1, 1);

    const cells = fixture.componentInstance.gridCells();
    const baseCell = cells[1][1];
    expect(baseCell.emoji).toBe('🏁');
    expect(baseCell.isBaseFlashing).toBe(true);
  });
});
