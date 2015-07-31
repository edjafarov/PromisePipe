import {Router} from "./router"
import HistoryApiAdapter from  "../../adapters/HistoryApiAdapter"

function mount(data){
  console.log("MOUNT DATA", data);
  document.getElementById('content').innerHTML = data;
}
Router.use(HistoryApiAdapter(mount));

window.router = Router.router;
console.log(Router.router)
