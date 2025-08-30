import "dayjs/locale/es";

import { AppDispatch, RootState } from "../store/store";
import { fetchTransactions, setFilter, setItemsPerPage, setOrderBy, setPage } from "../store/transactionsSlice";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, MenuItem, Select, Slider, TextField } from "@mui/material";
import { DataGrid, GridCellParams, GridColDef, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

interface Transaction {
  idTransaction: number;
  merchantName: string;
  email: string;
  phone: string;
  address: string;
  ip: string;
  ipCountry: string;
  txConcept: string;
  txDescription: string;
  txDescriptor: string;
  amount: number;
  taxAmount: number;
  txType: string;
  codAuth: string;
  codOper: string;
  authStatus: string;
  messageSys: string;
  authAmount: string;
  dateTms: string;
  avs: string;
  authCvv2: string | null;
  authCurrency: number;
  authDateGmt: string;
  authCardCountryCode: number;
  authCardCurrency: number | null;
  status: number;
  displayCardNum: string;
  cardholderFullName: string;
  cardType: string;
  tax: number;
  taxRetention: number;
  subTotalCom: number;
  totalCom: number;
  interCom: number;
  totalCost: number;
  totalReserve: number;
  blockedFunds: boolean;
  reserveIsLiberated: boolean;
  reserveLiberatedManually: boolean;
  containsClaim: boolean | null;
  reserveLiberationDate: string;
  reserveLiberationReason: string;
  containOpenClaim: boolean;
  idRelatedTransaction: number | null;
  idUsr: number | null;
  idMerchant: number;
  idActivity: number;
  ipSendedCheck: string;
  verificationRequested: boolean | null;
  verificationDate: string | null;
  inRevision: boolean;
  revisionLevel: number | null;
  revisionOptions: string | null;
  revisionApprovedDate: string | null;
  revisionApprovedIdUsr: number | null;
  payExpired: boolean;
}

const sortOptions = [
  { column: "dateTms", label: "Latest date" },
  { column: "-dateTms", label: "Recent date" },
  { column: "codOper", label: "Operation code" },
  { column: "status", label: "Status" },
  { column: "email", label: "Email" },
  { column: "-amount", label: "Higher amount" },
  { column: "amount", label: "Lower amount" },
];

const TransactionsTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, filter, currentPage, itemsPerPage, total, orderBy } = useSelector(
    (state: RootState) => state.transactions,
  );

  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const rows: Transaction[] = Array.isArray(data) ? data : [];

  const sortModel: GridSortModel = [
    {
      field: orderBy.startsWith("-") ? orderBy.substring(1) : orderBy,
      sort: orderBy.startsWith("-") ? "desc" : "asc",
    },
  ];

  const columns: GridColDef<Transaction>[] = [
    { field: "codOper", headerName: "Código", width: 180 },
    { field: "amount", headerName: "Monto", width: 120 },
    { field: "cardType", headerName: "Tipo de Tarjeta", width: 150 },
    { field: "displayCardNum", headerName: "Últimos 4 Dígitos", width: 150 },
    { field: "cardholderFullName", headerName: "Nombre Titular", width: 200 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "address", headerName: "Dirección", width: 250 },
    { field: "ipCountry", headerName: "País de IP", width: 120 },
    { field: "merchantName", headerName: "Nombre del Comercio", width: 200 },
    { field: "messageSys", headerName: "Mensaje del Sistema", width: 250 },
    { field: "status", headerName: "Estado", width: 120 },
    {
      field: "dateTms",
      headerName: "Fecha de Transacción",
      width: 200,
      valueFormatter: (params: GridCellParams<Transaction>) => {
        const value = params?.row?.dateTms;
        const date = dayjs(value);
        return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : "";
      },
    },
  ];

  const handlePageChange = (model: GridPaginationModel) => {
    dispatch(setPage(model.page + 1));
    if (model.pageSize !== itemsPerPage) {
      dispatch(setItemsPerPage(model.pageSize));
    }
  };

  const handleSortChange = (model: GridSortModel) => {
    if (model.length > 0) {
      const sortField = model[0].field;
      const sortDirection = model[0].sort;
      const newOrderBy = sortDirection === "desc" ? `-${sortField}` : sortField;
      dispatch(setOrderBy(newOrderBy));
    }
  };

  const handleFilterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value;
      dispatch(setFilter(value));
    }
  };

  useEffect(() => {
    dispatch(
      fetchTransactions({
        filter,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        orderBy,
        amountRange,
        startDate,
        endDate,
      }),
    );
  }, [dispatch, filter, currentPage, itemsPerPage, orderBy, amountRange, startDate, endDate]);

  if (error) return <p>Error: {error}</p>;

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.codOper}
        paginationMode="server"
        sortingMode="server"
        rowCount={total || 0}
        loading={loading}
        pageSizeOptions={[5, 10, 20]}
        onPaginationModelChange={handlePageChange}
        onSortModelChange={handleSortChange}
        paginationModel={{ page: currentPage - 1, pageSize: itemsPerPage }}
        sortModel={sortModel}
        slots={{
          toolbar: () => (
            <Box sx={{ display: "flex", gap: 2, p: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Select size="small" value={orderBy} onChange={(e) => dispatch(setOrderBy(e.target.value))}>
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.column} value={opt.column}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              <TextField size="small" defaultValue={filter} placeholder="Buscar..." onKeyDown={handleFilterSubmit} />
              <Box sx={{ width: 200, px: 1 }}>
                <Slider
                  value={amountRange}
                  onChange={(_, val) => setAmountRange(val as [number, number])}
                  min={0}
                  max={10000}
                  valueLabelDisplay="auto"
                />
              </Box>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <DatePicker
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                />
                <DatePicker
                  label="Fecha de fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                />
              </LocalizationProvider>
            </Box>
          ),
        }}
      />
    </Box>
  );
};

export default TransactionsTable;
