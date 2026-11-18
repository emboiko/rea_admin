import { duesLine } from "@/shared/duesLabel"
import { formatCents } from "@/shared/money"
import styles from "@/components/board/printBills.module.css"

const renderLines = (bill) => {
  if (bill.openFees.length === 0) {
    return (
      <tr className={styles.line}>
        <td colSpan={2}>Nothing is due right now.</td>
      </tr>
    )
  }
  return bill.openFees.map((fee) => (
    <tr className={styles.line} key={fee.id}>
      <td>{duesLine(fee.year, fee.description)}</td>
      <td>{formatCents(fee.remainingCents)}</td>
    </tr>
  ))
}

export const BillSheet = ({ bill, printOnly }) => {
  let billClassName = styles.bill
  if (printOnly) {
    billClassName = `${styles.bill} ${styles.singleBill}`
  }
  return (
    <article className={billClassName}>
      <header className={styles.billHeader}>
        <div>
          <h2>Redfield Estates Association</h2>
          <p>{bill.occupantName}</p>
          <p>{bill.mailingAddress}</p>
          <p>Total due {formatCents(bill.totalOwedCents)}</p>
          <p className={styles.payIntro}>
            Pay online at this address, or scan the code.
          </p>
          <p className={styles.payUrl}>{bill.payUrl}</p>
        </div>
        {/* Data-URL QR codes are generated for this print job and are not remote images. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.qr}
          src={bill.qrCodeDataUrl}
          alt="QR code for this house's payment link"
        />
      </header>
      <br />
      <table>
        <tbody>{renderLines(bill)}</tbody>
      </table>
    </article>
  )
}
