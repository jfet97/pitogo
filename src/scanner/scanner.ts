import { Position } from '../common/Position.js';
import { TAGS, Token, buildToken } from './tokens.js';

const KEYWORDS = ['nil'];

export function scanner(input: string): Token[] {
  const toRet = [];

  let index = 0; // position in input
  let start = 0; // start of the current lexeme
  let row = 1; // current row
  let column = 1; // current column

  function advance(): string {
    column++;
    return input[index++] ?? '';
  }
  function peek(): string {
    return input[index] ?? '';
  }
  function isAtEnd(): boolean {
    return index >= input.length;
  }
  function newline(): void {
    row++;
    column = 1;
  }

  let position = new Position(row, row, column, column);
  function refreshPosition(): void {
    position = new Position(row, row, column, column);
  }

  function addToken(tokenTag: Token['_tag'], value?: string | number): void {
    position.column_end = column - 1;
    position.row_end = row;

    const tokenArgs = {
      position,
      value,
    };
    toRet.push(buildToken(tokenTag, tokenArgs));
  }

  while (index < input.length) {
    const char = advance();

    switch (char) {
      case '.': {
        addToken(TAGS.Dot);
        break;
      }
      case '=': {
        addToken(TAGS.Equal);
        break;
      }
      case '+': {
        addToken(TAGS.Plus);
        break;
      }
      case '!': {
        addToken(TAGS.Bang);
        break;
      }
      case '|': {
        addToken(TAGS.VerticalBar);
        break;
      }
      case ';': {
        addToken(TAGS.Semicolon);
        break;
      }
      case '(': {
        addToken(TAGS.OpenParenthesis);
        break;
      }
      case ')': {
        addToken(TAGS.CloseParenthesis);
        break;
      }
      case '[': {
        addToken(TAGS.OpenBracket);
        break;
      }
      case ']': {
        addToken(TAGS.CloseBracket);
        break;
      }
      case '<': {
        addToken(TAGS.OpenAngleBracket);
        break;
      }
      case '>': {
        addToken(TAGS.CloseAngleBracket);
        break;
      }
      case '"': {
        while (peek() !== '"' && !isAtEnd()) {
          if (peek() === '\n') newline();
          advance();
        }

        if (isAtEnd()) {
          throw new Error('Unterminated string');
        }

        // the closing "
        advance();
        addToken(TAGS.StringLiteral, input.slice(start + 1, index - 1));
        break;
      }

      // ignore whitespaces
      case ' ':
      case '\r':
      case '\t': {
        break;
      }

      case '\n': {
        newline();
        break;
      }

      default: {
        if (/[0-9]/.test(char)) {
          // handle numeric literals

          while (/[0-9]/.test(peek())) {
            advance();
          }

          if (peek() === '.') {
            // consume the dot
            advance();

            while (/[0-9]/.test(peek())) {
              advance();
            }
          }

          addToken(TAGS.NumberLiteral, Number(input.slice(start, index)));
        } else if (/[a-zA-Z_]/.test(char)) {
          // handle identifiers and keywords

          while (/[a-zA-Z0-9_]/.test(peek())) {
            advance();
          }

          const identifier = input.slice(start, index);

          if (KEYWORDS.includes(identifier)) {
            addToken(TAGS.Nil);
          } else {
            addToken(TAGS.Identifier, identifier);
          }
        } else {
          throw new Error(`Unexpected character: ${char}`);
        }
      }
    }

    refreshPosition();
    start = index;
  }

  return toRet;
}
