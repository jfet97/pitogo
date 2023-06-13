import * as S from '../src/scanner/index.js';
import * as P from '../src/parser/index.js';
import { transpileToGo } from '../src/transpiler/transpiler.js';

// describe('transpiler', () => {
//   it('true', () => {
//     expect(true).toBe(true);
//   });
// });

// const ast = P.parse(
//   S.scanner(`
//     A = log<"a">;
//     B = log<"b">;
//     C(c) = c<"c">;
//     D = A | B;
//     E = ((c)[c = c]log<"c=c">) | ((c)(d)[c = d]log<"c=c">);
//     F = !(a)a<a>.log<"!">;
//     main = log<"main"> | ((c)(C<c> | c(m).log<m>)) | D | (A + B | (A | B)) | E;
// `),
// );

const ast = P.parse(
  S.scanner(`
    A = log<"a">;
    B = log<"b">;
    C(c) = !c<"c">;
    D = (c)(C<c> | (!c(a).log<"received">.log<a>.A + B));
    main = (a)(b)(c)(!log<"ciao"> + log<"pizza"> + a<"yo">) | (!a(msg).log<msg>);
  `),
);
const go = transpileToGo(ast);
console.log(go);
import { writeFileSync } from 'fs';

writeFileSync('./__tests__/program.go', go);
