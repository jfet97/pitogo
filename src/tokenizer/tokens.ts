/* eslint-disable @typescript-eslint/ban-types */
import { Position } from '../common/Position.js';
import { Resolve } from '../utils/index.js';

export const TAGS = {
  Nil: 'Nil',
  Identifier: 'Identifier',
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
  _tag = TAGS.Nil;
  constructor(public position: Position) {}
}

export class Identifier {
  _tag = TAGS.Identifier;
  constructor(public position: Position, public value: string) {}
}

export class NumberLiteral {
  _tag = TAGS.NumberLiteral;
  constructor(public position: Position, public value: number) {}
}

export class StringLiteral {
  _tag = TAGS.StringLiteral;
  constructor(public position: Position, public value: string) {}
}

export class Dot {
  _tag = TAGS.Dot;
  constructor(public position: Position) {}
}

export class Equal {
  _tag = TAGS.Equal;
  constructor(public position: Position) {}
}

export class Plus {
  _tag = TAGS.Plus;
  constructor(public position: Position) {}
}

export class Bang {
  _tag = TAGS.Bang;
  constructor(public position: Position) {}
}

export class VerticalBar {
  _tag = TAGS.VerticalBar;
  constructor(public position: Position) {}
}

export class Semicolon {
  _tag = TAGS.Semicolon;
  constructor(public position: Position) {}
}

export class OpenParenthesis {
  _tag = TAGS.OpenParenthesis;
  constructor(public position: Position) {}
}

export class CloseParenthesis {
  _tag = TAGS.CloseParenthesis;
  constructor(public position: Position) {}
}

export class OpenBracket {
  _tag = TAGS.OpenBracket;
  constructor(public position: Position) {}
}

export class CloseBracket {
  _tag = TAGS.CloseBracket;
  constructor(public position: Position) {}
}

export class OpenAngleBracket {
  _tag = TAGS.OpenAngleBracket;
  constructor(public position: Position) {}
}

export class CloseAngleBracket {
  _tag = TAGS.CloseAngleBracket;
  constructor(public position: Position) {}
}

export type Token =
  | Nil
  | Identifier
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
    case TAGS.Nil:
      return new Nil(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.Identifier:
      return new Identifier(
        position,
        // @ts-expect-error it cannot narrow down the type
        args.value,
      ) as Extract<Token, { _tag: TAG }>;
    case TAGS.NumberLiteral:
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
    case TAGS.Dot:
      return new Dot(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.Equal:
      return new Equal(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.Plus:
      return new Plus(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.Bang:
      return new Bang(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.VerticalBar:
      return new VerticalBar(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.Semicolon:
      return new Semicolon(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.OpenParenthesis:
      return new OpenParenthesis(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.CloseParenthesis:
      return new CloseParenthesis(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.OpenBracket:
      return new OpenBracket(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.CloseBracket:
      return new CloseBracket(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.OpenAngleBracket:
      return new OpenAngleBracket(position) as Extract<Token, { _tag: TAG }>;
    case TAGS.CloseAngleBracket:
      return new CloseAngleBracket(position) as Extract<Token, { _tag: TAG }>;
    default:
      throw new Error(`Unknown token tag: ${tag}`);
  }
}
