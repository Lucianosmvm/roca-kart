# Roça Kart — Oficina da Roça

Corrida arcade 3D cartoon com máquinas inventadas numa oficina rural brasileira.
Feito com Three.js para PC e celular.

## Jogar

Dê dois cliques em `Jogar.bat`, ou execute `python -m http.server 8765` e abra http://localhost:8765.
Jogo publicado em https://lucianosmvm.github.io/roca-kart/ — o GitHub Pages atualiza após os pushes na `main`.

## Monte sua máquina

Entre em **Garagem → 🛠 Montar**. Escolha Tatu ou Pingo na aba Máquina.

A oficina segue o layout aprovado: prévia 3D à esquerda e editor lateral no PC; no celular, a máquina fica acima de um painel inferior recolhível. **Salvar criação** e **Correr** ficam sempre visíveis.
Use **Máquina e acessórios** para escolher máquina, implemento, pintura, acessórios e buzina.
Dentro de **Montar**, os controles estão separados em **Peças**, **Proporções** e **Cores** (o Broto tem Peças e Cores).
Os atributos e a habilidade ficam numa área recolhível. A câmera usa apenas o espaço livre da prévia, incluindo quando o painel é recolhido.

- **Tatu:** troque capô, cabine e para-choque; ajuste altura e largura do capô.
- **Pingo:** ajuste tanque em gota e braços de irrigação.
- **Ambos:** ajuste rodas dianteiras/traseiras, largura dos pneus, distância lateral entre rodas e três cores livres.
- Gire a prévia arrastando o modelo. Alterações são salvas automaticamente por máquina e aparecem na corrida.
- **Restaurar montagem** repõe o visual da máquina selecionada sem apagar o progresso.
- **Broto:** com Tatu e Broto engatado, entre em **Montar → Broto**. Escolha reservatórios de sementes, barris ou caixotes e rodas pequenas, largas ou duplas. As quatro cores do implemento são independentes do trator.
- **Minhas criações:** dê um nome à montagem atual para guardar máquina, peças, cores, implemento, acessório e buzina. Use **Usar** para reaplicar uma combinação. Excluir uma criação da coleção mantém a montagem equipada.

As criações ficam no armazenamento do navegador, no mesmo dispositivo e endereço do jogo. Apagar os dados do navegador ou o progresso do jogo também apaga a coleção.

As peças têm encaixes definidos e limites de proporção. A montagem é visual e preserva os atributos da máquina-base.

## Conteúdo

Tatu (trator), Pingo (buggy de irrigação) e Broto (plantadeira rebocada); três pistas rurais;
drift com mini-turbo, saltos e manobras; habilidades especiais; itens de corrida; garagem e loja;
moedas de milho; acessórios e buzinas; trilha de baião sintetizada; controles por toque;
progresso e recordes salvos no navegador.

**Teclado:** W/↑ acelera · S/↓ freia · A/D vira · ESPAÇO drift/manobra · E item · Q habilidade · H buzina · C câmera · R volta à pista · ESC pausa.

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
