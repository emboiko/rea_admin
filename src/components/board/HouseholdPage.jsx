"use client"

import { useEffect, useRef, useState } from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"
import { duesName } from "@/shared/duesLabel"
import { formatCents } from "@/shared/money"
import { splitPayUrl } from "@/shared/payLink"
import { billService } from "@/client/services/billService"
import { useHousehold } from "@/client/state/useHousehold"
import { BillSheet } from "@/components/board/BillSheet"
import { BoardGate } from "@/components/board/BoardGate"
import styles from "@/components/board/printBills.module.css"
import {
  ErrorAlert,
  FormHint,
  LoadingState,
  NoticeAlert,
  PageMain,
} from "@/components/layout/PageFrame"

const HouseholdMain = styled(PageMain)({
  maxWidth: 1120,
})

const SummaryGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(2),
  alignItems: "start",
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(16rem, 0.8fr)",
  },
}))

const DueFigure = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary,
  border: `1px solid ${theme.vars.palette.divider}`,
}))

const TotalDue = styled(Typography)({
  fontSize: "2.5rem",
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
})

const PayLinkRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}))

const PayLink = styled("a")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.25),
  minWidth: 0,
  color: theme.vars.palette.primary.main,
  overflowWrap: "anywhere",
}))

const CopyPayLinkButton = styled(Button)({
  flexShrink: 0,
  whiteSpace: "nowrap",
})

const PayCode = styled("span")({
  fontFamily: 'Consolas, "Courier New", monospace',
  fontSize: "1.25rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
})

const ContentGrid = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(2.5),
  alignItems: "stretch",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
  },
}))

const Panel = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary,
  border: `1px solid ${theme.vars.palette.divider}`,
}))

const IndependentPanel = styled(Panel)({
  alignSelf: "start",
})

const PanelForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}))

const RecordList = styled("ul")(({ theme }) => ({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.25),
}))

const LedgerItem = styled("li")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.5),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
}))

const LedgerHeading = styled("div")({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
})

const LedgerTitle = styled("span")({
  fontSize: "1.15rem",
  fontWeight: 700,
})

const LedgerStatus = styled("span")(({ theme }) => ({
  color: theme.vars.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  textTransform: "capitalize",
}))

const LedgerDetails = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  color: theme.vars.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
}))

const ActionBlock = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: theme.spacing(1),
}))

const todayInputValue = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

const paymentMethodLabel = (method) => {
  if (method === "check") {
    return "Check"
  }
  if (method === "cash") {
    return "Cash"
  }
  if (method === "other") {
    return "Other"
  }
  if (method === "stripe") {
    return "Card"
  }
  return method
}

const mailActionCopy = (actionName) => {
  if (actionName === "replace-link") {
    return {
      title: "Replace the pay link?",
      body: "The current invoice URL and QR code will stop working. Print a new invoice before you mail it.",
      confirmLabel: "Replace pay link",
    }
  }
  if (actionName === "archive-login") {
    return {
      title: "Archive this login?",
      body: "This owner will no longer be able to sign in. Dues and payment history stay on the house.",
      confirmLabel: "Archive login",
    }
  }
  if (actionName === "resend-email") {
    return {
      title: "Resend this year's invoice?",
      body: "This sends this year's invoice again to the billing email on file.",
      confirmLabel: "Resend email",
    }
  }
  return null
}

const formatWhen = (iso, status) => {
  if (!iso) {
    if (status === "pending") {
      return "Awaiting confirmation"
    }
    return "Not recorded"
  }
  return new Date(iso).toLocaleDateString()
}

const HouseholdForm = ({
  householdId,
  detail,
  actions,
  errorMessage,
  notice,
}) => {
  const [streetAddress, setStreetAddress] = useState(
    detail.household.streetAddress,
  )
  const [lotNumber, setLotNumber] = useState(detail.household.lotNumber)
  const [occupantName, setOccupantName] = useState(
    detail.household.occupantName,
  )
  const [billingEmail, setBillingEmail] = useState(
    detail.household.billingEmail,
  )
  const [assessmentYear, setAssessmentYear] = useState(
    String(new Date().getFullYear()),
  )
  const [assessmentAmount, setAssessmentAmount] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("check")
  const [checkNumber, setCheckNumber] = useState("")
  const [paidOn, setPaidOn] = useState(todayInputValue)
  const [pendingAction, setPendingAction] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [printBill, setPrintBill] = useState(null)
  const [isPrintingBill, setIsPrintingBill] = useState(false)
  const [printErrorMessage, setPrintErrorMessage] = useState("")
  const [isPayLinkCopied, setIsPayLinkCopied] = useState(false)
  const [copyErrorMessage, setCopyErrorMessage] = useState("")
  const payLinkCopyTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (payLinkCopyTimer.current) {
        window.clearTimeout(payLinkCopyTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!printBill) {
      return undefined
    }
    const handleAfterPrint = () => {
      setPrintBill(null)
      setIsPrintingBill(false)
    }
    window.addEventListener("afterprint", handleAfterPrint)
    const printTimer = window.setTimeout(() => {
      window.print()
    }, 0)
    return () => {
      window.clearTimeout(printTimer)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [printBill])

  const handlePrintBill = async () => {
    setPrintErrorMessage("")
    setIsPrintingBill(true)
    try {
      const bill = await billService.getBill(householdId)
      setPrintBill(bill)
    } catch (error) {
      setPrintErrorMessage(error.message)
      setIsPrintingBill(false)
    }
  }

  const handleDetails = async (event) => {
    event.preventDefault()
    await actions.saveDetails({
      streetAddress,
      lotNumber,
      occupantName,
      billingEmail,
    })
  }

  const handleAssessment = async (event) => {
    event.preventDefault()
    await actions.addAssessment({
      year: Number(assessmentYear),
      amount: assessmentAmount,
    })
    setAssessmentAmount("")
  }

  const handlePayment = async (event) => {
    event.preventDefault()
    let submittedCheckNumber = ""
    if (paymentMethod === "check") {
      submittedCheckNumber = checkNumber
    }
    await actions.recordPayment({
      amount: paymentAmount,
      method: paymentMethod,
      checkNumber: submittedCheckNumber,
      paidOn,
    })
    setPaymentAmount("")
    setCheckNumber("")
  }

  const renderVoid = (assessment) => {
    if (assessment.status !== "open") {
      return null
    }
    if (assessment.paidCents !== 0) {
      return null
    }
    return (
      <Button
        size="small"
        onClick={() => actions.voidAssessment(assessment.id)}
      >
        Void
      </Button>
    )
  }

  const renderLogin = () => {
    if (!detail.login) {
      return (
        <Typography>
          No active account. The owner can create one from their invoice URL.
        </Typography>
      )
    }
    return (
      <Typography>
        Login: {detail.login.email} ({detail.login.role})
      </Typography>
    )
  }

  const renderPayCode = (code) => {
    if (!code) {
      return null
    }
    return <PayCode>{code}</PayCode>
  }

  const handleCopyPayLink = async () => {
    setCopyErrorMessage("")
    try {
      await navigator.clipboard.writeText(detail.payUrl)
      setIsPayLinkCopied(true)
      if (payLinkCopyTimer.current) {
        window.clearTimeout(payLinkCopyTimer.current)
      }
      payLinkCopyTimer.current = window.setTimeout(() => {
        setIsPayLinkCopied(false)
        payLinkCopyTimer.current = null
      }, 2000)
    } catch {
      setIsPayLinkCopied(false)
      setCopyErrorMessage("The pay link could not be copied.")
    }
  }

  const renderPayLink = () => {
    const payParts = splitPayUrl(detail.payUrl)
    let copyButtonLabel = "Copy"
    if (isPayLinkCopied) {
      copyButtonLabel = "Copied"
    }
    return (
      <PayLinkRow>
        <PayLink href={detail.payUrl}>
          <span>{payParts.sitePrefix || detail.payUrl}</span>
          {renderPayCode(payParts.code)}
        </PayLink>
        <CopyPayLinkButton
          size="small"
          variant="outlined"
          onClick={handleCopyPayLink}
          aria-live="polite"
        >
          {copyButtonLabel}
        </CopyPayLinkButton>
      </PayLinkRow>
    )
  }

  const renderAssessments = () => {
    if (detail.assessments.length === 0) {
      return <Typography>No dues recorded yet.</Typography>
    }
    return (
      <RecordList>
        {detail.assessments.map((assessment) => (
          <LedgerItem key={assessment.id}>
            <LedgerHeading>
              <LedgerTitle>{assessment.year}</LedgerTitle>
              <LedgerStatus>{assessment.status}</LedgerStatus>
            </LedgerHeading>
            <span>{duesName(assessment.year, assessment.description)}</span>
            <LedgerDetails>
              <span>Billed {formatCents(assessment.amountCents)}</span>
              <span>Remaining {formatCents(assessment.remainingCents)}</span>
            </LedgerDetails>
            {renderVoid(assessment)}
          </LedgerItem>
        ))}
      </RecordList>
    )
  }

  const renderCheckNumber = (payment) => {
    if (!payment.checkNumber) {
      return null
    }
    return <span>No. {payment.checkNumber}</span>
  }

  const renderPayments = () => {
    if (detail.payments.length === 0) {
      return <Typography>No payments recorded yet.</Typography>
    }
    return (
      <RecordList>
        {detail.payments.map((payment) => (
          <LedgerItem key={payment.id}>
            <LedgerHeading>
              <LedgerTitle>{formatCents(payment.amountCents)}</LedgerTitle>
              <LedgerStatus>{payment.status}</LedgerStatus>
            </LedgerHeading>
            <span>{paymentMethodLabel(payment.method)}</span>
            <LedgerDetails>
              <span>{formatWhen(payment.paidAt, payment.status)}</span>
              {renderCheckNumber(payment)}
            </LedgerDetails>
          </LedgerItem>
        ))}
      </RecordList>
    )
  }

  const closePendingAction = () => {
    if (isConfirming) {
      return
    }
    setPendingAction("")
  }

  const confirmPendingAction = async () => {
    const actionName = pendingAction
    setIsConfirming(true)
    if (actionName === "replace-link") {
      await actions.rotateLink()
    }
    if (actionName === "archive-login") {
      await actions.archiveLogin()
    }
    if (actionName === "resend-email") {
      await actions.resendEmail()
    }
    setIsConfirming(false)
    setPendingAction("")
  }

  const renderMailConfirm = () => {
    const copy = mailActionCopy(pendingAction)
    let title = ""
    let body = ""
    let confirmLabel = ""
    if (copy) {
      title = copy.title
      body = copy.body
      confirmLabel = copy.confirmLabel
    }
    return (
      <Dialog open={Boolean(copy)} onClose={closePendingAction}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePendingAction} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmPendingAction}
            disabled={isConfirming}
          >
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const renderCheckNumberField = () => {
    if (paymentMethod !== "check") {
      return null
    }
    return (
      <TextField
        label="Check number (optional)"
        value={checkNumber}
        onChange={(event) => setCheckNumber(event.target.value)}
        fullWidth
      />
    )
  }

  let alertMessage = errorMessage
  if (copyErrorMessage) {
    alertMessage = copyErrorMessage
  }
  if (printErrorMessage) {
    alertMessage = printErrorMessage
  }

  const renderPrintBill = () => {
    if (!printBill) {
      return null
    }
    return <BillSheet bill={printBill} printOnly />
  }

  return (
    <>
      <div className={styles.screenOnly}>
        <ErrorAlert message={alertMessage} />
        <NoticeAlert message={notice} />
        <SummaryGrid>
          <div>
            <Typography variant="h4" component="h1">
              {detail.household.mailingAddress}
            </Typography>
            {renderLogin()}
          </div>
          <DueFigure>
            <Typography variant="overline" component="p">
              Total due
            </Typography>
            <TotalDue component="p">
              {formatCents(detail.summary.totalOwedCents)}
            </TotalDue>
            {renderPayLink()}
          </DueFigure>
        </SummaryGrid>
        <ContentGrid>
          <Panel>
            <Typography variant="h6" component="h2">
              House details
            </Typography>
            <PanelForm onSubmit={handleDetails}>
              <TextField
                label="Street address"
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Lot"
                value={lotNumber}
                onChange={(event) => setLotNumber(event.target.value)}
                fullWidth
              />
              <TextField
                label="Occupant name"
                value={occupantName}
                onChange={(event) => setOccupantName(event.target.value)}
                fullWidth
              />
              <TextField
                label="Billing email"
                value={billingEmail}
                onChange={(event) => setBillingEmail(event.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained">
                Save details
              </Button>
            </PanelForm>
          </Panel>
          <Panel>
            <Typography variant="h6" component="h2">
              Actions
            </Typography>
            <ActionBlock>
              <Button
                variant="outlined"
                onClick={handlePrintBill}
                disabled={isPrintingBill}
              >
                Print bill
              </Button>
              <Typography variant="body2" color="text.secondary">
                Opens this house&apos;s bill in the print dialog.
              </Typography>
            </ActionBlock>
            <ActionBlock>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setPendingAction("replace-link")}
              >
                Replace pay link
              </Button>
              <Typography variant="body2" color="text.secondary">
                Stops the current letter and QR code. Print a new letter before
                you mail it.
              </Typography>
            </ActionBlock>
            <ActionBlock>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setPendingAction("archive-login")}
              >
                Archive login
              </Button>
              <Typography variant="body2" color="text.secondary">
                Removes this owner&apos;s sign-in. Dues and payment history stay
                on the house.
              </Typography>
            </ActionBlock>
            <ActionBlock>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setPendingAction("resend-email")}
              >
                Resend email
              </Button>
              <Typography variant="body2" color="text.secondary">
                Sends this year&apos;s invoice again to the billing email on
                file.
              </Typography>
            </ActionBlock>
          </Panel>
          <IndependentPanel>
            <Typography variant="h6" component="h2">
              Dues
            </Typography>
            {renderAssessments()}
            <PanelForm onSubmit={handleAssessment}>
              <FormHint variant="body2" component="p">
                Add a past or extra annual dues record.
              </FormHint>
              <TextField
                label="Year"
                value={assessmentYear}
                onChange={(event) => setAssessmentYear(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Amount"
                value={assessmentAmount}
                onChange={(event) => setAssessmentAmount(event.target.value)}
                placeholder="120.25"
                required
                fullWidth
              />
              <Button type="submit" variant="outlined">
                Add dues
              </Button>
            </PanelForm>
          </IndependentPanel>
          <IndependentPanel>
            <Typography variant="h6" component="h2">
              Payments
            </Typography>
            {renderPayments()}
            <PanelForm onSubmit={handlePayment}>
              <FormHint variant="body2" component="p">
                A check or cash payment is applied to the oldest open dues
                first.
              </FormHint>
              <TextField
                label="Amount"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="120.25"
                required
                fullWidth
              />
              <TextField
                select
                label="Method"
                value={paymentMethod}
                onChange={(event) => {
                  const nextMethod = event.target.value
                  setPaymentMethod(nextMethod)
                  if (nextMethod !== "check") {
                    setCheckNumber("")
                  }
                }}
                fullWidth
              >
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              {renderCheckNumberField()}
              <TextField
                label="Date received"
                type="date"
                value={paidOn}
                onChange={(event) => setPaidOn(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <Button type="submit" variant="contained">
                Record payment
              </Button>
            </PanelForm>
          </IndependentPanel>
        </ContentGrid>
        {renderMailConfirm()}
      </div>
      {renderPrintBill()}
    </>
  )
}

const HouseholdEditor = ({ householdId }) => {
  const householdState = useHousehold(householdId)
  if (householdState.isLoading) {
    return <LoadingState label="Loading the house" />
  }
  if (!householdState.detail) {
    return (
      <ErrorAlert
        message={householdState.errorMessage || "That house was not found."}
      />
    )
  }
  return (
    <HouseholdForm
      householdId={householdId}
      detail={householdState.detail}
      errorMessage={householdState.errorMessage}
      notice={householdState.notice}
      actions={householdState}
    />
  )
}

export const HouseholdPage = ({ householdId }) => {
  return (
    <BoardGate>
      <HouseholdMain>
        <HouseholdEditor householdId={householdId} />
      </HouseholdMain>
    </BoardGate>
  )
}
