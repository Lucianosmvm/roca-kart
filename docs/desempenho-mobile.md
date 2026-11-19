# Desempenho no celular e remoção de acrobacias

Relato do usuário: muito lag no celular após a atualização dos modelos. Diagnóstico feito por leitura do código e dos geradores, sem executar jogo, testes, scripts de validação ou benchmarks neste PC.

## Evidências e limites

A geração anterior registrou aproximadamente 120 mil triângulos por máquina; por exemplo, o Tatu tinha 123.960. O celular carregava os mesmos modelos do PC e usava materiais físicos. O perfil salvo como Alta também habilitava resolução de até 2×, sombras e o passe extra de contornos. Vegetação detalhada era repetida em grande quantidade. Esses são mecanismos concretos de aumento de custo; a contribuição de cada um não foi medida.

Também havia busca de todos os segmentos dos atalhos em cada consulta de piso e falta de liberação explícita de recursos exclusivos do cenário ao trocar de pista.

## Alterações

- Modelos leves independentes, carregados automaticamente em dispositivos com os controles de toque. O PC continua usando as fontes detalhadas.
- A geração reserva os olhos e as malhas pequenas antes de distribuir o orçamento por categoria. As quatro máquinas low-poly do PC têm entre 25.618 e 27.572 triângulos. No celular, o exportador registrou 15.996 para Tatu, Pipoca e Bento, 15.990 para Pingo e 8.998 para o implemento Broto.
- Plantas, árvores, acessórios, peças, oficina e marcos recebem versões leves próprias. Não há suavização ou decimação das superfícies navegáveis: os circuitos originais são reutilizados para manter a correção do piso.
- Materiais Lambert no celular, inclusive as cores da personalização; sem sombras ou passe extra de contornos.
- Após relato de imagem pixelizada, suavização de bordas foi habilitada e a resolução passou a ter limite de 1,35× no perfil Nítida, com orçamento de 1,5 milhão de pixels. Econômica usa limite de 1× e 900 mil pixels. Telas grandes respeitam o orçamento reduzindo a escala; não há uso irrestrito da densidade 2×/3× dos aparelhos.
- Menor densidade de vegetação, textura de chão menor, capacidade de partículas de 350 em vez de 1.400 e emissão reduzida.
- Consultas de atalhos usam uma grade espacial e examinam apenas segmentos próximos.
- Ao trocar de pista, geometrias, materiais e texturas exclusivos do cenário anterior são liberados. Recursos compartilhados dos modelos permanecem disponíveis.

## Saltos

Removidos comando, animação de giro, áudio e bônus de acrobacia, para jogador e adversários. As rampas continuam lançando o veículo e produzindo aterrissagem normal.

O desafio Asas da roça e sua pintura agora dependem de três saltos com aterrissagem, sem acrobacias. Identificadores e recompensas conquistadas anteriormente foram preservados. Ajuda, opções e HUD não instruem mais a usar Espaço para manobras.

## Arquivos reutilizáveis

O gerador `blender/mobile_models.py` lê a lista de assets utilizada pelo jogo e as fontes detalhadas. Mantém nomes, transformações e pivôs das peças, salvando cada resultado em `blender/models/<nome>_mobile.blend` e `assets/<nome>_mobile.glb`. Não sobrescreve os modelos detalhados.

Depois de regenerar modelos detalhados, gerar também os leves em uma chamada separada:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' -b --factory-startup --python-exit-code 1 --python blender/mobile_models.py
```

O Blender foi usado somente em segundo plano para produzir e salvar assets. Não há FPS medido, garantia de desempenho ou confirmação de encaixe das malhas simplificadas sem avaliação no aparelho em ambiente autorizado.

## Enquadramento e controles

O multiplicador de distância em retrato passou de 1,45 para 1,08, com aproximação adicional no celular e menor abertura de campo de visão. A câmera mantém a compensação pelo Broto e a opção de distância alternativa no teclado. O botão de buzina foi removido dos controles por toque; a buzina por H permanece no PC.

A inspeção de malhas invertidas, solicitada explicitamente depois, foi executada separadamente no Blender. Seus resultados estão em [revisao-malhas.md](revisao-malhas.md). Essa autorização é restrita à geometria; jogo, navegador, testes de código e benchmarks continuam sem execução.
