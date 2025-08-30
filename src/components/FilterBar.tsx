interface FilterBarProps {
  filter: string;
  setFilter: (value: string) => void;
  setCurrentPage: (page: number) => void;
}

const FilterBar = ({ filter, setFilter, setCurrentPage }: FilterBarProps) => {
  return (
    <input
      type="text"
      placeholder="Buscar por código..."
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value);
        setCurrentPage(1); // reset página
      }}
      className="mb-2 rounded border p-2"
    />
  );
};

export default FilterBar;
