import {runtime} from '../server/submissions/runtime.mjs';
import {makeHandler} from '../server/submissions/http.mjs';
export default makeHandler(runtime);
export const config = { maxDuration: 300 };
