import { Dayjs } from "dayjs";

import { endpointTransactions } from "@/config";
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
  total: number;
  orderBy: string;
  loadingCount: boolean;
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
  filter: "",
  total: 0,
  orderBy: "dateTms",
  loadingCount: false,
};

const buildApiUrl = (params: FetchParams, isCountQuery = false): string => {
  const url = new URL(endpointTransactions);
  const queryParams = new URLSearchParams();

  if (isCountQuery) {
    queryParams.append("field", "idTransaction::COUNT");
  } else {
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.offset !== undefined) {
      queryParams.append("offset", params.offset.toString());
    }
  }

  if (params.orderBy && !isCountQuery) {
    queryParams.append("sort", params.orderBy);
  }

  const conditionalParamsArray = [];
  if (params.filter) {
    const isEmail = params.filter.includes("@");
    const filterField = isEmail ? "email" : "codOper";
    queryParams.append("filter", `${filterField}::${params.filter}`);
  }
  if (params.startDate && params.endDate) {
    const formattedStartDate = params.startDate.format("YYYY-MM-DD");
    const formattedEndDate = params.endDate.format("YYYY-MM-DD");
    conditionalParamsArray.push(`dateTms%24bt${formattedStartDate}T00%3A00%3A00%3A%3A${formattedEndDate}T23%3A59%3A59`);
  }
  if (params.amountRange) {
    const [min, max] = params.amountRange;
    conditionalParamsArray.push(`amount%24bt${min}%3A%3A${max}`);
  }
  if (conditionalParamsArray.length > 0) {
    queryParams.append("conditional", conditionalParamsArray.join("|"));
  }

  return `${url.toString()}?${queryParams.toString()}`;
};

export const fetchTransactionsCount = createAsyncThunk(
  "transactions/fetchTransactionsCount",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const fullUrl = buildApiUrl(params, true);
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.headerStatus?.description || "Error en la API";
        return rejectWithValue(errorMessage);
      }

      const result = await response.json();

      const total = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : 0;
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
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.headerStatus?.description || "Error en la API";
        return rejectWithValue(errorMessage);
      }

      const result = await response.json();
      return {
        data: Array.isArray(result.data) ? result.data : [],
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
    },
    setOrderBy(state, action: PayloadAction<string>) {
      state.orderBy = action.payload;
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
      });
  },
});

export const { setFilter, setOrderBy } = transactionsSlice.actions;
export default transactionsSlice.reducer;
