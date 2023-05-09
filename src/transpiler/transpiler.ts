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

export function transpileToGo(ast: P.Node): string {
    switch (ast._tag) {
        case P.NODES.Program: {
            return `
package main

import "fmt"

type Message struct {
	value interface{}
}

func NewMessageNumber(n int) Message {
	return Message{value: n}
}

func NewMessageString(s string) Message {
	return Message{value: s}
}

func NewMessageChannel() Message {
	ch := make(chan Message)
	return Message{value: ch}
}

${ast.declarations.map(d => transpileToGo(d)).join("\n")}
${transpileToGo(ast.main)}`
        }

        case P.NODES.Log: {
            return `println(${ast._tag})`
        }
    
        default:
            return 'Not Implemented'
    }

}