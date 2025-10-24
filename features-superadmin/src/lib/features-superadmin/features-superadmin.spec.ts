import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesSuperadmin } from './features-superadmin';

describe('FeaturesSuperadmin', () => {
  let component: FeaturesSuperadmin;
  let fixture: ComponentFixture<FeaturesSuperadmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesSuperadmin],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesSuperadmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
