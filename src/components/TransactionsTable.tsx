import { AppDispatch, RootState } from "../store/store";
import { fetchTransactions } from "../store/transactionsSlice";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const TransactionsTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.transactions);

  const [filter, setFilterLocal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch inicial y cada vez que cambie filtro/página
  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchTransactions({ filter, limit: itemsPerPage, offset }));
  }, [dispatch, filter, currentPage]);

  // Filtrado adicional en cliente
  const filteredData = data.filter((tx) => tx.codOper.toLowerCase().includes(filter.toLowerCase()));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) return <p>Cargando transacciones...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <FilterBar filter={filter} setFilter={setFilterLocal} setCurrentPage={setCurrentPage} />
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border p-1">Código</th>
            <th className="border p-1">Monto</th>
            <th className="border p-1">Estado</th>
            <th className="border p-1">Método</th>
            <th className="border p-1">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((tx: any) => (
            <tr key={tx.codOper}>
              <td className="border p-1">{tx.codOper}</td>
              <td className="border p-1">{tx.amount}</td>
              <td className="border p-1">{tx.status}</td>
              <td className="border p-1">{tx.payment_method}</td>
              <td className="border p-1">{new Date(tx.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
};

export default TransactionsTable;
