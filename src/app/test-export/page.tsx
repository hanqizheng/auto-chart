import { notFound } from "next/navigation";
import TestExportClientPage from "./test-export-client";

const isTestExportEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_TEST_EXPORT === "true";

export default function TestExportPage() {
  if (!isTestExportEnabled) {
    notFound();
  }

  return <TestExportClientPage />;
}
