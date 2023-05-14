import { Position } from '../common/Position.js';
import { TOKENS, Token, buildToken } from './tokens.js';

const KEYWORDS = ['nil', 'main', 'log'];

export function scanner(input: string): Token[] {
  const toRet: Token[] = [];

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
        addToken(TOKENS.Dot);
        break;
      }
      case '=': {
        addToken(TOKENS.Equal);
        break;
      }
      case '+': {
        addToken(TOKENS.Plus);
        break;
      }
      case '!': {
        addToken(TOKENS.Bang);
        break;
      }
      case '|': {
        addToken(TOKENS.VerticalBar);
        break;
      }
      case ';': {
        addToken(TOKENS.Semicolon);
        break;
      }
      case '(': {
        addToken(TOKENS.OpenParenthesis);
        break;
      }
      case ')': {
        addToken(TOKENS.CloseParenthesis);
        break;
      }
      case '[': {
        addToken(TOKENS.OpenBracket);
        break;
      }
      case ']': {
        addToken(TOKENS.CloseBracket);
        break;
      }
      case '<': {
        addToken(TOKENS.OpenAngleBracket);
        break;
      }
      case '>': {
        addToken(TOKENS.CloseAngleBracket);
        break;
      }
      case '"': {
        while (peek() !== '"' && !isAtEnd()) {
          if (peek() === '\n') newline();
          advance();
        }

        if (isAtEnd()) {
          raise('Unterminated string');
        }

        // the closing "
        advance();
        addToken(TOKENS.StringLiteral, input.slice(start + 1, index - 1));
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

          addToken(TOKENS.NumberLiteral, Number(input.slice(start, index)));
        } else if (/[a-zA-Z_]/.test(char)) {
          // handle identifiers and keywords

          while (/[a-zA-Z0-9_]/.test(peek())) {
            advance();
          }

          const identifier = input.slice(start, index);

          if (KEYWORDS.includes(identifier)) {
            if (identifier === 'nil') {
              addToken(TOKENS.Nil);
            } else if (identifier === 'main') {
              addToken(TOKENS.Main);
            } else if (identifier === 'log') {
              addToken(TOKENS.Log);
            }
          } else {
            if (identifier.toLowerCase() === identifier) {
              addToken(TOKENS.Identifier, identifier);
            } else if (identifier.toUpperCase() === identifier) {
              addToken(TOKENS.ProcessConstant, identifier);
            } else {
              raise(
                `Unexpected identifier: ${identifier}. Use only lowercase for channels and messages, uppercase for process constants`,
              );
            }
          }
        } else {
          raise(`Unexpected character: ${char}`);
        }
      }
    }

    refreshPosition();
    start = index;
  }

  return toRet;

  // error
  function raise(message: string): never {
    throw {
      message: `Error: ${message}`,
      position,
    };
  }
}
