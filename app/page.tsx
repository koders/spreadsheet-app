import Spreadsheet from "@/components/Spreadsheet";

export default function Home() {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-xl font-bold mb-4">
        Your personal staking calculator
      </h1>
      <Spreadsheet />
    </div>
  );
}
