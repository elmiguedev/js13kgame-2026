import Scene from "../../lib/Scene";
import RoomController from "../controllers/RoomController";

export default class RoomScene extends Scene {
  protected get room(): RoomController {
    return RoomController.getInstance();
  }
}
