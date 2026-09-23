// Fallback do <Suspense> em volta de modais carregados sob demanda (ex.:
// import de planilha, que arrasta a lib pesada xlsx) — mostra algo na tela
// assim que o botão é clicado, em vez de a aba parecer travada enquanto o
// chunk é baixado/processado.
export default function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <span
        className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"
        aria-label="Carregando..."
      />
    </div>
  );
}
