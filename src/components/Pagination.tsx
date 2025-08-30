import { AppDispatch, RootState } from "../store/store";
import { setPage } from "../store/transactionsSlice";
import { useDispatch, useSelector } from "react-redux";

const Pagination = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentPage, data, itemsPerPage } = useSelector((state: RootState) => state.transactions);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <div className="mt-4 flex gap-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          onClick={() => dispatch(setPage(i + 1))}
          className={`rounded px-3 py-1 ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
