import { LiveApp } from "@/live/LiveApp";
import { LiveProvider } from "@/live/LiveProvider";
export default function BetaScreen() {
  return (
    <LiveProvider>
      <LiveApp />
    </LiveProvider>
  );
}
