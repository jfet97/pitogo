import * as AST from './ast.js';

// write a pretty print function for the ast
export function prettyPrint(curr: AST.Node, indent = 0): string {
  const currSpace = Array(indent + 1).join(' ');
  let currStr = '';
  switch (curr._tag) {
    case AST.NODES.Program: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Declarations:\n` +
        curr.declarations
          .map((declaration) => prettyPrint(declaration, indent + 2))
          .join('\n') +
        `${currSpace}Main: \n` +
        prettyPrint(curr.main, indent + 2);

      break;
    }
    case AST.NODES.Declaration: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Identifier:\n` +
        prettyPrint(curr.identifier, indent + 2) +
        `${currSpace}Process:\n` +
        prettyPrint(curr.process, indent + 2);

      break;
    }
    case AST.NODES.Main: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Process:\n` +
        prettyPrint(curr.process, indent + 2);

      break;
    }
    case AST.NODES.Log: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Message:\n` +
        prettyPrint(curr.message, indent + 2);

      break;
    }

    case AST.NODES.SendMessage: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Channel:\n` +
        prettyPrint(curr.channel, indent + 2) +
        `${currSpace}Message:\n` +
        prettyPrint(curr.message, indent + 2);

      break;
    }
    case AST.NODES.ReceiveMessage: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Channel:\n` +
        prettyPrint(curr.channel, indent + 2) +
        `${currSpace}Message:\n` +
        prettyPrint(curr.message, indent + 2);
      break;
    }
    case AST.NODES.InactiveProcess: {
      currStr += `${currSpace}Node: ${curr._tag}\n`;
      break;
    }
    case AST.NODES.ProcessConstant: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Identifier: ${curr.identifier}\n`;
      break;
    }
    case AST.NODES.Identifier: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Identifier: ${curr.identifier}\n`;
      break;
    }
    case AST.NODES.NumberLiteral: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` + `${currSpace}Value: ${curr.value}`;
      break;
    }
    case AST.NODES.StringLiteral: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` + `${currSpace}Value: ${curr.value}`;
      break;
    }
    case AST.NODES.ParallelComposition: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Processes:` +
        curr.processes
          .map((process) => prettyPrint(process, indent + 2))
          .join('\n');
      break;
    }
    case AST.NODES.NonDeterministicChoice: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Processes:` +
        curr.processes
          .map((process) => prettyPrint(process, indent + 2))
          .join('\n');
      break;
    }
    case AST.NODES.ActionPrefix: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Prefix:\n` +
        prettyPrint(curr.prefix, indent + 2) +
        `${currSpace}Process:\n` +
        prettyPrint(curr.process, indent + 2);
      break;
    }
    case AST.NODES.Matching: {
      currStr +=
        `${currSpace}Node: ${curr._tag}\n` +
        `${currSpace}Left:\n` +
        prettyPrint(curr.left, indent + 2) +
        `${currSpace}Right:\n` +
        prettyPrint(curr.right, indent + 2);
      break;
    }
  }

  return currStr;
}
