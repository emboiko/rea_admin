"use client"

import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"

const Hero = styled("section")(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "calc(100svh - 64px)",
  overflow: "hidden",
  backgroundColor: "#1a3328",
  [theme.breakpoints.down("sm")]: {
    minHeight: "calc(100svh - 56px)",
  },
  "@media print": {
    minHeight: "auto",
    display: "block",
    backgroundColor: "#ffffff",
  },
}))

const HeroPhoto = styled("div")({
  position: "absolute",
  inset: 0,
  backgroundImage: "url(/bap.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center center",
  "@media print": {
    display: "none",
  },
})

const HeroWash = styled("div")({
  position: "absolute",
  inset: 0,
  backgroundImage: [
    "radial-gradient(ellipse 72% 48% at 50% 46%, rgba(14, 28, 22, 0.42) 0%, rgba(14, 28, 22, 0.14) 54%, rgba(14, 28, 22, 0) 76%)",
    "linear-gradient(180deg, rgba(244, 241, 234, 0.2) 0%, rgba(31, 77, 58, 0.04) 34%, rgba(8, 22, 16, 0.32) 100%)",
  ].join(", "),
  "@media print": {
    display: "none",
  },
})

const HeroTitle = styled(Typography)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  margin: 0,
  maxWidth: 780,
  padding: theme.spacing(4),
  color: "#fffdf8",
  fontWeight: 600,
  letterSpacing: "0.01em",
  lineHeight: 1.2,
  textAlign: "center",
  textWrap: "balance",
  textShadow: "0 2px 22px rgba(8, 18, 14, 0.5)",
  [theme.breakpoints.down("sm")]: {
    fontSize: "2rem",
    padding: theme.spacing(3),
  },
  "@media print": {
    color: "#1f4d3a",
    textShadow: "none",
  },
}))

export const LandingPage = () => {
  return (
    <Hero>
      <HeroPhoto aria-hidden="true" />
      <HeroWash aria-hidden="true" />
      <HeroTitle variant="h3" component="h1">
        Redfield Estates Association Portal
      </HeroTitle>
    </Hero>
  )
}
