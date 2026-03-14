import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { Socket } from 'ngx-socket-io';
import { of } from 'rxjs';

describe('SocketService', () => {
  let service: SocketService;
  let socketMock: any;

  beforeEach(() => {
    socketMock = {
      on: vi.fn(),
      emit: vi.fn(),
      fromEvent: vi.fn().mockReturnValue(of({})),
      ioSocket: { connected: true }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Socket, useValue: socketMock }
      ]
    });
    service = TestBed.inject(SocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize connection status correctly', () => {
    expect(service.connected()).toBe(true);
  });

  it('should emit events', () => {
    service.emit('test', { data: 123 });
    expect(socketMock.emit).toHaveBeenCalledWith('test', { data: 123 });
  });

  it('should listen for events', () => {
    const obs = service.listen('test');
    expect(obs).toBeDefined();
    expect(socketMock.fromEvent).toHaveBeenCalledWith('test');
  });

  it('should update connected signal on events', () => {
    // Re-trigger constructor simulation by re-injecting or manually calling mocking
    // Actually the 'on' mock already recorded calls in constructor
    const connectHandler = socketMock.on.mock.calls.find((c: any) => c[0] === 'connect')[1];
    const disconnectHandler = socketMock.on.mock.calls.find((c: any) => c[0] === 'disconnect')[1];

    disconnectHandler();
    expect(service.connected()).toBe(false);
    connectHandler();
    expect(service.connected()).toBe(true);
  });
});
