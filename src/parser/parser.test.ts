import { scanner } from '../scanner/index.js';
import {
  removeSingleNonDeterministicChoice,
  removeSingleParallelComposition,
} from './clean.js';
import { parse } from './index.js';

const ast = parse(
  scanner(`
    A = (ab)as<ab>.ab<m>.nil;
    S = !as(x).bs<x>.nil;
    B = bs(y).y(w).log<y>.log<w>.nil;
    main = (as)(bs)(A | S | B);
  `),
);

removeSingleParallelComposition(ast);
removeSingleNonDeterministicChoice(ast);

// console.log(scanner(`A`));

// const ast = parse(
//   scanner(`
//     main = (ab)as<a>.nil;
//   `),
// );

// serialize ast on a file called ast.json
import { writeFileSync } from 'fs';
writeFileSync('./src/parser/ast.json', JSON.stringify(ast, null, 2));

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
