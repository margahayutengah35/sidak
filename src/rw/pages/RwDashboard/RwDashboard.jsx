import React from "react";
import StatsGrid from "./StatsGrid";
import ChartSection from "./ChartSection";

function RwDashboard() {
  return (
    <div className="p-6 space-y-6">
      <StatsGrid />
      <ChartSection />
    </div>
  );
}

export default RwDashboard;
