import { TestBed } from '@angular/core/testing';
import { GameCompleteModalComponent } from './game-complete-modal';
import { TranslateModule } from '@ngx-translate/core';

describe('GameCompleteModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCompleteModalComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GameCompleteModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('messageKey', 'TEST_KEY');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit closed on close', () => {
    const fixture = TestBed.createComponent(GameCompleteModalComponent);
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.componentInstance.close();
    expect(spy).toHaveBeenCalled();
  });
});
