// transactionsSlice.ts
import { Dayjs } from "dayjs";

import { endpointTransactions } from "@/config";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FieldFilter {
  field: string;
  value: string;
  id: string;
}

export interface FetchParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  amountRange?: [number, number];
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
  fieldFilters?: FieldFilter[];
}

interface TransactionsState {
  data: any[];
  loading: boolean;
  error: string | null;
  total: number;
  orderBy: string;
  loadingCount: boolean;
  fieldFilters: FieldFilter[];
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
  total: 0,
  orderBy: "dateTms",
  loadingCount: false,
  fieldFilters: [],
};

const buildApiUrl = (params: FetchParams, isCountQuery = false): string => {
  const url = new URL(endpointTransactions);
  const queryParams = new URLSearchParams();

  if (isCountQuery) {
    queryParams.append("field", "idTransaction::COUNT");
  } else {
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString());
  }

  if (params.orderBy && !isCountQuery) queryParams.append("sort", params.orderBy);

  const conditionalParams: string[] = [];

  if (params.fieldFilters && params.fieldFilters.length > 0) {
    params.fieldFilters.forEach((f) => {
      if (f.field && f.value && f.value.trim()) {
        const val = `%${f.value.trim()}%`; // parcial
        conditionalParams.push(`${f.field}$lk${val}`); // $lk = like
      }
    });
  }

  if (params.startDate && params.endDate) {
    const start = params.startDate.format("YYYY-MM-DD");
    const end = params.endDate.format("YYYY-MM-DD");
    conditionalParams.push(`dateTms$bt${start}T00:00:00::${end}T23:59:59`);
  }

  if (params.amountRange) {
    const [min, max] = params.amountRange;
    conditionalParams.push(`amount$bt${min}::${max}`);
  }

  if (conditionalParams.length > 0) queryParams.append("conditional", conditionalParams.join("|"));

  const finalUrl = `${url.toString()}?${queryParams.toString()}`;

  return finalUrl;
};

export const fetchTransactionsCount = createAsyncThunk(
  "transactions/fetchTransactionsCount",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const fullUrl = buildApiUrl(params, true);
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) return rejectWithValue(`Error HTTP: ${response.status}`);
      const result = await response.json();
      let total = 0;
      if (Array.isArray(result.data) && result.data.length > 0) {
        total = typeof result.data[0] === "number" ? result.data[0] : result.data[0].count || 0;
      } else if (result.total !== undefined) {
        total = result.total;
      } else if (result.count !== undefined) {
        total = result.count;
      }
      return total;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const fullUrl = buildApiUrl(params, false);
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) return rejectWithValue(`Error HTTP: ${response.status}`);
      const result = await response.json();
      const data = Array.isArray(result.data) ? result.data : [];
      return { data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setOrderBy(state, action: PayloadAction<string>) {
      state.orderBy = action.payload;
    },
    setFieldFilters(state, action: PayloadAction<FieldFilter[]>) {
      state.fieldFilters = action.payload;
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
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.data = [];
      })
      .addCase(fetchTransactionsCount.pending, (state) => {
        state.loadingCount = true;
      })
      .addCase(fetchTransactionsCount.fulfilled, (state, action) => {
        state.loadingCount = false;
        state.total = action.payload;
      })
      .addCase(fetchTransactionsCount.rejected, (state, action) => {
        state.loadingCount = false;
        state.error = action.payload as string;
        state.total = 0;
      });
  },
});

export const { setOrderBy, setFieldFilters } = transactionsSlice.actions;
export default transactionsSlice.reducer;
