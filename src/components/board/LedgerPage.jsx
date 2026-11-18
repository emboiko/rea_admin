"use client"

import { useState } from "react"
import Button from "@mui/material/Button"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"
import NextLink from "next/link"
import { formatCents } from "@/shared/money"
import { useLedger } from "@/client/state/useLedger"
import { BoardGate } from "@/components/board/BoardGate"
import {
  ButtonRow,
  ErrorAlert,
  LoadingState,
  PageMain,
} from "@/components/layout/PageFrame"

const ToolbarRow = styled(ButtonRow)(({ theme }) => ({
  justifyContent: "space-between",
  gap: theme.spacing(2),
}))

const ToolbarActions = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  alignItems: "center",
}))

const SearchField = styled(TextField)(({ theme }) => ({
  flex: "1 1 16rem",
  minWidth: "12rem",
  maxWidth: "24rem",
  [theme.breakpoints.down("sm")]: {
    flex: "1 1 100%",
    maxWidth: "none",
  },
}))

const HouseLink = styled(NextLink)(({ theme }) => ({
  color: theme.vars.palette.primary.main,
  fontWeight: 600,
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
  "&:visited": {
    color: theme.vars.palette.primary.main,
  },
}))

const matchesHouseSearch = (row, query) => {
  if (!query) {
    return true
  }
  const haystack = `${row.mailingAddress} ${row.occupantName}`.toLowerCase()
  return haystack.includes(query)
}

const LedgerTable = () => {
  const { rows, isLoading, errorMessage, downloadCsv } = useLedger()
  const [searchQuery, setSearchQuery] = useState("")

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleRows = rows.filter((row) => {
    return matchesHouseSearch(row, normalizedQuery)
  })

  const renderOldest = (row) => {
    if (row.oldestOpenYear === null) {
      return "—"
    }
    return row.oldestOpenYear
  }

  const renderRows = () => {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            No houses yet. Add the first house to start the ledger.
          </TableCell>
        </TableRow>
      )
    }
    if (visibleRows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            No houses match that search.
          </TableCell>
        </TableRow>
      )
    }
    return visibleRows.map((row) => (
      <TableRow key={row.id}>
        <TableCell>
          <HouseLink href={`/board/households/${row.id}`}>
            {row.mailingAddress}
          </HouseLink>
        </TableCell>
        <TableCell>{row.occupantName}</TableCell>
        <TableCell>{formatCents(row.totalOwedCents)}</TableCell>
        <TableCell>{row.yearsOutstanding}</TableCell>
        <TableCell>{renderOldest(row)}</TableCell>
      </TableRow>
    ))
  }

  if (isLoading) {
    return <LoadingState label="Loading the ledger" />
  }

  return (
    <>
      <ErrorAlert message={errorMessage} />
      <Typography>
        Houses are sorted with the largest balances first. A house several years
        behind stays at the top until it is paid down.
      </Typography>
      <ToolbarRow>
        <SearchField
          label="Search houses"
          placeholder="House or occupant"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          size="small"
        />
        <ToolbarActions>
          <Button
            component={NextLink}
            href="/board/households/new"
            variant="contained"
          >
            Add a house
          </Button>
          <Button variant="outlined" onClick={downloadCsv}>
            Download CSV
          </Button>
        </ToolbarActions>
      </ToolbarRow>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>House</TableCell>
            <TableCell>Occupant/Owner</TableCell>
            <TableCell>Amount owed</TableCell>
            <TableCell>Years outstanding</TableCell>
            <TableCell>Oldest outstanding year</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{renderRows()}</TableBody>
      </Table>
    </>
  )
}

export const LedgerPage = () => {
  return (
    <BoardGate>
      <PageMain>
        <Typography variant="h4" component="h1">
          Who owes what
        </Typography>
        <LedgerTable />
      </PageMain>
    </BoardGate>
  )
}
