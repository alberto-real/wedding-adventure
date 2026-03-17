import { TestBed } from '@angular/core/testing';
import { ChallengesComponent } from './challenges';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from './services/game-room.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ChallengesComponent', () => {
  let gameRoomServiceMock: {
    state: ReturnType<typeof signal>;
    status: ReturnType<typeof signal<string>>;
    players: ReturnType<typeof signal>;
    roomId: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    localPlayerName: ReturnType<typeof signal<string>>;
    onGameEvent: ReturnType<typeof vi.fn>;
    onGameReset: ReturnType<typeof vi.fn>;
    onGameStart: ReturnType<typeof vi.fn>;
    sendGameEvent: ReturnType<typeof vi.fn>;
    leaveRoom: ReturnType<typeof vi.fn>;
    resetGame: ReturnType<typeof vi.fn>;
    createRoom: ReturnType<typeof vi.fn>;
    joinRoom: ReturnType<typeof vi.fn>;
    markReady: ReturnType<typeof vi.fn>;
    readyPlayers: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    gameRoomServiceMock = {
      state: signal({}),
      status: signal('idle'),
      players: signal([]),
      roomId: signal(null),
      error: signal(null),
      localPlayerName: signal('P1'),
      onGameEvent: vi.fn(),
      onGameReset: vi.fn(),
      onGameStart: vi.fn(),
      sendGameEvent: vi.fn(),
      leaveRoom: vi.fn(),
      resetGame: vi.fn(),
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      markReady: vi.fn(),
      readyPlayers: signal([])
    };

    await TestBed.configureTestingModule({
      imports: [ChallengesComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([])
      ]
    })
    .overrideComponent(ChallengesComponent, {
      set: { providers: [{ provide: GameRoomService, useValue: gameRoomServiceMock }] }
    })
    .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should select a game and notify service', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    const game = component.miniGames[0];

    component.selectGame(game);
    expect(component.selectedGame()).toBe(game);
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('select-game', { gameId: game.id });
  });

  it('should not select a disabled game', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    const disabledGame = { id: 'test', icon: 'x', titleKey: '', descKey: '', enabled: false };

    component.selectGame(disabledGame);
    expect(component.selectedGame()).toBeNull();
    expect(gameRoomServiceMock.sendGameEvent).not.toHaveBeenCalled();
  });

  it('should go back to game list', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    component.selectedGame.set(component.miniGames[0]);

    component.backToGameList();
    expect(component.selectedGame()).toBeNull();
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('back-to-games', {});
  });

  it('should handle game completed', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    component.selectedGame.set(component.miniGames[0]);

    component.onGameCompleted();
    expect(component.selectedGame()).toBeNull();
    expect(gameRoomServiceMock.sendGameEvent).toHaveBeenCalledWith('back-to-games', {});
  });

  it('should show leave modal', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;

    component.leaveRoom();
    expect(component.showLeaveModal()).toBe(true);
  });

  it('should handle leave confirmation', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    component.selectedGame.set(component.miniGames[0]);
    component.inviteRoomId.set('TEST');

    component.confirmLeave();
    expect(gameRoomServiceMock.leaveRoom).toHaveBeenCalled();
    expect(component.showLeaveModal()).toBe(false);
    expect(component.selectedGame()).toBeNull();
    expect(component.inviteRoomId()).toBeNull();
  });

  it('should cancel leave', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;

    component.showLeaveModal.set(true);
    component.cancelLeave();
    expect(component.showLeaveModal()).toBe(false);
  });

  it('should reset game via service', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentInstance.resetGame();
    expect(gameRoomServiceMock.resetGame).toHaveBeenCalled();
  });

  it('should handle select-game event from service', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'select-game', payload: { gameId: 'ski' } });
    expect(fixture.componentInstance.selectedGame()?.id).toBe('ski');
  });

  it('should handle select-game event with unknown game', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.detectChanges();

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'select-game', payload: { gameId: 'unknown' } });
    expect(fixture.componentInstance.selectedGame()).toBeNull();
  });

  it('should handle back-to-games event from service', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.detectChanges();
    fixture.componentInstance.selectedGame.set(fixture.componentInstance.miniGames[0]);

    const onEvent = gameRoomServiceMock.onGameEvent.mock.calls[0][0];
    onEvent({ event: 'back-to-games', payload: {} });
    expect(fixture.componentInstance.selectedGame()).toBeNull();
  });

  it('should compute isInRoom correctly', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    expect(fixture.componentInstance.isInRoom()).toBe(false);

    gameRoomServiceMock.status.set('waiting');
    expect(fixture.componentInstance.isInRoom()).toBe(true);

    gameRoomServiceMock.status.set('ready');
    expect(fixture.componentInstance.isInRoom()).toBe(true);

    gameRoomServiceMock.status.set('idle');
    expect(fixture.componentInstance.isInRoom()).toBe(false);
  });

  it('should prevent beforeunload when in room', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    gameRoomServiceMock.status.set('waiting');

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const spy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.onBeforeUnload(event);
    expect(spy).toHaveBeenCalled();
  });

  it('should not prevent beforeunload when not in room', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const spy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.onBeforeUnload(event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should leave room on destroy', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentInstance.ngOnDestroy();
    expect(gameRoomServiceMock.leaveRoom).toHaveBeenCalled();
  });

  it('should auto-fill room code from input', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentRef.setInput('room', 'abc123');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.inviteRoomId()).toBe('ABC123');
  });

  it('should auto-fill pending game from input', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentRef.setInput('game', 'ski');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.pendingGameId()).toBe('ski');
  });

  it('should auto-select game when status becomes ready', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentRef.setInput('game', 'ski');
    fixture.detectChanges();

    gameRoomServiceMock.status.set('ready');
    TestBed.flushEffects();

    expect(fixture.componentInstance.selectedGame()?.id).toBe('ski');
    expect(fixture.componentInstance.pendingGameId()).toBeNull();
  });

  it('should not auto-select unknown pending game', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.componentRef.setInput('game', 'nonexistent');
    fixture.detectChanges();

    gameRoomServiceMock.status.set('ready');
    TestBed.flushEffects();

    expect(fixture.componentInstance.selectedGame()).toBeNull();
    expect(fixture.componentInstance.pendingGameId()).toBeNull();
  });
});
