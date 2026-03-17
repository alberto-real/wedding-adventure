import { Injectable, inject, signal } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket = inject(Socket);

  /**
   * Reactive signal for connection status.
   */
  readonly connected = signal(false);

  constructor() {
    // Escucha eventos de conexión para actualizar el signal
    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    
    // Sincronización inicial
    this.connected.set(this.socket.ioSocket.connected);
  }

  /**
   * Sends a message to the backend.
   * @param event The event name.
   * @param data The data to send.
   */
  emit(event: string, data: unknown): void {
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
}
