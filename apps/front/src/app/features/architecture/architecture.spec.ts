import { TestBed } from '@angular/core/testing';
import { ArchitectureComponent } from './architecture';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('ArchitectureComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitectureComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have 5 phases in config', () => {
    const fixture = TestBed.createComponent(ArchitectureComponent);
    const component = fixture.componentInstance;
    expect(component.ARCHITECTURE_CONFIG.length).toBe(5);
  });
});
