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
  total: number;
  orderBy: string;
}

const initialState: TransactionsState = {
  data: [],
  loading: false,
  error: null,
  filter: "",
  total: 5000,
  orderBy: "dateTms",
};

const buildApiUrl = (params: FetchParams): string => {
  const url = new URL(import.meta.env.VITE_API_URL);
  const queryParams = new URLSearchParams();

  if (params.limit !== undefined) {
    queryParams.append("limit", params.limit.toString());
  }
  if (params.offset !== undefined) {
    queryParams.append("offset", params.offset.toString());
  }
  if (params.orderBy) {
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

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const fullUrl = buildApiUrl(params);
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
        total: result.total || initialState.total,
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
        state.total = action.payload.total;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, setOrderBy } = transactionsSlice.actions;
export default transactionsSlice.reducer;
