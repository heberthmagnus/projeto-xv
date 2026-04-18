import { AdvancedSimulationClient } from "./simulation-client";
import { createAdvancedSimulationState } from "@/lib/advanced-team-simulation";

export default function AdvancedSimulationPage() {
  return <AdvancedSimulationClient initialState={createAdvancedSimulationState()} />;
}
