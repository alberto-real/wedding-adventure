import { TestBed } from '@angular/core/testing';
import { PhaseRulesComponent } from './phase-rules';
import { TranslateModule } from '@ngx-translate/core';

describe('PhaseRulesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseRulesComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PhaseRulesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render rules list when provided', () => {
    const fixture = TestBed.createComponent(PhaseRulesComponent);
    fixture.componentRef.setInput('rules', ['RULE_1', 'RULE_2']);
    fixture.detectChanges();
    
    const listItems = fixture.nativeElement.querySelectorAll('li');
    expect(listItems.length).toBe(2);
  });

  it('should not render anything when rules list is empty or undefined', () => {
    const fixture = TestBed.createComponent(PhaseRulesComponent);
    fixture.componentRef.setInput('rules', []);
    fixture.detectChanges();
    
    const container = fixture.nativeElement.querySelector('div');
    expect(container).toBeNull();
  });
});
