export class Position {
  constructor(
    public row_start: number,
    public row_end: number,
    public column_start: number,
    public column_end: number,
  ) {}

  static dummy(): Position {
    return new Position(-1, -1, -1, -1);
  }
}
