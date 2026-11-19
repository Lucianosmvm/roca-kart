# Expansão da Oficina da Roça

Implementação das melhorias autorizadas pelo usuário: pistas com aventura, dois veículos cartoon, coleção de montagens, progressão e drift por toque duplo.
Todo o código desta etapa está **sem testes executados**, por instrução expressa em AGENTS.md. Não foi aberto jogo, navegador, verificador de sintaxe ou benchmark. O Blender foi usado somente para produzir arquivos.

## Drift e pilotagem

- Dois acionamentos da mesma direção em até 300 ms iniciam o gesto. Manter o segundo acionamento sustenta o drift; soltar encerra e libera o mini-turbo conforme a carga.
- Acionamentos alternados e repetição automática de teclado não contam como toque duplo. Pausa, perda de foco e nova corrida limpam o gesto.
- A/D, setas e botões por toque usam o mesmo reconhecimento. Space fica reservado para manobra no ar; no celular as manobras são automáticas.
- Indicador Bom/Perfeito, faíscas e tom crescente acompanham a carga. Não há botão de drift no celular.
- O Plantio Relâmpago continua produzindo apenas um girassol por ativação.

## Quatro circuitos

| Pista | Estrutura e identidade |
|---|---|
| Fazenda Milharal | Celeiro atravessável, ponte, colinas suaves, salto e atalho sinalizado |
| Vale dos Girassóis | Colinas maiores, moinho gigante, ponte e atalho estreito com salto |
| Cerrado da Soja | Cânion, túnel, desníveis e curvas inclinadas |
| Feira da Colheita | Barracas de frutas, armazém, bandeirinhas do cenário existente, iluminação de entardecer e atalho |

`blender/course_designs.json` é a fonte dos traçados, cotas, inclinações, atalhos e marcos. `blender/courses.py` gera **juntos** os quatro modelos completos e `assets/course-layouts.json`, cujas amostras são usadas pela física.
O piso principal, os taludes, os caminhos alternativos e os marcadores do minimapa usam esses mesmos dados.
Cada volta exige quatro passagens de progresso em ordem. O avanço nos atalhos é convertido para a progressão equivalente do circuito principal.
As câmeras, veículos, reboques, itens, moedas e efeitos acompanham a altura da pista.

Para editar circuitos, alterar os dados de projeto e regenerar malhas **e** navegação; editar só o GLB não modifica o piso físico.

## Veículos e expressão

Tatu equilibrado, Pingo veloz nas retas, Pipoca ágil com boa arrancada e Bento mais pesado e estável.
Pipoca e Bento têm modelos, retratos, apresentação na seleção e falas próprias na abertura.
Todos têm movimento leve de suspensão; os olhos das máquinas reagem a adversários próximos; os vencedores comemoram no pódio.
Adesivos incluem remendo, girassol, bolinhas, relâmpago, florada e Número 07. São gráficos 2D originais gerados pelo jogo e não alteram atributos.

## Modos

- Corrida rápida: três voltas com adversários.
- Copa da Colheita: três corridas com pontos 10/7/5/3/2/1. Empates são resolvidos pela colocação na última etapa. É possível repetir a etapa atual; sua pontuação substitui a anterior em vez de ser somada novamente.
- Contra o tempo: três voltas, sem adversários, itens nem habilidade. Repetição pessoal translúcida, sem colisão, gravada a 10 Hz; melhor tempo e fantasma separados das corridas normais. Gravações têm limite de 20 minutos.
- Desafios: uma volta para concluir 5 drifts, 3 manobras ou coletar 20 moedas. Recordes separados por desafio/pista.
- Troféus e conquistas são persistentes. O andamento da copa é mantido somente na sessão atual.
- Recompensas de conquista são concedidas uma vez; moedas, compras e recordes anteriores são preservados.

## Criações

Miniaturas vêm da câmera real da oficina, capturadas dentro do quadro de renderização para evitar tela vazia e preservar a proporção.
Entradas antigas mantêm o retrato-base até que sejam salvas novamente com uma nova miniatura.
O nome é editável, as variações podem ser duplicadas, e uma montagem pode ser exportada/importada em JSON versionado.
Importações aceitam somente máquinas, peças e cores conhecidas, têm limite de tamanho e não concedem moedas, conquistas ou itens não possuídos.
Miniaturas são opcionais, embutidas em formato raster; arquivos externos não são carregados como miniatura.

## Arquivos 3D reutilizáveis

Todos têm uma fonte em `blender/models/<nome>.blend` e exportação em `assets/<nome>.glb`:

- Novos veículos: `pipoca`, `bento`.
- Veículos atualizados com olhos separados: `tatu`, `pingo`.
- Circuitos completos: `course_milharal`, `course_girassol`, `course_cerrado`, `course_feira`.
- Cenário de corrida: `race_barn`, `race_bridge`, `race_canyon`, `race_tunnel`, `race_stall`, `race_mill`, `race_shortcut`.
- Retratos dos veículos em `assets/ui/`.

Geração dos arquivos, sem iniciar o jogo ou testes:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/courses.py
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/adventure.py
```

O gerador de aventura também aceita nomes após `--` para gerar apenas peças selecionadas.
Não foram adicionadas marcas, personagens, pistas ou arquivos gráficos de Crash Team Racing.
