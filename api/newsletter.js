import {makeNewsletterHandler} from '../server/newsletter/service.mjs';
import {runtime} from '../server/newsletter/runtime.mjs';
export default makeNewsletterHandler(runtime);
