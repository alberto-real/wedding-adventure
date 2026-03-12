import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnDestroy,
  HostListener,
  input,
  effect,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from './services/game-room.service';
import { RoomLobbyComponent } from './components/room-lobby/room-lobby';
import { LeaveConfirmModalComponent } from './components/leave-confirm-modal/leave-confirm-modal';

interface MiniGame {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
}

@Component({
  selector: 'app-challenges',
  imports: [
    RouterModule,
    TranslateModule,
    RoomLobbyComponent,
    LeaveConfirmModalComponent,
  ],
  providers: [GameRoomService],
  templateUrl: './challenges.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesComponent implements OnDestroy {
  private gameRoomService = inject(GameRoomService);

  /** Query params bound via withComponentInputBinding() */
  room = input<string>();
  game = input<string>();

  readonly miniGames: MiniGame[] = [
    {
      id: 'ski',
      icon: '⛷️',
      titleKey: 'CHALLENGES.GAMES.SKI.TITLE',
      descKey: 'CHALLENGES.GAMES.SKI.DESC',
    },
    {
      id: 'photographers',
      icon: '📸',
      titleKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TITLE',
      descKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.DESC',
    },
    {
      id: 'designs',
      icon: '🎨',
      titleKey: 'CHALLENGES.GAMES.DESIGNS.TITLE',
      descKey: 'CHALLENGES.GAMES.DESIGNS.DESC',
    },
  ];

  selectedGame = signal<MiniGame | null>(null);
  inviteRoomId = signal<string | null>(null);
  showLeaveModal = signal(false);
  readonly status = this.gameRoomService.status;
  readonly isInRoom = computed(
    () => this.status() === 'waiting' || this.status() === 'ready',
  );

  constructor() {
    // Auto-select game and pre-fill room code from URL query params
    effect(() => {
      const gameId = this.game();
      const roomId = this.room();
      if (gameId) {
        const found = this.miniGames.find((g) => g.id === gameId);
        if (found) {
          this.selectedGame.set(found);
          if (roomId) {
            this.inviteRoomId.set(roomId.toUpperCase());
          }
        }
      }
    });
  }

  selectGame(game: MiniGame): void {
    this.selectedGame.set(game);
  }

  backToGameList(): void {
    if (this.isInRoom()) {
      this.showLeaveModal.set(true);
    } else {
      this.selectedGame.set(null);
      this.inviteRoomId.set(null);
    }
  }

  confirmLeave(): void {
    this.gameRoomService.leaveRoom();
    this.showLeaveModal.set(false);
    this.selectedGame.set(null);
    this.inviteRoomId.set(null);
  }

  cancelLeave(): void {
    this.showLeaveModal.set(false);
  }

  resetGame(): void {
    this.gameRoomService.resetGame();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isInRoom()) {
      event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.gameRoomService.leaveRoom();
  }
}
