import {obj} from "lib/object";
import { scale_type } from "lib/render";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface black_background_state extends obj_state{
    
}
    
export interface black_background_parameters{
    
}
    
export class black_background extends obj{
  sprite_url = "./sprites/black.png";
  height = 1;
  width = 1;
  collision = false;
  render = true;
  scale_type: scale_type.grow;
  tick_state: false;
  layer = -1;  
}