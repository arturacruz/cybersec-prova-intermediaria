# Relatório de execução - Oceania

> Remova esta orientação antes de entregar. Preencha todos os campos entre colchetes e exporte o documento final como PDF.

## 1. Identificação

- Aluno: [nome completo]
- Matrícula: [matrícula]
- Repositório: [URL]
- Versão do Firefox: [versão]
- Sistema operacional: [sistema e versão]
- Data dos testes: [data]

## 2. Visão geral da ferramenta

O Oceania é uma extensão Manifest V3 para Firefox que observa o tráfego da aba, identifica domínios de terceira parte e cabeçalhos `Set-Cookie`, mede o uso de armazenamento HTML5 e apresenta uma pontuação de privacidade por página.

### 2.1 Metodologia da pontuação

A página começa com 100 pontos. São descontados 2 pontos por domínio de terceira parte (máximo 40), 1 por cookie recebido via `Set-Cookie` (máximo 25), 10 pelo uso de `localStorage`, 5 por `sessionStorage` e 10 por `IndexedDB`. O score final é limitado ao intervalo de 0 a 100.

[Explicar e justificar os pesos com suas palavras. Discutir que os sinais podem ter usos legítimos e que o score não determina, sozinho, intenção maliciosa.]

## 3. DuckDuckGo Privacy Test Pages

| Teste | Resultado esperado pela página | Resultado do Oceania | Divergência e explicação técnica | Evidência |
| --- | --- | --- | --- | --- |
| Tracker Reporting | [esperado] | [domínios, requisições, cookies e storage] | [usar tráfego observado] | Figura 1 |
| Storage Blocking | [esperado] | [resultado] | [explicação] | Figura 2 |
| Fingerprinting / Canvas | [esperado] | [resultado] | O escopo do Conceito C não instrumenta chamadas à API Canvas; o Oceania pode observar requisições e storage associados, mas não atribuir o uso do canvas a fingerprinting. [Completar conforme o teste.] | Figura 3 |

### 3.1 Tracker Reporting

[Descrever procedimento, resultado e divergências.]

![Figura 1 - Oceania no teste Tracker Reporting](../evidencias/ddg/tracker-reporting.png)

### 3.2 Storage Blocking

[Descrever procedimento, resultado e divergências. Diferenciar ausência de uso, bloqueio pelo navegador e impossibilidade de leitura.]

![Figura 2 - Oceania no teste Storage Blocking](../evidencias/ddg/storage-blocking.png)

### 3.3 Fingerprinting / Canvas

[Descrever procedimento e explicar tecnicamente os limites do plugin.]

![Figura 3 - Oceania no teste de Canvas](../evidencias/ddg/fingerprinting-canvas.png)

## 4. Análise dos sites reais

Repita esta subseção para cada um dos três sites sorteados.

### 4.1 Site N - [nome]

- URL: [URL]
- HAR: `evidencias/sites-reais/site-N/trafego.har`
- Score Oceania: [0-100]
- Blacklight: [resumo]
- uBlock Origin: [quantidade/tipos de bloqueio]

| Fonte | Domínios/rastreadores | Cookies/storage | Observações |
| --- | --- | --- | --- |
| Oceania | [resultado] | [resultado] | [resultado] |
| Blacklight | [resultado] | [resultado] | [resultado] |
| uBlock Origin | [resultado] | [não se aplica ou resultado] | [resultado] |

[Comparar os resultados. Para toda divergência citada, apontar uma requisição, cabeçalho ou ausência observável no HAR.]

![Oceania no site](../evidencias/sites-reais/site-N/oceania.png)

## 5. Comparação das pontuações

| Site | Score Oceania | Resultado Blacklight | Onde concordam | Onde divergem e por quê |
| --- | ---: | --- | --- | --- |
| [Site 1] | [score] | [resultado] | [análise] | [análise baseada em evidência] |
| [Site 2] | [score] | [resultado] | [análise] | [análise baseada em evidência] |
| [Site 3] | [score] | [resultado] | [análise] | [análise baseada em evidência] |

## 6. Limitações

- O contador principal registra `Set-Cookie` observado depois que a extensão está ativa.
- A leitura de `document.cookie` não inclui cookies `HttpOnly`.
- A identificação do domínio registrável usa uma lista reduzida de sufixos.
- O plugin não instrumenta chamadas Canvas no escopo do Conceito C.
- O plugin detecta e relata, mas não bloqueia requisições.

## 7. Conclusão

[Resumir os resultados, a efetividade da ferramenta e melhorias futuras.]
