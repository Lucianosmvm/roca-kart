# Revisão de orientação das malhas

O usuário pediu explicitamente: “verifique se tem malhas invertidas nos 3d”. Foi realizada somente a inspeção geométrica no Blender em segundo plano e a produção dos arquivos corrigidos. Não foram executados o jogo, navegador, testes de código, verificadores de sintaxe ou benchmarks.

## Resultado

Foram inspecionados 118 arquivos de modelos ativos: detalhados, peças, cenários, quatro circuitos e versões móveis. Houve correção de orientação de faces em 18 arquivos:

- Tatu, Pingo, Pipoca, Bento e Broto, nas versões detalhada e móvel.
- Três conjuntos de rodas do Broto, nas versões detalhada e móvel.
- Circuitos Cerrado e Feira, com faces de superfície voltadas para baixo.

Cada arquivo alterado foi salvo em `blender/models/<nome>.blend` e reexportado para `assets/<nome>.glb`. A conferência geométrica após a correção não apontou novas faces para inversão pelo mesmo critério. O relatório por objeto está em [mesh-orientation-report.json](mesh-orientation-report.json), incluindo a quantidade corrigida e o resultado após a correção.

## Causa e prevenção

O perfil arredondado dos pneus era construído com ordem de vértices invertida nos quadriláteros da sua casca. Isso orientava as faces para dentro. A ordem foi corrigida em `blender/quality_models.py`.

O exportador comum também orienta para fora as cascas fechadas e para cima as superfícies identificadas como circuitos. Quando faces mudam de orientação, as normais personalizadas antigas são descartadas e recalculadas para não manter iluminação invertida. Não há alteração de posições, nomes, pivôs, encaixes ou traçados.

As superfícies abertas de outros objetos são registradas, sem presumir automaticamente qual lado é “fora”. Portanto, a revisão não equivale a certificar visualmente todo material ou superfície interna: ela cobre cascas fechadas e a orientação conhecida do piso.

## Ferramentas preservadas

- `blender/mesh_orientation.py`: rotina de orientação usada pelo exportador.
- `blender/review_mesh_orientation.py`: inspeção focada e reparação das fontes e exportações.
- `blender/render_portraits.py`: produção dos retratos a partir das fontes salvas, sem regenerar a geometria.

Os cinco retratos das máquinas foram atualizados a partir das malhas corrigidas. O efeito no jogo e a experiência da câmera ainda precisam de avaliação no aparelho pelo usuário.
