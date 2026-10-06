# Frames e player integrado — Playwright e TypeScript

[English version](README.en.md)

Testes nas páginas hospedadas do [Test Pages, de Alan Richardson](https://testpages.eviltester.com/pages/embedded-pages/). O foco é trabalhar com documentos diferentes na mesma tela: iframes, um frameset legado e um podcast incorporado de outra origem.

## Executar

Node.js 22.9 ou superior. O CI usa Node 24 e Chromium.

```bash
cp .env.example .env
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

No PowerShell, use `Copy-Item .env.example .env`. No Linux, instale o navegador com `npx playwright install --with-deps chromium`. Não há aplicação local para iniciar.

`BASE_URL` define o Test Pages; `PODCAST_URL` identifica o iframe já presente no host. Variáveis do processo têm prioridade sobre `.env`. Alterar uma URL exige um ambiente com o mesmo contrato; a suíte não injeta conteúdo nem monta uma página substituta.

## Cenários

| Risco | Verificação |
| --- | --- |
| Interagir no documento errado | Dois iframes compartilham o ID `alist`. O seletor usa `src`; a operação 12 + 7 altera somente o frame interativo, preservando a lista vizinha e o host. |
| Usar contexto antigo | Recarga do iframe e recarga do host são cenários separados. Ambos exigem o estado inicial e uma nova interação válida. |
| Misturar regiões legadas | O frameset contém cinco frames. A suíte confere nome, lista e último item das três regiões centrais. |
| Navegação presa no frame | Um link real com `target="_top"` sai do frameset. A próxima interação ocorre nos iframes da nova página. |
| Player visível sem reprodução | Um clique inicia o podcast; a resposta final da mídia deve ser 200/206 com conteúdo de áudio. O relógio deve avançar, pausar e continuar após retomar. |
| Controle de avanço sem efeito | O botão do player avança aproximadamente 15 segundos, mantendo o estado pausado. |

`tests/frames.spec.ts` contém cinco cenários; `tests/player.spec.ts`, dois. `frameLocator` mantém a seleção no documento correto e resolve o frame novamente depois da navegação. Os testes não guardam handles de elementos entre recargas.

O player usa os botões da aplicação. A leitura de `HTMLAudioElement` verifica tempo, pausa e erro; não chama `play()`, não altera `currentTime` nem substitui a resposta de rede. O download real redireciona para a CDN: o teste verifica a resposta final, não confunde o 302 intermediário com a entrega do áudio.

## Gate e investigação

O CI exige typecheck, todos os testes aprovados e JUnit válido, sem casos ignorados ou relatório vazio. `test.only` é proibido no CI. Sem retries, sleeps ou respostas simuladas.

Uma falha do site ou do provedor de áudio continua sendo uma falha da execução. Para investigar, confira primeiro o status de navegação e mídia, depois o frame/URL no trace e a expectativa do cenário. Não troque o provedor silenciosamente nem aceite `skip` como prova de funcionamento.

Em **Actions → Tests → execução → Summary**, consulte contagens e decisão do gate. O artifact `test-results` inclui JUnit, resumo e relatório HTML; falhas acrescentam screenshot e trace. Retenção de sete dias. Para uso local, `npm run report` abre o HTML. Saídas e `.env` ficam fora do Git desde o primeiro commit.

## Limites e referências

O formulário do iframe é um contador em JavaScript, sem persistência ou transação de backend. O frameset reproduz uma técnica de integração legada; não representa um sistema de cliente. O player é de áudio, sem cobertura de vídeo, DRM, publicidade, autoplay ou qualidade sonora. O YouTube existente na mesma página não faz parte do gate.

- [iFrames e contador](https://testpages.eviltester.com/pages/embedded-pages/iframes/)
- [Frameset legado](https://testpages.eviltester.com/pages/embedded-pages/frames/)
- [Host com conteúdo externo e podcast](https://testpages.eviltester.com/pages/embedded-pages/external-content/)
- [Documento interativo servido pelo site](https://testpages.eviltester.com/frame-includes/iframe-interactive.html)

São ambientes públicos de prática. A suíte usa um worker e sessões novas por cenário; não executa carga nem altera dados de outras pessoas.
