# Roça Kart — Oficina da Roça

Corrida arcade 3D cartoon com máquinas inventadas numa oficina rural brasileira.
Feito com Three.js para PC e celular.

## Jogar

Dê dois cliques em `Jogar.bat`, ou execute `python -m http.server 8765` e abra http://localhost:8765.
As mudanças desta etapa são locais; ainda não foram publicadas no GitHub Pages.

## Monte sua máquina

Entre em **Garagem → 🛠 Montar**. Escolha Tatu ou Pingo na aba Máquina.

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
