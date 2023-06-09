import * as P from '../parser/index.js';
import * as C from '../common/index.js';

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

const processConstantsAST: Record<string, P.Declaration> = {};

export function transpileToGo(ast: P.Node): string {
  switch (ast._tag) {
    case P.NODES.Program: {
      // reset
      for (const k in processConstantsAST) {
        delete processConstantsAST[k];
      }

      return `
package main

import (
  "fmt"
  "math/rand"
)

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

// usage: fmt.Println(NewStringMessage("hello"))
// result: Message<"hello">
func (m Message) Println() {
	fmt.Println(m.String())
}



func main() {
  ${ast.declarations
    .map((d) => `${d.identifier.identifier} := ${transpileToGo(d)}`)
    .join('\n')}

  ${transpileToGo(ast.main)}

  // Avoid declared and not used errors
${ast.declarations.map((d) => `_ = ${d.identifier.identifier}`).join('\n')}
}`;
    }

    case P.NODES.Main: {
      return `${transpileToGo(ast.process)}`;
    }

    case P.NODES.ActionPrefix: {
      if (ast.process._tag === P.NODES.InactiveProcess) {
        return `${transpileToGo(ast.prefix)}`;
      } else {
        return `${transpileToGo(ast.prefix)}
          ${transpileToGo(ast.process)}`;
      }
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
      processConstantsAST[ast.identifier.identifier] = ast;
      return (
        `func (` +
        ast.parameters
          .map((identifier) => identifier.identifier + ' Message')
          .join(', ') +
        `) {
          ${transpileToGo(ast.process)}
        }
        `
      );
    }

    case P.NODES.Restriction: {
      return (
        ast.channels
          .map(
            (channel) => `
${channel.identifier} := NewChannelMessage()
_ = ${channel.identifier}`,
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
      const p = transpileToGo(handleReplicatedProcess(ast.process));

      return `
      {
        goOn := NewChannelMessage()
        aA := 300
        bB := rand.Intn(100)
        for ; bB < aA; {
          go func(){
          ${p}
          }()
          go func(){
            ${p}
          }()
          <- goOn.Channel()
          }
        }
    `;
    }

    case P.NODES.NonDeterministicChoice: {
      return `{
        ${
          ast.processes.some(
            (proc) =>
              proc._tag == P.NODES.ActionPrefix &&
              proc.prefix._tag == P.NODES.Log,
          )
            ? `
        pHoNyChAnNeL := make(chan struct{}, 1)
        pHoNyChAnNeL <- struct{}{}
        `
            : ''
        }
  select {
    ${ast.processes
      .map((process) => {
        switch (process._tag) {
          case P.NODES.ActionPrefix: {
            switch (process.prefix._tag) {
              case P.NODES.Log: {
                return `case <-pHoNyChAnNeL :
                ${transpileToGo(process.prefix)}
                ${transpileToGo(process.process)}`;
              }
              default: {
                return `case ${transpileToGo(process.prefix)} :
                ${transpileToGo(process.process)}`;
              }
            }
          }
          default: {
            raise('non guarded non-determnism not implemented', ast);
          }
        }
      })
      .join('\n    ')}
  }
}`;
    }

    // default:
    //   return `// ${ast._tag} not Implemented`;
  }
}

function handleReplicatedProcess(process: P.Process): P.Process {
  const signalFirstMoveDone = P.buildNode(P.NODES.SendMessage, {
    channel: P.buildNode(P.NODES.Identifier, {
      identifier: 'goOn',
      position: C.Position.dummy(),
    }),
    position: C.Position.dummy(),
    message: P.buildNode(P.NODES.StringLiteral, {
      position: C.Position.dummy(),
      value: 'first move done',
    }),
  });

  const actionPrefixToSignalFirstMove = P.buildNode(P.NODES.ActionPrefix, {
    position: C.Position.dummy(),
    prefix: signalFirstMoveDone,
    process: null as unknown as P.Process, // <- temp, will be filled soon
  });

  switch (process._tag) {
    case P.NODES.InactiveProcess: {
      raise(
        'Replication of an InactiveProcess is bisimilar to an InactiveProcess. The parser should handle that.',
        process,
      );
      break;
    }
    case P.NODES.Replication: {
      raise(
        'Replication of an Replication is bisimilar to a single Replication. The parser should handle that.',
        process,
      );
      break;
    }

    case P.NODES.ProcessConstant: {
      const decl = processConstantsAST[process.identifier];
      if (!decl) {
        raise(
          `Process constant ${process.identifier} not declared or it is declared after main`,
          process,
        );
      }
      return handleReplicatedProcess(decl.process);
    }

    case P.NODES.ActionPrefix: {
      // clone the process node, to do this without changing the original ast
      const processprocess = process.process;
      process.process = null as unknown as P.Process; // <-- temp: to not recursively clone the process
      const processClone = JSON.parse(
        JSON.stringify(process),
      ) as P.ActionPrefix;

      process.process = processprocess;
      processClone.process = processprocess;

      actionPrefixToSignalFirstMove.process = processClone.process;
      processClone.process = actionPrefixToSignalFirstMove;
      return processClone;
    }

    case P.NODES.Restriction:
    case P.NODES.Matching: {
      // clone the process node, to do this without changing the original ast
      const processprocess = process.process;
      process.process = null as unknown as P.Process; // <-- temp: to not recursively clone the process
      const processClone = JSON.parse(JSON.stringify(process)) as
        | P.Restriction
        | P.Matching;
      process.process = processprocess;
      processClone.process = handleReplicatedProcess(processprocess);

      return processClone;
    }

    case P.NODES.ParallelComposition:
    case P.NODES.NonDeterministicChoice: {
      // clone the process node, to do this without changing the original ast
      const processprocesses = process.processes;
      process.processes = []; // <-- temp: to not recursively clone the process
      const processClone = JSON.parse(JSON.stringify(process)) as
        | P.ParallelComposition
        | P.NonDeterministicChoice;
      process.processes = processprocesses;
      processClone.processes = processprocesses.map(handleReplicatedProcess);

      return processClone;
    }

    default: {
      raise('handleReplicatedProcess is not exaustive', process);
      break;
    }
  }
}

// error
function raise(message: string, node: P.Node): never {
  throw {
    message: `Error: ${message}`,
    position: node.position,
  };
}
