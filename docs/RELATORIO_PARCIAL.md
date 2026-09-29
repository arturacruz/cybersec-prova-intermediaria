# Relatório de execução - Oceania

> Documento parcialmente preenchido em 28/09/2026. Antes da entrega, substituir os campos entre colchetes, acrescentar os outros dois sites reais e exportar a versão final para PDF.

## 1. Identificação e ambiente

- Aluno: [nome completo]
- Matrícula: [matrícula]
- Repositório: [URL do repositório]
- Extensão: Oceania 1.1.1, Manifest V3
- Sistema operacional: Windows
- Navegador registrado no HAR atual: Zen 1.22.3b
- Data das medições: 28/09/2026

**Pendência de conformidade:** o enunciado solicita execução no Firefox. O Zen é derivado do Firefox, mas não deve ser apresentado como se fosse o Firefox oficial. Antes da entrega, as medições finais e os arquivos HAR devem ser repetidos no Firefox e a versão exata deve ser registrada nesta seção.

## 2. Objetivo e funcionamento

O Oceania é uma extensão Manifest V3 que produz um relatório de privacidade para a aba atual. O script de background observa as requisições de rede, identifica domínios de terceira parte e conta cabeçalhos `Set-Cookie` recebidos. O content script verifica `localStorage`, `sessionStorage` e `IndexedDB` no documento principal e nos seus frames. O popup agrega os resultados por origem, evitando somar duas vezes frames que compartilham a mesma origem.

A classificação como terceira parte é feita comparando o domínio registrável da página principal com o domínio de cada requisição. Essa classificação indica separação de origem, mas não prova que o recurso seja um rastreador: CDNs, fontes, pagamentos e outros componentes funcionais também podem ser servidos por terceiros.

## 3. Metodologia da pontuação

Cada página começa com 100 pontos. O Oceania aplica os seguintes descontos:

| Sinal observado | Desconto | Limite | Justificativa |
| --- | ---: | ---: | --- |
| Domínio de terceira parte | 2 pontos por domínio | 40 | Mais terceiros ampliam as possibilidades de compartilhamento de dados. |
| Cookie recebido por `Set-Cookie` | 1 ponto por cabeçalho | 25 | Cookies podem manter identificadores entre requisições e acessos. |
| Uso de `localStorage` | 10 pontos | 10 | O armazenamento persistente pode manter identificadores no cliente. |
| Uso de `sessionStorage` | 5 pontos | 5 | Mantém estado durante a sessão, com persistência menor. |
| Uso de `IndexedDB` | 10 pontos | 10 | Permite armazenar estruturas e volumes de dados mais complexos. |

A fórmula utilizada é:

```text
score = max(0,
  100
  - min(40, 2 × domínios terceiros)
  - min(25, cookies recebidos)
  - 10 se localStorage for usado
  - 5 se sessionStorage for usado
  - 10 se IndexedDB for usado
)
```

Scores entre 80 e 100 são classificados como risco baixo; entre 50 e 79, risco médio; e abaixo de 50, risco alto. O score é um indicador comparativo baseado em sinais técnicos, não uma afirmação de que o site possui comportamento malicioso.

## 4. DuckDuckGo Privacy Test Pages

Os testes foram executados com o popup do Oceania aberto e o DevTools visível. A própria página de teste foi usada como fonte do resultado esperado.

| Teste | Resultado reportado pela página | Resultado do Oceania | Avaliação |
| --- | --- | --- | --- |
| Tracker Reporting | Um rastreador principal carregado por `script src`. | 1 domínio terceiro (`doubleclick.net`), 1 requisição terceira, 0 cookies recebidos e score 93. | O domínio foi detectado corretamente. A requisição apareceu como bloqueada pela proteção do navegador, mas ainda foi observada pelo `webRequest`. |
| Storage Blocking | Número aleatório armazenado usando 23 mecanismos; 1 mecanismo falhou. | 3 domínios terceiros, 23 requisições terceiras, 7 cookies recebidos, `localStorage` em 3 origens/3 itens, `sessionStorage` em 3 origens/6 itens, `IndexedDB` em 3 origens/3 bancos e score 62. | O Oceania detectou os três tipos de storage exigidos e agregou os frames por origem. O total de 23 da página inclui mecanismos fora do escopo do Conceito C. |
| Fingerprinting/Canvas | A página executou verificações de resistência e desempenho do canvas, apresentando resultados `pass` e `fail`. | 1 domínio terceiro (`cdnjs.cloudflare.com`), 1 requisição terceira, 0 cookies recebidos, uso dos três storages e score 73. | O Oceania não instrumenta as chamadas de Canvas; ele observou somente tráfego e storage associados. Essa limitação é esperada no escopo do Conceito C. |

### 4.1 Tracker Reporting

A página informou o carregamento de um rastreador conhecido por meio de `script src`. O Oceania encontrou uma requisição para `doubleclick.net`, domínio diferente de `first-party.site`, classificando-a como terceira parte. O painel de rede mostrou que a tentativa foi bloqueada pela proteção de rastreamento do navegador. Por isso, a extensão registrou a tentativa de conexão, mas nenhum cookie foi recebido.

O score foi conferido manualmente: 100 menos 2 pontos por um domínio terceiro e menos 5 pontos pelo uso de `sessionStorage`, resultando em 93.

![Figura 1 - Tracker Reporting com Oceania e painel de rede](../evidencias/ddg/tracker-reporting.png)

### 4.2 Storage Blocking

A página conseguiu armazenar o número aleatório por 23 mecanismos, com uma falha. O Oceania identificou três origens usando `localStorage`, três usando `sessionStorage` e três instâncias de IndexedDB. Em `sessionStorage`, as três origens continham um total de seis itens. Isso não representa Cache Storage: o número corresponde à soma das chaves de `sessionStorage` observadas nas origens.

O painel Storage do navegador organiza os dados principalmente por origem e não apresenta necessariamente a mesma contagem do popup. Além disso, os 23 mecanismos da página incluem cookies, Cache API, CookieStore e outros recursos que o Oceania não contabiliza como `localStorage`, `sessionStorage` ou `IndexedDB`.

O score 62 também foi confirmado: 6 pontos por três domínios terceiros, 7 pelos cookies recebidos, 10 por `localStorage`, 5 por `sessionStorage` e 10 por IndexedDB. A dedução total foi 38.

![Figura 2 - Storage Blocking com dados agregados por origem](../evidencias/ddg/storage-blocking.png)

### 4.3 Fingerprinting/Canvas

A página executou comparações dos pixels e medições de desempenho do canvas. Alguns testes de resistência falharam e os testes de desempenho apresentados passaram. O Oceania não afirma ter detectado canvas fingerprinting, pois a versão desenvolvida para o Conceito C não intercepta métodos como `getImageData()` ou `toDataURL()`.

A extensão detectou uma requisição para `cdnjs.cloudflare.com` e identificou uso dos três storages na origem principal. O resultado demonstra uma limitação importante: tráfego e armazenamento relacionados à página podem ser observados, mas isso não basta para atribuir tecnicamente a leitura do canvas a uma tentativa de fingerprinting.

![Figura 3 - Teste de Fingerprinting/Canvas com Oceania](../evidencias/ddg/fingerprinting-canvas.png)

## 5. Site real 1 - Wikipedia

### 5.1 Procedimento

Foi analisada a página `https://www.wikipedia.org/`. O log de rede foi preservado e exportado no formato HAR. Também foram registrados o popup do Oceania, o relatório do Blacklight e o logger do uBlock Origin.

### 5.2 Resultado do Oceania

O Oceania apresentou score 85, classificado como risco baixo. Não foram encontrados domínios nem requisições de terceira parte e nenhum cabeçalho `Set-Cookie` foi recebido durante a captura. A página possuía dois cookies legíveis por `document.cookie`, um item em `localStorage`, três itens em `sessionStorage` e nenhum IndexedDB detectado.

O cálculo foi: 100 menos 10 pontos por `localStorage` e menos 5 por `sessionStorage`, resultando em 85.

![Figura 4 - Wikipedia analisada pelo Oceania](../evidencias/sites-reais/site-1-wikipedia/oceania.png)

### 5.3 Análise do HAR

O arquivo HAR contém cinco requisições `GET`, todas para `www.wikipedia.org`: o documento principal, dois scripts, o ícone e uma imagem. Foram registrados quatro status 200 e um status 304. Não existe domínio de terceira parte no arquivo e nenhuma resposta contém `Set-Cookie`, confirmando as contagens de terceiros e cookies recebidos apresentadas pelo Oceania.

O HAR contém cinco nomes únicos de cookies enviados nas requisições: `GeoIP`, `NetworkProbeLimit`, `WMF-Last-Access`, `WMF-Last-Access-Global` e `WMF-Uniq`. Esses cookies já existiam antes da captura; portanto, não aparecem no contador de cookies recebidos, que mede somente novos cabeçalhos `Set-Cookie`. O popup conseguiu ler dois cookies pela API `document.cookie`. A diferença em relação aos cinco enviados na rede pode ser explicada por atributos como `HttpOnly`, domínio e caminho, que restringem a visibilidade para JavaScript.

Arquivo analisado: [`trafego.har`](../evidencias/sites-reais/site-1-wikipedia/trafego.har).

### 5.4 Resultado do Blacklight

O Blacklight não encontrou ad trackers, evasão de bloqueadores de cookies, gravação de sessão, captura de teclas, Facebook Pixel, TikTok Pixel, X Pixel ou audiência de remarketing do Google Analytics. Entretanto, relatou quatro cookies de terceira parte.

Esse resultado diverge da captura local: o HAR não contém requisições de terceira parte, enquanto o Blacklight executa a página em outro navegador automatizado e em outra sessão. Conteúdo condicional, localização, cookies preexistentes, proteção do navegador e diferenças no modo de interação podem produzir respostas distintas. Como os quatro cookies do Blacklight não aparecem no HAR local, não há evidência para atribuí-los ao mesmo carregamento observado pelo Oceania.

![Figura 5 - Resultado do Blacklight para Wikipedia](../evidencias/sites-reais/site-1-wikipedia/blacklight.png)

### 5.5 Resultado do uBlock Origin

O logger do uBlock registrou somente requisições para `www.wikipedia.org`. Não há linha de requisição de rede bloqueada nem domínio terceiro no registro apresentado. O logger mostra atividade de filtros cosméticos/scriptlets, incluindo uma exceção `generichide`, mas isso não representa o bloqueio de um rastreador de rede.

Nesse carregamento, o uBlock e o Oceania concordaram quanto à ausência de tráfego de terceiros. A concordância também é sustentada pelo HAR, que contém somente o domínio principal.

![Figura 6 - Logger do uBlock Origin na Wikipedia](../evidencias/sites-reais/site-1-wikipedia/ublock-logger.png)

### 5.6 Reconciliação

| Fonte | Resultado principal | Concordâncias | Divergências e explicação |
| --- | --- | --- | --- |
| Oceania | 0 domínios terceiros; 0 cookies recebidos; score 85. | Concorda com HAR e uBlock sobre ausência de terceiros. | Leu 2 cookies por JavaScript, enquanto o HAR enviou 5 nomes de cookies já existentes. |
| HAR | 5 requisições, todas para `www.wikipedia.org`; 0 `Set-Cookie`. | Confirma os contadores de terceiros e cookies recebidos do Oceania. | Contém 5 cookies de requisição porque registra também cookies não visíveis por `document.cookie`. |
| Blacklight | 0 ad trackers; 4 cookies de terceira parte; demais categorias negativas. | Concorda que não foram encontrados ad trackers e outras técnicas invasivas listadas. | Os quatro cookies terceiros não aparecem no HAR local; a medição foi feita em outro ambiente automatizado. |
| uBlock Origin | 0 requisições de rede bloqueadas no logger apresentado. | Concorda com Oceania e HAR sobre ausência de tráfego terceiro. | Houve atividade de filtros cosméticos/scriptlets, que não equivale a bloqueio de rede. |

## 6. Sites reais restantes

### 6.1 Site 2 - [nome e URL]

[Executar o mesmo procedimento e inserir Oceania, HAR, Blacklight e uBlock.]

### 6.2 Site 3 - [nome e URL]

[Executar o mesmo procedimento e inserir Oceania, HAR, Blacklight e uBlock.]

## 7. Comparação final dos três sites

| Site | Score Oceania | Blacklight | uBlock Origin | Síntese |
| --- | ---: | --- | --- | --- |
| Wikipedia | 85 | 0 ad trackers; 4 cookies terceiros | 0 bloqueios de rede observados | Baixo tráfego e apenas armazenamento first-party no teste local. |
| [Site 2] | [score] | [resultado] | [resultado] | [análise] |
| [Site 3] | [score] | [resultado] | [resultado] | [análise] |

## 8. Limitações

- O contador de cookies recebidos considera cabeçalhos `Set-Cookie` observados depois que a extensão iniciou a captura; cookies preexistentes não entram nesse contador.
- `document.cookie` não expõe cookies marcados como `HttpOnly`.
- A classificação por domínio terceiro não determina, sozinha, que o recurso seja um rastreador.
- O protótipo não intercepta APIs de Canvas e, portanto, não detecta diretamente canvas fingerprinting.
- A identificação do domínio registrável usa uma lista reduzida de sufixos comuns, não uma Public Suffix List completa.
- O Blacklight executa o site em um ambiente diferente, de modo que seus resultados não precisam reproduzir exatamente o HAR local.
- As evidências atuais foram capturadas no Zen 1.22.3b e devem ser repetidas no Firefox para atendimento literal ao enunciado.

## 9. Conclusão parcial

Os testes padronizados demonstraram que o Oceania identifica requisições de terceira parte, cookies recebidos e uso dos três mecanismos de armazenamento exigidos para o Conceito C. A análise da Wikipedia mostrou coerência entre Oceania, HAR e uBlock quanto à ausência de tráfego de terceiros no carregamento observado. As divergências com o Blacklight e entre os diferentes contadores de cookies puderam ser explicadas pelo escopo de cada ferramenta e pelas diferenças entre ambientes de execução.

A conclusão final será completada após a execução dos outros dois sites reais no Firefox.
