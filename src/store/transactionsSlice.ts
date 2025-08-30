import { Transaction } from "../types/Transaction";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Filters {
  search: string;
}

interface TransactionsState {
  data: Transaction[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  currentPage: number;
  itemsPerPage: number;
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
  filters: { search: "" },
  currentPage: 1,
  itemsPerPage: 5,
};

export const fetchTransactions = createAsyncThunk("transactions/fetchTransactions", async () => {
  const res = await fetch("https://sandbox.paguelofacil.com/api/transacciones");
  if (!res.ok) throw new Error("Error al cargar transacciones");
  const data: Transaction[] = await res.json();
  return data;
});

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error desconocido";
      });
  },
});

export const { setFilter, setPage } = transactionsSlice.actions;
export default transactionsSlice.reducer;
