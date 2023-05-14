import { scanner } from '../src/scanner/index.js';

// describe('scanner', () => {
//   it('true', () => {
//     expect(true).toBe(true);
//   });
// });

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

console.log(
  scanner(`
  A = log<123>;
  C(x) = x<"a">;
  main = (as)A + C<as>;
  `),
);

// console.log(
//   scanner(`
//   A = (ab)ab<23.23>.nil;
// `),
// );
