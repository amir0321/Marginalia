import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

@Component({
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state [title]="'Testtitel'" [description]="'Testbeskrivning'" [icon]="'fa-solid fa-magnifying-glass'">
      <button type="button" class="btn btn-primary test-action">Åtgärd</button>
    </app-empty-state>
  `,
})
class TestHostComponent {}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render icon, title, description, and projected action button', () => {
    const el = fixture.nativeElement as HTMLElement;

    const iconEl = el.querySelector('.empty-state-icon-plate i');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.className).toContain('fa-magnifying-glass');

    const titleEl = el.querySelector('.empty-state-title');
    expect(titleEl?.textContent?.trim()).toBe('Testtitel');

    const descEl = el.querySelector('.empty-state-desc');
    expect(descEl?.textContent?.trim()).toBe('Testbeskrivning');

    const actionBtn = el.querySelector('.test-action');
    expect(actionBtn).toBeTruthy();
    expect(actionBtn?.textContent?.trim()).toBe('Åtgärd');
  });

  it('should use default values when rendered directly', () => {
    const directFixture = TestBed.createComponent(EmptyStateComponent);
    directFixture.detectChanges();

    const el = directFixture.nativeElement as HTMLElement;
    const titleEl = el.querySelector('.empty-state-title');
    expect(titleEl?.textContent?.trim()).toBe('Inga poster än');

    const iconEl = el.querySelector('.empty-state-icon-plate i');
    expect(iconEl?.className).toContain('fa-book-open');
  });
});
