

import { room } from "../../../lib/room";
import { DEBUG, game, render_filled_box } from "../../../van";
import { state_config } from "../../../lib/room";
import { Vector } from "../../../lib/state";
import { obj } from "../../../lib/object";
import { collision_box, getEncompassingBox } from "../../../lib/collision";
import { debug_state } from "lib/debug";

function one_arr(height: number, width: number): number[][] {
  let mesh: number[][] = [];
  for (let a = 0; a < height; a++) {
    mesh[a] = [];
    for (let b = 0; b < width; b++) {
      mesh[a][b] = 1;
    }
  }
  return mesh;
}

export interface nav_mesh {
  box: collision_box,
  grid: number[][],
  objects: obj[]
}

export class Pathing_Room<T> extends room<T>{
  nav_node_diameter = 100;
  nav_padding = 0;
  nav_mesh: nav_mesh;
  nav_recalculation_interval = 5000;
  floor_tag: string;
  private pathfind_counter = 0;
  carveNavMesh(nav_mesh: nav_mesh, obj: obj, fill: number) {
    let bounds = obj.getBoundingBox();
    let mesh = nav_mesh.grid;
    
    let b_l = this.posToCord(nav_mesh, bounds.bottom_left);
    let t_r = this.posToCord(nav_mesh, bounds.top_right);
    let y_min = Math.max(0, b_l.y);
    let y_max = Math.min(mesh.length - 1, t_r.y);
    let x_min = Math.max(0, b_l.x);
    let x_max = Math.min(mesh[0].length - 1, t_r.x);
    for (let a = x_min; a <= x_max; a++) {
      for (let b = y_min; b <= y_max; b++) {
        mesh[b][a] = fill;
      }
    }
  }
  computeNavMesh(floor_tag: string, object_id: string) {
    let room = this.game.getRoom();
    let floors = room.getObjByTag(floor_tag);
    let coll_box = getEncompassingBox(floors);
    let width = coll_box.width / this.nav_node_diameter;
    let height = coll_box.height / this.nav_node_diameter;
    let colliders = room.checkCollisions(coll_box, [floor_tag]).filter((o) => o.id != object_id);
    let bot_left: Vector = {
      x: coll_box.x - coll_box.width / 2,
      y: coll_box.y - coll_box.height / 2
    }
    let top_right: Vector = {
      x: coll_box.x + coll_box.width / 2,
      y: coll_box.y + coll_box.height / 2
    }

    let mesh: number[][] = one_arr(height, width);
    
    let nav_mesh: nav_mesh = {
      grid: mesh,
      box: coll_box,
      objects: floors
    };
    this.nav_mesh = nav_mesh;
    for (let floor of floors) {
      let old_hbox = floor.hitbox;
      let new_width = (floor.width * floor.state.scaling.width - 2 * this.nav_padding) / floor.state.scaling.width
      let new_height = (floor.height * floor.state.scaling.height - 2 * this.nav_padding) / floor.state.scaling.height
      floor.hitbox = {
        x_offset: 0,
        y_offset: 0,
        width: new_width > 0 ? new_width : 0,
        height: new_height > 0 ? new_height : 0
      }
      this.carveNavMesh(nav_mesh, floor, 0);
      floor.hitbox = old_hbox;
    }
    for (let obj of colliders) {
      this.carveNavMesh(nav_mesh, obj, 1);
    }
    return nav_mesh;
  }
  posToCord(nav_mesh: nav_mesh, pos: Vector): Vector {
    let room = this.game.getRoom() as Pathing_Room<unknown>;
    let x = Math.floor((pos.x - nav_mesh.box.x + nav_mesh.box.width / 2) / nav_mesh.box.width * (nav_mesh.box.width / room.nav_node_diameter));
    let y = Math.floor((pos.y - nav_mesh.box.y + nav_mesh.box.height / 2) / nav_mesh.box.height * (nav_mesh.box.height / room.nav_node_diameter));
    return { x, y };
  }
  statef(time: number) {
    

    super.statef(time);
  }

}

