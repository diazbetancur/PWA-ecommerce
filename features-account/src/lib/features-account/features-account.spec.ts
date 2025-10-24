import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesAccount } from './features-account';

describe('FeaturesAccount', () => {
  let component: FeaturesAccount;
  let fixture: ComponentFixture<FeaturesAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesAccount],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
