import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAccountSettings } from './user-account-settings';

describe('UserAccountSettings', () => {
  let component: UserAccountSettings;
  let fixture: ComponentFixture<UserAccountSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAccountSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAccountSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
