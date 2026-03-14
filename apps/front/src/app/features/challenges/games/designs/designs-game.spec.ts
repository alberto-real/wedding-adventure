import { TestBed } from '@angular/core/testing';
import { DesignsGameComponent } from './designs-game';
import { TranslateModule } from '@ngx-translate/core';

describe('DesignsGameComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignsGameComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DesignsGameComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
