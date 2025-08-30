import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Parámetros opcionales para filtrar la API
interface FetchParams {
  filter?: string;
  limit?: number;
  offset?: number;
}

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: FetchParams = {}, { rejectWithValue }) => {
    try {
      const { filter = "", limit = 50, offset = 0 } = params;

      const url = `${import.meta.env.VITE_API_URL}?filter=${filter}&limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        headers: {
          Authorization: import.meta.env.VITE_API_TOKEN,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      console.log("RESULT COMPLETO:", result);
      console.log("ARRAY REAL DE TRANSACCIONES:", result?.data);

      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState: {
    data: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionsSlice.reducer;
