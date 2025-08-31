import { AppDispatch, RootState } from "../../../store/store";
import { fetchTransactions, fetchTransactionsCount, setFilter, setOrderBy } from "../../../store/transactionsSlice";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Card, CardContent, Grid, MenuItem, Select, Slider, TextField, Typography } from "@mui/material";
import { DataGrid, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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
  const { data, loading, error, filter, total, orderBy, loadingCount } = useSelector(
    (state: RootState) => state.transactions,
  );

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [localFilter, setLocalFilter] = useState(filter);
  const debouncedFilter = useDebounce(localFilter, 500);

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
      {
        field: "amount",
        headerName: "Monto",
        width: 120,
        valueGetter: (value: number) => {
          return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "USD",
          }).format(value);
        },
      },
      { field: "cardType", headerName: "Tipo de Tarjeta", width: 150 },
      { field: "displayCardNum", headerName: "Últimos 4 Dígitos", width: 150 },
      { field: "cardholderFullName", headerName: "Nombre Titular", width: 200 },
      { field: "email", headerName: "Email", width: 200 },
      { field: "address", headerName: "Dirección", width: 250 },
      { field: "merchantName", headerName: "Nombre del Comercio", width: 200 },
      {
        field: "status",
        headerName: "Estado",
        width: 120,
        valueGetter: (value: number) => {
          switch (value) {
            case 1:
              return "Aprobado";
            case 0:
              return "Denegado";
            default:
              return "Pendiente";
          }
        },
      },
      {
        field: "dateTms",
        headerName: "Fecha de Transacción",
        width: 200,
        valueGetter: (value: string) => {
          const date = dayjs(value);
          return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : "";
        },
      },
    ],
    [],
  );

  const createQueryParams = useCallback(
    () => ({
      filter,
      orderBy,
      amountRange,
      startDate,
      endDate,
    }),
    [filter, orderBy, amountRange, startDate, endDate],
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
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
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

  useEffect(() => {
    if (debouncedFilter !== filter) {
      dispatch(setFilter(debouncedFilter));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, [debouncedFilter, filter, dispatch]);

  useEffect(() => {
    const baseParams = createQueryParams();

    const dataParams = {
      ...baseParams,
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    };

    dispatch(fetchTransactions(dataParams));

    dispatch(fetchTransactionsCount(baseParams));
  }, [dispatch, paginationModel, createQueryParams]);

  if (error) {
    return (
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid size={{ lg: 8, xs: 12 }}>
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
        rowCount={total}
        loading={loading || loadingCount}
        pageSizeOptions={[5, 10, 20]}
        onPaginationModelChange={handlePageChange}
        onSortModelChange={handleSortChange}
        paginationModel={paginationModel}
        sortModel={sortModel}
        keepNonExistentRowsSelected={false}
        disableRowSelectionOnClick={true}
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
                <Typography variant="caption" gutterBottom>
                  Monto: ${amountRange[0]} - ${amountRange[1]}
                </Typography>
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
        localeText={{
          toolbarDensity: "Densidad",
          toolbarDensityLabel: "Densidad",
          toolbarDensityCompact: "Compacta",
          toolbarDensityStandard: "Estándar",
          toolbarDensityComfortable: "Cómoda",
          toolbarColumns: "Columnas",
          toolbarColumnsLabel: "Seleccionar columnas",
          toolbarFilters: "Filtros",
          toolbarFiltersLabel: "Mostrar filtros",
          toolbarFiltersTooltipHide: "Ocultar filtros",
          toolbarFiltersTooltipShow: "Mostrar filtros",
          toolbarExport: "Exportar",
          toolbarExportLabel: "Exportar",
          toolbarExportCSV: "Descargar como CSV",
          toolbarExportPrint: "Imprimir",
          columnMenuLabel: "Menú",
          columnMenuShowColumns: "Mostrar columnas",
          columnMenuFilter: "Filtrar",
          columnMenuHideColumn: "Ocultar",
          columnMenuUnsort: "No ordenar",
          columnMenuSortAsc: "Ordenar ASC",
          columnMenuSortDesc: "Ordenar DESC",
          footerRowSelected: (count: number) =>
            count !== 1
              ? `${count.toLocaleString()} filas seleccionadas`
              : `${count.toLocaleString()} fila seleccionada`,
          footerTotalRows: "Total de filas:",
          footerTotalVisibleRows: (visibleCount: number, totalCount: number) =>
            `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
          paginationRowsPerPage: "Filas por página:",
        }}
      />
    </Box>
  );
};

export default TransactionsTable;
