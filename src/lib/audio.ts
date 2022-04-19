import { root_path, path } from "./debug";
import { DEBUG } from "../van";

interface sound_storage {
  [index: string]: HTMLAudioElement
}

export class audio {
  sounds: sound_storage = {};
  add(name: string, url: string) {
    let p = url;
    if (DEBUG) {
      p = path.join(root_path, url);
    }
    console.log(p);
    this.sounds[name] = new Audio(p);
    console.log(this.sounds[name]);
  }
  async load() {
    let keys = Object.keys(this.sounds);
    let promises = keys.map((key) => {
      return new Promise<void>((resolve, reject) => {
        this.sounds[key].addEventListener("canplaythrough", (e) => {
          resolve();
        });
      })
    })
    try {
      let x = await Promise.all(promises);
      return (x);
    }
    catch (e) {
      console.log(e);
    }
  }
  stop(name: string) {
    this.sounds[name].pause();
    this.sounds[name].currentTime = 0;
  }
  pause(name: string) {
    this.sounds[name].pause();
  }
  get(name: string) {
    return this.sounds[name];
  }
  play(name: string, volume: number) {
    let a = this.sounds[name];
    console.log(a.duration)
    a.pause()
    a.currentTime = 0;
    a.volume = volume;
    a.play();

  }
}