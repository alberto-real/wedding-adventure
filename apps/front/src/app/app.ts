import { Component, inject, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './components/navbar/navbar';
import { SocketService } from './core/services/socket.service';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule, NavbarComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected title = 'front';
  private socketService = inject(SocketService);

  constructor() {
    // Reacciona a cambios en el estado de la conexión automáticamente
    effect(() => {
      const isConnected = this.socketService.connected();
      console.log(`WebSocket Connection Status: ${isConnected ? 'Connected 🟢' : 'Disconnected 🔴'}`);
    });
  }

  ngOnInit() {
    // Escucha el mensaje de prueba del servidor
    this.socketService.listen<string>('message').subscribe((msg) => {
      console.log('WebSocket Response:', msg);
    });

    // Envía un mensaje inicial
    this.socketService.emit('message', 'Hello from Wedding Adventure!');
  }
}
