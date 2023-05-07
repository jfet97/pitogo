import { lexer } from './lexer.js';

console.log(
  lexer(`
    A = (ab)as<ab>.ab<m>.A;
    S = !as(x).bs<x>;
    B = bs(y).y(w).B;
  `),
);

// console.log(lexer(`A`));

// console.log(
//   lexer(`
//     (ab)as
//   `),
// );
