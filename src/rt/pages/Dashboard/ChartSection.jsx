import React from "react";
import PopulationStatsChart from "./PopulationStatsChart";
import SpinChart from "./SpinChart";

function ChartSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <PopulationStatsChart />
      </div>
      <div className="space-y-6">
        <SpinChart />
      </div>
    </div>
  );
  
}

export default ChartSection;
