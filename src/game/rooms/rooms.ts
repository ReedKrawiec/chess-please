
interface room_dir {
  [index:string]:any
}
import {boardView} from "./boardView";
import {test} from "./test";
export let rooms:room_dir = {
	boardView:boardView,
	test:test,
}