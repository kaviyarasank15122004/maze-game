
import { Cell, Position } from '../types';

export const generateMaze = (rows: number, cols: number): Cell[][] => {
  // Initialize grid
  const grid: Cell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r,
      c,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  const stack: Position[] = [];
  const start: Position = { r: 0, c: 0 };
  grid[start.r][start.c].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const currentPos = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(currentPos, rows, cols, grid);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(currentPos, next, grid);
      grid[next.r][next.c].visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  return grid;
};

const getUnvisitedNeighbors = (pos: Position, rows: number, cols: number, grid: Cell[][]): Position[] => {
  const neighbors: Position[] = [];
  const { r, c } = pos;

  if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c });
  if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c });
  if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r, c: c - 1 });
  if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push({ r, c: c + 1 });

  return neighbors;
};

const removeWalls = (a: Position, b: Position, grid: Cell[][]) => {
  const dr = a.r - b.r;
  const dc = a.c - b.c;

  if (dr === 1) {
    grid[a.r][a.c].walls.top = false;
    grid[b.r][b.c].walls.bottom = false;
  } else if (dr === -1) {
    grid[a.r][a.c].walls.bottom = false;
    grid[b.r][b.c].walls.top = false;
  }

  if (dc === 1) {
    grid[a.r][a.c].walls.left = false;
    grid[b.r][b.c].walls.right = false;
  } else if (dc === -1) {
    grid[a.r][a.c].walls.right = false;
    grid[b.r][b.c].walls.left = false;
  }
};
