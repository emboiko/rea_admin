"use client"

import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { useBills } from "@/client/state/useBills"
import { BillSheet } from "@/components/board/BillSheet"
import { BoardGate } from "@/components/board/BoardGate"
import {
  ErrorAlert,
  LoadingState,
  PageMain,
} from "@/components/layout/PageFrame"
import styles from "@/components/board/printBills.module.css"

const BillStack = () => {
  const { bills, isLoading, errorMessage } = useBills()

  if (isLoading) {
    return <LoadingState label="Preparing bills" />
  }

  return (
    <div className={styles.page}>
      <ErrorAlert message={errorMessage} />
      <div className={styles.toolbar}>
        <div>
          <Typography variant="h4" component="h1">
            Bill stack
          </Typography>
          <Typography>
            {bills.length} houses, in address order. One print job.
          </Typography>
        </div>
        <Button variant="contained" onClick={() => window.print()}>
          Print bills
        </Button>
      </div>
      <div className={styles.stack}>
        {bills.map((bill) => (
          <BillSheet bill={bill} key={bill.householdId} />
        ))}
      </div>
    </div>
  )
}

export const PrintBillsPage = () => {
  return (
    <BoardGate>
      <PageMain>
        <BillStack />
      </PageMain>
    </BoardGate>
  )
}
