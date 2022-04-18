
interface prefabs {
  [index:string]:any
}
import {board} from "./board";
import {pawn} from "./pawn";
export let prefabs:prefabs = {
	board:board,
	pawn:pawn,
}