import { Header } from "./Header";

/*
 * The app had two near-identical nav bars: Header (landing only) and
 * TopNav (everywhere else), which drifted apart. This keeps the old import
 * path working while leaving exactly one implementation.
 */
export function TopNav() {
  return <Header />;
}