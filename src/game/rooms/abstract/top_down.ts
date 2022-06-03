import { room } from "lib/room";
import { createItemString, game, viewport } from "src/van";
import {Camera} from "lib/render";
import { state_config } from "lib/room";
import * as config from "./top_down.json";
import { obj } from "lib/object";
import { Pathing_Room } from "./Pathing_Room";
import {text_background} from "game/objects/text_background"
import {black_background} from "game/objects/black_background";
import { HUD, Text } from "lib/hud";
import { Vec } from "lib/math";
import { range } from "lib/utils";
import { exec_type, Poll_Mouse } from "lib/controls";
import { main_character } from "game/objects/main_character";
import { g, item_entry, items, setFlag } from "game/main";
import { inv_icon } from "game/objects/inv_icon";
import { inventory_clicks } from "game/objects/inventory_clicks";

let cfig = config as unknown as state_config;

export enum views{
  main,
  inventory,
  text
}

interface top_down_state {
  current_view:views,
  conv: {
    current_conv: conv_entry[],
    callback: (() => void),
  }
  movable:boolean
}
function getLines(text:string, maxWidth:number,font_name:string, font_size:number) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];
  let ctx = (<HTMLCanvasElement>document.createElement("canvas")).getContext("2d");
  ctx.font = `${font_size}px ${font_name}`;
  for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
          currentLine += " " + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
}

interface conv_entry{
  name:string,
  full_text:string,
  left?:string,
  right?:string,
  dark: "left" | "right",
  flags?:{
    [index:string]:string
  },
  items?:Array<{
    action:"add" | "remove",
    name:string
  }>
}

export class main_hud extends HUD{
  async load(){
    return super.load()
  }
  setGraphicElements():obj[]{
    return [/*new inv_icon({
      position:Vec.create(3 * viewport.width/20,3 * viewport.height/20),
      scaling:{width:.5,height:.5}
    })*/]
  }
  statef(time:number){
    super.statef(time);
  }
}

const text_speed = 20;
export class inventory_hud extends HUD{
  state = {
    line_texts:["","","",""],
    name:"",
    current_page:0
  }
  setGraphicElements():obj[]{
    let b_background = new black_background({
      position:Vec.create(viewport.width/2,viewport.height/2),
      scaling:{width:viewport.width,height:viewport.height}
    })
    b_background.opacity = 0.9;
    return [b_background,new inventory_clicks({
      position:Vec.create(50,20),
      scaling:{width:1,height:1}
    }),]
  }
  setTextElements():Text[]{
    let nodes = [];
    for(let a of range(4)){
      nodes.push(new Text({
        position:Vec.create(100,8 * viewport.height/32 - (viewport.width/30 + 5) * a),
        size:viewport.width/30,
        scaling:1,
        font:"VT323",
        color:"white",
        align:"left"
      },()=> this.state.line_texts[a])  )
    }
    nodes.push(new Text({
      position:Vec.create(100,12 * viewport.height/32),
      size:viewport.width/20,
      scaling:1,
      font:"VT323",
      color:"white",
      align:"left"
    },()=>this.state.name));
    return nodes
  }
  setHoveredItem(item:item_entry){
    let lines = getLines(item.description,viewport.width - 100,"VT323",viewport.width/30)
    lines = lines.slice(0,3);
    this.state.line_texts = ["","","",""];
    for(let [index,line] of lines.entries()){
      this.state.line_texts[index] = line;
    }
    this.state.name = item.name
  }
  renderPage(page_index:number){
    this.graphic_elements = this.graphic_elements.filter((e)=>!e.tags.has("item"))
    let inv = g.state.globals.inventory;
    let inv_clicks = this.graphic_elements.filter((e)=>e.tags.has("manager"))[0] as inventory_clicks;
    if(page_index == 0){
      inv_clicks.state.show_left = false;
      inv_clicks.state.show_right = true;
      this.state.line_texts = ["","","",""];
      this.state.name = "";
    }
    this.state.current_page = page_index;
    let names = inv.slice(page_index * 8, (page_index + 1) * 8);
    for(let [index,item_name] of names.entries()){
      let entry = items[item_name];
      let obj_width = viewport.width/960;
      if(index > 3){
        let obj = createItemString(entry.obj_name,{
          position:Vec.create( (1 + index % 4) * (viewport.width/5),1/4 * viewport.height/2 + viewport.height/2),
          scaling:{height:obj_width, width:obj_width}
        })
        obj.UnbindAll();
        obj.removeAllEventHandlers();
        obj.tags.add("item");
        this.addGraphic(obj);
      }
      else{
        let obj = createItemString(entry.obj_name,{
          position:Vec.create((1 + index % 4) * (viewport.width/5),3/4 * viewport.height/2 + viewport.height/2),
          scaling:{height:obj_width, width:obj_width}
        });
        obj.UnbindAll();
        obj.removeAllEventHandlers();
        obj.tags.add("item");
        this.addGraphic(obj);
      }
      if(index === inv.length - 1) break;
    }
  }
  async setActive(){
    this.renderPage(0)
  }
}
export class conversation_hud extends HUD{
  max_characters:number = 15;
  text_speed = text_speed;
  state:{
    text_active:boolean,
    full_text:string[],
    line_text:string[] 
    current_line:number,
    current_text_line:number,
    index:number,
    timer:number,
    blocked:boolean,
    text_finished:boolean,
    name:string
  }
  constructor(){
    super();
    this.state = {
      text_active:false,
      full_text:[],
      index:0,  
      timer:0,
      current_line:0,
      current_text_line:0,
      line_text:["","","",""],
      blocked:false,
      text_finished:false,
      name:""
    }
  }
  progress(){
    if(this.state.text_finished){
      return true;
    }
    if(!this.state.text_finished && this.state.blocked){
      this.state.blocked = false 
      this.state.current_line = 0;
      this.clearLines();
    }
    return false;
  }
  clearCharacterPortrain(side:"left" | "right"){
    if(side == "left"){
      this.graphic_elements = this.graphic_elements.filter((obj) => !obj.tags.has("text_left"));
    }
    if(side == "right"){
      this.graphic_elements = this.graphic_elements.filter((obj) => !obj.tags.has("text_right"));
    }
  }
  async changeCharacterPortrait(side:"left" | "right", obj:obj, dark:boolean){
    obj.layer = 2;
    obj.state.scaling = {width:viewport.width/480,height:viewport.width/480};
    if(dark) obj.tags.add("dark");
    if(side == "left"){
      obj.tags.add("text_left");
      obj.state.position = Vec.create(viewport.width/6,viewport.height/4);
      this.graphic_elements = this.graphic_elements.filter((obj) => !obj.tags.has("text_left"));
    }
    if(side == "right"){
      obj.tags.add("text_right");
      obj.state.position = Vec.create(5 * viewport.width/6,viewport.height/4);
      this.graphic_elements = this.graphic_elements.filter((obj) => !obj.tags.has("text_right"));
    }
    obj.UnbindAll();
    obj.removeAllEventHandlers();
    this.addGraphic(obj);
  }
  statef(time:number){
    super.statef(time);
    if(this.state.text_active){
      if(this.state.timer > this.text_speed){
        if(!this.state.blocked){
            this.state.line_text[this.state.current_line] += this.state.full_text[this.state.current_text_line][this.state.index];
            this.state.index++;
            if(this.state.index === this.state.full_text[this.state.current_text_line].length){
              this.state.current_line++;
              this.state.current_text_line++;
              this.state.index = 0;
            }
            if(this.state.current_line === 4){
              this.state.blocked = true;
            } 
            if(this.state.current_text_line === this.state.full_text.length){
              this.state.blocked = true;
              this.state.text_finished = true;
            }
            this.state.timer = 0;
        }
      }
      this.state.timer += time;
    }
  }
  clearLines(){
    this.state.line_text = range(4).map(()=>"");
  }
  setGraphicElements():obj[]{
    let b_background = new black_background({
      position:Vec.create(viewport.width/2,viewport.height/2),
      scaling:{width:viewport.width,height:viewport.height}
    })
    b_background.opacity = 0.9;
    return [
      new text_background({
        position:Vec.create(viewport.width/2,viewport.height/6),
        scaling:{width:viewport.width,height:viewport.height/3}
    }), b_background]
  }
  setTextElements():Text[]{
    let nodes = [];
    for(let a of range(4)){
      nodes.push(new Text({
        position:Vec.create(100,6 * viewport.height/32 - (viewport.width/50 + 5) * a),
        size:viewport.width/50,
        scaling:1,
        font:"VT323",
        color:"white",
        align:"left"
      },()=>{ return this.state.line_text[a]})  )
    }
    nodes.push(new Text({
      position:Vec.create(80,8 * viewport.height/32),
      size:viewport.width/40,
      scaling:1,
      font:"VT323",
      color:"white",
      align:"left"
    },()=>this.state.name))
    return nodes;
  }
  setText(text:string){
    this.state.text_active = true;
    this.state.current_text_line = 0;
    this.state.current_line = 0;
    this.state.blocked = false;
    this.clearLines();
    this.state.text_finished = false;
    this.state.full_text = getLines(text,viewport.width - 100,"Arial",viewport.width/50);
    this.progress();
  }
}

export class top_down extends Pathing_Room<top_down_state>{
  background_url = "./sprites/Error.png";
  render = true;
  floor_tag = "floor";
  nav_padding = 100;
  text_hud = new conversation_hud();
  main_hud = new main_hud();
  inventory_hud = new inventory_hud();
  nav_node_diameter = 200;
  constructor(game: game<unknown>,cfig:state_config) {
    super(game, cfig);
    this.state = {
      current_view:views.main,
      movable:true,
      conv: undefined
    }
    this.cameras.push(
      new Camera({
        x:0,
        y:0,
        dimensions:viewport,
        scaling:0.6
      },{
        x:0,
        y:0,
        width:1,
        height:1
      },this.main_hud
    ));
    console.log("v1");
  }
  async load(){
    await this.inventory_hud.load();
    await this.main_hud.load();
    await this.text_hud.load();
    return super.load()
  }
  setConv(script:conv_entry[], after_conv?:()=>void){
    this.state.current_view = views.text;
    this.cameras[0].setHud(this.text_hud);  
    this.state.conv = {
      current_conv: script,
      callback: after_conv
    };
    this.progressConv(script[0]);
    this.state.movable = false;
  }
  progressConv(script:conv_entry){
    this.text_hud.setText(script.full_text);
    this.text_hud.state.name = script.name;
    if(script.left !== undefined){
      this.text_hud.changeCharacterPortrait("left",this.createItemString(script.left,{position:Vec.create(0,0)},{}),script.dark === "left");
    }
    else{
      this.text_hud.clearCharacterPortrain("left");
    }
    if(script.right !== undefined){
      this.text_hud.changeCharacterPortrait("right",this.createItemString(script.right,{position:Vec.create(0,0)},{}),script.dark === "right");
    }
    else{
      this.text_hud.clearCharacterPortrain("right");
    }
  }
  nextConversationEntry(){
    let flag_values = this.state.conv.current_conv[0].flags;
    let items = this.state.conv.current_conv[0].items;
    if(items){
      for(let item of items){
        if(item.action = "add"){
          g.state.globals.inventory.push(item.name);
        }
        else{
          let index = g.state.globals.inventory.indexOf(item.name);
          if(index > -1){
            g.state.globals.inventory.splice(index,1);
          }
        }
      }
    }
    if(flag_values){
      for(let flag of Object.keys(flag_values)){
        setFlag(flag,flag_values[flag]);
      }
    }
    if(this.state.conv.current_conv.length > 1){
      this.state.conv.current_conv.splice(0,1);
      this.progressConv(this.state.conv.current_conv[0]);
    }
    else{
      this.text_hud.clearLines();
      this.state.current_view = views.main;
      this.cameras[0].setHud(new main_hud());  
      this.state.movable = true;
      this.state.conv.callback();
    } 
  }
  registerControls() {
    this.bindControl("mouse0down",exec_type.once,()=>{
      if(this.cameras[0].hud === this.text_hud){
        if(this.text_hud.state.text_finished){
          this.nextConversationEntry();
        }
        else{
          this.text_hud.progress();
        }
      }
    });
    this.bindControl("Spacedown",exec_type.once,()=>{
      if(this.state.current_view  === views.text){
        this.text_hud.text_speed = text_speed/2; 
      }
    });
    this.bindControl("Spaceup",exec_type.once,()=>{
        this.text_hud.text_speed = text_speed;
    })
    this.bindControl("KeyX",exec_type.once,()=>{
      if(!(this.state.current_view === views.text)){
        this.setConv([{
          left:"main_character",
          right:"main_character",
          name:"John Smith",
          dark:"left",
          full_text:`In case of an error, the promise becomes rejected, and the execution should jump to the closest rejection handler. But there is none. So the error gets “stuck”. There’s no code to handle it.`,
          flags:{
            test:"one"
          }
        },{
          right:"example",
          name:"test",
          dark:"left",
          full_text:`Test TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest.`,
          flags:{
            test2:"yep"
          }
        },{
          name:"",
          dark:"left",
          full_text:`But why?...`,
          flags:{
            test:"twp"
          }
        }])
      }
    })
  }
  registerParticles() {

  }
  statef(delta_time: number) {
    super.statef(delta_time);
    let player = <obj>this.cache("player",this.getObjByTag("player")[0]);
    this.cameras[0].state.position = player.state.position;
    if(!this.state.movable){
      player.state.velocity = Vec.create(0,0);
    }
  }

}