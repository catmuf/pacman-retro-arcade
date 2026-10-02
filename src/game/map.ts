import { MAP_COLS, MAP_ROWS } from './constants';
import { TileType } from './types';

export const RAW_MAZE_LAYOUT: string[] = [
  '                            ', // 0
  '                            ', // 1
  '                            ', // 2
  '############################', // 3
  '#............##............#', // 4
  '#.####.#####.##.#####.####.#', // 5
  '#o####.#####.##.#####.####o#', // 6
  '#.####.#####.##.#####.####.#', // 7
  '#..........................#', // 8
  '#.####.##.########.##.####.#', // 9
  '#.####.##.########.##.####.#', // 10
  '#......##....##....##......#', // 11
  '######.##### ## #####.######', // 12
  '     #.##### ## #####.#     ', // 13
  '     #.##          ##.#     ', // 14
  '     #.## ###--### ##.#     ', // 15
  '######.## #hhhhhh# ##.######', // 16
  'TTTTTT    #hhhhhh#    TTTTTT', // 17
  '######.## #hhhhhh# ##.######', // 18
  '     #.## ######## ##.#     ', // 19
  '     #.##          ##.#     ', // 20
  '     #.## ######## ##.#     ', // 21
  '######.## ######## ##.######', // 22
  '#............##............#', // 23
  '#.####.#####.##.#####.####.#', // 24
  '#.####.#####.##.#####.####.#', // 25
  '#o..##................##..o#', // 26
  '###.##.##.########.##.##.###', // 27
  '###.##.##.########.##.##.###', // 28
  '#......##....##....##......#', // 29
  '#.##########.##.##########.#', // 30
  '#.##########.##.##########.#', // 31
  '#..........................#', // 32
  '############################', // 33
  '                            ', // 34
  '                            ', // 35
];

export class GameMap {
  private grid: TileType[][];
  private initialGrid: TileType[][];
  public totalPellets: number = 0;
  public remainingPellets: number = 0;

  constructor() {
    this.grid = [];
    this.initialGrid = [];
    this.parseMap();
  }

  private parseMap(): void {
    this.grid = [];
    this.initialGrid = [];
    this.totalPellets = 0;

    for (let r = 0; r < MAP_ROWS; r++) {
      const rowStr = RAW_MAZE_LAYOUT[r] || ' '.repeat(MAP_COLS);
      const row: TileType[] = [];
      const initRow: TileType[] = [];

      for (let c = 0; c < MAP_COLS; c++) {
        const char = rowStr[c] || ' ';
        let tile = TileType.EMPTY;

        switch (char) {
          case '#':
            tile = TileType.WALL;
            break;
          case '.':
            tile = TileType.PELLET;
            this.totalPellets++;
            break;
          case 'o':
            tile = TileType.ENERGIZER;
            this.totalPellets++;
            break;
          case '-':
            tile = TileType.GHOST_DOOR;
            break;
          case 'h':
            tile = TileType.GHOST_HOUSE;
            break;
          case 'T':
            tile = TileType.TUNNEL;
            break;
          default:
            tile = TileType.EMPTY;
            break;
        }

        row.push(tile);
        initRow.push(tile);
      }

      this.grid.push(row);
      this.initialGrid.push(initRow);
    }

    this.remainingPellets = this.totalPellets;
  }

  public resetPellets(): void {
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        this.grid[r][c] = this.initialGrid[r][c];
      }
    }
    this.remainingPellets = this.totalPellets;
  }

  public getTile(col: number, row: number): TileType {
    if (row < 0 || row >= MAP_ROWS) return TileType.WALL;
    // Tunnel horizontal wrap
    if (col < 0 || col >= MAP_COLS) {
      if (row === 17) return TileType.TUNNEL;
      return TileType.WALL;
    }
    return this.grid[row][col];
  }

  public setTile(col: number, row: number, tile: TileType): void {
    if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
      this.grid[row][col] = tile;
    }
  }

  public isWall(col: number, row: number): boolean {
    const tile = this.getTile(col, row);
    return tile === TileType.WALL;
  }

  public isTunnel(col: number, row: number): boolean {
    const tile = this.getTile(col, row);
    return tile === TileType.TUNNEL;
  }

  public isPassableForPacman(col: number, row: number): boolean {
    // Pacman can wrap through tunnel row 17
    if (row === 17 && (col < 0 || col >= MAP_COLS)) return true;
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;

    const tile = this.grid[row][col];
    return (
      tile !== TileType.WALL &&
      tile !== TileType.GHOST_DOOR &&
      tile !== TileType.GHOST_HOUSE
    );
  }

  public isPassableForGhost(
    col: number,
    row: number,
    isEaten: boolean = false,
    isInHouse: boolean = false
  ): boolean {
    if (row === 17 && (col < 0 || col >= MAP_COLS)) return true;
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;

    const tile = this.grid[row][col];
    if (tile === TileType.WALL) return false;

    // Ghost can pass through door if eaten or in house
    if (tile === TileType.GHOST_DOOR) {
      return isEaten || isInHouse;
    }
    if (tile === TileType.GHOST_HOUSE) {
      return isEaten || isInHouse;
    }

    return true;
  }

  public eatPellet(col: number, row: number): { atePellet: boolean; isEnergizer: boolean } {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
      return { atePellet: false, isEnergizer: false };
    }

    const tile = this.grid[row][col];
    if (tile === TileType.PELLET) {
      this.grid[row][col] = TileType.EMPTY;
      this.remainingPellets--;
      return { atePellet: true, isEnergizer: false };
    } else if (tile === TileType.ENERGIZER) {
      this.grid[row][col] = TileType.EMPTY;
      this.remainingPellets--;
      return { atePellet: true, isEnergizer: true };
    }

    return { atePellet: false, isEnergizer: false };
  }

  public wrapX(col: number): number {
    if (col < -1) return MAP_COLS;
    if (col > MAP_COLS) return -1;
    return col;
  }
}
