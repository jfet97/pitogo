import { scanner } from './scanner.js';

// console.log(
//   scanner(`
//     A = (ab)as<ab>.ab<m>.A;
//     S = !as(x).bs<x>;
//     B = bs(y).y(w).B;
//   `),
// );

// console.log(scanner(`A`));

// console.log(
//   scanner(`
//     (ab)as
//   `),
// );

console.log(scanner(`
  A = (ab)ab<"ciao">.nil;
`))

console.log(
  scanner(`
  A = (ab)ab<23.23>.nil;
`),
);
