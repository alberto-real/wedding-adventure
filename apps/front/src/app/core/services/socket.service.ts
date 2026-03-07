import { Injectable, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket = inject(Socket);

  /**
   * Sends a message to the backend.
   * @param event The event name.
   * @param data The data to send.
   */
  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  /**
   * Listens for an event from the backend.
   * @param event The event name.
   * @returns An observable with the event data.
   */
  listen<T>(event: string): Observable<T> {
    return this.socket.fromEvent<T>(event);
  }

  /**
   * Returns the connection status.
   */
  isConnected(): boolean {
    return this.socket.ioSocket.connected;
  }
}
