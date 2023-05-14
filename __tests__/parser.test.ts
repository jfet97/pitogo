import { scanner } from '../src/scanner/index.js';
import { parse } from '../src/parser/index.js';
import { writeFileSync } from 'fs';
import { prettyPrint } from '../src/parser/pretty_print.js';

// describe('parser', () => {
//   it('true', () => {
//     expect(true).toBe(true);
//   });
// });

// const ast = parse(
//   scanner(`
//     A = (ab)as<ab>.ab<m>.nil;
//     S = !as(x).bs<x>.nil;
//     B = bs(y).y(w).log<y>.log<w>;
//     C(x) = x<"a">;
//     main = (as)(bs)A | S | B + C<as>;
//   `),
// );

const ast = parse(
  scanner(`
    C(s) = log<s>;
    D = log<"ciao">;
    main = C<"c"> | D.C<"c">;
  `),
);


// const ast = parse(
//   scanner(`
//     A = (ab)as<ab>.ab<m>;
//     S = !as(x).bs<x>;
//     B = bs(y).y(w).log<y>.log<w>;
//     main = (as)(bs)A | S + B;
//   `),
// );

// const ast = parse(
//   scanner(`
//     A = (ab)as<ab>.ab<m>.nil | P;
//     main = A;
//   `),
// );

// const ast = parse(
//   scanner(`
//     main = (as)(bs)(A | S + B);
//   `),
// );

// const ast = parse(
//   scanner(`
//     main = ((as)(bs)((A|(S)))) + B;
//   `),
// );

// const ast = parse(
//   scanner(`
//     main = (as)(bs)(A|S) + B;
//   `),
// );

// pruning done into AST
// removeSingleParallelComposition(ast);
// removeSingleNonDeterministicChoice(ast);

console.log(prettyPrint(ast));

// console.log(scanner(`A`));

// const ast = parse(
//   scanner(`
//     main = (ab)as<a>.nil;
//   `),
// );

// serialize ast on a file called ast.json
writeFileSync('./__tests__/ast.json', JSON.stringify(ast, null, 2));

// console.log(
//   scanner(`
//   A = (ab)ab<"ciao">.nil;
// `),
// );

// console.log(
//   scanner(`
//   A = (ab)ab<23.23>.nil;
// `),
// );
