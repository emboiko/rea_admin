"use client"

import { useEffect, useState } from "react"
import { statementService } from "@/client/services/statementService"

export const useStatement = (initialPayToken) => {
  const [statement, setStatement] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setErrorMessage("")
      try {
        if (initialPayToken) {
          const opened = await statementService.openSession(initialPayToken)
          setStatement(opened)
          // The pay code is a secret, and once the server has traded it for a cookie, the page takes the code out of the address bar.
          window.history.replaceState({}, "", "/pay")
        } else {
          const current = await statementService.getCurrent()
          setStatement(current)
        }
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [initialPayToken])

  const pay = async () => {
    setErrorMessage("")
    try {
      return await statementService.startCheckout()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const claimAccount = async (body) => {
    setErrorMessage("")
    setNotice("")
    const user = await statementService.claimAccount(body)
    const current = await statementService.getCurrent()
    setStatement(current)
    setNotice("Login saved. You can come back without the letter.")
    return user
  }

  return {
    statement,
    isLoading,
    errorMessage,
    notice,
    pay,
    claimAccount,
    setErrorMessage,
  }
}
