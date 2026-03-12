import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  computed,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-room-lobby',
  imports: [FormsModule, TranslateModule],
  templateUrl: './room-lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomLobbyComponent {
  private gameRoomService = inject(GameRoomService);

  gameType = input.required<string>();
  gameTitleKey = input.required<string>();
  inviteRoomId = input<string | null>(null);

  readonly state = this.gameRoomService.state;
  readonly status = this.gameRoomService.status;
  readonly players = this.gameRoomService.players;
  readonly roomId = this.gameRoomService.roomId;
  readonly error = this.gameRoomService.error;

  playerName = signal('');
  joinRoomId = signal('');
  mode = signal<'choose' | 'create' | 'join'>('choose');
  qrDataUrl = signal<string | null>(null);
  copied = signal(false);

  readonly shareUrl = computed(() => {
    const id = this.roomId();
    const game = this.gameType();
    if (!id) return null;
    const base = window.location.origin;
    return `${base}/challenges?game=${game}&room=${id}`;
  });

  constructor() {
    // Auto-switch to join mode if inviteRoomId is provided
    effect(() => {
      const invite = this.inviteRoomId();
      if (invite) {
        this.joinRoomId.set(invite);
        this.mode.set('join');
      }
    });

    // Generate QR code when room is created (waiting state)
    effect(() => {
      const url = this.shareUrl();
      if (url) {
        QRCode.toDataURL(url, { width: 200, margin: 2 }).then((dataUrl) =>
          this.qrDataUrl.set(dataUrl),
        );
      } else {
        this.qrDataUrl.set(null);
      }
    });
  }

  selectCreate(): void {
    this.mode.set('create');
  }

  selectJoin(): void {
    this.mode.set('join');
  }

  backToChoose(): void {
    this.mode.set('choose');
    this.joinRoomId.set('');
  }

  createRoom(): void {
    const name = this.playerName().trim();
    if (!name) return;
    this.gameRoomService.createRoom(this.gameType(), name);
  }

  joinRoom(): void {
    const name = this.playerName().trim();
    const roomId = this.joinRoomId().trim().toUpperCase();
    if (!name || !roomId) return;
    this.gameRoomService.joinRoom(roomId, name);
  }

  async shareRoom(): Promise<void> {
    const url = this.shareUrl();
    if (!url) return;

    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  async copyCode(): Promise<void> {
    const code = this.roomId();
    if (!code) return;
    await navigator.clipboard.writeText(code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
