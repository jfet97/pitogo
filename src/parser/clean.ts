import * as AST from './ast.js';

export function removeSingleParallelComposition(
  curr: AST.Node,
  parent: AST.Node | null = null,
): void {
  if (curr._tag === AST.NODES.Program) {
    curr.declarations.forEach((declaration) =>
      removeSingleParallelComposition(declaration, curr),
    );
    removeSingleParallelComposition(curr.main, curr);
  } else if (
    // parallel composition with only one process -> discard the node
    curr._tag === AST.NODES.ParallelComposition &&
    curr.processes.length === 1
  ) {
    if (parent && 'process' in parent) {
      parent.process = curr.processes[0];
      return removeSingleParallelComposition(curr.processes[0], parent);
    } else if (parent && 'processes' in parent) {
      const index = parent.processes.indexOf(curr);
      parent.processes[index] = curr.processes[0];
      return removeSingleParallelComposition(curr.processes[0], parent);
    }
  } else if ('process' in curr) {
    return removeSingleParallelComposition(curr.process, curr);
  } else if ('processes' in curr) {
    curr.processes.forEach((process) =>
      removeSingleParallelComposition(process, curr),
    );
  }
}

export function removeSingleNonDeterministicChoice(
  curr: AST.Node,
  parent: AST.Node | null = null,
): void {
  if (curr._tag === AST.NODES.Program) {
    curr.declarations.forEach((declaration) =>
      removeSingleNonDeterministicChoice(declaration, curr),
    );
    removeSingleNonDeterministicChoice(curr.main, curr);
  } else if (
    // non deterministic choice with only one process -> discard the node
    curr._tag === AST.NODES.NonDeterministicChoice &&
    curr.processes.length === 1
  ) {
    if (parent && 'process' in parent) {
      parent.process = curr.processes[0];
      return removeSingleNonDeterministicChoice(curr.processes[0], parent);
    } else if (parent && 'processes' in parent) {
      const index = parent.processes.indexOf(curr);
      parent.processes[index] = curr.processes[0];
      return removeSingleNonDeterministicChoice(curr.processes[0], parent);
    }
  } else if ('process' in curr) {
    return removeSingleNonDeterministicChoice(curr.process, curr);
  } else if ('processes' in curr) {
    curr.processes.forEach((process) =>
      removeSingleNonDeterministicChoice(process, curr),
    );
  }
}
