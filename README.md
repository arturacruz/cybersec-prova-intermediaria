# Oceania

Extensão Firefox (Manifest V3) desenvolvida para a Avaliação Intermediária de Cibersegurança. A versão 2.0.0 implementa os detectores exigidos até o Conceito B.

## Funcionalidades implementadas

- captura de requisições realizadas pela aba;
- identificação de domínios de terceira parte;
- contagem de cabeçalhos `Set-Cookie` recebidos durante o carregamento;
- contagem de cookies não `HttpOnly` visíveis à página;
- detecção de `localStorage`, `sessionStorage` e `IndexedDB`, agregada entre a página principal e iframes;
- relatório por página em popup;
- pontuação de privacidade com metodologia explícita.
- classificação de cookies recebidos em primeira/terceira parte e sessão/persistentes;
- detecção de uso de APIs associadas a canvas fingerprinting;
- detecção heurística de bounce tracking, cookie sync e parâmetros de rastreamento em links.

## Instalação temporária no Firefox

1. Abra `about:debugging` no Firefox.
2. Clique em **Este Firefox**.
3. Clique em **Carregar extensão temporária**.
4. Selecione o arquivo `src/manifest.json` deste projeto.
5. Abra uma página HTTP ou HTTPS e recarregue-a.
6. Clique no ícone do Oceania para consultar o relatório.

O Firefox remove extensões temporárias quando é encerrado. Páginas privilegiadas, como `about:addons`, `about:debugging`, o visualizador interno de PDF e a loja de extensões, não permitem a execução normal de content scripts.

O pacote da extensão com `manifest.json` na raiz também está disponível em `dist/oceania-extension-2.0.0.zip`. Como extensões distribuídas fora do modo temporário precisam ser assinadas pelo Firefox, durante o desenvolvimento prefira carregar `src/manifest.json` pelo procedimento acima.

## Como obter uma medição reproduzível

1. Instale ou recarregue a extensão em `about:debugging`.
2. Abra uma nova aba com o site que será medido.
3. Abra o DevTools (`F12`) e a aba **Rede/Network**.
4. Ative **Persistir registros/Preserve log**.
5. Recarregue a página com `Ctrl+Shift+R`.
6. Aguarde pelo menos dez segundos para storages criados de forma assíncrona.
7. Abra o popup e clique em **Atualizar análise**.
8. Tire o print do popup e exporte o HAR pelo painel de rede.

Se **Zerar contadores** for usado, a página precisa ser recarregada para que as requisições e os cookies do carregamento sejam observados novamente.

## Metodologia da pontuação

Toda página começa com 100 pontos. São aplicados os seguintes descontos:

| Sinal | Desconto | Limite | Justificativa |
| --- | ---: | ---: | --- |
| Domínio de terceira parte | 2 por domínio | 40 | Mais terceiros ampliam a superfície de rastreamento e compartilhamento de dados. |
| Cookie recebido (`Set-Cookie`) | 1 por cabeçalho | 25 | Cookies podem sustentar identificação e rastreamento entre acessos. |
| Uso de `localStorage` | 10 | 10 | Armazenamento persistente pode manter identificadores no cliente. |
| Uso de `sessionStorage` | 5 | 5 | É menos persistente, mas ainda mantém estado durante a sessão. |
| Uso de `IndexedDB` | 10 | 10 | Permite armazenar volumes maiores e estruturas mais complexas. |

O resultado é limitado ao intervalo de 0 a 100. A classificação visual é: 80 a 100, risco baixo; 50 a 79, risco médio; e 0 a 49, risco alto.

A pontuação mede sinais técnicos observáveis, não prova intenção maliciosa. Um domínio terceiro pode ser funcional (CDN, fonte ou pagamento), e um storage pode ser necessário para preferências legítimas. Essa limitação deve ser discutida na comparação com o Blacklight.

## Estrutura do projeto

```text
src/
├── background/background.js
├── content/oceania.js
├── icons/
├── popup/
└── manifest.json

docs/
├── CONCEITO_B.md
├── CHECKLIST_CONCEITO_C.md
├── MODELO_RELATORIO.md
└── RELATORIO.md

evidencias/
├── ddg/
└── sites-reais/
```

## Limitações conhecidas

- Cookies `HttpOnly` não aparecem em `document.cookie`; o contador principal usa os cabeçalhos `Set-Cookie` observados no tráfego.
- Cookies existentes antes do carregamento não entram em "Cookies recebidos".
- Resultados de storage são agregados por origem; frames que compartilham a mesma origem não são somados em duplicidade.
- A identificação do domínio registrável usa uma lista reduzida de sufixos comuns (`com.br`, `co.uk` etc.), não a Public Suffix List completa.
- `indexedDB.databases()` pode não estar disponível em versões antigas do navegador ou em contextos que bloqueiam acesso ao storage.
- O protótipo detecta e relata; ele não bloqueia requisições.
- A detecção de Canvas informa o uso de APIs de leitura/exportação; ela não prova, isoladamente, intenção de rastrear.
- Bounce tracking e cookie sync são detectados por redirecionamentos entre sites, parâmetros identificadores e reutilização de valores observados em cookies; técnicas ofuscadas podem não ser detectadas.
- O protótipo identifica parâmetros de rastreamento clicados, mas não os remove da URL.

## Conceito B

O procedimento de validação, os resultados esperados e o texto-base do relatório estão em `docs/CONCEITO_B.md`. As páginas adicionais do DuckDuckGo devem ser executadas no Firefox oficial para produzir os prints reais da entrega.

## Validação técnica

```bash
python -m json.tool src/manifest.json
node --check src/background/background.js
node --check src/content/oceania.js
node --check src/popup/popup.js
node tests/package.test.js
node tests/background.test.js
```

Depois valide o comportamento no Firefox com `docs/CHECKLIST_CONCEITO_C.md`.

As evidências verificadas dos testes DDG, Wikipedia, gov.br e Monkeytype estão em `evidencias/`. O texto completo da análise está em `docs/RELATORIO.md`. Antes da entrega, preencha a identificação, repita as medições no Firefox oficial e exporte o relatório para PDF.
