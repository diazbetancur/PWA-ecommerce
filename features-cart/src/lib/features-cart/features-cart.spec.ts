import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesCart } from './features-cart';

describe('FeaturesCart', () => {
  let component: FeaturesCart;
  let fixture: ComponentFixture<FeaturesCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesCart],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesCart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
