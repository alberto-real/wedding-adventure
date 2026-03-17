import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  computed,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoomService } from '../../services/game-room.service';
import * as QRCode from 'qrcode';

function getBackendUrl(): string {
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return `${protocol}//${hostname}:3000`;
  }
  return 'https://wedding-adventureback-production.up.railway.app';
}

@Component({
  selector: 'app-room-lobby',
  imports: [FormsModule, TranslateModule],
  templateUrl: './room-lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomLobbyComponent implements OnInit, OnDestroy {
  private gameRoomService = inject(GameRoomService);

  gameType = input<string>('challenges');
  gameTitleKey = input<string>('SECTIONS.CHALLENGES');
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
  hasWaitingRooms = signal(false);

  private waitingCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly backendUrl = getBackendUrl();

  readonly shareUrl = computed(() => {
    const id = this.roomId();
    if (!id) return null;
    const base = window.location.origin;
    return `${base}/challenges?room=${id}`;
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

  ngOnInit(): void {
    this.checkWaitingRooms();
    this.waitingCheckInterval = setInterval(() => this.checkWaitingRooms(), 10000);
  }

  ngOnDestroy(): void {
    if (this.waitingCheckInterval) {
      clearInterval(this.waitingCheckInterval);
    }
  }

  private async checkWaitingRooms(): Promise<void> {
    try {
      const res = await fetch(`${this.backendUrl}/back/admin/rooms/waiting-count`);
      if (res.ok) {
        const data = await res.json();
        this.hasWaitingRooms.set(data.waitingCount > 0);
      }
    } catch {
      // Silently fail - don't block UI
    }
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
