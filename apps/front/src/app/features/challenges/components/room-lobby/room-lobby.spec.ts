import { TestBed } from '@angular/core/testing';
import { RoomLobbyComponent } from './room-lobby';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import * as QRCode from 'qrcode';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,123')
}));

describe('RoomLobbyComponent', () => {
  let gameRoomServiceMock: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    gameRoomServiceMock = {
      state: signal({}),
      status: signal('idle'),
      players: signal([]),
      roomId: signal(null),
      error: signal(null),
      createRoom: vi.fn(),
      joinRoom: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RoomLobbyComponent, TranslateModule.forRoot(), FormsModule],
      providers: [
        { provide: GameRoomService, useValue: gameRoomServiceMock }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should switch modes', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.selectCreate();
    expect(component.mode()).toBe('create');

    component.selectJoin();
    expect(component.mode()).toBe('join');

    component.backToChoose();
    expect(component.mode()).toBe('choose');
    expect(component.joinRoomId()).toBe('');
  });

  it('should call createRoom in service', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.playerName.set('Test');
    component.createRoom();
    expect(gameRoomServiceMock.createRoom).toHaveBeenCalledWith('challenges', 'Test');
  });

  it('should not create room with empty name', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.playerName.set('  ');
    component.createRoom();
    expect(gameRoomServiceMock.createRoom).not.toHaveBeenCalled();
  });

  it('should call joinRoom in service', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.playerName.set('Test');
    component.joinRoomId.set('room1');
    component.joinRoom();
    expect(gameRoomServiceMock.joinRoom).toHaveBeenCalledWith('ROOM1', 'Test');
  });

  it('should not join room with empty name', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.playerName.set('');
    component.joinRoomId.set('ROOM1');
    component.joinRoom();
    expect(gameRoomServiceMock.joinRoom).not.toHaveBeenCalled();
  });

  it('should not join room with empty room ID', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    component.playerName.set('Test');
    component.joinRoomId.set('');
    component.joinRoom();
    expect(gameRoomServiceMock.joinRoom).not.toHaveBeenCalled();
  });

  it('should generate QR code when room ID is set', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    gameRoomServiceMock.roomId.set('ID123');
    fixture.detectChanges();
    TestBed.flushEffects();
    await vi.advanceTimersByTimeAsync(0);

    expect(QRCode.toDataURL).toHaveBeenCalled();
    expect(component.qrDataUrl()).toBe('data:image/png;base64,123');
  });

  it('should clear QR code when room ID is cleared', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const component = fixture.componentInstance;

    gameRoomServiceMock.roomId.set('ID123');
    fixture.detectChanges();
    TestBed.flushEffects();
    await vi.advanceTimersByTimeAsync(0);

    gameRoomServiceMock.roomId.set(null);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(component.qrDataUrl()).toBeNull();
  });

  it('should compute shareUrl when roomId exists', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    gameRoomServiceMock.roomId.set('TEST123');
    const url = fixture.componentInstance.shareUrl();
    expect(url).toContain('/challenges?room=TEST123');
  });

  it('should return null shareUrl when no roomId', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    expect(fixture.componentInstance.shareUrl()).toBeNull();
  });

  it('should use navigator.share when available', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    gameRoomServiceMock.roomId.set('TEST');

    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });

    await fixture.componentInstance.shareRoom();
    expect(shareSpy).toHaveBeenCalledWith({ url: expect.stringContaining('/challenges?room=TEST') });

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('should use clipboard when navigator.share is not available', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    gameRoomServiceMock.roomId.set('TEST');

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const clipSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipSpy }, configurable: true });

    await fixture.componentInstance.shareRoom();
    expect(clipSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.copied()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(fixture.componentInstance.copied()).toBe(false);
  });

  it('should not share when no URL', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const shareSpy = vi.fn();
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });

    await fixture.componentInstance.shareRoom();
    expect(shareSpy).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('should copy room code to clipboard', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    gameRoomServiceMock.roomId.set('MYCODE');

    const clipSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipSpy }, configurable: true });

    await fixture.componentInstance.copyCode();
    expect(clipSpy).toHaveBeenCalledWith('MYCODE');
    expect(fixture.componentInstance.copied()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(fixture.componentInstance.copied()).toBe(false);
  });

  it('should not copy code when no roomId', async () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    const clipSpy = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipSpy }, configurable: true });

    await fixture.componentInstance.copyCode();
    expect(clipSpy).not.toHaveBeenCalled();
  });

  it('should auto-switch to join mode when inviteRoomId is provided', () => {
    const fixture = TestBed.createComponent(RoomLobbyComponent);
    fixture.componentRef.setInput('inviteRoomId', 'ABC');
    fixture.detectChanges();

    expect(fixture.componentInstance.joinRoomId()).toBe('ABC');
    expect(fixture.componentInstance.mode()).toBe('join');
  });
});
