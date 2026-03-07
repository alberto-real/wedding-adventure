import { Component, inject, OnInit } from '@angular/core';
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
})
export class App implements OnInit {
  protected title = 'front';
  private socketService = inject(SocketService);

  ngOnInit() {
    // Escucha el mensaje de prueba del servidor
    this.socketService.listen<string>('message').subscribe((msg) => {
      console.log('WebSocket Response:', msg);
    });

    // Envía un mensaje inicial
    this.socketService.emit('message', 'Hello from Wedding Adventure!');
  }
}
