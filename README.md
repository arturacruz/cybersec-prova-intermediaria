# Oceania

Extensão Firefox (Manifest V3) desenvolvida para a Avaliação Intermediária de Cibersegurança. O projeto detecta sinais de rastreamento e armazenamento no cliente e apresenta uma pontuação de privacidade para a página atual.

## Funcionalidades implementadas

- captura de requisições realizadas pela aba;
- identificação de domínios de terceira parte;
- contagem de cabeçalhos `Set-Cookie` recebidos durante o carregamento;
- contagem de cookies não `HttpOnly` visíveis à página;
- detecção de uso de `localStorage`, `sessionStorage` e `IndexedDB`;
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
├── CHECKLIST_CONCEITO_C.md
└── MODELO_RELATORIO.md

evidencias/
├── ddg/
└── sites-reais/
```

## Limitações conhecidas

- Cookies `HttpOnly` não aparecem em `document.cookie`; o contador principal usa os cabeçalhos `Set-Cookie` observados no tráfego.
- Cookies existentes antes do carregamento não entram em "Cookies recebidos".
- A identificação do domínio registrável usa uma lista reduzida de sufixos comuns (`com.br`, `co.uk` etc.), não a Public Suffix List completa.
- `indexedDB.databases()` pode não estar disponível em versões antigas do navegador ou em contextos que bloqueiam acesso ao storage.
- O protótipo detecta e relata; ele não bloqueia requisições.

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
