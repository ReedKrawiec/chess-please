
interface prefabs {
  [index:string]:any
}
import {black_background} from "./black_background";
import {board} from "./board";
import {example} from "./example";
import {inv_icon} from "./inv_icon";
import {inventory_clicks} from "./inventory_clicks";
import {main_character} from "./main_character";
import {pawn} from "./pawn";
import {test_char} from "./test_char";
import {test_item} from "./test_item";
import {test_item2} from "./test_item2";
import {text_background} from "./text_background";
import {wood_floor} from "./wood_floor";
export let prefabs:prefabs = {
	black_background:black_background,
	board:board,
	example:example,
	inv_icon:inv_icon,
	inventory_clicks:inventory_clicks,
	main_character:main_character,
	pawn:pawn,
	test_char:test_char,
	test_item:test_item,
	test_item2:test_item2,
	text_background:text_background,
	wood_floor:wood_floor,
}