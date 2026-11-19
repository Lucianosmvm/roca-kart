# Roça Kart — Oficina da Roça

Corrida arcade 3D cartoon com máquinas inventadas numa oficina rural brasileira.
Feito com Three.js para PC e celular.

O foco da primeira versão comercial é **Windows, para um jogador, com compra única**. O conteúdo está fechado em quatro máquinas, quatro pistas e os quatro modos existentes; a prioridade agora é acabamento. Veja o [escopo da versão 1.0 e a ordem de trabalho](docs/escopo-v1.md). O aplicativo offline e o suporte a controle ainda estão pendentes.

A primeira passagem de [acabamento da pilotagem](docs/acabamento-pilotagem.md) trata controles, drift, saltos, atalhos, progresso, colisões e câmera. As alterações não foram testadas; a avaliação jogável continua pendente.

O [acabamento de apresentação](docs/acabamento-apresentacao.md) acrescenta placas de curva/salto/atalho, marcadores de borda, estados mais claros no HUD, ajuda antes da primeira corrida e avisos de salvamento. A ajuda pode ser reaberta em **Opções → Como pilotar** ou pela pausa. Os novos modelos de sinalização estão salvos em `.blend` e `.glb`, com gerador em `blender/race_signs.py`. Esta etapa também não foi testada.

## Jogar

Dê dois cliques em `Jogar.bat`, ou execute `python -m http.server 8765` e abra http://localhost:8765.
Jogo publicado em https://lucianosmvm.github.io/roca-kart/ — o GitHub Pages atualiza após os pushes na `main`.

## Monte sua máquina

Entre em **Garagem → Montar**. Escolha Tatu, Pingo, Pipoca ou Bento em Máquina e acessórios.

A oficina segue o layout aprovado: prévia 3D à esquerda e editor lateral no PC; no celular, a máquina fica acima de um painel inferior recolhível. **Salvar criação** e **Correr** ficam sempre visíveis.
Use **Máquina e acessórios** para escolher máquina, implemento, pintura, acessórios e buzina.
Dentro de **Montar**, os controles estão separados em **Peças**, **Proporções** e **Cores** (o Broto tem Peças e Cores).
Os atributos e a habilidade ficam numa área recolhível. A câmera usa apenas o espaço livre da prévia, incluindo quando o painel é recolhido.

- **Tatu:** troque capô, cabine e para-choque; ajuste altura e largura do capô.
- **Pingo:** ajuste tanque em gota e braços de irrigação.
- **Pipoca:** mini colheitadeira ágil, com ajustes de rodas, cores e adesivos.
- **Bento:** caminhão graneleiro estável, com ajustes de rodas, cores e adesivos.
- **Todas as máquinas:** ajuste rodas dianteiras/traseiras, largura dos pneus, distância lateral entre rodas e três cores livres.
- Gire a prévia arrastando o modelo. Alterações são salvas automaticamente por máquina e aparecem na corrida.
- **Restaurar montagem** repõe o visual da máquina selecionada sem apagar o progresso.
- **Broto:** com Tatu e Broto engatado, entre em **Montar → Broto**. Escolha reservatórios de sementes, barris ou caixotes e rodas pequenas, largas ou duplas. As quatro cores do implemento são independentes do trator.
- **Minhas criações:** dê um nome à montagem atual para guardar máquina, peças, cores, implemento, acessório e buzina. Use **Usar** para reaplicar uma combinação. Excluir uma criação da coleção mantém a montagem equipada.
- Criações novas recebem miniaturas da montagem 3D real. Edite o nome na coleção, duplique variações e use **Exportar** / **Importar criação** para compartilhar arquivos `.roca.json`.

As criações ficam no armazenamento do navegador, no mesmo dispositivo e endereço do jogo. Apagar os dados do navegador ou o progresso do jogo também apaga a coleção.

As peças têm encaixes definidos e limites de proporção. A montagem é visual e preserva os atributos da máquina-base.

## Conteúdo

Tatu (trator), Pingo (buggy de irrigação), Pipoca (mini colheitadeira), Bento (caminhão graneleiro) e Broto (plantadeira rebocada); quatro pistas rurais com desníveis, curvas inclinadas e caminhos alternativos;
drift com mini-turbo, saltos e manobras; habilidades especiais; itens de corrida; garagem e loja;
moedas de milho; acessórios e buzinas; trilha de baião sintetizada; controles por toque;
progresso e recordes salvos no navegador.

O Plantio Relâmpago do Broto planta **um único girassol por uso**, centralizado atrás da plantadeira, para deixar espaço de desvio na pista.

**Drift:** dê dois toques rápidos (até 300 ms) no mesmo lado e mantenha o segundo toque. Solte para liberar o mini-turbo. Vale para A/D, setas e botões de direção no celular. O indicador mostra quando o drift está Bom ou Perfeito.

**Teclado:** W/↑ acelera · S/↓ freia · A/D vira · ESPAÇO faz manobra no ar · E item · Q habilidade · H buzina · C câmera · R volta à pista · ESC pausa.
No celular, as manobras em saltos são automáticas e não existe mais botão separado de drift.

## Corridas e progressão

- **Corrida rápida:** três voltas em qualquer uma das quatro pistas.
- **Copa da Colheita:** Milharal → Girassóis → Cerrado, com pontuação acumulada, troféu e recompensa por pódio. A copa em andamento dura a sessão atual; o troféu conquistado é salvo.
- **Contra o tempo:** três voltas sozinho, sem itens nem habilidade. O fantasma da melhor tentativa é salvo por pista e aparece na próxima corrida; nunca colide com o jogador. Os recordes são separados das corridas normais.
- **Desafios:** uma volta com objetivos de drift, saltos ou coleta de milho. Objetivos alcançados liberam adesivos, pintura e moedas.
- **Recompensas:** 5 mini-turbos numa corrida liberam Relâmpago; 3 manobras liberam Céu da Colheita; 20 moedas liberam Florada; um pódio na copa libera Número 07 e bônus. As condições também podem ser cumpridas em corridas normais.

As peças e adesivos são cosméticos; os atributos continuam ligados à máquina-base.
Detalhes técnicos e todos os arquivos reutilizáveis estão em `docs/expansao-corridas.md`.

## HUD da corrida

Organização inspirada na referência visual fornecida pelo usuário, com os elementos próprios do Roça Kart:

- Cronômetro no alto à esquerda; item equipado centralizado no alto.
- Moedas de milho e voltas no alto à direita.
- Retratos dos quatro primeiros colocados na lateral esquerda e posição do jogador em destaque embaixo.
- Minimapa transparente à direita, com o traçado em creme e marcadores dos corredores.
- Velocímetro com ponteiro, leitura em km/h e indicação de turbo no canto inferior direito.
- Habilidade separada no canto esquerdo e botão de pausa abaixo das voltas.
- Adaptações para celular e telas baixas, com os controles de toque afastados do velocímetro.

Esta reorganização do HUD não foi testada neste PC, por orientação do usuário. Não houve alteração de modelos 3D.

## Arquivos principais

- `blender/oficina.py`: gera os três modelos originais e retratos, sem geometria importada.
- `blender/broto_parts.py`: gera o Broto modular e as seis peças reutilizáveis, sem renderizar retratos ou executar testes.
- `blender/models/tatu.blend`, `pingo.blend`, `broto.blend`: modelos editáveis.
- `assets/tatu.glb`, `pingo.glb`, `broto.glb`: modelos utilizados no jogo.
- `js/main.js`: corrida, física, IA, cenas, câmeras e garagem 3D.
- `js/customize.js`: montagem visual e encaixes.
- `js/ui.js`: menus, editor e loja.
- `js/save.js`: catálogo, montagens e migração do progresso anterior.
- `js/tracks.js`, `js/audio.js`: pistas e áudio procedural.
- `docs/design-maquinas.md`: direção de arte, limites e validação.
- `docs/art/oficina-conceito.png`: prancha conceitual do elenco.

Regerar os modelos e retratos (sobrescreve os arquivos do novo elenco):

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/oficina.py
```

Os antigos modelos e geradores estão preservados como histórico e não são carregados pelo jogo.

## Peças 3D do Broto

As seis peças têm arquivos `.blend` em `blender/models/` e `.glb` em `assets/`:

- `broto_hoppers_seed`, `broto_hoppers_barrel`, `broto_hoppers_crate`.
- `broto_wheels_small`, `broto_wheels_wide`, `broto_wheels_double`.

Os conjuntos usam a origem do engate do Broto e podem ser reutilizados nos próximos modelos.
Para gerar e salvar os arquivos novamente:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/broto_parts.py
```

Esta etapa de personalização do Broto e Minhas criações não foi testada, a pedido do usuário. Não executar testes neste PC; as preferências estão em `AGENTS.md`.

## Visual da oficina

Paleta comum nos menus: azul-petróleo, creme, coral e amarelo-palha, com botões e cartões arredondados.
O cenário de madeira atualizado foi salvo em `blender/models/garage.blend` e `assets/garage.glb`.
A referência aprovada está em `docs/art/oficina-layout-aprovado.png`.

Para gerar apenas o cenário, preservando os outros modelos:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python blender/props_demo.py -- garage
```

O novo layout não foi testado neste PC, conforme instrução do usuário. O Blender foi usado somente para gerar e salvar o cenário.
