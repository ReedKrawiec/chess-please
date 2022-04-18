import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface board_state extends obj_state{
    
}
    
export interface board_parameters{
    
}
    
export class board extends obj{
  sprite_url = "./sprites/chess/board.png";
  height = 180;
  width = 180;
  collision = true;
  render = true;
  layer: number = 0;
  static = true;
  state:board_state;
  params:board_parameters;
  static default_params:board_parameters = {}
  constructor(state:obj_state,params:board_parameters = copy(board.default_params)){
    super(state,params);
    this.tags.add("board");
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