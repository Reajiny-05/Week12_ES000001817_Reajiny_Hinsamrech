import { createSlice } from '@reduxjs/toolkit'

interface FirebaseStatusState {
  success: number
  failure: number
}

const initialState: FirebaseStatusState = {
  success: 0,
  failure: 0,
}

const firebaseStatusSlice = createSlice({
  name: 'firebaseStatus',
  initialState,
  reducers: {
    addSuccess: (state) => {
      state.success += 1
    },
    addFailure: (state) => {
      state.failure += 1
    },
    resetStatus: (state) => {
      state.success = 0
      state.failure = 0
    },
  },
})

export const { addSuccess, addFailure, resetStatus } =
  firebaseStatusSlice.actions

export default firebaseStatusSlice.reducer