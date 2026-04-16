/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const TradeDarkModeContext = createContext({
  darkMode: false,
  setDarkMode: () => {},
})

export function TradeDarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <TradeDarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </TradeDarkModeContext.Provider>
  )
}

export function useTradeDarkMode() {
  return useContext(TradeDarkModeContext)
}
