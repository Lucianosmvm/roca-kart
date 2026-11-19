# Acabamento de apresentação — pistas, HUD, menus, ajuda e áudio

Etapa 2 do [escopo da versão 1.0](escopo-v1.md), em 19/11/2026. Alterações implementadas por leitura e edição; **sem execução ou testes do jogo**.

## Sinalização das pistas

- Placas originais amarelas com setas à esquerda/direita, posicionadas conforme a curvatura do traçado. Uma placa antecipa a curva e outra reforça o sentido no trecho.
- Placas SALTO antes das rampas existentes e ATALHO nas entradas dos caminhos alternativos.
- Marcadores baixos de borda em creme, coral e azul-petróleo. A montagem evita as junções dos atalhos e usa instâncias para repetir a peça.
- Os sinais acompanham a altura do terreno, sem acrescentar obstáculos físicos à pista.
- Quantidade, legibilidade, distância de antecipação e possível sobreposição com cenário ainda exigem avaliação jogável e visual autorizada. A sinalização não altera os traçados.

Os cinco modelos novos são reutilizáveis, com fontes em `blender/models/*.blend` e exportações em `assets/*.glb`:

- `race_curve_left`, `race_curve_right`.
- `race_sign_jump`, `race_sign_route`.
- `race_edge_marker`.

Gerador preservado: `blender/race_signs.py`. Produz somente modelos, sem iniciar jogo, navegador ou testes:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/race_signs.py
```

O Blender foi usado em segundo plano para gerar e salvar esses arquivos. A geração não representa avaliação do jogo.

## HUD

- Item equipado mostra o comando para uso; sorteio e item disponível têm estados visuais distintos.
- Habilidade mostra porcentagem e PRONTA, além da barra. O botão por toque acompanha a disponibilidade; o indicador da habilidade também aceita Enter/Espaço quando recebe foco.
- Drift diferencia carregamento, BOM e PERFEITO por texto, borda e cor, além da barra.
- Mensagens centrais usam tamanhos limitados à tela e quebra de linha. Nome do evento e item recebem fundo para melhorar o contraste.
- Ajustes de CSS para telas pequenas e paisagem baixa; preferência do sistema por movimento reduzido desativa animações de interface e linhas de velocidade.

## Menus e garagem

- Seleções de pista e catálogo usam botões com estado selecionado e foco visível. O foco é recuperado ao selecionar outra pista ou item do catálogo.
- O texto da copa esclarece que seu andamento dura a sessão. A pausa avisa sobre a saída da corrida/copa.
- Prévia não comprada tem ação explícita para descartar; tentar correr com uma prévia pendente explica como voltar à montagem equipada.
- Adesivos bloqueados mostram sua condição de conquista, em vez de ignorar o clique.
- Um estado de armazenamento compartilhado permite mostrar falhas de gravação no menu, resultados, opções e oficina.
- Aplicar, renomear, duplicar, excluir, importar e salvar criações distingue uma alteração persistida de uma alteração mantida somente na sessão. A exportação comunica a preparação do download, sem afirmar que o usuário já guardou o arquivo.
- Exportar uma criação preserva a montagem, não todo o progresso da conta; os avisos não prometem backup completo.
- Os controles de opções receberam rótulos associados e mensagem de salvamento.

## Ajuda inicial

- Uma explicação curta aparece antes da primeira corrida: tocar, soltar, tocar novamente e segurar, esperar BOM/PERFEITO, soltar para mini-turbo.
- A ajuda inclui os comandos de teclado/toque e uma legenda dos sinais da pista. Não exige botão adicional de drift.
- O jogador pode voltar sem iniciar a corrida ou confirmar para correr. A confirmação é lembrada no progresso; se a gravação falhar, vale somente para a sessão.
- Pode ser reaberta por Como pilotar nas opções e na pausa. Escape fecha a ajuda, o foco fica entre seus botões e retorna ao controle anterior ao sair.

## Áudio

- Sinais distintos ao atingir BOM e PERFEITO, uma vez por limiar em cada drift.
- O tom crescente de carga existente foi mantido. A chegada usa um sinal curto; a comemoração completa continua no pódio.
- Música baixa brevemente durante avisos importantes, respeitando o volume configurado. Alterar o volume cancela restaurações antigas para não desfazer a escolha do jogador.
- Motor, impactos leves e aterrissagens tiveram redução de volume para dar espaço aos avisos. O equilíbrio sonoro ainda precisa ser ouvido em uma sessão autorizada.
- O controle de volume dos efeitos emite um sinal ao terminar o ajuste, evitando repetir sons a cada movimento do controle.
- Todo o áudio continua sintetizado em `js/audio.js`, sem arquivos de terceiros.

## Avaliação pendente

Em outro ambiente autorizado, observar legibilidade das placas em velocidade, visibilidade do HUD nas quatro pistas, teclado/toque nos menus, primeira corrida/retorno da ajuda, mensagens com armazenamento indisponível e equilíbrio de áudio com os volumes baixo e alto.

Nenhum teste automatizado, verificador de sintaxe, benchmark ou script de validação foi executado. Não foi aberto jogo ou navegador neste PC. O acabamento não deve ser considerado aprovado visualmente ou pronto para venda sem essa avaliação.
