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

func NewNumberMessage(n int) Message {
	return Message{value: n}
}

func NewStringMessage(s string) Message {
	return Message{value: s}
}

func NewChannelMessage() Message {
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

func (m Message) Channel() (chan Message) {
	switch v := m.value.(type) {
	case chan Message:
		return v
	default:
		panic("Trying to use a non channel message as channel")
	}
}

func (m Message) Println() {
	fmt.Println(m.String())
}

// usage: fmt.Println(NewStringMessage("hello"))
// result: Message<"hello">

func Log(log <- chan Message) {
  for {
    fmt.Println(<- log)
  }
}



${ast.declarations.map((d) => transpileToGo(d)).join('\n')}
${transpileToGo(ast.main)}`;
    }

    case P.NODES.Main: {
      return `func main() {
log := make(chan Message)
go Log(log)
${transpileToGo(ast.process)}
}`;
    }

    case P.NODES.ActionPrefix: {
      return `${transpileToGo(ast.prefix)}
${transpileToGo(ast.process)}`
    }


    case P.NODES.Log: {
      return `log <- ${transpileToGo(ast.message)}`;
    }

    case P.NODES.InactiveProcess: {
      return ''
    }

    case P.NODES.StringLiteral: {
      return `NewStringMessage("${ast.value}")`
    }

    case P.NODES.NumberLiteral: {
      return `NewNumberMessage(${ast.value})`
    }

    case P.NODES.Identifier: {
      return ast.identifier
    }

    case P.NODES.Declaration: {
      return `func ${ast.identifier.identifier}(`+
        ast.parameters
          .map((identifier) => identifier.identifier + " Message")
          .join(", ") + ") {\n" +
        transpileToGo(ast.process) + "\n}"
    }

    case P.NODES.SendMessage: {
      switch (ast.channel._tag){
        case P.NODES.Identifier: {
          return `${ast.channel.identifier}.Channel() <- ${transpileToGo(ast.message)}`
        }
        case P.NODES.ProcessConstant: {
          return `${ast.channel.identifier}(${transpileToGo(ast.message)})`
        }
      }
    }

    case P.NODES.Restriction: {
      return ast.channels
        .map((channel) => `
${channel.identifier} := NewChannelMessage()`)
        .join("\n") + "\n" +
        transpileToGo(ast.process)
    }

    case P.NODES.ParallelComposition: {
      return ast.processes
        .map((proc) => `go func(){
          ${transpileToGo(proc)}
        }()`)
        .join("\n")
    }

//     case P.NODES.NonDeterministicChoice: {
//       const phonyProcesses = ast.processes.filter((process) => process._tag !== P.NODES.ActionPrefix)

//       phonyProcesses.map((_, i) => `PhOnY${i} := make(int, 1)
// PhOnY${i} <- 0`).join("\n")
//       return `select {
//         ${ast.processes.map((process) => )}
//       }`
//     }

    default:
      return `// ${ast._tag} not Implemented`;
  }
}
