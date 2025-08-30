import "dayjs/locale/es";

import { Dayjs } from "dayjs";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FetchParams {
  filter?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  amountRange?: [number, number];
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
}

interface TransactionsState {
  data: any[];
  loading: boolean;
  error: string | null;
  filter: string;
  currentPage: number;
  itemsPerPage: number;
  total: number;
  orderBy: string;
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
  filter: "",
  currentPage: 1,
  itemsPerPage: 10,
  total: 0,
  orderBy: "dateTms",
};

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const {
        filter,
        limit = initialState.itemsPerPage,
        offset = (initialState.currentPage - 1) * initialState.itemsPerPage,
        orderBy,
        startDate,
        endDate,
        amountRange,
      } = params;

      const url = new URL(import.meta.env.VITE_API_URL);
      const queryParams = new URLSearchParams();

      queryParams.append("limit", limit.toString());
      queryParams.append("offset", offset.toString());

      if (orderBy) {
        queryParams.append("sort", orderBy);
      }

      const conditionalParamsArray = [];

      if (filter) {
        const isEmail = filter.includes("@");
        const filterField = isEmail ? "email" : "codOper";
        queryParams.append("filter", `${filterField}::${filter}`);
      }

      if (startDate && endDate) {
        const formattedStartDate = startDate.format("YYYY-MM-DD");
        const formattedEndDate = endDate.format("YYYY-MM-DD");
        conditionalParamsArray.push(
          `dateTms%24bt${formattedStartDate}T00%3A00%3A00%3A%3A${formattedEndDate}T23%3A59%3A59`,
        );
      }

      if (amountRange) {
        const [min, max] = amountRange;
        conditionalParamsArray.push(`amount%24bt${min}%3A%3A${max}`);
      }

      if (conditionalParamsArray.length > 0) {
        queryParams.append("conditional", conditionalParamsArray.join("|"));
      }

      const fullUrl = `${url.toString()}?${queryParams.toString()}`;

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.headerStatus?.description || "Error en la API");
      }

      return {
        data: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
      state.currentPage = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setOrderBy(state, action: PayloadAction<string>) {
      state.orderBy = action.payload;
      state.currentPage = 1;
    },
    setItemsPerPage(state, action: PayloadAction<number>) {
      state.itemsPerPage = action.payload;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, setPage, setOrderBy, setItemsPerPage } = transactionsSlice.actions;
export default transactionsSlice.reducer;
