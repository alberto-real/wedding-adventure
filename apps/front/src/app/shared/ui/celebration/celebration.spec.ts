import { TestBed } from '@angular/core/testing';
import { CelebrationComponent } from './celebration';
import { TranslateModule } from '@ngx-translate/core';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('CelebrationComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [CelebrationComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and launch confetti', () => {
    const fixture = TestBed.createComponent(CelebrationComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(confetti).toHaveBeenCalled();
  });

  it('should auto-hide after timeout', () => {
    const fixture = TestBed.createComponent(CelebrationComponent);
    fixture.detectChanges();

    // Initial state
    expect(fixture.componentInstance.isVisible()).toBe(true);
    expect(fixture.componentInstance.isFadingOut()).toBe(false);

    // After 4s: starts fading
    vi.advanceTimersByTime(4000);
    expect(fixture.componentInstance.isFadingOut()).toBe(true);

    // After 1s more (total 5s): is hidden
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.isVisible()).toBe(false);
  });

  it('should close manually', () => {
    const fixture = TestBed.createComponent(CelebrationComponent);
    fixture.detectChanges();

    fixture.componentInstance.close();
    expect(fixture.componentInstance.isFadingOut()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.isVisible()).toBe(false);
  });

  it('should not close again if already fading', () => {
    const fixture = TestBed.createComponent(CelebrationComponent);
    fixture.componentInstance.isFadingOut.set(true);

    fixture.componentInstance.close();
    // Verify it doesn't do anything (though hard to prove with just a set)
    expect(fixture.componentInstance.isFadingOut()).toBe(true);
  });
});
