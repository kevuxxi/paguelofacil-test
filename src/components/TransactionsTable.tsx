import "dayjs/locale/es";

import { AppDispatch, RootState } from "../store/store";
import { fetchTransactions, setFilter, setOrderBy } from "../store/transactionsSlice";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Card, CardContent, Grid, MenuItem, Select, Slider, TextField, Typography } from "@mui/material"; // Agregamos Card, CardContent y Typography
import { DataGrid, GridCellParams, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Hook de utilidad para debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// ... (El resto del código de interfaces y sortOptions permanece igual) ...
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
  const { data, loading, error, filter, total, orderBy } = useSelector((state: RootState) => state.transactions);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // Usar estado local para el input
  const [localFilter, setLocalFilter] = useState(filter);
  const debouncedFilter = useDebounce(localFilter, 500); // Debounce de 500ms

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const sortModel: GridSortModel = useMemo(
    () => [
      {
        field: orderBy.startsWith("-") ? orderBy.substring(1) : orderBy,
        sort: orderBy.startsWith("-") ? "desc" : "asc",
      },
    ],
    [orderBy],
  );

  const columns = useMemo(
    () => [
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
    ],
    [],
  );

  const handlePageChange = useCallback((newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  }, []);

  const handleSortChange = useCallback(
    (model: GridSortModel) => {
      if (model.length > 0) {
        const sortField = model[0].field;
        const sortDirection = model[0].sort;
        const newOrderBy = sortDirection === "desc" ? `-${sortField}` : sortField;
        if (newOrderBy !== orderBy) {
          dispatch(setOrderBy(newOrderBy));
        }
      }
    },
    [orderBy, dispatch],
  );

  const handleDateChange = useCallback(
    (type: "start" | "end") => (newValue: Dayjs | null) => {
      if (type === "start") {
        setStartDate(newValue);
      } else {
        setEndDate(newValue);
      }
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [],
  );

  const handleAmountChange = useCallback((_: Event, newValue: number | number[]) => {
    setAmountRange(newValue as [number, number]);
  }, []);

  const handleAmountChangeCommitted = useCallback(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  // Sincronizar el filtro local con Redux solo cuando se presiona Enter o el debounce termina
  useEffect(() => {
    if (debouncedFilter !== filter) {
      dispatch(setFilter(debouncedFilter));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, [debouncedFilter, filter, dispatch]);

  useEffect(() => {
    const queryParams = {
      filter,
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
      orderBy,
      amountRange,
      startDate,
      endDate,
    };
    dispatch(fetchTransactions(queryParams));
  }, [dispatch, filter, paginationModel, orderBy, amountRange, startDate, endDate]);

  // Lógica de renderizado condicional
  if (error) {
    return (
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid size={{ lg: 4, xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h5" color="error" sx={{ mb: 1 }}>
                Error al cargar datos
              </Typography>
              <Typography variant="body1">{error}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.codOper || row.idTransaction}
        paginationMode="server"
        sortingMode="server"
        rowCount={total || 0}
        loading={loading}
        pageSizeOptions={[5, 10, 20]}
        onPaginationModelChange={handlePageChange}
        onSortModelChange={handleSortChange}
        paginationModel={paginationModel}
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
              <TextField
                size="small"
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                placeholder="Buscar..."
              />
              <Box sx={{ width: 200, px: 1 }}>
                <Slider
                  value={amountRange}
                  onChange={handleAmountChange}
                  onChangeCommitted={handleAmountChangeCommitted}
                  min={0}
                  max={10000}
                  valueLabelDisplay="auto"
                />
              </Box>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <DatePicker
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={handleDateChange("start")}
                  slotProps={{ textField: { size: "small" } }}
                />
                <DatePicker
                  label="Fecha de fin"
                  value={endDate}
                  onChange={handleDateChange("end")}
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
