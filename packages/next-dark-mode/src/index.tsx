import darkmodejs from '@assortment/darkmodejs'
import { NextComponentType } from 'next'
import { AppContext } from 'next/app'
import { parseCookies, setCookie } from 'nookies'
import React, { useEffect, useState } from 'react'

import { defaultConfig, Config, MODE } from './config'
import { DarkModeContext, useDarkMode } from './darkModeContext'

interface AppProps {
  autoMode?: boolean
  darkMode?: boolean
  initialProps: any
}

export default (App: NextComponentType | any, config?: Partial<Config>) => {
  const { autoModeCookieName, darkModeCookieName, defaultMode, provider } = { ...defaultConfig, ...config }

  function DarkMode({ autoMode, darkMode, initialProps, ...props }: AppProps) {
    const [state, setState] = useState({
      autoModeActive: !!autoMode,
      autoModeSupported: false,
      browserMode: defaultMode,
      darkModeActive: !!darkMode,
      switchToAutoMode: () => {
        setState(state => {
          if (state.autoModeSupported) {
            setCookie(null, autoModeCookieName, '1', { sameSite: 'lax' })
            const darkModeActive = state.browserMode === MODE.DARK
            setCookie(null, darkModeCookieName, darkModeActive ? '1' : '0', { sameSite: 'lax' })

            return { ...state, autoModeActive: true, darkModeActive }
          }

          return { ...state }
        })
      },
      switchToDarkMode: () => {
        setState(state => ({ ...state, autoModeActive: false, darkModeActive: true }))
        setCookie(null, autoModeCookieName, '0', { sameSite: 'lax' })
        setCookie(null, darkModeCookieName, '1', { sameSite: 'lax' })
      },
      switchToLightMode: () => {
        setState(state => ({ ...state, autoModeActive: false, darkModeActive: false }))
        setCookie(null, autoModeCookieName, '0', { sameSite: 'lax' })
        setCookie(null, darkModeCookieName, '0', { sameSite: 'lax' })
      },
    })

    useEffect(() => {
      const { removeListeners } = darkmodejs({
        onChange: (activeTheme, themes) => {
          switch (activeTheme) {
            case themes.DARK:
              setState(state => {
                if (state.autoModeSupported) {
                  setCookie(null, darkModeCookieName, '1', { sameSite: 'lax' })
                  return { ...state, browserMode: MODE.DARK, darkModeActive: true }
                } else {
                  if (state.autoModeActive) setCookie(null, darkModeCookieName, '1', { sameSite: 'lax' })
                  return {
                    ...state,
                    autoModeSupported: true,
                    browserMode: MODE.DARK,
                    darkModeActive: state.autoModeActive ? true : state.darkModeActive,
                  }
                }
              })
              break
            case themes.LIGHT:
              setState(state => {
                if (state.autoModeSupported) {
                  setCookie(null, darkModeCookieName, '0', { sameSite: 'lax' })
                  return { ...state, browserMode: MODE.LIGHT, darkModeActive: false }
                } else {
                  if (state.autoModeActive) setCookie(null, darkModeCookieName, '0', { sameSite: 'lax' })
                  return {
                    ...state,
                    autoModeSupported: true,
                    browserMode: MODE.LIGHT,
                    darkModeActive: state.autoModeActive ? false : state.darkModeActive,
                  }
                }
              })
              break
            case themes.NO_PREF:
            case themes.NO_SUPP:
              setCookie(null, autoModeCookieName, '0', { sameSite: 'lax' })
              setState(state => ({ ...state, autoModeSupported: false }))
              break
          }
        },
      })

      return removeListeners
    }, [])

    const app = <App darkMode={state} {...props} {...initialProps} />

    return provider ? <DarkModeContext.Provider value={state}>{app}</DarkModeContext.Provider> : app
  }

  DarkMode.getInitialProps = async (appContext: AppContext) => {
    const initialProps = App.getInitialProps ? await App.getInitialProps(appContext) : {}

    if (typeof window === 'undefined') {
      const cookies = parseCookies(appContext.ctx)

      const autoModeCookie = cookies[autoModeCookieName]
      const darkModeCookie = cookies[darkModeCookieName]

      const autoMode = typeof autoModeCookie === 'undefined' ? true : autoModeCookie === '1'
      const darkMode = typeof darkModeCookie === 'undefined' ? defaultMode === MODE.DARK : darkModeCookie === '1'

      const autoModeString = autoMode ? '1' : '0'
      const darkModeString = darkMode ? '1' : '0'

      if (autoModeString !== autoModeCookie)
        setCookie(appContext.ctx, autoModeCookieName, autoModeString, { sameSite: 'lax' })
      if (darkModeString !== darkModeCookie)
        setCookie(appContext.ctx, darkModeCookieName, darkModeString, { sameSite: 'lax' })

      return { autoMode, darkMode, initialProps }
    }

    return { initialProps }
  }

  DarkMode.displayName = `withDarkMode(${App.displayName || App.name || 'App'})`

  return DarkMode
}

export { MODE, useDarkMode }
