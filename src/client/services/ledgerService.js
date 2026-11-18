import { downloadFile, requestJson } from "@/client/services/httpClient"

export const ledgerService = {
  getLedger: async () => {
    const payload = await requestJson("/api/ledger")
    return payload.rows
  },
  downloadCsv: async () => {
    await downloadFile("/api/ledger/export", "ledger.csv")
  },
}
