import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";
import {item} from "game/objects/abstract/item";
import { items } from "game/main";
export interface test_item_state extends obj_state{
    
}
    
export interface test_item_parameters{
    
}
    
export class test_item extends item{
  sprite_url = "./sprites/Error.png";
  height = 100;
  width = 100;
  render = true;
  item = items["test"];
}