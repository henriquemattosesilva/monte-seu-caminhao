# Monte o seu caminhão

Página de resolução dos puzzles de cubinhos: digite o código do seu puzzle e veja, peça por peça,
como montar a carga do baú (ou o cubo), em 3D.

- O código (por exemplo `3629G`) guarda a grade, o número de peças e a semente do puzzle.
- Dá para abrir direto com o código no endereço: `.../#3629G`.

## Como funciona

- `src/gerador/`: cópia do gerador de peças do programa que cria os puzzles. **Não editar aqui**:
  as cópias são atualizadas pelo programa de origem, junto com `tests/esperado.json` (puzzles feitos
  lá, para conferir que esta página refaz exatamente as mesmas peças).
- `src/resolver.js`: do código às peças, na ordem de montagem.
- `src/vista.js`: a vista 3D (three.js).
- `src/app.js`: a página.

Testes: `npm test` (Node 18+).
