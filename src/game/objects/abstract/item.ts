import { g, item_entry } from "game/main";
import { top_down } from "game/rooms/abstract/top_down";
import { Poll_Mouse } from "lib/controls";
import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface item_state extends obj_state{
    
}
    
export interface item_parameters{
    
}
    
export class item extends obj{
  sprite_url = "./sprites/Error.png";
  height = 100;
  width = 100;
  collision = true;
  render = true;
  state:item_state;
  item:item_entry;
  tick_state = false;
  params:item_parameters;
  static default_params:item_parameters = {}
  constructor(state:obj_state,params:item_parameters = copy(item.default_params)){
    super(state,params);
  }
  statef(time_delta:number){
    super.statef(time_delta);
    let mouse = Poll_Mouse(g.getRoom().cameras[0],true);
    if(mouse){
      if(mouse && this.collidesWithPoint(mouse)){
        console.log("test")
        let room = <top_down>g.getRoom();
        room.inventory_hud.setHoveredItem(this.item);
      }
    }
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