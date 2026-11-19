# Desempenho no celular e remoção de acrobacias

Relato do usuário: muito lag no celular após a atualização dos modelos. Diagnóstico feito por leitura do código e dos geradores, sem executar jogo, testes, scripts de validação ou benchmarks neste PC.

## Evidências e limites

A geração anterior registrou aproximadamente 120 mil triângulos por máquina; por exemplo, o Tatu tinha 123.960. O celular carregava os mesmos modelos do PC e usava materiais físicos. O perfil salvo como Alta também habilitava resolução de até 2×, sombras e o passe extra de contornos. Vegetação detalhada era repetida em grande quantidade. Esses são mecanismos concretos de aumento de custo; a contribuição de cada um não foi medida.

Também havia busca de todos os segmentos dos atalhos em cada consulta de piso e falta de liberação explícita de recursos exclusivos do cenário ao trocar de pista.

## Alterações

- Modelos leves independentes, carregados automaticamente em dispositivos com os controles de toque. O PC continua usando as fontes detalhadas.
- Geração com orçamento de geometria por categoria. As quatro máquinas têm alvo de 16 mil triângulos cada; o Tatu gerado registrou 15.990. Isso é informação da produção da malha, não medição de desempenho.
- Plantas, árvores, acessórios, peças, oficina e marcos recebem versões leves próprias. Não há suavização ou decimação das superfícies navegáveis: os circuitos originais são reutilizados para manter a correção do piso.
- Materiais Lambert no celular, inclusive as cores da personalização; sem sombras, antialiasing inicial ou passe extra de contornos.
- Resolução de renderização de 0,9× no perfil Leve, ou 0,75× em Econômica. Não usa a densidade de pixels 2× dos aparelhos.
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
