/* eslint-disable @typescript-eslint/ban-types */
import { Position } from '../common/Position.js';
import { Resolve } from '../utils/index.js';

export const TOKENS = {
  Nil: 'Nil',
  Main: 'Main',
  Log: 'Log',
  Identifier: 'Identifier',
  ProcessConstant: 'ProcessConstant',
  NumberLiteral: 'NumberLiteral',
  StringLiteral: 'StringLiteral',
  Dot: 'Dot',
  Equal: 'Equal',
  Plus: 'Plus',
  Bang: 'Bang',
  VerticalBar: 'VerticalBar',
  Semicolon: 'Semicolon',
  OpenParenthesis: 'OpenParenthesis',
  CloseParenthesis: 'CloseParenthesis',
  OpenBracket: 'OpenBracket',
  CloseBracket: 'CloseBracket',
  OpenAngleBracket: 'OpenAngleBracket',
  CloseAngleBracket: 'CloseAngleBracket',
} as const;

export class Nil {
  _tag = TOKENS.Nil;
  constructor(public position: Position) {}
}

export class Main {
  _tag = TOKENS.Main;
  constructor(public position: Position) {}
}

export class Log {
  _tag = TOKENS.Log;
  constructor(public position: Position) {}
}

export class Identifier {
  _tag = TOKENS.Identifier;
  constructor(public position: Position, public value: string) {}
}

export class ProcessConstant {
  _tag = TOKENS.ProcessConstant;
  constructor(public position: Position, public value: string) {}
}

export class NumberLiteral {
  _tag = TOKENS.NumberLiteral;
  constructor(public position: Position, public value: number) {}
}

export class StringLiteral {
  _tag = TOKENS.StringLiteral;
  constructor(public position: Position, public value: string) {}
}

export class Dot {
  _tag = TOKENS.Dot;
  constructor(public position: Position) {}
}

export class Equal {
  _tag = TOKENS.Equal;
  constructor(public position: Position) {}
}

export class Plus {
  _tag = TOKENS.Plus;
  constructor(public position: Position) {}
}

export class Bang {
  _tag = TOKENS.Bang;
  constructor(public position: Position) {}
}

export class VerticalBar {
  _tag = TOKENS.VerticalBar;
  constructor(public position: Position) {}
}

export class Semicolon {
  _tag = TOKENS.Semicolon;
  constructor(public position: Position) {}
}

export class OpenParenthesis {
  _tag = TOKENS.OpenParenthesis;
  constructor(public position: Position) {}
}

export class CloseParenthesis {
  _tag = TOKENS.CloseParenthesis;
  constructor(public position: Position) {}
}

export class OpenBracket {
  _tag = TOKENS.OpenBracket;
  constructor(public position: Position) {}
}

export class CloseBracket {
  _tag = TOKENS.CloseBracket;
  constructor(public position: Position) {}
}

export class OpenAngleBracket {
  _tag = TOKENS.OpenAngleBracket;
  constructor(public position: Position) {}
}

export class CloseAngleBracket {
  _tag = TOKENS.CloseAngleBracket;
  constructor(public position: Position) {}
}

export type Token =
  | Nil
  | Main
  | Log
  | Identifier
  | ProcessConstant
  | NumberLiteral
  | StringLiteral
  | Dot
  | Equal
  | Plus
  | Bang
  | VerticalBar
  | Semicolon
  | OpenParenthesis
  | CloseParenthesis
  | OpenBracket
  | CloseBracket
  | OpenAngleBracket
  | CloseAngleBracket;

// utils
export function buildToken<TAG extends Token['_tag']>(
  tag: TAG,
  args: Resolve<Omit<Extract<Token, { _tag: TAG }>, '_tag'>>,
): Extract<Token, { _tag: TAG }> {
  const position = args.position;
  switch (tag) {
    case TOKENS.Nil:
      return new Nil(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Main:
      return new Main(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Log:
      return new Log(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Identifier:
      return new Identifier(
        position,
        // @ts-expect-error it cannot narrow down the type
        args.value,
      ) as Extract<Token, { _tag: TAG }>;
    case TOKENS.ProcessConstant:
      return new ProcessConstant(
        position,
        // @ts-expect-error it cannot narrow down the type
        args.value,
      ) as Extract<Token, { _tag: TAG }>;
    case TOKENS.NumberLiteral:
      return new NumberLiteral(
        position,
        // @ts-expect-error it cannot narrow down the type
        args.value,
      ) as Extract<Token, { _tag: TAG }>;
    case 'StringLiteral':
      return new StringLiteral(
        position,
        // @ts-expect-error it cannot narrow down the type
        args.value,
      ) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Dot:
      return new Dot(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Equal:
      return new Equal(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Plus:
      return new Plus(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Bang:
      return new Bang(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.VerticalBar:
      return new VerticalBar(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.Semicolon:
      return new Semicolon(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.OpenParenthesis:
      return new OpenParenthesis(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.CloseParenthesis:
      return new CloseParenthesis(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.OpenBracket:
      return new OpenBracket(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.CloseBracket:
      return new CloseBracket(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.OpenAngleBracket:
      return new OpenAngleBracket(position) as Extract<Token, { _tag: TAG }>;
    case TOKENS.CloseAngleBracket:
      return new CloseAngleBracket(position) as Extract<Token, { _tag: TAG }>;
    default:
      throw new Error(`Unknown token tag: ${tag}`);
  }
}
