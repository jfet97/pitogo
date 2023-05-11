import { Position } from '../common/Position.js';
import * as S from '../scanner/index.js';
import * as AST from './ast.js';

// :)
// Program -> Declaration* Main
// Declaration -> ProcessConstant (TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis)? TOKENS.Equal Process TOKENS.Semicolon
// Main -> TOKENS.Main TOKENS.Equal Process TOKENS.Semicolon
// Process -> Replication
// Replication -> (TOKENS.Bang)* Restriction
// Restriction -> (TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis)* ParallelComposition
// ParallelComposition -> NonDeterministicChoice (TOKENS.VerticalBar NonDeterministicChoice)*
// NonDeterministicChoice -> Matching (TOKENS.Plus Matching)*
// Matching -> (TOKENS.OpenBracket Identifier TOKENS.Equal Identifier TOKENS.CloseBracket)* ActionPrefix
// ActionPrefix -> (Prefix TOKEN.Dot)* (Prefix | primary)
// Prefix ->  LogMessage | SendMessage | ReceiveMessage
// SendMessage -> (Identifier | ProcessConstant) TOKENS.OpenAngleBracket Message TOKENS.CloseAngleBracket
// ReceiveMessage -> Identifier TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis
// LogMessage -> TOKENS.Log TOKENS.OpenAngleBracket Message TOKENS.CloseAngleBracket
// Message -> StringLiteral | NumberLiteral | Identifier
// primary -> InactiveProcess | ProcessConstant | TOKENS.OpenParenthesis Process TOKENS.CloseParenthesis
// InactiveProcess -> TOKENS.Nil

// LL(2) parser ???
export function parse(tokens: readonly S.Token[]): AST.Program {
  let index = 0;

  function isAtEnd(n = 0): boolean {
    return index + n === tokens.length;
  }
  function check(tag: S.Token['_tag'], n = 0): boolean {
    return !isAtEnd() && tokens[index + n]?._tag === tag;
  }
  function advance(): S.Token {
    return tokens[index++];
  }
  function match(tag: S.Token['_tag']): boolean {
    return check(tag) && !!advance();
  }
  // function back(n = 1): void {
  //   index -= n;
  // }

  // parsers

  function parseProgram(): AST.Program {
    // Program -> Declaration* Main

    const declarations: AST.Declaration[] = [];

    while (!check(S.TOKENS.Main)) {
      declarations.push(parseDeclaration());
    }

    const main = parseMain();

    return AST.buildNode(AST.NODES.Program, {
      position: new Position(
        declarations[0]?.position.row_start ?? main.position.row_start,
        main.position.row_end,
        declarations[0]?.position.column_start ?? main.position.column_start,
        main.position.column_end,
      ),
      declarations,
      main,
    });
  }

  function parseDeclaration(): AST.Declaration {
    // Declaration -> ProcessConstant (TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis)? TOKENS.Equal Process TOKENS.Semicolon

    // identifier
    const processConstant = parseProcessConstant();

    const parameters: AST.Identifier[] = []
    if (check(S.TOKENS.OpenParenthesis)){
      parseOpenParenthesis()
      parameters.push(parseIdentifier())
      parseCloseParenthesis()
    }

    // equal
    if (!match(S.TOKENS.Equal)) {
      raise('Expected an equal sign');
    }

    // process
    const process = parseProcess();

    // semicolon
    const semicolon = parseSemicolon();

    // result
    return AST.buildNode(AST.NODES.Declaration, {
      position: new Position(
        processConstant.position.row_start,
        semicolon.position.row_end,
        processConstant.position.column_start,
        semicolon.position.column_end,
      ),
      identifier: AST.buildNode(AST.NODES.ProcessConstant, {
        position: processConstant.position,
        identifier: processConstant.identifier,
      }),
      parameters,
      process,
    });
  }

  function parseMain(): AST.Main {
    // Main -> TOKENS.Main TOKENS.Equal Process TOKENS.Semicolon

    // main
    if (!check(S.TOKENS.Main)) {
      raise('Expected the main keyword');
    }
    const main = advance();

    // equal
    if (!match(S.TOKENS.Equal)) {
      raise('Expected an equal sign');
    }

    // process
    const process = parseProcess();

    // semicolon
    if (!check(S.TOKENS.Semicolon)) {
      raise('Expected a semicolon');
    }
    const semicolon = advance();

    // result
    return AST.buildNode(AST.NODES.Main, {
      position: new Position(
        main.position.row_start,
        semicolon.position.row_end,
        main.position.column_start,
        semicolon.position.column_end,
      ),
      process,
    });
  }

  function parseProcess(): AST.Process {
    // Process -> Replication

    return parseReplication();
  }

  function parsePrefix(): AST.Prefix {
    // Prefix ->  LogMessage | SendMessage | ReceiveMessage

    if (check(S.TOKENS.Log)) {
      return parseLogMessage();
    } else if (check(S.TOKENS.OpenAngleBracket, 1)) {
      return parseSendMessage();
    } else if (check(S.TOKENS.OpenParenthesis, 1)) {
      return parseReceiveMessage();
    } else {
      raise('Unexpected prefix type');
    }
  }

  function parseSendMessage(): AST.SendMessage {
    // SendMessage -> (Identifier | ProcessConstant) TOKENS.OpenAngleBracket Message TOKENS.CloseAngleBracket

    const channel = check(AST.NODES.Identifier) ? parseIdentifier() : parseProcessConstant();

    if (!match(S.TOKENS.OpenAngleBracket)) {
      raise('Expected an open angle bracket');
    }

    const message = parseMessage();

    const closeAngleBracket = parseCloseAngleBracket();

    return AST.buildNode(AST.NODES.SendMessage, {
      position: new Position(
        channel.position.row_start,
        closeAngleBracket.position.row_end,
        channel.position.column_start,
        closeAngleBracket.position.column_end,
      ),
      channel,
      message,
    });
  }
  function parseReceiveMessage(): AST.ReceiveMessage {
    // ReceiveMessage -> Identifier TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis

    const channel = parseIdentifier();

    if (!match(S.TOKENS.OpenParenthesis)) {
      raise('Expected an open parenthesis');
    }

    const message = parseIdentifier();

    if (!match(S.TOKENS.CloseParenthesis)) {
      raise('Expected a close parenthesis');
    }

    return AST.buildNode(AST.NODES.ReceiveMessage, {
      position: new Position(
        channel.position.row_start,
        message.position.row_end,
        channel.position.column_start,
        message.position.column_end,
      ),
      channel,
      message,
    });
  }

  function parseLogMessage(): AST.Log {
    // LogMessage -> TOKENS.Log TOKENS.OpenAngleBracket Message TOKENS.CloseAngleBracket

    if (!check(S.TOKENS.Log)) {
      raise('Expected a log');
    }

    const log = advance() as S.Log;

    if (!match(S.TOKENS.OpenAngleBracket)) {
      raise('Expected an open angle bracket');
    }

    const message = parseMessage();

    const closeAngleBracket = parseCloseAngleBracket();

    return AST.buildNode(AST.NODES.Log, {
      position: new Position(
        log.position.row_start,
        closeAngleBracket.position.row_end,
        log.position.column_start,
        closeAngleBracket.position.column_end,
      ),
      message,
    });
  }

  function parseMessage(): AST.Message {
    // Message -> StringLiteral | NumberLiteral | Identifier

    if (check(S.TOKENS.StringLiteral)) {
      return parseStringLiteral();
    } else if (check(S.TOKENS.NumberLiteral)) {
      return parseNumberLiteral();
    } else if (check(S.TOKENS.Identifier)) {
      return parseIdentifier();
    } else {
      raise('Unexpected message type');
    }
  }

  function parseMatching(): AST.Process {
    // Matching -> (TOKENS.OpenBracket Identifier TOKENS.Equal Identifier TOKENS.CloseBracket)* ActionPrefix

    const matches: AST.Matching[] = [];

    while (check(S.TOKENS.OpenBracket)) {
      // open bracket
      if (!match(S.TOKENS.OpenBracket)) {
        raise('Expected an open bracket');
      }

      const channel_1 = parseIdentifier();

      // equal
      if (!match(S.TOKENS.Equal)) {
        raise('Expected an equal sign');
      }

      const channel_2 = parseIdentifier();

      // closed bracket
      if (!match(S.TOKENS.CloseBracket)) {
        raise('Expected a close bracket');
      }

      matches.push(
        AST.buildNode(AST.NODES.Matching, {
          left: channel_1,
          right: channel_2,
          process: null as unknown as AST.Process, // temp
          // temp
          position: new Position(
            channel_1.position.row_start,
            channel_1.position.row_end,
            channel_1.position.column_start,
            channel_1.position.column_end,
          ),
        }),
      );
    }

    const process = parseActionPrefix();

    // align matches
    matches.reduceRight<AST.Process>((process, match) => {
      match.process = process;

      match.position.column_end = process.position.column_end;
      match.position.row_end = process.position.row_end;

      return match;
    }, process);

    return matches.length ? matches[0] : process;
  }

  function parseNonDeterministicChoice(): AST.Process {
    // NonDeterministicChoice -> Matching (TOKENS.Plus Matching)*

    const matches: AST.Process[] = [parseMatching()];

    while (check(S.TOKENS.Plus)) {
      if (!match(S.TOKENS.Plus)) {
        raise('Expected a plus');
      }

      matches.push(parseMatching());
    }

    return matches.length >= 2
      ? AST.buildNode(AST.NODES.NonDeterministicChoice, {
          position: new Position(
            matches[0].position.row_start,
            matches[matches.length - 1].position.row_end,
            matches[0].position.column_start,
            matches[matches.length - 1].position.column_end,
          ),
          processes: matches,
        })
      : matches[0];
  }

  function parseParallelComposition(): AST.Process {
    // ParallelComposition -> NonDeterministicChoice (TOKENS.VerticalBar NonDeterministicChoice)*

    const processes: AST.Process[] = [parseNonDeterministicChoice()];

    while (check(S.TOKENS.VerticalBar)) {
      if (!match(S.TOKENS.VerticalBar)) {
        raise('Expected a vertical bar');
      }

      processes.push(parseNonDeterministicChoice());
    }

    return processes.length >= 2
      ? AST.buildNode(AST.NODES.ParallelComposition, {
          position: new Position(
            processes[0].position.row_start,
            processes[processes.length - 1].position.row_end,
            processes[0].position.column_start,
            processes[processes.length - 1].position.column_end,
          ),
          processes,
        })
      : processes[0];
  }

  function parseActionPrefix(): AST.Process {
    // ActionPrefix -> (Prefix TOKEN.Dot)* (Prefix | primary)

    const prefixes: AST.ActionPrefix[] = [];

    let shouldParsePrimary = true;

    while (
      (check(S.TOKENS.Identifier) || check(S.TOKENS.Log)) || (check(S.TOKENS.ProcessConstant) && check(S.TOKENS.OpenAngleBracket, 1))&&
      shouldParsePrimary
    ) {
      const prefix = parsePrefix();

      if (!check(S.TOKENS.Dot)) {
        shouldParsePrimary = false;
      } else {
        match(S.TOKENS.Dot);
      }

      prefixes.push(
        AST.buildNode(AST.NODES.ActionPrefix, {
          // temp
          position: new Position(
            prefix.position.row_start,
            prefix.position.row_end,
            prefix.position.column_start,
            prefix.position.column_end,
          ),
          prefix,
          process: null as unknown as AST.Process, // <-  temp
        }),
      );
    }

    let primary: AST.Process | null = null;

    if (shouldParsePrimary) {
      // "matching"
      primary = parsePrimary();
    } else {
      // last prefix has not the consecutive process
      prefixes[prefixes.length - 1].process = AST.buildNode(
        AST.NODES.InactiveProcess,
        {
          position: prefixes[prefixes.length - 1].prefix.position,
        },
      );
    }

    prefixes.reduceRight((process, actionPrefix) => {
      if (process) {
        actionPrefix.process = process;

        actionPrefix.position.column_end = process.position.column_end;
        actionPrefix.position.row_end = process.position.row_end;
      }

      return actionPrefix;
    }, primary);

    // by construction prefixes.length > 0 or matching !== null
    if (prefixes[0]) {
      return prefixes[0];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return primary!;
    }
  }

  function parseReplication(): AST.Process {
    // Replication -> (TOKENS.Bang)* Restriction

    let firstBang: S.Bang | null = null;
    if (check(S.TOKENS.Bang)) {
      firstBang = parseBang();
    }
    while (match(S.TOKENS.Bang));

    const restriction = parseRestriction();

    return firstBang
      ? AST.buildNode(AST.NODES.Replication, {
          position: new Position(
            firstBang?.position.row_start ?? restriction.position.row_start,
            restriction.position.row_end,
            firstBang?.position.column_start ??
              restriction.position.column_start,
            restriction.position.column_end,
          ),
          process: restriction,
        })
      : restriction;
  }

  function parseRestriction(): AST.Process {
    // Restriction -> (TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis)* ParallelComposition

    const identifiers: AST.Identifier[] = [];

    let firstOpenParenthesis: S.OpenParenthesis | null = null;

    while (check(S.TOKENS.OpenParenthesis)) {
      if (!check(S.TOKENS.Identifier, 1)) {
        // disambiguate between '(as)(bs)(A | S | B)' vs '(as)(bs)(cs)' vs '(as)(bs)(A)'
        break;
      }

      const op = parseOpenParenthesis();
      !firstOpenParenthesis && (firstOpenParenthesis = op); // in loving memory of Yuri ❤️

      identifiers.push(parseIdentifier());

      if (!match(S.TOKENS.CloseParenthesis)) {
        raise('Expected a close parenthesis');
      }
    }

    const parallelComposition = parseParallelComposition();

    return firstOpenParenthesis
      ? AST.buildNode(AST.NODES.Restriction, {
          position: new Position(
            firstOpenParenthesis?.position.row_start ??
              parallelComposition.position.row_start,
            parallelComposition.position.row_end,
            firstOpenParenthesis?.position.column_start ??
              parallelComposition.position.column_start,
            parallelComposition.position.column_end,
          ),
          channels: identifiers,
          process: parallelComposition,
        })
      : parallelComposition;
  }

  function parsePrimary(): AST.Process {
    // primary -> InactiveProcess | ProcessConstant | TOKENS.OpenParenthesis Process TOKENS.CloseParenthesis
    // InactiveProcess -> TOKENS.Nil

    if (check(S.TOKENS.Nil)) {
      return parseInactiveProcess();
    } else if (check(S.TOKENS.ProcessConstant)) {
      return parseProcessConstant();
    } else if (check(S.TOKENS.OpenParenthesis)) {
      const openParenthesis = parseOpenParenthesis();
      const process = parseProcess();
      const closeParenthesis = parseCloseParenthesis();

      process.position.row_start = openParenthesis.position.row_start;
      process.position.row_end = closeParenthesis.position.row_end;
      process.position.column_start = openParenthesis.position.column_start;
      process.position.column_end = closeParenthesis.position.column_end;

      return process;
    } else {
      raise('Unexpected primary type');
    }
  }

  function parseInactiveProcess(): AST.InactiveProcess {
    // InactiveProcess -> TOKENS.Nil

    if (check(S.TOKENS.Nil)) {
      const nil = advance() as S.Nil;

      return AST.buildNode(AST.NODES.InactiveProcess, {
        position: nil.position,
      });
    } else {
      raise('Expected a nil process');
    }
  }

  // utils

  function parseIdentifier(): AST.Identifier {
    if (!check(S.TOKENS.Identifier)) {
      raise('Expected an identifier');
    }

    const identifier = advance() as S.Identifier;

    return AST.buildNode(AST.NODES.Identifier, {
      position: identifier.position,
      identifier: identifier.value,
    });
  }

  function parseProcessConstant(): AST.ProcessConstant {
    if (!check(S.TOKENS.ProcessConstant)) {
      raise('Expected a process constant');
    }

    const processConstant = advance() as S.ProcessConstant;

    return AST.buildNode(AST.NODES.ProcessConstant, {
      position: processConstant.position,
      identifier: processConstant.value,
    });
  }

  function parseStringLiteral(): AST.StringLiteral {
    if (!check(S.TOKENS.StringLiteral)) {
      raise('Expected a string literal');
    }

    const stringLiteral = advance() as S.StringLiteral;

    return AST.buildNode(AST.NODES.StringLiteral, {
      position: stringLiteral.position,
      value: stringLiteral.value,
    });
  }

  function parseNumberLiteral(): AST.NumberLiteral {
    if (!check(S.TOKENS.NumberLiteral)) {
      raise('Expected a number literal');
    }

    const numberLiteral = advance() as S.NumberLiteral;

    return AST.buildNode(AST.NODES.NumberLiteral, {
      position: numberLiteral.position,
      value: numberLiteral.value,
    });
  }

  function parseSemicolon(): S.Semicolon {
    if (!check(S.TOKENS.Semicolon)) {
      raise('Expected a semicolon');
    }

    return advance() as S.Semicolon;
  }

  function parseBang(): S.Bang {
    if (!check(S.TOKENS.Bang)) {
      raise('Expected a bang!');
    }

    return advance() as S.Bang;
  }

  function parseOpenParenthesis(): S.OpenParenthesis {
    if (!check(S.TOKENS.OpenParenthesis)) {
      raise('Expected an open parenthesis');
    }

    return advance() as S.OpenParenthesis;
  }

  function parseCloseParenthesis(): S.CloseParenthesis {
    if (!check(S.TOKENS.CloseParenthesis)) {
      raise('Expected an close parenthesis');
    }

    return advance() as S.CloseParenthesis;
  }

  function parseCloseAngleBracket(): S.CloseAngleBracket {
    if (!check(S.TOKENS.CloseAngleBracket)) {
      raise('Expected a close angle bracket');
    }

    return advance() as S.CloseAngleBracket;
  }

  // error
  function raise(message: string): never {
    throw new Error(
      `Error: ${message} at ${JSON.stringify(tokens[index].position)}`,
    );
  }

  return parseProgram();
}
