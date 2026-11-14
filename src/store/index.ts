import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import { baseApi } from "@/store/api"
import ui from "@/store/ui"

export const makeStore = () => configureStore({ reducer: { ui, [baseApi.reducerPath]: baseApi.reducer }, middleware: (d) => d().concat(baseApi.middleware) })
export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
