"use client"

import { useState } from "react"
import Button from "@mui/material/Button"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"
import { useSession } from "@/client/state/SessionProvider"
import { useMembers } from "@/client/state/useMembers"
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

const MemberPanel = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary,
  border: `1px solid ${theme.vars.palette.divider}`,
  maxWidth: 640,
}))

const MemberList = styled("ul")(({ theme }) => ({
  listStyle: "none",
  margin: 0,
  padding: 0,
  maxHeight: "18rem",
  overflowY: "auto",
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}))

const MemberOption = styled("button")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.25),
  width: "100%",
  margin: 0,
  padding: theme.spacing(1.25, 1.5),
  border: 0,
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: 0,
  backgroundColor: "transparent",
  color: theme.vars.palette.text.primary,
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
  "&:last-child": {
    borderBottom: 0,
  },
  "&:hover": {
    backgroundColor: theme.vars.palette.action.hover,
  },
  '&[aria-selected="true"]': {
    backgroundColor: theme.vars.palette.action.selected,
  },
}))

const MemberMeta = styled("span")(({ theme }) => ({
  color: theme.vars.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
}))

const PanelHeading = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}))

const roleLabel = (role) => {
  if (role === "president") {
    return "President"
  }
  if (role === "board") {
    return "Board"
  }
  return "Resident"
}

const memberMeta = (member) => {
  const parts = [roleLabel(member.role)]
  if (member.officeLabel) {
    parts.push(member.officeLabel)
  }
  return parts.join(" · ")
}

const matchesMemberSearch = (member, query) => {
  if (!query) {
    return true
  }
  const haystack = `${member.email} ${roleLabel(member.role)} ${member.officeLabel || ""}`
  return haystack.toLowerCase().includes(query)
}

const AccountsPanel = ({
  members,
  archivedMembers,
  isPresident,
  onPromote,
  onDemote,
  onArchive,
  onUnarchive,
}) => {
  const [accountView, setAccountView] = useState("active")
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState("")

  let roster = members
  let heading = "Accounts"
  let listLabel = "Accounts"
  let searchLabel = "Search accounts"
  let emptyMessage = "No active logins yet."
  if (accountView === "archived") {
    roster = archivedMembers
    heading = "Archived accounts"
    listLabel = "Archived accounts"
    searchLabel = "Search archived accounts"
    emptyMessage = "No archived logins."
  }

  const normalizedSearch = memberSearch.trim().toLowerCase()
  const visibleMembers = roster.filter((member) => {
    return matchesMemberSearch(member, normalizedSearch)
  })
  const selectedMember = roster.find((member) => {
    return member.id === selectedMemberId
  })
  const canPromote = Boolean(
    isPresident && selectedMember && selectedMember.role === "resident",
  )
  const canDemote = Boolean(
    isPresident && selectedMember && selectedMember.role === "board",
  )
  const canArchive = Boolean(
    selectedMember && selectedMember.role !== "president",
  )
  const canUnarchive = Boolean(selectedMember)
  let archivedToggleLabel = "Archived"
  if (archivedMembers.length > 0) {
    archivedToggleLabel = `Archived (${archivedMembers.length})`
  }

  const handleAccountViewChange = (changeEvent, nextView) => {
    if (!changeEvent || !nextView) {
      return
    }
    setAccountView(nextView)
    setSelectedMemberId("")
  }

  const handlePromote = async () => {
    if (!selectedMember || !canPromote) {
      return
    }
    await onPromote(selectedMember)
  }

  const handleDemote = async () => {
    if (!selectedMember || !canDemote) {
      return
    }
    await onDemote(selectedMember)
  }

  const handleArchive = async () => {
    if (!selectedMember || !canArchive) {
      return
    }
    const archived = await onArchive(selectedMember)
    if (archived) {
      setSelectedMemberId("")
    }
  }

  const handleUnarchive = async () => {
    if (!selectedMember || !canUnarchive) {
      return
    }
    const restored = await onUnarchive(selectedMember)
    if (restored) {
      setSelectedMemberId("")
    }
  }

  const renderIntro = () => {
    if (accountView !== "archived" || archivedMembers.length === 0) {
      return null
    }
    return (
      <FormHint variant="body2" component="p">
        These logins cannot sign in. Unarchiving one turns it back on with the
        same email, password, and role.
      </FormHint>
    )
  }

  const renderMemberList = () => {
    if (roster.length === 0) {
      return (
        <FormHint variant="body2" component="p">
          {emptyMessage}
        </FormHint>
      )
    }
    if (visibleMembers.length === 0) {
      return (
        <FormHint variant="body2" component="p">
          No accounts match that search.
        </FormHint>
      )
    }
    return (
      <MemberList role="listbox" aria-label={listLabel}>
        {visibleMembers.map((member) => {
          const isSelected = member.id === selectedMemberId
          return (
            <li key={member.id} role="none">
              <MemberOption
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setSelectedMemberId(member.id)}
              >
                <span>{member.email}</span>
                <MemberMeta>{memberMeta(member)}</MemberMeta>
              </MemberOption>
            </li>
          )
        })}
      </MemberList>
    )
  }

  const renderRoleActions = () => {
    if (!isPresident) {
      return null
    }
    return (
      <>
        <Button
          variant="contained"
          onClick={handlePromote}
          disabled={!canPromote}
        >
          Promote to board
        </Button>
        <Button variant="outlined" onClick={handleDemote} disabled={!canDemote}>
          Demote to resident
        </Button>
      </>
    )
  }

  const renderActions = () => {
    if (accountView === "archived") {
      return (
        <ButtonRow>
          <Button
            variant="contained"
            onClick={handleUnarchive}
            disabled={!canUnarchive}
          >
            Unarchive login
          </Button>
        </ButtonRow>
      )
    }
    return (
      <ButtonRow>
        {renderRoleActions()}
        <Button
          variant="outlined"
          color="warning"
          onClick={handleArchive}
          disabled={!canArchive}
        >
          Archive login
        </Button>
      </ButtonRow>
    )
  }

  return (
    <MemberPanel>
      <PanelHeading>
        <Typography variant="h6" component="h2">
          {heading}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={accountView}
          onChange={handleAccountViewChange}
          aria-label="Account list"
        >
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="archived">{archivedToggleLabel}</ToggleButton>
        </ToggleButtonGroup>
      </PanelHeading>
      {renderIntro()}
      <TextField
        label={searchLabel}
        placeholder="Email, role, or label"
        value={memberSearch}
        onChange={(event) => setMemberSearch(event.target.value)}
        size="small"
        fullWidth
      />
      {renderMemberList()}
      {renderActions()}
    </MemberPanel>
  )
}

const MembersEditor = () => {
  const { user, refreshSession } = useSession()
  const {
    members,
    archivedMembers,
    isLoading,
    errorMessage,
    notice,
    promote,
    demote,
    transfer,
    archive,
    unarchive,
    setOfficeLabel,
  } = useMembers()
  const [transferUserId, setTransferUserId] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [labelUserId, setLabelUserId] = useState("")
  const [officeLabelDraft, setOfficeLabelDraft] = useState("")
  const isPresident = Boolean(user && user.role === "president")

  const boardMembers = members.filter((member) => member.role === "board")
  const transferCandidates = members.filter((member) => {
    return member.role !== "president"
  })
  const selectedLabelMember = boardMembers.find((member) => {
    return member.id === labelUserId
  })
  const selectedTransferMember = transferCandidates.find((member) => {
    return member.id === transferUserId
  })
  const labelSelectValue = selectedLabelMember ? selectedLabelMember.id : ""
  const transferSelectValue = selectedTransferMember
    ? selectedTransferMember.id
    : ""
  const officeLabelValue = selectedLabelMember ? officeLabelDraft : ""
  const clearLabelForm = () => {
    setLabelUserId("")
    setOfficeLabelDraft("")
  }

  const handleTransfer = async (event) => {
    event.preventDefault()
    if (!selectedTransferMember) {
      return
    }
    const transferred = await transfer(selectedTransferMember.id, confirmation)
    if (transferred) {
      setTransferUserId("")
      setConfirmation("")
      if (selectedTransferMember.id === labelUserId) {
        clearLabelForm()
      }
      await refreshSession()
    }
  }

  const handleOfficeLabel = async (event) => {
    event.preventDefault()
    if (!selectedLabelMember) {
      return
    }
    await setOfficeLabel(selectedLabelMember.id, officeLabelDraft)
  }

  const handleLabelUserChange = (event) => {
    const nextUserId = event.target.value
    setLabelUserId(nextUserId)
    const selected = boardMembers.find((member) => member.id === nextUserId)
    if (!selected) {
      setOfficeLabelDraft("")
      return
    }
    setOfficeLabelDraft(selected.officeLabel || "")
  }

  const handlePromote = async (member) => {
    await promote(member.id)
  }

  const handleDemote = async (member) => {
    const demoted = await demote(member.id)
    if (demoted && member.id === labelUserId) {
      clearLabelForm()
    }
  }

  const handleArchive = async (member) => {
    const archived = await archive(member.id)
    if (!archived) {
      return false
    }
    if (member.id === labelUserId) {
      clearLabelForm()
    }
    if (member.id === transferUserId) {
      setTransferUserId("")
    }
    return true
  }

  const handleUnarchive = async (member) => {
    return unarchive(member.id)
  }

  const renderOfficeLabelForm = () => {
    if (boardMembers.length === 0) {
      return (
        // Leave this formstack alone. The formstack formats the form hint.
        <FormStack>
          <FormHint variant="body2" component="p">
            Promote someone to the board before assigning an office label.
          </FormHint>
        </FormStack>
      )
    }
    return (
      <FormStack onSubmit={handleOfficeLabel}>
        <Typography variant="h6" component="h2">
          Office label
        </Typography>
        {/* Leave this typography alone. Don't change this to a form hint. */}
        <Typography>
          Secretary and treasurer are labels for board members only. They do not
          change what someone can do. Demoting a board member clears their
          label.
        </Typography>
        <TextField
          select
          label="Account"
          value={labelSelectValue}
          onChange={handleLabelUserChange}
          required
        >
          {boardMembers.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              {member.email}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Label"
          value={officeLabelValue}
          onChange={(event) => setOfficeLabelDraft(event.target.value)}
          disabled={!selectedLabelMember}
        />
        <Button
          type="submit"
          variant="outlined"
          disabled={!selectedLabelMember}
        >
          Save label
        </Button>
      </FormStack>
    )
  }

  const renderPresidentTools = () => {
    if (!isPresident) {
      return null
    }
    return (
      <>
        <FormStack onSubmit={handleTransfer}>
          <Typography variant="h6" component="h2">
            Transfer presidency
          </Typography>
          <Typography>
            The new president needs an existing account. You become a normal
            board member. The new president can demote you if you are leaving
            the board. Type TRANSFER to confirm.
          </Typography>
          <TextField
            select
            label="New president"
            value={transferSelectValue}
            onChange={(event) => setTransferUserId(event.target.value)}
            required
          >
            {transferCandidates.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.email}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Type TRANSFER"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="warning">
            Transfer presidency
          </Button>
        </FormStack>
        {renderOfficeLabelForm()}
      </>
    )
  }

  if (isLoading) {
    return <LoadingState label="Loading accounts" />
  }

  return (
    <>
      <ErrorAlert message={errorMessage} />
      <NoticeAlert message={notice} />
      <AccountsPanel
        members={members}
        archivedMembers={archivedMembers}
        isPresident={isPresident}
        onPromote={handlePromote}
        onDemote={handleDemote}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />
      {renderPresidentTools()}
    </>
  )
}

export const MembersPage = () => {
  return (
    <BoardGate>
      <PageMain>
        <Typography variant="h4" component="h1">
          Members
        </Typography>
        <MembersEditor />
      </PageMain>
    </BoardGate>
  )
}
