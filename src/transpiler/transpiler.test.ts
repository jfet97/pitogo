import * as S from '../scanner/index.js';
import * as P from '../parser/index.js';
import { transpileToGo } from './transpiler.js';

const ast = P.parse(
  S.scanner(`
    A = log<"a">;
    B = log<"b">;
    C(c) = c<"c">;
    D = A | B;
    E = ((c)[c = c]log<"c=c">) | ((c)(d)[c = d]log<"c=c">);
    F = !log<"!">;
    main = log<"main"> | ((c)(C<c> | c(m).log<m>)) | D | (A | B | (A | B)) | E | F;
`),
);

const go = transpileToGo(ast);
console.log(go);
import { writeFileSync } from 'fs';

writeFileSync('./src/transpiler/program.go', go);
