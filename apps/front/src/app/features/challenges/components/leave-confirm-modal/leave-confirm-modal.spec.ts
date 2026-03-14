import { TestBed } from '@angular/core/testing';
import { LeaveConfirmModalComponent } from './leave-confirm-modal';
import { TranslateModule } from '@ngx-translate/core';

describe('LeaveConfirmModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveConfirmModalComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LeaveConfirmModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit confirmed on confirm', () => {
    const fixture = TestBed.createComponent(LeaveConfirmModalComponent);
    const spy = vi.spyOn(fixture.componentInstance.confirmed, 'emit');
    fixture.componentInstance.confirm();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancelled on cancel', () => {
    const fixture = TestBed.createComponent(LeaveConfirmModalComponent);
    const spy = vi.spyOn(fixture.componentInstance.cancelled, 'emit');
    fixture.componentInstance.cancel();
    expect(spy).toHaveBeenCalled();
  });
});
