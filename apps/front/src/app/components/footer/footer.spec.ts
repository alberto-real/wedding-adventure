import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer';
import { TranslateModule } from '@ngx-translate/core';
import packageInfo from '@version';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the correct version from package.json', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance.version).toBe(packageInfo.version);
  });
});
