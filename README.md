# Oceania

Extensão para Firefox, desenvolvida em Manifest V3 para a Avaliação Intermediária de Cibersegurança. O projeto detecta sinais de rastreamento e armazenamento no cliente e apresenta uma pontuação de privacidade para a página atual.

## Funcionalidades implementadas

- captura de requisições realizadas pela aba;
- identificação de domínios de terceira parte;
- contagem de cabeçalhos `Set-Cookie` recebidos durante o carregamento;
- contagem de cookies não `HttpOnly` visíveis à página;
- detecção de `localStorage`, `sessionStorage` e `IndexedDB`, agregada entre a página principal e iframes;
- relatório por página em popup;
- pontuação de privacidade com metodologia explícita.

## Instalação temporária no Firefox

1. Abra `about:debugging` no Firefox.
2. Clique em **Este Firefox**.
3. Clique em **Carregar extensão temporária**.
4. Selecione o arquivo `src/manifest.json` deste projeto.
5. Abra uma página HTTP ou HTTPS e recarregue-a.
6. Clique no ícone do Oceania para consultar o relatório.

O Firefox remove extensões temporárias quando é encerrado. Páginas privilegiadas, como `about:addons`, `about:debugging`, o visualizador interno de PDF e a loja de extensões, não permitem a execução normal de content scripts.

## Como obter uma medição reproduzível

1. Instale ou recarregue a extensão em `about:debugging`.
2. Abra uma nova aba com o site que será medido.
3. Abra o DevTools (`F12`) e selecione a aba **Rede/Network**.
4. Ative **Persistir registros/Preserve log**.
5. Recarregue a página com `Ctrl+Shift+R`.
6. Aguarde pelo menos dez segundos para a criação assíncrona de storages.
7. Abra o popup e clique em **Refresh analysis**.
8. Registre o popup e exporte o HAR pelo painel de rede.

Se **Reset counters** for utilizado, a página precisa ser recarregada para que as requisições e os cookies do carregamento sejam observados novamente.

Para obter uma medição-base, execute a primeira captura sem o uBlock Origin. Ative-o separadamente apenas para registrar os recursos bloqueados e comparar os resultados.

## Metodologia da pontuação

Toda página começa com 100 pontos. São aplicados os seguintes descontos:

| Sinal | Desconto | Limite | Justificativa |
| --- | ---: | ---: | --- |
| Domínio de terceira parte | 2 por domínio | 40 | Mais terceiros ampliam a superfície de rastreamento e compartilhamento de dados. |
| Cookie recebido (`Set-Cookie`) | 1 por cabeçalho | 25 | Cookies podem sustentar identificação e rastreamento entre acessos. |
| Uso de `localStorage` | 10 | 10 | Armazenamento persistente pode manter identificadores no cliente. |
| Uso de `sessionStorage` | 5 | 5 | É menos persistente, mas ainda mantém estado durante a sessão. |
| Uso de `IndexedDB` | 10 | 10 | Permite armazenar volumes maiores e estruturas mais complexas. |

O resultado é limitado ao intervalo de 0 a 100. A classificação visual é:

- 80 a 100: risco baixo;
- 50 a 79: risco médio;
- 0 a 49: risco alto.

A pontuação mede sinais técnicos observáveis e não prova intenção maliciosa. Um domínio terceiro pode ser funcional, como uma CDN, fonte ou serviço de acessibilidade, e o armazenamento pode ser necessário para preferências legítimas.

## Estrutura do projeto

```text
src/
├── background/
│   └── background.js
├── content/
│   └── oceania.js
├── icons/
├── popup/
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
└── manifest.json

docs/
└── RELATORIO.md

evidencias/
├── ddg/
├── sites-reais/
└── VALIDACAO.md
```

## Evidências e relatório

As evidências dos testes do DuckDuckGo e das análises da Wikipedia, do gov.br e do Monkeytype estão em `evidencias/`. Cada análise utiliza os resultados do Oceania e, conforme o caso, arquivos HAR, Blacklight e registros do uBlock Origin.

O relatório completo, incluindo a metodologia, a comparação entre ferramentas, as limitações e a conclusão, está em `docs/RELATORIO.md`.

## Limitações conhecidas

- Cookies `HttpOnly` não aparecem em `document.cookie`; o contador principal usa os cabeçalhos `Set-Cookie` observados no tráfego.
- Cookies existentes antes do carregamento não entram em **Cookies received**.
- Os resultados de storage são agregados por origem; frames que compartilham a mesma origem não são somados em duplicidade.
- A identificação do domínio registrável usa uma lista reduzida de sufixos comuns, como `com.br` e `co.uk`, e não uma Public Suffix List completa.
- `indexedDB.databases()` pode não estar disponível em versões antigas do navegador ou em contextos que bloqueiam acesso ao storage.
- O protótipo detecta e relata sinais técnicos; ele não bloqueia requisições.
- O protótipo não intercepta diretamente APIs de Canvas e, portanto, não afirma detectar canvas fingerprinting.

## Validação antes da entrega

- carregar a extensão pelo `src/manifest.json` no Firefox oficial;
- confirmar que o popup abre sem erros em `about:debugging`;
- conferir se os resultados aparecem após recarregar a página;
- verificar se os arquivos e imagens referenciados em `docs/RELATORIO.md` estão disponíveis no repositório;
- preencher a identificação exigida e exportar o relatório final para PDF, caso solicitado.
