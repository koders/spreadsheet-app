import "./globals.css";
import { Montserrat } from "next/font/google";
import { SpreadsheetProvider } from "@/contexts/SpreadsheetContext";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
  title: "Spreadsheet",
  description: "Generated by CHAT GPT xD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <SpreadsheetProvider>{children}</SpreadsheetProvider>
      </body>
    </html>
  );
}
