import { create } from 'zustand';
import { MeshDiagnostics, MeshRouteInfo } from '../types/mesh';
import { MeshRouter } from '../services/mesh/MeshRouter';

interface MeshState {
  diagnostics: MeshDiagnostics;
  routes: MeshRouteInfo[];
  refreshDiagnostics: () => void;
  setBatterySaver: (enabled: boolean) => void;
}

export const useMeshStore = create<MeshState>((set) => {
  const router = MeshRouter.getInstance();

  return {
    diagnostics: router.getDiagnostics(),
    routes: router.getRoutes(),

    refreshDiagnostics: () => {
      set({
        diagnostics: router.getDiagnostics(),
        routes: router.getRoutes(),
      });
    },

    setBatterySaver: (enabled: boolean) => {
      router.setBatteryLow(enabled);
      set({
        diagnostics: router.getDiagnostics(),
      });
    },
  };
});
