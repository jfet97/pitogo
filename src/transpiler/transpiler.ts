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





${ast.declarations.map((d) => transpileToGo(d)).join('\n')}
${transpileToGo(ast.main)}`;
    }

    case P.NODES.Main: {
      return `func main() {

${transpileToGo(ast.process)}
}`;
    }

    case P.NODES.ActionPrefix: {
      return `${transpileToGo(ast.prefix)}
${transpileToGo(ast.process)}`;
    }

    case P.NODES.Log: {
      return `fmt.Println(${transpileToGo(ast.message)})`;
    }
    case P.NODES.InactiveProcess: {
      return '';
    }

    case P.NODES.StringLiteral: {
      return `NewStringMessage("${ast.value}")`;
    }

    case P.NODES.NumberLiteral: {
      return `NewNumberMessage(${ast.value})`;
    }

    case P.NODES.Identifier: {
      return ast.identifier;
    }

    case P.NODES.Declaration: {
      return (
        `func ${ast.identifier.identifier}(` +
        ast.parameters
          .map((identifier) => identifier.identifier + ' Message')
          .join(', ') +
        ` ) {\n` +
        transpileToGo(ast.process) +
        '\n}'
      );
    }

    case P.NODES.Restriction: {
      return (
        ast.channels
          .map(
            (channel) => `
${channel.identifier} := NewChannelMessage()`,
          )
          .join('\n') +
        '\n' +
        transpileToGo(ast.process)
      );
    }

    case P.NODES.SendMessage: {
      switch (ast.channel._tag) {
        case P.NODES.Identifier: {
          return `${ast.channel.identifier}.Channel() <- ${transpileToGo(
            ast.message,
          )}`;
        }
        case P.NODES.ProcessConstant: {
          return `${ast.channel.identifier}(${transpileToGo(ast.message)})`;
        }
      }
      break;
    }

    case P.NODES.ReceiveMessage: {
      return `${transpileToGo(ast.message)} := <- ${
        ast.channel.identifier
      }.Channel()`;
    }

    case P.NODES.ProcessConstant: {
      return `${ast.identifier}()`;
    }

    case P.NODES.ParallelComposition: {
      return `
      // nesting to avoid name collisions, I always use the same name for the channel
      {
        dOne := make(chan struct{}, ${ast.processes.length})
        ${ast.processes
          .map(
            (proc) => `go func(dOne chan <- struct{}){
            ${transpileToGo(proc)}
          dOne <- struct{}{}  // signal completion
        }(dOne)`,
          )
          .join('\n')}
        for i := 0; i < ${ast.processes.length}; i++ {
          <- dOne
        }\n  }\n`;
    }

    case P.NODES.Matching: {
      return `
      if ${transpileToGo(ast.left)} == ${transpileToGo(ast.right)} {
        ${transpileToGo(ast.process)}
      }
      `;
    }

    case P.NODES.Replication: {
      return `
      // nesting to avoid name collisions, I always use the same name for the channel
      {
      goOn := make(chan struct{}, 100)
      for {
        go func(goOn <- chan struct{}){
            ${transpileToGo(ast.process)}
          <- goOn  // signal completion the other way around
        }(goOn)

        goOn <- struct{}{}
      }
    }\n
      `;
    }

    case P.NODES.NonDeterministicChoice: {
      return `{
  PhOnYcHaNnEl := make(chan struct{}, 1)
  PhOnYcHaNnEl <- struct{}{}
  select {
    ${ast.processes.map((process) => {
          switch (process._tag) {
            case P.NODES.ActionPrefix: {
              return `case ${transpileToGo(process.prefix)} :
      ${transpileToGo(process.process)}`
            }
            default: {
              return `case <- PhOnYcHaNnEl :
      ${transpileToGo(process)}`
            }
          }
        }).join('\n    ')}
  }
}`
    }

    // default:
    //   return `// ${ast._tag} not Implemented`;
  }
}
