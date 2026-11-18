"use client"

import AppBar from "@mui/material/AppBar"
import Button from "@mui/material/Button"
import Toolbar from "@mui/material/Toolbar"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { styled } from "@mui/material/styles"
import { useSession } from "@/client/state/SessionProvider"
import { ThemeModeToggle } from "@/components/theme/ThemeModeToggle"

const NavRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  width: "100%",
}))

const BrandLink = styled(NextLink)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  textDecoration: "none",
  fontWeight: 700,
  marginRight: theme.spacing(1),
}))

const NavLink = styled(NextLink)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  textDecoration: "none",
}))

const Spacer = styled("span")({
  flexGrow: 1,
})

const hasLedgerAccess = (user) => {
  if (!user) {
    return false
  }
  return user.role === "board" || user.role === "president"
}

export const AppShell = ({ children }) => {
  const router = useRouter()
  const { user, isReady, signOut } = useSession()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const renderBoardLinks = () => {
    if (!hasLedgerAccess(user)) {
      return null
    }
    return (
      <>
        <NavLink href="/board">Ledger</NavLink>
        <NavLink href="/board/annual">Annual dues</NavLink>
        <NavLink href="/board/bills">Print bills</NavLink>
        <NavLink href="/board/members">Members</NavLink>
      </>
    )
  }

  const renderAccountLink = () => {
    if (!user || !user.householdId) {
      return null
    }
    return <NavLink href="/account">Your dues</NavLink>
  }

  const renderSessionAction = () => {
    if (!isReady) {
      return null
    }
    if (!user) {
      return <NavLink href="/login">Log in</NavLink>
    }
    return (
      <Button color="inherit" onClick={handleSignOut}>
        Sign out
      </Button>
    )
  }

  return (
    <>
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <NavRow>
            <BrandLink href="/">Redfield Estates</BrandLink>
            {renderBoardLinks()}
            {renderAccountLink()}
            <Spacer />
            <ThemeModeToggle />
            {renderSessionAction()}
          </NavRow>
        </Toolbar>
      </AppBar>
      {children}
    </>
  )
}
