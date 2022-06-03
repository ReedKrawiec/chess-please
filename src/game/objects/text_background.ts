import {obj} from "lib/object";
import { scale_type } from "lib/render";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface text_background_state extends obj_state{
    
}
    
export interface text_background_parameters{
    
}
    
export class text_background extends obj{
  sprite_url = "./sprites/darkgray.png";
  height = 1;
  width = 1;
  collision = true;
  render = true;
  state:text_background_state;
  scale_type: scale_type.grow;
  tick_state: false;
  layer = 3;
  params:text_background_parameters;
  static default_params:text_background_parameters = {}
  constructor(state:obj_state,params:text_background_parameters = copy(text_background.default_params)){
    super(state,params);
  }
  statef(time_delta:number){
    super.statef(time_delta);
  }
  renderf(time_delta:number){
   return super.renderf(time_delta); 
  }
  register_animations(){
    
  }
  register_audio(){
    
  }
  register_controls(){
        
  }
}