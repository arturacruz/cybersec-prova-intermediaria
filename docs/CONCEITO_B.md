# Validação e texto-base - Conceito B

## 1. Funcionalidades acrescentadas

A versão 2.0.0 do Oceania mantém todos os recursos do Conceito C e acrescenta:

- classificação dos cookies recebidos em primeira ou terceira parte;
- classificação dos cookies recebidos em sessão ou persistentes;
- instrumentação das APIs de Canvas no contexto JavaScript da página;
- observação de redirecionamentos entre sites e identificadores em parâmetros de URL;
- correlação entre valores recebidos em cookies e valores enviados a outros domínios, como indício de cookie sync;
- identificação de parâmetros conhecidos de rastreamento, como `utm_source`, `gclid` e `fbclid`, nos links acionados pelo usuário.

Os sinais avançados são apresentados separadamente no popup. Eles não modificam a fórmula de score usada nas evidências anteriores, garantindo que os resultados do Conceito C permaneçam comparáveis.

## 2. Como instalar a versão B

1. Abra o Firefox oficial.
2. Acesse `about:debugging`.
3. Selecione **Este Firefox**.
4. Remova ou recarregue a versão anterior do Oceania.
5. Clique em **Carregar extensão temporária**.
6. Selecione `src/manifest.json`.
7. Confirme que a versão exibida é `2.0.0` e que não existem erros no console da extensão.

## 3. Protocolo para cada página do DuckDuckGo

Use a página inicial oficial: <https://privacy-test-pages.site/>.

Para cada teste:

1. use uma aba nova;
2. deixe o uBlock Origin desativado durante a medição do Oceania;
3. abra DevTools > Rede e ative **Persistir registros**;
4. recarregue normalmente, sem `Ctrl+Shift+R` no teste de Storage Partitioning;
5. execute o botão ou link oferecido pela página;
6. aguarde dez segundos;
7. abra o Oceania e clique em **Update analysis**;
8. capture a página, o popup e a parte relevante do DevTools no mesmo print;
9. salve o arquivo usando o nome indicado abaixo.

## 4. Testes adicionais obrigatórios

### 4.1 Fingerprinting canvas verification

URL: <https://privacy-test-pages.site/privacy-protections/fingerprinting/canvas.html>

Arquivo sugerido: `evidencias/ddg-b/fingerprinting-canvas-b.png`.

**Resultado esperado pela página:** a página executa verificações de correção e desempenho de renderização por Canvas.

**Resultado esperado no Oceania:** `Canvas fingerprint` deve aparecer como `DETECTED`, acompanhado de uma ou mais APIs, como `canvas.toDataURL`, `canvas2d.getImageData`, `canvas.toBlob` ou `canvas2d.measureText`.

**Texto para o relatório:**

> O Oceania detectou chamadas de leitura, exportação ou medição do Canvas realizadas pela página. O resultado demonstra que a superfície técnica usada em fingerprinting foi acessada. A detecção não afirma, isoladamente, intenção maliciosa, pois as mesmas APIs também são utilizadas para desenho, gráficos e processamento legítimo de imagens. A página do DuckDuckGo avalia ainda a correção e o desempenho da proteção do navegador, enquanto o Oceania registra a ocorrência das chamadas; por isso, os resultados possuem objetivos diferentes.

### 4.2 Bounce Tracking

URL: <https://privacy-test-pages.site/privacy-protections/bounce-tracking/>

Arquivo sugerido: `evidencias/ddg-b/bounce-tracking.png`.

**Procedimento:** clique em um dos links que passa por `bad.third-party.site`. Depois de chegar ao destino, abra o popup.

**Resultado esperado pela página:** a navegação passa por `bad.third-party.site`, que encaminha seu UID local ao destino usando um parâmetro de URL.

**Resultado esperado no Oceania:** `Bounce tracking` deve aparecer como `DETECTED`; os detalhes devem apresentar os domínios envolvidos e, quando disponível, o nome do parâmetro identificador.

**Texto para o relatório:**

> O Oceania observou uma cadeia de navegação entre domínios registráveis diferentes. O redirecionador intermediário encaminhou um parâmetro com características de identificador ao destino, satisfazendo a heurística de bounce tracking. A extensão registra o fluxo e os domínios, mas não remove o parâmetro nem impede a navegação. Se a proteção do Firefox eliminar o parâmetro antes da requisição, o Oceania poderá registrar a troca de domínios sem confirmar o identificador; essa divergência decorre da ordem em que a proteção do navegador e o `webRequest` processam a URL.

### 4.3 Query Parameters

URL: <https://privacy-test-pages.site/privacy-protections/query-parameters/>

Arquivo sugerido: `evidencias/ddg-b/query-parameters.png`.

**Procedimento:** execute separadamente os links com `utm_source`, `utm_medium` e `fbclid`.

**Resultado esperado pela página:** os parâmetros de rastreamento são removidos e os parâmetros funcionais permanecem. A própria página apresenta o valor esperado para cada link.

**Resultado esperado no Oceania:** `Tracking query parameters` deve aparecer como `DETECTED`, com os nomes observados antes da navegação.

**Texto para o relatório:**

> O Oceania identificou parâmetros conhecidos de rastreamento no link acionado, antes da navegação. O Firefox pode remover alguns parâmetros e preservar outros conforme sua própria lista de proteção. Assim, a página avalia se o navegador reescreveu corretamente a URL, enquanto o Oceania informa que o link original continha material de rastreamento. A extensão não altera a URL; ela apenas registra os nomes dos parâmetros, sem armazenar seus valores no relatório apresentado ao usuário.

### 4.4 Tracker Blocking

URL: <https://privacy-test-pages.site/privacy-protections/request-blocking/>

Arquivo sugerido: `evidencias/ddg-b/tracker-blocking.png`.

**Resultado esperado pela página:** requisições para `bad.third-party.site` falham quando uma solução de bloqueio contém esse domínio em sua lista.

**Resultado esperado no Oceania:** o domínio e suas tentativas de requisição devem aparecer em **Observed third-party domains**, mas os recursos podem carregar porque o Oceania é um detector, não um bloqueador.

**Texto para o relatório:**

> A página esperava o bloqueio das requisições direcionadas a `bad.third-party.site`. O Oceania observou o domínio e contabilizou as tentativas, mas não bloqueou os recursos. A divergência é funcional e verificável no painel de rede: o teste mede capacidade de bloqueio, enquanto o escopo do Conceito B exige detecção e apresentação. O bloqueio personalizado aparece somente nos requisitos do Conceito A.

### 4.5 Storage Partitioning

URL: <https://privacy-test-pages.site/privacy-protections/storage-partitioning/>

Arquivo sugerido: `evidencias/ddg-b/storage-partitioning.png`.

**Atenção:** não mantenha outra cópia do teste aberta e não use recarga forçada, pois a própria página informa que isso pode invalidar os resultados relacionados a Service Workers.

**Resultado esperado pela página:** indicar quais APIs de armazenamento estão particionadas ou bloqueadas entre origens.

**Resultado esperado no Oceania:** apresentar os storages usados em cada origem/frame. O Oceania pode comprovar a existência do storage, mas não compara a mesma origem terceira sob dois top-level sites e, portanto, não afirma sozinho que o armazenamento foi particionado.

**Texto para o relatório:**

> A página do DuckDuckGo realizou o teste de isolamento do armazenamento entre contextos de primeira e terceira parte. O Oceania registrou `localStorage`, `sessionStorage` e IndexedDB por origem e agregou frames sem duplicar a mesma origem. Entretanto, detectar a presença de dados não equivale a provar particionamento: essa confirmação exige comparar a mesma origem terceira sob top-level sites diferentes. Por isso, o resultado da própria página foi utilizado como referência para o particionamento, enquanto o popup confirmou quais mecanismos de storage foram efetivamente acessíveis durante a execução.

## 5. Classificação de cookies

O popup apresenta quatro contadores:

| Categoria | Regra usada |
| --- | --- |
| First-party session | `Set-Cookie` recebido do mesmo domínio registrável, sem `Expires` e sem `Max-Age`. |
| First-party persistent | Mesmo domínio registrável, com `Expires` ou `Max-Age`. |
| Third-party session | Domínio registrável diferente, sem `Expires` e sem `Max-Age`. |
| Third-party persistent | Domínio registrável diferente, com `Expires` ou `Max-Age`. |

Texto sugerido:

> A classificação considera o host da resposta que enviou `Set-Cookie` e o domínio registrável da página principal. Cookies com `Expires` ou `Max-Age` são classificados como persistentes; na ausência desses atributos, são classificados como cookies de sessão. O contador representa cabeçalhos observados durante a captura, não o estoque completo de cookies já existente no perfil.

## 6. Reconciliação individual dos três sites

O Conceito B exige que cada diferença seja explicada individualmente. A tabela abaixo contém todos os terceiros identificados nominalmente nas evidências locais. O relatório resumido do Blacklight não expõe os nomes dos 34 trackers do Monkeytype nem o nome do único tracker do gov.br; abra os detalhes do Blacklight e acrescente esses nomes antes da entrega.

### Wikipedia

| Item | Oceania/HAR | uBlock | Blacklight | Explicação |
| --- | --- | --- | --- | --- |
| Tráfego terceiro | Não observado | Nenhum bloqueio de rede | 0 ad trackers | As três fontes concordam quanto à ausência de rastreadores de rede na captura. |
| 4 cookies terceiros do Blacklight | Não aparecem no HAR | Não aparecem no logger | Relatados somente pelo Blacklight | O Blacklight utilizou outra sessão/ambiente; sem nomes e requisições correspondentes no HAR, não é possível atribuí-los ao carregamento local. |

### gov.br

| Domínio/sinal | Oceania/HAR | uBlock | Blacklight | Explicação técnica |
| --- | --- | --- | --- | --- |
| `agenciagov.ebc.com.br` | Terceiro | Scriptlet neutralizou função de Analytics | Verificar detalhes | Subdomínio de outra entidade registrável; o uBlock atuou em código específico, não necessariamente na requisição inteira. |
| `barra.sistema.gov.br` | Terceiro | Sem bloqueio nominal | Verificar detalhes | Serviço governamental funcional, mas terceiro em relação a `www.gov.br` pela regra de domínio registrável. |
| `browser-update.org` | Terceiro | Bloqueado | Verificar detalhes | Concordância entre observação e bloqueio; status 0 no HAR é compatível com cancelamento/bloqueio. |
| `cdn.jsdelivr.net` | Terceiro | Sem bloqueio nominal | Verificar detalhes | CDN funcional; ser terceiro não prova rastreamento. |
| `cdnjs.cloudflare.com` | Terceiro | Sem bloqueio nominal | Verificar detalhes | CDN funcional; diferença decorre do critério amplo do Oceania. |
| `s.go-mpulse.net` | Terceiro | Bloqueado | Verificar detalhes | Endpoint de medição de desempenho/telemetria reconhecido por lista do uBlock. |
| `vlibras.gov.br` | Terceiro | Sem bloqueio nominal | Verificar detalhes | Recurso de acessibilidade servido por domínio registrável diferente. |
| `www.googletagmanager.com` | Terceiro | Bloqueado/redirecionado | Verificar detalhes | Infraestrutura de tags/analytics; Oceania observa a tentativa e o uBlock aplica regra de filtro. |

### Monkeytype

| Domínio/sinal | Oceania/HAR | uBlock | Blacklight | Explicação técnica |
| --- | --- | --- | --- | --- |
| `api.github.com` | Terceiro | Sem bloqueio nominal | Verificar detalhes | API funcional externa; não é automaticamente um tracker. |
| `cdn.intergient.com` | Terceiro | Bloqueado | Verificar detalhes | Recurso publicitário; concordância entre observação do Oceania e filtro do uBlock. |
| `firebase.googleapis.com` | Terceiro | Sem bloqueio nominal | Verificar detalhes | Serviço externo de aplicação; terceiro não implica rastreamento. |
| endpoint do Sentry | Terceiro | Bloqueado | Verificar detalhes | Telemetria/erros; as requisições POST com status 0 no HAR coincidem com o logger. |
| `www.google.com` | Terceiro | Sem bloqueio nominal | Verificar detalhes | Dependência Google observada no tráfego; é necessário conferir a categoria específica do Blacklight. |
| `www.googletagmanager.com` | Terceiro | Bloqueado/redirecionado | Google Analytics relatado | Concordância sobre infraestrutura de analytics; o uBlock impediu sua execução completa localmente. |
| `www.gstatic.com` | Terceiro | Sem bloqueio nominal | Verificar detalhes | Recurso estático Google, que pode ser funcional e não classificado individualmente como tracker. |
| 34 ad trackers/21 cookies do Blacklight | Apenas 7 domínios e 0 `Set-Cookie` na captura protegida | Intergient, GTM e Sentry bloqueados | Relatados | O Blacklight executou o site sem os mesmos bloqueios. Para cumprir literalmente o item “cada rastreador”, anexar a lista expandida e criar uma linha para cada nome adicional. |

## 7. Checklist final do Conceito B

- [x] Tudo do Conceito C preservado no código.
- [x] Cookies classificados por parte e duração.
- [x] Detector de Canvas implementado.
- [x] Detector heurístico de bounce tracking implementado.
- [x] Detector heurístico de cookie sync implementado.
- [x] Detector de parâmetros de rastreamento implementado.
- [x] Testes automatizados do pacote e da lógica de background.
- [ ] Print do Canvas com a versão 2.0.0 no Firefox.
- [ ] Print de Bounce Tracking no Firefox.
- [ ] Print de Query Parameters no Firefox.
- [ ] Print de Tracker Blocking no Firefox.
- [ ] Print de Storage Partitioning no Firefox.
- [ ] Detalhes nominais do Blacklight para gov.br e Monkeytype.
- [ ] Relatório final atualizado e exportado para PDF.
