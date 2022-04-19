import { string_dict } from "lib/utils";
import {Vector,obj_state,room_state} from "../lib/state";
import {game,GetViewportDimensions,viewport} from "../van";

const PUZZLES_URL = "https://raw.githubusercontent.com/ReedKrawiec/chess-please/master/src/game/puzzles.csv";

let canvas_element:HTMLCanvasElement = document.getElementById("target") as HTMLCanvasElement;

export interface game_state{
  rating:number,
  puzzles: puzzle[]
}

export interface puzzle {
  id:string
  rating:number
  fen:string
  solution:string[]
}

export let g:game<game_state>; 

export function getNextPuzzle(puzzles:puzzle[], target_rating:number, range:number){
  let filtered = puzzles.filter(p => p.rating >= target_rating - range && p.rating <= target_rating + range);
  if(filtered.length == 0){
    return null;
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
} 

(async function(){
  let puzzles_raw = await fetch(PUZZLES_URL);
  let puzzles_lines = (await puzzles_raw.text()).split("\n");
  let puzzles:puzzle[] = puzzles_lines.map(line => {
    let lines_split = line.split(",");
    return {
      id: lines_split[0],
      fen: lines_split[1],
      solution: lines_split[2] ? lines_split[2].split(" ") : [],
      rating: parseInt(lines_split[3])
    };
  });
  puzzles.sort((a,b) => a.rating - b.rating);
  g = new game<game_state>(canvas_element.getContext("2d"),{
    rating: 1600,
    puzzles
  });
  g.loadRoomString("boardView");
})();
