import { TextStyle } from "react-native";

type TypographyToken = Readonly<TextStyle>;

export const typography: Record<string, TypographyToken> = {
  display: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: 0.15,
    textTransform: "uppercase",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
    fontFamily: "Rajdhani_700Bold",
    textTransform: "uppercase",
  },
  labelCaps: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Rajdhani_700Bold",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
};
