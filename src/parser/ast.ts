import { Position } from '../common/Position.js';
import { Resolve } from '../utils/index.js';

export const NODES = {
  Program: 'Program',
  Declaration: 'Declaration',
  Main: 'Main',
  Log: 'Log',
  SendMessage: 'SendMessage',
  ReceiveMessage: 'ReceiveMessage',
  InactiveProcess: 'InactiveProcess',
  ProcessConstant: 'ProcessConstant',
  Identifier: 'Identifier',
  NumberLiteral: 'NumberLiteral',
  StringLiteral: 'StringLiteral',
  ActionPrefix: 'ActionPrefix',
  Matching: 'Matching',
  NonDeterministicChoice: 'NonDeterministicChoice',
  ParallelComposition: 'ParallelComposition',
  Restriction: 'Restriction',
  Replication: 'Replication',
} as const;

export class Program {
  _tag = NODES.Program;
  constructor(
    public position: Position,
    public declarations: Declaration[],
    public main: Main,
  ) {}
}

export class Declaration {
  _tag = NODES.Declaration;
  constructor(
    public position: Position,
    public identifier: ProcessConstant,
    public process: Process,
  ) {}
}

export class Main {
  _tag = NODES.Main;
  constructor(public position: Position, public process: Process) {}
}

export class Log {
  _tag = NODES.Log;
  constructor(public position: Position, public message: Message) {}
}

export class SendMessage {
  _tag = NODES.SendMessage;
  constructor(
    public position: Position,
    public channel: Identifier,
    public message: Message,
  ) {}
}

export class ReceiveMessage {
  _tag = NODES.ReceiveMessage;
  constructor(
    public position: Position,
    public channel: Identifier,
    public message: Message,
  ) {}
}

export class InactiveProcess {
  _tag = NODES.InactiveProcess;
  constructor(public position: Position) {}
}

export class ProcessConstant {
  _tag = NODES.ProcessConstant;
  constructor(public position: Position, public identifier: string) {}
}

export class Identifier {
  _tag = NODES.Identifier;
  constructor(public position: Position, public identifier: string) {}
}

export class NumberLiteral {
  _tag = NODES.NumberLiteral;
  constructor(public position: Position, public value: number) {}
}

export class StringLiteral {
  _tag = NODES.StringLiteral;
  constructor(public position: Position, public value: string) {}
}

export class ActionPrefix {
  _tag = NODES.ActionPrefix;
  constructor(
    public position: Position,
    public prefix: Prefix,
    public process: Process,
  ) {}
}

export class Matching {
  _tag = NODES.Matching;
  constructor(
    public position: Position,
    public left: Identifier,
    public right: Identifier,
    public process: Process,
  ) {}
}

export class NonDeterministicChoice {
  _tag = NODES.NonDeterministicChoice;
  constructor(public position: Position, public processes: Process[]) {}
}

export class ParallelComposition {
  _tag = NODES.ParallelComposition;
  constructor(public position: Position, public processes: Process[]) {}
}

export class Restriction {
  _tag = NODES.Restriction;
  constructor(
    public position: Position,
    public channels: Identifier[],
    public process: Process,
  ) {}
}

export class Replication {
  _tag = NODES.Replication;
  constructor(public position: Position, public process: Process) {}
}

export type Message = StringLiteral | NumberLiteral | Identifier;

export type Prefix = Log | SendMessage | ReceiveMessage;

export type Process =
  | InactiveProcess
  | ProcessConstant
  | ActionPrefix
  | Matching
  | NonDeterministicChoice
  | ParallelComposition
  | Restriction
  | Replication;

export type Node =
  | Program
  | Declaration
  | Main
  | SendMessage
  | ReceiveMessage
  | Log
  | InactiveProcess
  | ProcessConstant
  | Identifier
  | NumberLiteral
  | StringLiteral
  | ActionPrefix
  | Matching
  | NonDeterministicChoice
  | ParallelComposition
  | Restriction
  | Replication;

export function buildNode<NODE extends Node['_tag']>(
  tag: NODE,
  args: Resolve<Omit<Extract<Node, { _tag: NODE }>, '_tag'>>,
): Extract<Node, { _tag: NODE }> {
  const position = args.position;

  switch (tag) {
    case NODES.Program: {
      // @ts-expect-error it cannot narrow down the type
      return new Program(position, args.declarations, args.main);
    }
    case NODES.Declaration: {
      // @ts-expect-error it cannot narrow down the type
      return new Declaration(position, args.identifier, args.process);
    }
    case NODES.Main: {
      // @ts-expect-error it cannot narrow down the type
      return new Main(position, args.process);
    }
    case NODES.SendMessage: {
      // @ts-expect-error it cannot narrow down the type
      return new SendMessage(position, args.channel, args.message);
    }
    case NODES.ReceiveMessage: {
      // @ts-expect-error it cannot narrow down the type
      return new ReceiveMessage(position, args.channel, args.message);
    }
    case NODES.Log: {
      // @ts-expect-error it cannot narrow down the type
      return new Log(position, args.message);
    }
    case NODES.InactiveProcess: {
      // @ts-expect-error it cannot narrow down the type
      return new InactiveProcess(position);
    }
    case NODES.ProcessConstant: {
      // @ts-expect-error it cannot narrow down the type
      return new ProcessConstant(position, args.identifier);
    }
    case NODES.Identifier: {
      // @ts-expect-error it cannot narrow down the type
      return new Identifier(position, args.identifier);
    }
    case NODES.NumberLiteral: {
      // @ts-expect-error it cannot narrow down the type
      return new NumberLiteral(position, args.value);
    }
    case NODES.StringLiteral: {
      // @ts-expect-error it cannot narrow down the type
      return new StringLiteral(position, args.value);
    }
    case NODES.ActionPrefix: {
      // @ts-expect-error it cannot narrow down the type
      return new ActionPrefix(position, args.prefix, args.process);
    }
    case NODES.Matching: {
      // @ts-expect-error it cannot narrow down the type
      return new Matching(position, args.left, args.right, args.process);
    }
    case NODES.NonDeterministicChoice: {
      // @ts-expect-error it cannot narrow down the type
      return new NonDeterministicChoice(position, args.processes);
    }
    case NODES.ParallelComposition: {
      // @ts-expect-error it cannot narrow down the type
      return new ParallelComposition(position, args.processes);
    }
    case NODES.Restriction: {
      // @ts-expect-error it cannot narrow down the type
      return new Restriction(position, args.channels, args.process);
    }
    case NODES.Replication: {
      // @ts-expect-error it cannot narrow down the type
      return new Replication(position, args.process);
    }
    default:
      throw new Error(`Unknown node tag: ${tag}`);
  }
}
