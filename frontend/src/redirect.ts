import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

// Página de retorno do popup de login (Entra ID): só devolve a resposta para a
// janela principal e fecha. Não carrega a aplicação React de propósito — se
// carregasse, o popup abriria o sistema inteiro em vez de concluir o login.
broadcastResponseToMainFrame().catch((err) => {
  console.error('Falha ao processar a resposta de autenticação', err);
});
