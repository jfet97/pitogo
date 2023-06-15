import * as P from '../parser/index.js';

const processConstantsAST: Record<string, P.Declaration> = {};
const guardedProcessConstants: string[] = [];

export function isRecursionGuarded(
  node: P.Node,
  visitedProcessConstants: string[] = [],
): void {
  switch (node._tag) {
    case P.NODES.Program: {
      // reset
      for (const k in processConstantsAST) {
        delete processConstantsAST[k];
      }
      guardedProcessConstants.length = 0;

      // defer declarations checking, just collect asts
      node.declarations.forEach((declaration) => {
        if (processConstantsAST[declaration.identifier.identifier]) {
          raise(
            `Process constant ${declaration.identifier.identifier} already declared`,
            declaration,
          );
        } else {
          processConstantsAST[declaration.identifier.identifier] = declaration;
        }
      });

      isRecursionGuarded(node.main);

      node.declarations
        .filter(
          (declaration) =>
            !guardedProcessConstants.includes(
              declaration.identifier.identifier,
            ),
        )
        // check remaining declarations
        .forEach((d) => isRecursionGuarded(d));

      break;
    }
    case P.NODES.Declaration: {
      if (!guardedProcessConstants.includes(node.identifier.identifier)) {
        isRecursionGuarded(node.process, [
          ...visitedProcessConstants,
          node.identifier.identifier,
        ]);
        guardedProcessConstants.push(node.identifier.identifier);
      }

      break;
    }
    case P.NODES.Main: {
      return isRecursionGuarded(node.process);
    }
    // ----------------------------------------------------------------

    case P.NODES.ProcessConstant: {
      if (visitedProcessConstants.includes(node.identifier)) {
        raise(`${P.NODES.ProcessConstant} is not guarded`, node);
      } else {
        if (guardedProcessConstants.includes(node.identifier)) {
          // :)
        } else {
          // check declaration first time is used
          if (!processConstantsAST[node.identifier]) {
            raise(
              `${P.NODES.ProcessConstant} ${node.identifier} is not declared or it is declared after main`,
              node,
            );
          }
          isRecursionGuarded(
            processConstantsAST[node.identifier],
            visitedProcessConstants,
          );
        }
      }
      break;
    }
    case P.NODES.Identifier: {
      raise(`${P.NODES.Identifier} is not guarded`, node);
      break;
    }
    case P.NODES.ActionPrefix: {
      switch (node.prefix._tag) {
        case P.NODES.ReceiveMessage:
        case P.NODES.Log: {
          // :)
          break;
        }
        case P.NODES.SendMessage: {
          switch (node.prefix.channel._tag) {
            case P.NODES.ProcessConstant: {
              isRecursionGuarded(node.prefix.channel, visitedProcessConstants);
              break;
            }
            case P.NODES.Identifier: {
              // :)
              break;
            }
          }

          break;
        }
      }
      isRecursionGuarded(node.process, []);
      break;
    }

    case P.NODES.NonDeterministicChoice: {
      return node.processes.forEach(
        (choice) =>
          !(
            choice._tag === P.NODES.ActionPrefix &&
            (choice.prefix._tag === P.NODES.ReceiveMessage ||
              (choice.prefix._tag === P.NODES.SendMessage &&
                choice.prefix.channel._tag !== P.NODES.ProcessConstant) ||
              choice.prefix._tag === P.NODES.Log)
          ) && raise(`${choice._tag} must be guarded by an action`, choice),
      );
    }

    case P.NODES.ParallelComposition: {
      return node.processes.forEach((choice) =>
        isRecursionGuarded(choice, visitedProcessConstants),
      );
    }

    case P.NODES.Restriction:
    case P.NODES.Matching:
    case P.NODES.Replication: {
      return isRecursionGuarded(node.process, visitedProcessConstants);
    }

    case P.NODES.InactiveProcess: {
      // :)
      // I think it is guarded, but I'm not sure
      raise(`${P.NODES.InactiveProcess} is not guarded`, node);
      break;
    }

    case P.NODES.NumberLiteral: {
      raise(`${P.NODES.NumberLiteral} is not guarded`, node);
      break;
    }

    case P.NODES.StringLiteral: {
      raise(`${P.NODES.StringLiteral} is not guarded`, node);
      break;
    }

    case P.NODES.SendMessage: {
      raise(`${P.NODES.SendMessage} is not guarded`, node);
      break;
    }

    case P.NODES.ReceiveMessage: {
      raise(`${P.NODES.ReceiveMessage} is not guarded`, node);
      break;
    }

    case P.NODES.Log: {
      raise(`${P.NODES.Log} is not guarded`, node);
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
