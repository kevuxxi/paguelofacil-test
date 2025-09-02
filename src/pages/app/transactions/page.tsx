import { AppDispatch, RootState } from "../../../store/store";
import {
  clearAllFilters,
  fetchTransactions,
  fetchTransactionsCount,
  setFieldFilters,
  setOrderBy,
} from "../../../store/transactionsSlice";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import ClearIcon from "@mui/icons-material/Clear";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const sortOptions = [
  { column: "-dateTms", label: "Fecha más reciente" },
  { column: "dateTms", label: "Fecha más antigua" },
  { column: "codOper", label: "Código de operación (A-Z)" },
  { column: "-codOper", label: "Código de operación (Z-A)" },
  { column: "status", label: "Estado (A-Z)" },
  { column: "-status", label: "Estado (Z-A)" },
  { column: "email", label: "Email (A-Z)" },
  { column: "-email", label: "Email (Z-A)" },
  { column: "-amount", label: "Monto mayor a menor" },
  { column: "amount", label: "Monto menor a mayor" },
];

const fieldFilterOptions = [
  { field: "codOper", label: "Código de Operación" },
  { field: "email", label: "Email" },
  { field: "cardType", label: "Tipo de Tarjeta" },
  { field: "cardholderFullName", label: "Nombre del Titular" },
  { field: "merchantName", label: "Nombre del Comercio" },
  { field: "status", label: "Estado" },
  { field: "displayCardNum", label: "Últimos 4 Dígitos" },
  { field: "address", label: "Dirección" },
];

const statusOptions = [
  { value: "1", label: "Aprobado" },
  { value: "0", label: "Denegado" },
  { value: "-1", label: "Pendiente" },
];

interface FieldFilter {
  field: string;
  value: string;
  id: string;
}

const TransactionsTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    loading,
    error,
    total,
    orderBy,
    loadingCount,
    fieldFilters = [],
  } = useSelector((state: RootState) => state.transactions);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [selectedField, setSelectedField] = useState<string>("");
  const [fieldValue, setFieldValue] = useState<string>("");

  const [localStartDate, setLocalStartDate] = useState<Dayjs | null>(null);
  const [localEndDate, setLocalEndDate] = useState<Dayjs | null>(null);

  const currentFieldFilters = fieldFilters;

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
      { field: "codOper", headerName: "Código de Operación", flex: 1.5 },
      {
        field: "amount",
        headerName: "Monto",
        flex: 1,
        valueGetter: (value: number) => {
          if (typeof value === "number") {
            return new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "USD",
            }).format(value);
          }
          return value || "";
        },
      },
      { field: "cardType", headerName: "Tipo de Tarjeta", flex: 1.2 },
      { field: "displayCardNum", headerName: "Últimos 4 Dígitos", flex: 1.2 },
      { field: "cardholderFullName", headerName: "Nombre Titular", flex: 1.8 },
      { field: "email", headerName: "Email", flex: 2 },
      { field: "address", headerName: "Dirección", flex: 2 },
      { field: "merchantName", headerName: "Nombre del Comercio", flex: 1.8 },
      {
        field: "status",
        headerName: "Estado",
        flex: 1,
        valueGetter: (value: any) => {
          if (typeof value === "string") {
            switch (value.toLowerCase()) {
              case "approved":
              case "aprobado":
                return "Aprobado";
              case "denied":
              case "denegado":
                return "Denegado";
              case "pending":
              case "pendiente":
                return "Pendiente";
              default:
                return value;
            }
          }
          if (typeof value === "number") {
            switch (value) {
              case 1:
                return "Aprobado";
              case 0:
                return "Denegado";
              default:
                return "Pendiente";
            }
          }
          return value || "Desconocido";
        },
      },
      {
        field: "dateTms",
        headerName: "Fecha de Transacción",
        flex: 1.8,
        valueGetter: (value: string) => {
          if (!value) return "";
          const date = dayjs(value);
          return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : value;
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
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }
      }
    },
    [orderBy, dispatch],
  );

  const handleDateChange = useCallback(
    (type: "start" | "end") => (newValue: Dayjs | null) => {
      if (type === "start") {
        setLocalStartDate(newValue);
        setStartDate(newValue);
      } else {
        setLocalEndDate(newValue);
        setEndDate(newValue);
      }
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [],
  );

  const handleMinAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMinAmount(value);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, []);

  const handleMaxAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Permitir solo números y punto decimal
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMaxAmount(value);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, []);

  const handleAddFieldFilter = useCallback(() => {
    if (selectedField && fieldValue.trim()) {
      const newFilter: FieldFilter = {
        field: selectedField,
        value: fieldValue.trim(),
        id: `${selectedField}-${Date.now()}`,
      };

      dispatch(setFieldFilters([...currentFieldFilters, newFilter]));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      setSelectedField("");
      setFieldValue("");
    }
  }, [selectedField, fieldValue, currentFieldFilters, dispatch]);

  const handleRemoveFieldFilter = useCallback(
    (filterId: string) => {
      const updatedFilters = currentFieldFilters.filter((f) => f.id !== filterId);
      dispatch(setFieldFilters(updatedFilters));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [currentFieldFilters, dispatch],
  );

  const handleClearAllFilters = useCallback(() => {
    dispatch(clearAllFilters());
    setMinAmount("");
    setMaxAmount("");
    setStartDate(null);
    setEndDate(null);
    setLocalStartDate(null);
    setLocalEndDate(null);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [dispatch]);

  const handleFieldValueKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddFieldFilter();
      }
    },
    [handleAddFieldFilter],
  );

  const minAmountValue = minAmount ? parseFloat(minAmount) : undefined;
  const maxAmountValue = maxAmount ? parseFloat(maxAmount) : undefined;

  const hasActiveFilters = useMemo(() => {
    return (
      currentFieldFilters.length > 0 || minAmount !== "" || maxAmount !== "" || startDate !== null || endDate !== null
    );
  }, [currentFieldFilters, minAmount, maxAmount, startDate, endDate]);

  useEffect(() => {
    const baseParams = {
      orderBy,
      minAmount: minAmountValue,
      maxAmount: maxAmountValue,
      startDate,
      endDate,
      fieldFilters: currentFieldFilters,
    };

    const dataParams = {
      ...baseParams,
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    };

    dispatch(fetchTransactions(dataParams));
    dispatch(fetchTransactionsCount(baseParams));
  }, [dispatch, paginationModel, orderBy, minAmountValue, maxAmountValue, startDate, endDate, currentFieldFilters]);

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

  const getFieldLabel = (field: string) => {
    const option = fieldFilterOptions.find((opt) => opt.field === field);
    return option ? option.label : field;
  };

  const formatFilterValue = (field: string, value: string) => {
    if (field === "status") {
      const statusOption = statusOptions.find((opt) => opt.value === value);
      return statusOption ? statusOption.label : value;
    }
    return value;
  };

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 150, flexGrow: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="order-by-label">Ordenar por</InputLabel>
              <Select
                labelId="order-by-label"
                value={orderBy}
                label="Ordenar por"
                onChange={(e) => dispatch(setOrderBy(e.target.value))}
              >
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.column} value={opt.column}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              label="Monto mínimo"
              value={minAmount}
              onChange={handleMinAmountChange}
              placeholder="0"
              sx={{ width: 140 }}
              type="text"
              inputProps={{
                inputMode: "decimal",
                pattern: "[0-9]*\\.?[0-9]*",
              }}
            />
            <TextField
              size="small"
              label="Monto máximo"
              value={maxAmount}
              onChange={handleMaxAmountChange}
              placeholder="Sin límite"
              sx={{ width: 140 }}
              type="text"
              inputProps={{
                inputMode: "decimal",
                pattern: "[0-9]*\\.?[0-9]*",
              }}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DatePicker
              label="Fecha de inicio"
              value={localStartDate}
              onChange={handleDateChange("start")}
              slotProps={{ textField: { size: "small", sx: { flexGrow: 1 } } }}
            />
            <DatePicker
              label="Fecha de fin"
              value={localEndDate}
              onChange={handleDateChange("end")}
              slotProps={{ textField: { size: "small", sx: { flexGrow: 1 } } }}
            />
          </LocalizationProvider>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              startIcon={<ClearAllIcon />}
              onClick={handleClearAllFilters}
              color="secondary"
              size="small"
            ></Button>
          )}
        </Box>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon />
              <Typography variant="subtitle2">Filtros por Campo ({currentFieldFilters.length})</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                <InputLabel>Campo</InputLabel>
                <Select value={selectedField} onChange={(e) => setSelectedField(e.target.value)} label="Campo">
                  {fieldFilterOptions.map((option) => (
                    <MenuItem key={option.field} value={option.field}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedField === "status" ? (
                <FormControl size="small" sx={{ minWidth: 150, flexGrow: 1 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} label="Estado">
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  size="small"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  onKeyDown={handleFieldValueKeyPress}
                  placeholder="Valor del filtro"
                  disabled={!selectedField}
                  sx={{ minWidth: 200, flexGrow: 1 }}
                  variant="outlined"
                />
              )}
              <Button
                variant="contained"
                onClick={handleAddFieldFilter}
                disabled={!selectedField || !fieldValue.trim()}
                sx={{
                  backgroundColor: "#c924a1",
                  "&:hover": {
                    backgroundColor: "#a91c85",
                  },
                }}
              >
                Agregar Filtro
              </Button>
            </Box>
            {currentFieldFilters.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {currentFieldFilters.map((fieldFilter) => (
                  <Chip
                    key={fieldFilter.id}
                    label={`${getFieldLabel(fieldFilter.field)}: ${formatFilterValue(fieldFilter.field, fieldFilter.value)}`}
                    onDelete={() => handleRemoveFieldFilter(fieldFilter.id)}
                    deleteIcon={<ClearIcon />}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.codOper || row.idTransaction || row.id || Math.random().toString()}
        paginationMode="server"
        sortingMode="server"
        rowCount={total}
        loading={loading || loadingCount}
        pageSizeOptions={[5, 10, 20, 50]}
        onPaginationModelChange={handlePageChange}
        onSortModelChange={handleSortChange}
        paginationModel={paginationModel}
        sortModel={sortModel}
        keepNonExistentRowsSelected={false}
        disableRowSelectionOnClick={true}
        autoHeight={false}
        sx={{
          height: 400,
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
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
