import { AppGateway } from './app.gateway';

describe('AppGateway', () => {
  let gateway: AppGateway;
  let mockServer: { emit: jest.Mock };
  let mockClient: { id: string };

  beforeEach(() => {
    gateway = new AppGateway();
    mockServer = { emit: jest.fn() };
    mockClient = { id: 'client-1' };
    (gateway as unknown as { server: typeof mockServer }).server = mockServer;
  });

  describe('handleMessage', () => {
    it('should broadcast the received message to all clients', () => {
      gateway.handleMessage('hello', mockClient as never);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'message',
        'Server received: hello',
      );
    });
  });

  describe('handleConnection', () => {
    it('should log without throwing', () => {
      expect(() => gateway.handleConnection(mockClient as never)).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should log without throwing', () => {
      expect(() =>
        gateway.handleDisconnect(mockClient as never),
      ).not.toThrow();
    });
  });
});
