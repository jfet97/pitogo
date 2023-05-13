import * as P from "../parser/index.js"

//   | Program
//   | Declaration
//   | Main
//   | SendMessage
//   | ReceiveMessage
//   | Log
//   | InactiveProcess
//   | ProcessConstant
//   | Identifier
//   | NumberLiteral
//   | StringLiteral
//   | ActionPrefix
//   | Matching
//   | NonDeterministicChoice
//   | ParallelComposition
//   | Restriction
//   | Replication;

export function transpileToPi(ast: P.Node): string {
    switch (ast._tag) {
        case P.NODES.Program: {
            return ast.declarations
                .map(transpileToPi).join(';\n') +
                ((ast.declarations.length > 0) ? ';\n' : '') +
                transpileToPi(ast.main)
        }

        case P.NODES.Main: {
            return `main = ${transpileToPi(ast.process)};`
        }

        case P.NODES.Declaration: {
            return `${ast.identifier.identifier}${ast.parameters.length > 0 ? `(${ast.parameters.map(par => par.identifier).join(', ')})` : ''} = ${transpileToPi(ast.process)}`
        }

        case P.NODES.Restriction: {
            return ast.channels.map(c => `(${c.identifier})`).join('') + `(${transpileToPi(ast.process)})`
        }

        case P.NODES.ParallelComposition: {
            return `(${ast.processes.map(transpileToPi).join(') | (')})`
        }

        case P.NODES.Replication: {
            return `!(${transpileToPi(ast.process)})`
        }

        case P.NODES.NonDeterministicChoice: {
            return `(${ast.processes.map(transpileToPi).join(') + (')})`
        }

        case P.NODES.ActionPrefix: {
            return `${transpileToPi(ast.prefix)}.(${transpileToPi(ast.process)})`
        }

        case P.NODES.SendMessage: {
            return `${ast.channel.identifier}<${transpileToPi(ast.message)}>`
        }

        case P.NODES.ReceiveMessage: {
            return `${ast.channel.identifier}(${transpileToPi(ast.message)})`
        }

        case P.NODES.Log: {
            return `log<${transpileToPi(ast.message)}>`
        }

        case P.NODES.InactiveProcess: {
            return `nil`
        }

        case P.NODES.StringLiteral: {
            return `"${ast.value}"`
        }

        case P.NODES.NumberLiteral: {
            return `${ast.value}`
        }

        case P.NODES.Identifier: {
            return `${ast.identifier}`
        }

        case P.NODES.ProcessConstant: {
            return `${ast.identifier}`
        }

    
        default:
            return `${ast._tag} Not Implemented`
    }

}