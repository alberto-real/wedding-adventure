import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnDestroy,
  OnInit,
  HostListener,
  input,
  effect,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from './services/game-room.service';
import { RoomLobbyComponent } from './components/room-lobby/room-lobby';
import { LeaveConfirmModalComponent } from './components/leave-confirm-modal/leave-confirm-modal';
import { PhotographersGameComponent } from './games/photographers/photographers-game';

interface MiniGame {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  enabled: boolean;
}

@Component({
  selector: 'app-challenges',
  imports: [
    RouterModule,
    TranslateModule,
    RoomLobbyComponent,
    LeaveConfirmModalComponent,
    PhotographersGameComponent,
  ],
  providers: [GameRoomService],
  templateUrl: './challenges.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesComponent implements OnInit, OnDestroy {
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
      enabled: false,
    },
    {
      id: 'photographers',
      icon: '📸',
      titleKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.TITLE',
      descKey: 'CHALLENGES.GAMES.PHOTOGRAPHERS.DESC',
      enabled: true,
    },
    {
      id: 'designs',
      icon: '🎨',
      titleKey: 'CHALLENGES.GAMES.DESIGNS.TITLE',
      descKey: 'CHALLENGES.GAMES.DESIGNS.DESC',
      enabled: false,
    },
  ];

  selectedGame = signal<MiniGame | null>(null);
  inviteRoomId = signal<string | null>(null);
  pendingGameId = signal<string | null>(null);
  showLeaveModal = signal(false);
  readonly status = this.gameRoomService.status;
  readonly isInRoom = computed(
    () => this.status() === 'waiting' || this.status() === 'ready',
  );

  constructor() {
    // Auto-fill room code from URL query params
    effect(() => {
      const roomId = this.room();
      const gameId = this.game();
      if (roomId) {
        this.inviteRoomId.set(roomId.toUpperCase());
      }
      if (gameId) {
        this.pendingGameId.set(gameId);
      }
    });

    // Auto-select game from URL once room is ready
    effect(() => {
      const pending = this.pendingGameId();
      if (pending && this.status() === 'ready' && !this.selectedGame()) {
        const found = this.miniGames.find(
          (g) => g.id === pending && g.enabled,
        );
        if (found) {
          this.selectedGame.set(found);
        }
        this.pendingGameId.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.gameRoomService.onGameEvent((data) => {
      const payload = data.payload as Record<string, unknown>;

      if (data.event === 'select-game') {
        const gameId = payload['gameId'] as string;
        const found = this.miniGames.find((g) => g.id === gameId && g.enabled);
        if (found) {
          this.selectedGame.set(found);
        }
      } else if (data.event === 'back-to-games') {
        this.selectedGame.set(null);
      }
    });
  }

  selectGame(game: MiniGame): void {
    if (!game.enabled) return;
    this.selectedGame.set(game);
    this.gameRoomService.sendGameEvent('select-game', { gameId: game.id });
  }

  backToGameList(): void {
    this.selectedGame.set(null);
    this.gameRoomService.sendGameEvent('back-to-games', {});
  }

  onGameCompleted(): void {
    this.selectedGame.set(null);
    this.gameRoomService.sendGameEvent('back-to-games', {});
  }

  leaveRoom(): void {
    this.showLeaveModal.set(true);
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
