import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchableSelect from './SearchableSelect';

const options = [
  { id: 1, name: 'Alpha College' },
  { id: 2, name: 'Beta Institute' },
];

const getLabel = (o) => o.name;
const getValue = (o) => o.id;

describe('SearchableSelect', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Select College"
        getLabel={getLabel}
        getValue={getValue}
      />
    );
    expect(screen.getByText('Select College')).toBeInTheDocument();
  });

  it('shows the selected option label', () => {
    render(
      <SearchableSelect
        options={options}
        value="2"
        onChange={() => {}}
        placeholder="Select College"
        getLabel={getLabel}
        getValue={getValue}
      />
    );
    expect(screen.getByText('Beta Institute')).toBeInTheDocument();
  });

  it('filters by the search query and fires onChange with the chosen value', () => {
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={onChange}
        placeholder="Select College"
        searchPlaceholder="Search college..."
        getLabel={getLabel}
        getValue={getValue}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByText('Select College'));

    // Filter to "beta"
    fireEvent.change(screen.getByPlaceholderText('Search college...'), {
      target: { value: 'beta' },
    });
    expect(screen.queryByText('Alpha College')).not.toBeInTheDocument();

    // Pick the remaining option
    fireEvent.click(screen.getByText('Beta Institute'));
    expect(onChange).toHaveBeenCalledWith('2');
  });
});
