# Checklist de entrega - Conceito C

## Plugin

- [x] Manifest V3 válido e popup configurado.
- [x] Detecção e apresentação de conexões a domínios de terceira parte.
- [x] Contagem de cookies recebidos durante o carregamento.
- [x] Detecção de `localStorage`, `sessionStorage` e `IndexedDB`.
- [x] Pontuação de privacidade com critérios e pesos documentados.
- [ ] Testar no Firefox usado na apresentação/entrega.
- [ ] Confirmar que o popup não mostra erros em `about:debugging` > **Inspecionar**.

## DuckDuckGo Privacy Test Pages

- [x] Tracker Reporting capturado e analisado.
- [x] Storage Blocking capturado e analisado.
- [x] Fingerprinting/Canvas capturado e analisado.

Executar pelo menos Tracker Reporting, Storage Blocking e Fingerprinting/Canvas. Em cada teste, registrar o esperado pelo DDG, o resultado do Oceania, a explicação da divergência e um print do popup.

1. Recarregar o Oceania em `about:debugging`.
2. Abrir a página de teste em uma aba nova.
3. Abrir o DevTools e preservar o log de rede.
4. Recarregar com `Ctrl+Shift+R`.
5. Esperar dez segundos e atualizar o popup.
6. Capturar o popup e a parte relevante da página de teste.
7. Preencher a tabela em `docs/MODELO_RELATORIO.md`.

## Três sites reais

Progresso: Wikipedia, gov.br e Monkeytype foram capturados e analisados. Os HARs identificam Zen 1.22.3b e precisam ser repetidos no Firefox para conformidade literal. Nas capturas de gov.br e Monkeytype, os mecanismos de bloqueio estavam ativos e essa condição está registrada no relatório.

Repetir para cada site sorteado pelo professor:

- [x] Registrar nome, URL, data/hora, navegador e sistema operacional.
- [ ] Limpar dados do site ou registrar que a medição usa perfil limpo.
- [ ] Abrir DevTools > Rede e ativar **Persistir registros**.
- [ ] Recarregar a página e aguardar dez segundos.
- [x] Exportar o HAR para `evidencias/sites-reais/site-N/trafego.har`.
- [x] Salvar print do Oceania como `oceania.png`.
- [x] Salvar ou capturar o resultado do Blacklight.
- [x] Registrar os bloqueios do uBlock Origin.
- [x] Aplicar e conferir manualmente o score do Oceania.
- [x] Explicar diferenças com base no HAR e no comportamento observado.

## Repositório e relatório

- [x] Histórico Git preservado e novos commits incrementais criados.
- [x] Instruções de carregamento via `about:debugging`.
- [ ] Enviar o repositório para o Git remoto usado na disciplina.
- [ ] Substituir todos os campos entre colchetes no modelo de relatório.
- [x] Inserir os prints DDG e Wikipedia já recebidos, legíveis e legendados.
- [x] Anexar os três HARs no repositório.
- [ ] Exportar o relatório final como PDF.
- [ ] Conferir que o link do repositório está acessível ao professor.
