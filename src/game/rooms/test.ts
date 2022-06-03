import { proximity_matrix, room } from "lib/room";
import { game } from "src/van";
import { state_config } from "lib/room";
import * as config from "./test.json";
import {top_down} from "game/rooms/abstract/top_down";
import { Poll_Mouse } from "lib/controls";
import { g } from "game/main";
let cfig = config as unknown as state_config;
interface test_state {

}

export class test extends top_down{
  background_url = "./sprites/Error.png";
  render = true;
  proximity_map:proximity_matrix = new proximity_matrix(4000,9);
  constructor(game: game<unknown>) {
    super(game, cfig);
  }
  registerControls() {
    super.registerControls();
  }
  registerParticles() {

  }
  statef(delta_time: number) {
    super.statef(delta_time);
  }

}