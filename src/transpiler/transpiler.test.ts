import * as S from '../scanner/index.js';
import * as P from '../parser/index.js';
import { transpileToGo } from './transpiler.js';

const ast = P.parse(
  S.scanner(`
    A = log<"a">;
    B = log<"b">;
    C(c) = c<"c">;
    D = A | B;
    main = log<"main"> | ((c)(C<c> | c(m).log<m>)) | D | (A | B | ( A | B));
`),
);

const go = transpileToGo(ast);
console.log(go);
import { writeFileSync } from 'fs';

writeFileSync('./src/transpiler/program.go', go);
