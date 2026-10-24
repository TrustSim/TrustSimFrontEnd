import { Newsreader } from "next/font/google";
import BuyerHomepage from "@/components/home/BuyerHomepage";

const displayFont = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-home-display",
});

export default function HomePage() {
  return (
    <div className={displayFont.variable}>
      <BuyerHomepage />
    </div>
  );
}
