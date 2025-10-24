import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesCheckout } from './features-checkout';

describe('FeaturesCheckout', () => {
  let component: FeaturesCheckout;
  let fixture: ComponentFixture<FeaturesCheckout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesCheckout],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesCheckout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
