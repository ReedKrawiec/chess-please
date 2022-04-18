import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";
import { piece, piece_parameters } from "./abstract/piece";

export interface pawn_state extends obj_state{
    
}
    
export interface pawn_parameters{
    
}
    
export class pawn extends piece{
  constructor(state:obj_state,params:piece_parameters = copy(piece.default_params)){
    super(state,params);
    this.state.scaling = {
      height: 8,
      width: 8
    }
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
}