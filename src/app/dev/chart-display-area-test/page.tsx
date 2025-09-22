import { notFound } from "next/navigation";
import ChartDisplayAreaTestClient from "./chart-display-area-test-client";

const isChartDisplayTestEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_CHART_DISPLAY_AREA_TEST === "true";

export default function ChartDisplayAreaTestPage() {
  if (!isChartDisplayTestEnabled) {
    notFound();
  }

  return <ChartDisplayAreaTestClient />;
}
