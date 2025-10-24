import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesOrders } from './features-orders';

describe('FeaturesOrders', () => {
  let component: FeaturesOrders;
  let fixture: ComponentFixture<FeaturesOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
