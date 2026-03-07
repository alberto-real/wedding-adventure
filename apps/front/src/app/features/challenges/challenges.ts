import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './challenges.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesComponent implements OnInit {
  private socketService = inject(SocketService);

  constructor() {
    effect(() => {
      const isConnected = this.socketService.connected();
      console.log(`Challenges WebSocket Status: ${isConnected ? 'Connected 🤝' : 'Disconnected 🔴'}`);
    });
  }

  ngOnInit() {
    // Escucha eventos del minijuego
    this.socketService.listen<string>('message').subscribe((msg) => {
      console.log('Game Message:', msg);
    });

    // Envía señal de unión al reto
    this.socketService.emit('message', 'Anna & Roger entered Challenges');
  }
}
