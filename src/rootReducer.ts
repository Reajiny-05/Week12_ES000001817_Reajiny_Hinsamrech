import { combineReducers } from '@reduxjs/toolkit'
import firebaseStatusReducer from './firebaseStatus.slice'

const rootReducer = combineReducers({
  firebaseStatus: firebaseStatusReducer,
})

export default rootReducer