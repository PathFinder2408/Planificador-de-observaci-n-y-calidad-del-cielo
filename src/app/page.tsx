import { ObservationPlanner } from "@/components/ObservationPlanner";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Región de Coquimbo &amp; Observatorios de Chile
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Planificador de Observación y Calidad del Cielo
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            Efemérides calculadas en{" "}
            <span className="font-mono text-slate-300">America/Santiago</span> con{" "}
            <span className="font-mono text-slate-300">astronomy-engine</span> e índice de calidad
            nocturna con datos reales de Open-Meteo.
          </p>
        </div>
      </header>

      <ObservationPlanner />
    </main>
  );
}
