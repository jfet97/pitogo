import * as S from '../scanner/index.js';
import * as P from '../parser/index.js';
import { transpileToPi } from './pitranspiler.js';

const ast = P.parse(
  S.scanner(`
    A = log<"a">;
    B = log<"b">;
    C(a) = c<"c">;
    main = (c)(C | (!c(a).log<"received">.log<a>.A + B));
  `)
)
const go = transpileToPi(ast);
console.log(go);