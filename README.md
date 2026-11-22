# Monte o seu caminhão

Página de resolução dos puzzles de cubinhos: digite o código do seu puzzle e veja, peça por peça,
como montar a carga do baú (ou o cubo), em 3D.

- O código (por exemplo `3629G`) guarda a grade, o número de peças e a semente do puzzle.
- Dá para abrir direto com o código no endereço: `.../#3629G`.
- Abre na solução de sempre; se o puzzle tiver outras, o botão "Outra solução (1 de N)" passa por elas.

## Como funciona

- `src/gerador/`: cópia do gerador de peças do programa que cria os puzzles. **Não editar aqui**:
  as cópias são atualizadas pelo programa de origem, junto com `tests/esperado.json` (puzzles feitos
  lá, para conferir que esta página refaz exatamente as mesmas peças).
- `src/resolver.js`: do código às peças, na ordem de montagem.
- `src/solucoes.js`: as outras soluções do mesmo puzzle (as mesmas peças enchendo o bloco de outro jeito, cada
  uma com a sua ordem de montagem; a mesma solução só virada no bloco não conta). Procura aos poucos, até 999.
- `src/vista.js`: a vista 3D (three.js).
- `src/app.js`: a página.

Testes: `npm test` (Node 18+).
