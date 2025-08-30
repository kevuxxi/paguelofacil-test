interface PaginationProps {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const Pagination = ({ totalPages, currentPage, setCurrentPage }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex gap-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          onClick={() => setCurrentPage(i + 1)}
          className={`rounded px-3 py-1 ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
