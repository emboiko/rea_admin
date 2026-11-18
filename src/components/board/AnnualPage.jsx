"use client"

import { useState } from "react"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import NextLink from "next/link"
import { formatCents, formatCentsPlain } from "@/shared/money"
import { useAnnual } from "@/client/state/useAnnual"
import { BoardGate } from "@/components/board/BoardGate"
import {
  ButtonRow,
  ErrorAlert,
  FormHint,
  FormStack,
  LoadingState,
  NoticeAlert,
  PageMain,
} from "@/components/layout/PageFrame"

const formatStatusTime = (isoValue) => {
  if (!isoValue) {
    return ""
  }
  return new Date(isoValue).toLocaleString()
}

const AnnualForm = ({
  status,
  isLoading,
  errorMessage,
  notice,
  saveAmount,
  generate,
  sendEmail,
}) => {
  let startingAmount = ""
  if (status && status.feeSchedule) {
    startingAmount = formatCentsPlain(status.feeSchedule.amountCents)
  }
  const [amount, setAmount] = useState(startingAmount)
  const [confirmationYear, setConfirmationYear] = useState("")

  const schedule = status ? status.feeSchedule : null
  let isLocked = false
  if (schedule && schedule.lockedAt) {
    isLocked = true
  }
  let canEditAmount = false
  if (!isLoading && status && !isLocked) {
    canEditAmount = true
  }
  let canGenerate = false
  if (canEditAmount && schedule) {
    canGenerate = true
  }

  const renderYear = () => {
    if (!status) {
      return null
    }
    return <Typography>Year {status.year}</Typography>
  }

  const renderStatus = () => {
    if (isLoading || !status) {
      return null
    }
    if (!status.feeSchedule) {
      return (
        <Typography>No dues amount is saved for {status.year} yet.</Typography>
      )
    }
    const savedAmount = formatCents(status.feeSchedule.amountCents)
    let lastSavedText = ""
    if (status.feeSchedule.updatedAt) {
      lastSavedText = `Last saved ${formatStatusTime(status.feeSchedule.updatedAt)}.`
    }
    if (status.feeSchedule.lockedAt) {
      return (
        <Typography>
          Saved amount {savedAmount}. {lastSavedText} Dues were generated on{" "}
          {formatStatusTime(status.feeSchedule.lockedAt)}.
        </Typography>
      )
    }
    return (
      <Typography>
        Saved amount {savedAmount}. {lastSavedText} The amount can still be
        changed.
      </Typography>
    )
  }

  const renderEmail = () => {
    if (!status) {
      return null
    }
    if (!status.smtpConfigured) {
      return (
        <Typography>
          Mass email stays off until SMTP is configured. Printing the bills does
          not need email.
        </Typography>
      )
    }
    if (status.emailSentAt) {
      return (
        <Typography>
          The annual email for {status.year} was sent on{" "}
          {new Date(status.emailSentAt).toLocaleString()}.
        </Typography>
      )
    }
    let emailIsReady = false
    if (status.feeSchedule && status.feeSchedule.lockedAt) {
      emailIsReady = true
    }
    return (
      <Button variant="contained" onClick={sendEmail} disabled={!emailIsReady}>
        Send annual email
      </Button>
    )
  }

  return (
    <>
      {renderYear()}
      {isLoading ? <LoadingState label="Loading the year" /> : null}
      <ErrorAlert message={errorMessage} />
      <NoticeAlert message={notice} />
      {renderStatus()}
      <FormStack
        onSubmit={(event) => {
          event.preventDefault()
          saveAmount(amount)
        }}
      >
        <TextField
          label="Annual amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="120.25"
          disabled={!canEditAmount}
        />
        <Button type="submit" variant="outlined" disabled={!canEditAmount}>
          Save amount
        </Button>
      </FormStack>
      <FormStack
        onSubmit={(event) => {
          event.preventDefault()
          generate(Number(confirmationYear))
        }}
      >
        <Typography>
          Generate one dues record for every active house, including houses with
          no email and no account. Type the year to confirm.
        </Typography>
        <FormHint>
          This cannot be done more than once for a given year.
        </FormHint>
        <TextField
          label="Type the year to confirm"
          value={confirmationYear}
          onChange={(event) => setConfirmationYear(event.target.value)}
          disabled={!canGenerate}
        />
        <Button type="submit" variant="contained" disabled={!canGenerate}>
          Generate dues
        </Button>
      </FormStack>
      <ButtonRow>
        {renderEmail()}
        <Button component={NextLink} href="/board/bills" variant="outlined">
          Open the bill stack
        </Button>
      </ButtonRow>
      <FormHint component="div">
        <Typography variant="subtitle2" component="h2">
          How amounts work
        </Typography>
        <ul>
          <li>
            Save this year&apos;s amount. It can be changed until dues are
            generated.
          </li>
          <li>
            Generate dues once for every active house. That locks the amount.
          </li>
          <li>After that, send the annual email and print the bills.</li>
        </ul>
      </FormHint>
    </>
  )
}

const AnnualEditor = () => {
  const annual = useAnnual()
  let formKey = "pending"
  if (annual.status) {
    formKey = String(annual.status.year)
    if (annual.status.feeSchedule) {
      const savedAt = annual.status.feeSchedule.updatedAt || ""
      const lockedAt = annual.status.feeSchedule.lockedAt || ""
      formKey = `${formKey}:${annual.status.feeSchedule.amountCents}:${savedAt}:${lockedAt}`
    } else {
      formKey = `${formKey}:none`
    }
  }
  return (
    <AnnualForm
      key={formKey}
      status={annual.status}
      isLoading={annual.isLoading}
      errorMessage={annual.errorMessage}
      notice={annual.notice}
      saveAmount={annual.saveAmount}
      generate={annual.generate}
      sendEmail={annual.sendEmail}
    />
  )
}

export const AnnualPage = () => {
  return (
    <BoardGate>
      <PageMain>
        <Typography variant="h4" component="h1">
          Annual dues
        </Typography>
        <AnnualEditor />
      </PageMain>
    </BoardGate>
  )
}
