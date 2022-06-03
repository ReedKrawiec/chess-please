import { g } from "game/main";
import { conversation_hud } from "game/rooms/abstract/top_down";
import { exec_type, Poll_Mouse } from "lib/controls";
import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";
import { floor } from "./abstract/wood_floor";
import { example } from "./example";
import { main_character } from "./main_character";

export interface wood_floor_state extends obj_state{
    
}
    
export interface wood_floor_parameters{
    
}
    
export class wood_floor extends floor{
  sprite_url = "./sprites/wood_floor.jpg";
  height = 400;
  width = 400;
  registerEvents(){
    this.addEventHandler("click",()=>{
      console.log("test");
    })
  }
  registerControls(){

  }
}