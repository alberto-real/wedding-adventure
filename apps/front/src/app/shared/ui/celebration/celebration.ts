import { Component, ChangeDetectionStrategy, input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-celebration',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './celebration.html',
  styleUrl: './celebration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrationComponent implements OnInit, OnDestroy {
  messageKey = input<string>('CELEBRATION_MESSAGE');
  isVisible = signal(true);
  isFadingOut = signal(false);
  
  private autoHideTimeout?: ReturnType<typeof setTimeout>;
  private destroyTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.launchConfetti();
    
    // Start fading out after 4 seconds (total duration 5s with 1s fade)
    this.autoHideTimeout = setTimeout(() => {
      this.close();
    }, 4000);
  }

  ngOnDestroy() {
    if (this.autoHideTimeout) clearTimeout(this.autoHideTimeout);
    if (this.destroyTimeout) clearTimeout(this.destroyTimeout);
  }

  private launchConfetti() {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors: ['#1e3a8a', '#475569', '#f59e0b', '#ffffff'],
        zIndex: 10000 // In front of overlay
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors: ['#1e3a8a', '#475569', '#f59e0b', '#ffffff'],
        zIndex: 10000 // In front of overlay
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  close() {
    if (this.isFadingOut()) return;
    
    this.isFadingOut.set(true);
    
    // Remove from DOM after transition (1s)
    this.destroyTimeout = setTimeout(() => {
      this.isVisible.set(false);
    }, 1000);
  }
}
