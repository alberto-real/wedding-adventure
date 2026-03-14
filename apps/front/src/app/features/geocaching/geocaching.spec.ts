import { TestBed } from '@angular/core/testing';
import { GeocachingComponent } from './geocaching';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('GeocachingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeocachingComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GeocachingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
