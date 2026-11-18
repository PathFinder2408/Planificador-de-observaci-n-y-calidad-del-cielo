export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
        Región de Coquimbo &amp; Observatorios de Chile
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Planificador de Observación y Calidad del Cielo
      </h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Base inicial desplegada. Las próximas fases integrarán efemérides con{" "}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">astronomy-engine</code>,
        índice meteorológico con Open-Meteo, gráficos de altitud nocturna y favoritos de usuario.
      </p>
    </main>
  );
}
