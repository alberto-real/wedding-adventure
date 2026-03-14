import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have the expected sections', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component.sections.length).toBe(4);
    expect(component.sections.map(s => s.id)).toContain('sports');
    expect(component.sections.map(s => s.id)).toContain('architecture');
  });
});
