import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';

interface RoomSummary {
  id: string;
  gameType: string;
  players: string[];
  playerCount: number;
  createdAt: number;
  age: number;
}

interface RoomsResponse {
  rooms: RoomSummary[];
  total: number;
  waitingCount: number;
}

function getBackendUrl(): string {
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return `${protocol}//${hostname}:3000`;
  }
  return 'https://wedding-adventureback-production.up.railway.app';
}

@Component({
  selector: 'app-admin',
  imports: [DatePipe],
  templateUrl: './admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly rooms = signal<RoomSummary[]>([]);
  readonly total = signal(0);
  readonly waitingCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly backendUrl = getBackendUrl();

  ngOnInit(): void {
    this.refresh();
    this.refreshInterval = setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await fetch(`${this.backendUrl}/back/admin/rooms`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RoomsResponse = await res.json();
      this.rooms.set(data.rooms);
      this.total.set(data.total);
      this.waitingCount.set(data.waitingCount);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }

  async closeRoom(roomId: string): Promise<void> {
    try {
      const res = await fetch(`${this.backendUrl}/back/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await this.refresh();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  formatAge(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  }
}
