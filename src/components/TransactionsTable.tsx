import { AppDispatch, RootState } from "../store/store";
import { fetchTransactions } from "../store/transactionsSlice";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const TransactionsTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, filters, currentPage, itemsPerPage } = useSelector(
    (state: RootState) => state.transactions,
  );

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const filtered = data.filter((t) => t.codOper.toLowerCase().includes(filters.search.toLowerCase()));

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <FilterBar />
      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Código</th>
            <th className="border p-2">Fecha</th>
            <th className="border p-2">Monto</th>
            <th className="border p-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((t) => (
            <tr key={t.id}>
              <td className="border p-2">{t.id}</td>
              <td className="border p-2">{t.codOper}</td>
              <td className="border p-2">{t.fecha}</td>
              <td className="border p-2">${t.monto}</td>
              <td className="border p-2">{t.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination />
    </div>
  );
};

export default TransactionsTable;
