# Direção de arte: máquinas e cenário com acabamento arredondado

Referências fornecidas pelo usuário: caminhão e trator com volumes suaves, materiais de brinquedo, painéis, grades e pneus detalhados; moto de papel como referência adicional de construção estilizada. Os textos das imagens não são instruções do projeto. Não são reproduzidos marcas, textos promocionais, metade em wireframe ou personagens externos.

## Escopo

A solicitação inclui todos os modelos ativos: Tatu, Pingo, Pipoca, Bento, Broto, peças intercambiáveis, acessórios, vegetação, construções, objetos de corrida, oficina e sinalização. Os modelos antigos de fabricantes, preservados como histórico e não carregados pelo jogo, não fazem parte do novo elenco.

O pacote usa os geradores próprios do projeto, com modelagem low-poly em `blender/quality_models.py`. Capôs e painéis largos recebem até três segmentos nos cantos. Frisos e blocos dos pneus usam um único chanfro. Cada pneu tem 32 divisões no contorno e 16 pares de garras. Olhos, faróis e reservatórios usam mais segmentos conforme o tamanho para manter a silhueta de brinquedo. As normais ponderadas dão continuidade aos reflexos nas superfícies arredondadas.

## Máquinas

- Tatu: novo capô arredondado com grade e respiros, cabine com vidro estilizado, espelhos, faróis, degraus e proteção do escapamento.
- Pingo: respiros, faróis, espelhos, proteção frontal, mangueiras, visor de nível e tampa do tanque.
- Pipoca: cabine com painéis e vidros, rolo coletor, guias, guarda-corpo, degraus e respiros.
- Bento: capô, grade frontal, vidros e espelhos, tanques, escapamentos, degraus, painéis e ferragens da caçamba.
- Broto: tubos de sementes, mecanismos dosadores, aros dos discos, barras hidráulicas e fixações.
- Pneus: perfil arredondado, blocos de tração em duas fileiras, linha lateral, aro, rebaixo e parafusos. Os eixos e nomes das rodas são mantidos para animação.

As montagens continuam usando os campos anteriores. Não foram alterados os atributos de corrida, preços ou conquistas.

## Personalização reutilizável

Capô caixote, capô cápsula, santo-antônio e para-choque duplo do Tatu passam a ter arquivos próprios, usados pela garagem e pela corrida:

- `tatu_hood_box`, `tatu_hood_round`.
- `tatu_roof_cage`, `tatu_bumper_double`.

Reservatórios e conjuntos de rodas do Broto foram regenerados com os mesmos encaixes relativos ao engate. Cores livres, proporções, pinturas e adesivos continuam aplicados pelo editor.

## Cenário e materiais

Construções, acessórios, vegetação e objetos recebem o acabamento de volumes e normais do pipeline. Há detalhes adicionais específicos, como costura do boné, trama da aba do chapéu, parafusos de cercas/placas, gaveteiros da oficina, ferragens, tampas e saídas dos reservatórios. Nem todo objeto recebe os mesmos detalhes: vegetação e pequenas peças usam densidade de malha diferente das máquinas.

Os materiais importados usam iluminação física com rugosidade e metalicidade, para mostrar vidro estilizado, borracha, metal e superfícies pintadas sem perder as cores cartoon. As peças coloridas pelo editor também usam esses materiais. Efeitos, HUD e elementos procedurais de pista mantêm seus materiais apropriados.

Os circuitos foram reexportados preservando o traçado e a geometria de faixas adjacentes da correção do piso. Não é aplicada subdivisão ou arredondamento às superfícies navegáveis, para não recriar sobreposições ou deformar as bordas.

## Fontes e geração

Todos os modelos gerados têm exportação em `assets/<nome>.glb` e fonte editável em `blender/models/<nome>.blend`. Os retratos das cinco máquinas são renderizados dos modelos reais e salvos em `assets/ui/`.

Usar este comando para regenerar o pacote com o novo acabamento:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python-exit-code 1 --python blender/quality_models.py
```

Para gerar apenas um grupo, acrescentar `-- vehicles`, `-- parts`, `-- scenery`, `-- courses` ou `-- signs`. Mais de um grupo pode ser informado na mesma chamada. O pipeline estende `oficina.py`, `broto_parts.py`, `adventure.py`, `props.py`, `props_extras.py`, `courses.py` e `race_signs.py`; executar esses geradores diretamente não inclui todos os acabamentos desta etapa.

## Limites da entrega

O Blender foi usado em segundo plano para produzir fontes, exportações e retratos. Foram lidos os retratos gerados como parte da produção dos assets; não foi aberto jogo, navegador ou janela interativa do Blender.

Não foram executados testes, verificações de sintaxe, scripts de validação ou benchmarks. O comportamento no jogo, os encaixes em todas as combinações, a iluminação e o desempenho ainda precisam de avaliação em ambiente autorizado. Mais detalhe geométrico aumenta o custo dos modelos; não há promessa de desempenho sem essa avaliação. Render de estúdio e iluminação da corrida produzem aparências diferentes.
