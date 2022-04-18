
interface room_dir {
  [index:string]:any
}
import {boardView} from "./boardView";
export let rooms:room_dir = {
	boardView:boardView,
}