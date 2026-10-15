import { B612, B612_Mono } from "next/font/google";

// B612 was designed by Airbus for cockpit displays: legible at a glance, made for avionics.
const b612 = B612({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-b612" });
const b612Mono = B612_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-b612-mono" });

export const metadata = {
  title: "ATC Assistant · /me Bank",
  description: "CTAF and San Andreas Center calls for GTA World pilot roleplay",
};

export default function AtcLayout({ children }) {
  return <div className={`${b612.variable} ${b612Mono.variable} font-avsans`}>{children}</div>;
}
