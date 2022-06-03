import { g } from "game/main";
import { top_down } from "game/rooms/abstract/top_down";
import {obj} from "lib/object";
import { positioned_sprite, sprite_gen } from "lib/sprite";
import { obj_state, Vector } from "lib/state";
import { room_template } from "lib/templates/room_template";
import {copy} from "src/van";

export interface test_char_state extends obj_state{
    
}
    
export interface test_char_parameters{
    
}
    
export class test_char extends obj{
  sprite_url = "./sprites/test_char.png";
  height = 500;
  width = 500;
  collision = true;
  render = true;
  state:test_char_state;
  params:test_char_parameters;
  static default_params:test_char_parameters = {}
  constructor(state:obj_state,params:test_char_parameters = copy(test_char.default_params)){
    super(state,params);
  }
  statef(time_delta:number){
    super.statef(time_delta);
  }
  renderf(time_delta:number){
    let sprites = sprite_gen(this,500,500);
    let positioned = super.renderf(time_delta) as positioned_sprite;
    if(this.tags.has("dark")){
      positioned.sprite = sprites[0][1];
    }
    else{
      positioned.sprite = sprites[0][0];
    }
    return positioned; 
  }
  registerEvents(){
    this.addEventHandler("click",()=>{
      console.log("clicked");
      let room = g.state.current_room as top_down;
      room.setConv([{
        name:"John",
        left:"main_character",
        right:"test_char",
        dark:"right",
        full_text:"play me in chess *****"
      },{
        name:"Smith",
        left:"main_character",
        right:"test_char",
        dark:"left",
        full_text:"i will kill u"
      }],() => {
        this.game.loadRoomString("boardView"); 
      })
    })
  }
  registerAnimations(){
    
  }
  registerAudio(){
    
  }
  registerControls(){
        
  }
}