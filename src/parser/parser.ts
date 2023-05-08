import { Position } from '../common/Position.js';
import * as S from '../scanner/index.js';
import * as AST from './ast.js';

// LL(2) parser
function parse(tokens: readonly S.Token[]): AST.Program {
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
        declarations[0].position.row_start ?? main.position.row_start,
        main.position.row_end,
        declarations[0].position.column_start ?? main.position.column_start,
        main.position.column_end,
      ),
      declarations,
      main,
    });
  }

  function parseDeclaration(): AST.Declaration {
    // Declaration -> ProcessIdentifier TOKENS.Equal Process TOKENS.Semicolon

    // identifier
    const identifier = parseIdentifier(AST.NODES.ProcessConstant);

    // equal
    if (!match(S.TOKENS.Equal)) {
      throw new Error('Expected an equal sign');
    }

    // process
    const process = parseProcess();

    // semicolon
    const semicolon = parseSemicolon();

    // result
    return AST.buildNode(AST.NODES.Declaration, {
      position: new Position(
        identifier.position.row_start,
        semicolon.position.row_end,
        identifier.position.column_start,
        semicolon.position.column_end,
      ),
      identifier: AST.buildNode(AST.NODES.ProcessConstant, {
        position: identifier.position,
        identifier: identifier.identifier,
      }),
      process,
    });
  }

  function parseMain(): AST.Main {
    // Main -> TOKENS.Main TOKENS.Equal Process TOKENS.Semicolon

    // main
    if (!check(S.TOKENS.Main)) {
      throw new Error('Expected the main keyword');
    }
    const main = advance();

    // equal
    if (!match(S.TOKENS.Equal)) {
      throw new Error('Expected an equal sign');
    }

    // process
    const process = parseProcess();

    // semicolon
    if (!check(S.TOKENS.Semicolon)) {
      throw new Error('Expected a semicolon');
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
    // Process -> (Prefix TOKEN.Dot)* Matching

    const prefixes: AST.ActionPrefix[] = [];

    // (Prefix TOKEN.Dot)*
    while (check(S.TOKENS.Identifier)) {
      const prefix = parsePrefix();

      if (!match(S.TOKENS.Dot)) {
        throw new Error('Expected a dot');
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
          process: null, // <-  temp
        }),
      );
    }

    // "matching"
    const matching = parseMatching();

    // align action prefixes
    prefixes.reduceRight<AST.Process>((process, actionPrefix) => {
      actionPrefix.process = process;

      actionPrefix.position.column_end = process.position.column_end;
      actionPrefix.position.row_end = process.position.row_end;

      return actionPrefix;
    }, matching);

    return prefixes.length ? prefixes[0] : matching;
  }

  function parsePrefix(): AST.Prefix {
    // Prefix -> SendMessage | ReceiveMessage
    if (check(S.TOKENS.OpenAngleBracket, 1)) {
      return parseSendMessage();
    } else if (check(S.TOKENS.OpenParenthesis, 1)) {
      return parseReceiveMessage();
    } else {
      throw new Error('Unexpected prefix type');
    }
  }

  function parseSendMessage(): AST.SendMessage {
    // SendMessage -> Identifier TOKENS.OpenAngleBracker Message TOKENS.CloseAngleBracket
    const channel = parseIdentifier(AST.NODES.Identifier);

    if (!match(S.TOKENS.OpenAngleBracket)) {
      throw new Error('Expected an open angle bracket');
    }

    const message = parseMessage();

    if (!match(S.TOKENS.CloseAngleBracket)) {
      throw new Error('Expected a close angle bracket');
    }

    return AST.buildNode(AST.NODES.SendMessage, {
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
  function parseReceiveMessage(): AST.ReceiveMessage {
    // ReceiveMessage -> Identifier TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis

    const channel = parseIdentifier(AST.NODES.Identifier);

    if (!match(S.TOKENS.OpenAngleBracket)) {
      throw new Error('Expected an open angle bracket');
    }

    const message = parseIdentifier(AST.NODES.Identifier);

    if (!match(S.TOKENS.CloseAngleBracket)) {
      throw new Error('Expected a close angle bracket');
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

  function parseMessage(): AST.Message {
    // Message -> StringLiteral | NumberLiteral | Identifier

    if (check(S.TOKENS.StringLiteral)) {
      return parseStringLiteral();
    } else if (check(S.TOKENS.NumberLiteral)) {
      return parseNumberLiteral();
    } else if (check(S.TOKENS.Identifier)) {
      return parseIdentifier(AST.NODES.Identifier);
    } else {
      throw new Error('Unexpected message type');
    }
  }

  function parseMatching(): AST.Process {
    // Matching -> (TOKENS.OpenBracket Identifier TOKENS.Equal Identifier TOKENS.CloseBracket)* NonDeterministicChoice

    const matches: AST.Matching[] = [];

    while (check(S.TOKENS.OpenBracket)) {
      // open bracket
      if (!match(S.TOKENS.OpenBracket)) {
        throw new Error('Expected an open bracket');
      }

      const channel_1 = parseIdentifier(AST.NODES.Identifier);

      // equal
      if (!match(S.TOKENS.Equal)) {
        throw new Error('Expected an equal sign');
      }

      const channel_2 = parseIdentifier(AST.NODES.Identifier);

      // closed bracket
      if (!match(S.TOKENS.CloseBracket)) {
        throw new Error('Expected a close bracket');
      }

      matches.push(
        AST.buildNode(AST.NODES.Matching, {
          left: channel_1,
          right: channel_2,
          process: null, // temp
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

    const process = parseNonDeterministicChoice();

    // align matches
    matches.reduceRight<AST.Process>((process, match) => {
      match.process = process;

      match.position.column_end = process.position.column_end;
      match.position.row_end = process.position.row_end;

      return match;
    }, process);

    return matches.length ? matches[0] : process;
  }

  function parseNonDeterministicChoice(): AST.NonDeterministicChoice {
    // NonDeterministicChoice -> ParallelComposition (TOKENS.Plus ParallelComposition)*

    const parallelCompositions: AST.ParallelComposition[] = [
      parseParallelComposition(),
    ];

    while (check(S.TOKENS.Plus)) {
      if (!match(S.TOKENS.Plus)) {
        throw new Error('Expected a plus');
      }

      parallelCompositions.push(parseParallelComposition());
    }

    return AST.buildNode(AST.NODES.NonDeterministicChoice, {
      position: new Position(
        parallelCompositions[0].position.row_start,
        parallelCompositions[parallelCompositions.length - 1].position.row_end,
        parallelCompositions[0].position.column_start,
        parallelCompositions[
          parallelCompositions.length - 1
        ].position.column_end,
      ),
      processes: parallelCompositions,
    });
  }

  function parseParallelComposition(): AST.ParallelComposition {
    // ParallelComposition -> RRp (TOKENS.VerticalBar RRp)*

    const processes: AST.Process[] = [parseRRp()];

    while (check(S.TOKENS.VerticalBar)) {
      if (!match(S.TOKENS.VerticalBar)) {
        throw new Error('Expected a vertical bar');
      }

      processes.push(parseRRp());
    }

    return AST.buildNode(AST.NODES.ParallelComposition, {
      position: new Position(
        processes[0].position.row_start,
        processes[processes.length - 1].position.row_end,
        processes[0].position.column_start,
        processes[processes.length - 1].position.column_end,
      ),
      processes,
    });
  }

  function parseRRp(): AST.Process {
    // RRp -> Replication |  Restriction | primary

    if (check(S.TOKENS.Bang)) {
      return parseReplication();
    } else if (check(S.TOKENS.OpenParenthesis)) {
      return parseRestriction();
    } else {
      return parsePrimary();
    }
  }

  function parseReplication(): AST.Replication {
    // Replication -> TOKENS.Bang Process

    const bang = parseBang();

    const process = parseProcess();

    return AST.buildNode(AST.NODES.Replication, {
      position: new Position(
        bang.position.row_start,
        process.position.row_end,
        bang.position.column_start,
        process.position.column_end,
      ),
      process,
    });
  }

  function parseRestriction(): AST.Restriction {
    // Restriction -> (TOKENS.OpenParenthesis Identifier TOKENS.CloseParenthesis)+ Process

    const identifiers: AST.Identifier[] = [];

    let firstOpenParenthesis: S.OpenParenthesis;
    do {
      const op = parseOpenParenthesis();
      firstOpenParenthesis && (firstOpenParenthesis = op); // in loving memory of Yuri ❤️

      identifiers.push(parseIdentifier(AST.NODES.Identifier));

      if (!match(S.TOKENS.CloseParenthesis)) {
        throw new Error('Expected a close parenthesis');
      }
    } while (check(S.TOKENS.OpenParenthesis));

    const process = parseProcess();

    return AST.buildNode(AST.NODES.Restriction, {
      position: new Position(
        firstOpenParenthesis.position.row_start,
        process.position.row_end,
        firstOpenParenthesis.position.column_start,
        process.position.column_end,
      ),
      channels: identifiers,
      process,
    });
  }

  function parsePrimary(): AST.Process {
    // primary -> InactiveProcess | ProcessConstant | TOKENS.OpenParenthesis Process TOKENS.CloseParenthesis
    // InactiveProcess -> TOKENS.Nil

    if (check(S.TOKENS.Nil)) {
      return parseInactiveProcess();
    } else if (check(S.TOKENS.Identifier)) {
      return parseIdentifier(AST.NODES.ProcessConstant);
    } else if (check(S.TOKENS.OpenParenthesis)) {
      const openParenthesis = parseOpenParenthesis();
      const process = parseProcess();
      const closeParenthesis = parseCloseParenthesis();

      process.position.row_start = openParenthesis.position.row_start;
      process.position.row_end = closeParenthesis.position.row_end;
      process.position.column_start = openParenthesis.position.column_start;
      process.position.column_end = closeParenthesis.position.column_end;

      return process;
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
      throw new Error('Expected a nil process');
    }
  }

  // utils

  function parseIdentifier(tag: typeof AST.NODES.Identifier): AST.Identifier;
  function parseIdentifier(
    tag: typeof AST.NODES.ProcessConstant,
  ): AST.ProcessConstant;
  function parseIdentifier(
    tag: typeof AST.NODES.Identifier | typeof AST.NODES.ProcessConstant,
  ): AST.Identifier | AST.ProcessConstant {
    if (!check(S.TOKENS.Identifier)) {
      throw new Error('Expected an identifier');
    }

    const identifier = advance() as S.Identifier;

    if (
      tag === AST.NODES.ProcessConstant &&
      identifier.value.toUpperCase() !== identifier.value
    ) {
      throw new Error('Process identifiers must be uppercase');
    }

    if (
      tag === AST.NODES.Identifier &&
      identifier.value.toLowerCase() !== identifier.value
    ) {
      throw new Error('Non-process identifiers must be lowercase');
    }

    return AST.buildNode(tag, {
      position: identifier.position,
      identifier: identifier.value,
    });
  }

  function parseStringLiteral(): AST.StringLiteral {
    if (!check(S.TOKENS.StringLiteral)) {
      throw new Error('Expected a string literal');
    }

    const stringLiteral = advance() as S.StringLiteral;

    return AST.buildNode(AST.NODES.StringLiteral, {
      position: stringLiteral.position,
      value: stringLiteral.value,
    });
  }

  function parseNumberLiteral(): AST.NumberLiteral {
    if (!check(S.TOKENS.NumberLiteral)) {
      throw new Error('Expected a number literal');
    }

    const numberLiteral = advance() as S.NumberLiteral;

    return AST.buildNode(AST.NODES.NumberLiteral, {
      position: numberLiteral.position,
      value: numberLiteral.value,
    });
  }

  function parseSemicolon(): S.Semicolon {
    if (!check(S.TOKENS.Semicolon)) {
      throw new Error('Expected a semicolon');
    }

    return advance() as S.Semicolon;
  }

  function parseBang(): S.Bang {
    if (!check(S.TOKENS.Bang)) {
      throw new Error('Expected a bang!');
    }

    return advance() as S.Bang;
  }

  function parseOpenParenthesis(): S.OpenParenthesis {
    if (!check(S.TOKENS.OpenParenthesis)) {
      throw new Error('Expected an open parenthesis');
    }

    return advance() as S.OpenParenthesis;
  }

  function parseCloseParenthesis(): S.CloseParenthesis {
    if (!check(S.TOKENS.CloseParenthesis)) {
      throw new Error('Expected an close parenthesis');
    }

    return advance() as S.CloseParenthesis;
  }

  return parseProgram();
}
