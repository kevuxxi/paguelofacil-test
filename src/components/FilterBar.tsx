import { AppDispatch, RootState } from "../store/store";
import { setFilter } from "../store/transactionsSlice";
import { useDispatch, useSelector } from "react-redux";

const FilterBar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const search = useSelector((state: RootState) => state.transactions.filters.search);

  return (
    <input
      type="text"
      placeholder="Buscar por código..."
      value={search}
      onChange={(e) => dispatch(setFilter(e.target.value))}
      className="rounded border p-2"
    />
  );
};

export default FilterBar;
