import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomSelectComponent, SelectOption } from './custom-select.component';

describe('CustomSelectComponent', () => {
  let component: CustomSelectComponent<string>;
  let fixture: ComponentFixture<CustomSelectComponent<string>>;

  const mockOptions: SelectOption<string>[] = [
    { value: 'option-1', label: 'Första valet' },
    { value: 'option-2', label: 'Andra valet' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSelectComponent<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
    fixture.componentRef.setInput('value', 'option-1');
    fixture.componentRef.setInput('label', 'Sortera');
    fixture.detectChanges();
  });

  it('should create and render the selected option label', () => {
    expect(component).toBeTruthy();
    expect(component.selectedOption()?.label).toBe('Första valet');
  });

  it('should update value on selectOption', () => {
    component.selectOption('option-2');
    expect(component.value()).toBe('option-2');
  });

  it('should render a visible label with for attribute matching button id', () => {
    const labelEl = fixture.nativeElement.querySelector('label[for="customSelectTrigger"]') as HTMLLabelElement;
    expect(labelEl).toBeTruthy();
    expect(labelEl.textContent?.trim()).toBe('Sortera');
  });
});
