import * as S from "../scanner/index.js"
import * as P from "../parser/index.js"
import { transpileToGo } from "./transpiler.js"

console.log(transpileToGo(P.parse(S.scanner(`
A = a<a>;
B = b<b>;
main = log<"yo">;
`))))

console.log(P.parse(S.scanner(`
A = a<a>;
B = b<b>;
main = log<"yo">;
`)))