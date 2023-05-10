import * as P from '../parser/index.js';

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

func (m Message) String() string {
	switch v := m.value.(type) {
	case int:
		return fmt.Sprintf("Message<%d>", v)
	case string:
		return fmt.Sprintf("Message<\\"%s\\">", v)
	case chan Message:
		return "Message<channel>"
	default:
		return "Message<unknown>"
	}
}

func (m Message) Println() {
	fmt.Println(m.String())
}

// usage: fmt.Println(NewMessageString("hello"))
// result: Message<"hello">

${ast.declarations.map((d) => transpileToGo(d)).join('\n')}
${transpileToGo(ast.main)}`;
    }

    case P.NODES.Main: {
      return `func main() {
${transpileToGo(ast.process)}
}`
    }

    case P.NODES.ActionPrefix: {
      return `${transpileToGo(ast.prefix)}
${transpileToGo(ast.process)}`
    }


    case P.NODES.Log: {
      return `fmt.Println(${transpileToGo(ast.message)})`;
    }

    case P.NODES.InactiveProcess: {
      return ''
    }

    case P.NODES.StringLiteral: {
      return `"${ast.value}"`
    }

    case P.NODES.Declaration: {
      return "asdasd"
    }

    default:
      return `${ast._tag} Not Implemented`;
  }
}
