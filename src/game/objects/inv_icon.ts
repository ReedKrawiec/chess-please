import { g } from "game/main";
import { top_down } from "game/rooms/abstract/top_down";
import { exec_type } from "lib/controls";
import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface inv_icon_state extends obj_state{
    
}
    
export interface inv_icon_parameters{
    
}
    
export class inv_icon extends obj{
  sprite_url = "./sprites/invicon.png";
  height = 300;
  width = 300;
  collision = true;
  render = true;
  state:inv_icon_state;
  tick_state = false;
  hud_clickable = true;
  params:inv_icon_parameters;
  static default_params:inv_icon_parameters = {}
  constructor(state:obj_state,params:inv_icon_parameters = copy(inv_icon.default_params)){
    super(state,params);
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
    this.bindControl("mouse0down",exec_type.once,()=>{
      let room = (<top_down>g.getRoom());
      room.cameras[0].setHud(room.inventory_hud);
      room.state.movable = false;
    })
  }
}