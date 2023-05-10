import * as S from "../scanner/index.js"
import * as P from "../parser/index.js"
import { transpileToGo } from "./transpiler.js"

const ast = P.parse(S.scanner(`
A = (a)a<a>;
B = (b)b<b>;
C(x) = x<"yo">;
main = log<"yo"> | A + B | ((a)C<a>);
`))
console.log(transpileToGo(ast))