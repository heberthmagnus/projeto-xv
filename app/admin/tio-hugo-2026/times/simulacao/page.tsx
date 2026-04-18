import { createSimulationState } from "@/lib/team-simulation";
import { SimulationClient } from "./simulation-client";

export default function SimulacaoTimesPage() {
  return <SimulationClient initialState={createSimulationState()} />;
}
