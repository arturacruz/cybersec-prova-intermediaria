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

Executar pelo menos Tracker Reporting, Storage Blocking e Fingerprinting/Canvas. Em cada teste, registrar o esperado pelo DDG, o resultado do Oceania, a explicação da divergência e um print do popup.

1. Recarregar o Oceania em `about:debugging`.
2. Abrir a página de teste em uma aba nova.
3. Abrir o DevTools e preservar o log de rede.
4. Recarregar com `Ctrl+Shift+R`.
5. Esperar dez segundos e atualizar o popup.
6. Capturar o popup e a parte relevante da página de teste.
7. Preencher a tabela em `docs/MODELO_RELATORIO.md`.

## Três sites reais

Repetir para cada site sorteado pelo professor:

- [ ] Registrar nome, URL, data/hora, Firefox e sistema operacional.
- [ ] Limpar dados do site ou registrar que a medição usa perfil limpo.
- [ ] Abrir DevTools > Rede e ativar **Persistir registros**.
- [ ] Recarregar a página e aguardar dez segundos.
- [ ] Exportar o HAR para `evidencias/sites-reais/site-N/trafego.har`.
- [ ] Salvar print do Oceania como `oceania.png`.
- [ ] Salvar ou capturar o resultado do Blacklight.
- [ ] Registrar os bloqueios do uBlock Origin.
- [ ] Aplicar e conferir manualmente o score do Oceania.
- [ ] Explicar diferenças com base no HAR e no comportamento observado.

## Repositório e relatório

- [x] Histórico Git preservado e novos commits incrementais criados.
- [x] Instruções de carregamento via `about:debugging`.
- [ ] Enviar o repositório para o Git remoto usado na disciplina.
- [ ] Substituir todos os campos entre colchetes no modelo de relatório.
- [ ] Inserir prints legíveis e legendados.
- [ ] Anexar os três HARs no repositório.
- [ ] Exportar o relatório final como PDF.
- [ ] Conferir que o link do repositório está acessível ao professor.
