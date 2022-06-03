import { g } from "game/main";
import { main_hud, top_down } from "game/rooms/abstract/top_down";
import { exec_type, Poll_Mouse } from "lib/controls";
import { Text } from "lib/hud";
import { Vec } from "lib/math";
import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy, viewport} from "src/van";
import {views,inventory_hud} from "game/rooms/abstract/top_down";
import { collision_box, pointCollidesWithBox } from "lib/collision";
export interface inventory_back_button_state extends obj_state{
  show_left:boolean,
  show_right:boolean
}
    
export interface inventory_back_button_parameters{
    
}

export class inventory_clicks extends obj{
  sprite_url = "./sprites/Error.png";
  height = 0;
  width = 0;
  collision = true;
  hitbox = {
    width:100,
    height:100,
    x_offset:0,
    y_offset:0
  }
  render = true;
  layer = 3;
  state:inventory_back_button_state;
  constructor(state:obj_state,params:inventory_back_button_parameters = copy(inventory_clicks.default_params)){
    super(state,params);
    Object.assign(this.state, {
      show_left:false,
      show_right:false
    });
    this.text_nodes.push(new Text({
      position:this.state.position,
      size:40,
      scaling:1,
      font:"VT323",
      color:"white"
    },()=>"Back"));
    this.text_nodes.push(new Text({
      position:Vec.create(50,viewport.height/2),
      size:40,
      scaling:1,
      font:"VT323",
      color:"white"
    },()=>this.state.show_left ? "<" : ""));
    this.text_nodes.push(new Text({
      position:Vec.create(viewport.width - 50,viewport.height/2),
      size:40,
      scaling:1,
      font:"VT323",
      color:"white"
    },()=>this.state.show_right ? ">" : ""));
    this.state.show_right = g.state.globals.inventory.length > 8;
    this.tags.add("manager");
  }
  statef(time:number){
    super.statef(time);
    let hud = g.getRoom().cameras[0].hud as inventory_hud;
    console.log(hud.state.current_page);
  }
  registerControls(){
    this.bindControl("mouse0",exec_type.once,()=>{
      const click_regions:{
        [index:string]:collision_box
      } = {
        "back":{
          x:50,
          y:50,
          height:100,
          width:100
        },
        "left":{
          x:50,
          y:viewport.height/2,
          height:100,
          width:100
        },
        "right":{
          x:viewport.width - 50,
          y:viewport.height/2,
          height:100,
          width:100
        }
      }
      let room = <top_down>g.getRoom();
      let mouse = Poll_Mouse(room.cameras[0],true);

      if(pointCollidesWithBox(mouse,click_regions["back"])){
        room.cameras[0].setHud(new main_hud());
        room.state.current_view = views.main;
        room.state.movable = true;
      }
      if(pointCollidesWithBox(mouse,click_regions["left"])){
        let hud = room.cameras[0].hud as inventory_hud;
        console.log(hud.state.current_page)
        if(hud.state.current_page > 0){
          
          hud.renderPage(hud.state.current_page - 1);
          if(hud.state.current_page - 1 > 0){
            this.state.show_left = true;
          }
          else{
            this.state.show_left = false;
          }
          this.state.show_right = true;
        }
      }
      if(pointCollidesWithBox(mouse,click_regions["right"])){
        let hud = room.cameras[0].hud as inventory_hud;
        if((hud.state.current_page + 1) * 8 < g.state.globals.inventory.length){
          console.log("rendering" + hud.state.current_page)
          hud.renderPage(hud.state.current_page + 1);
          if((hud.state.current_page + 1) * 8 < g.state.globals.inventory.length){
            this.state.show_right = true;
          }
          else{
            this.state.show_right = false;
          }
          this.state.show_left = true;
        }
      }
    })
  }
}