import {obj} from "lib/object";
import { render_type, scale_type } from "lib/render";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface wood_floor_state extends obj_state{
    
}
    
export interface wood_floor_parameters{
    
}
    
export class floor extends obj{
  sprite_url = "./sprites/Error.png";
  height = 100;
  width = 100;
  collision = false;
  render = true;
  static = true;
  scale_type = scale_type.repeat;
  state:wood_floor_state;
  params:wood_floor_parameters;
  static default_params:wood_floor_parameters = {}
  constructor(state:obj_state,params:wood_floor_parameters = copy(floor.default_params)){
    super(state,params);
    this.tags.add("floor");
  }
  statef(time_delta:number){
    super.statef(time_delta);
  }
  renderf(time_delta:number){
   return super.renderf(time_delta); 
  }
  registerAnimations(){
    
  }
  registerAudio(){
    
  }
  registerControls(){
  }
}