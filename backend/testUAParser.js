import { UAParser } from 'ua-parser-js';
const parser = new UAParser("Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)");
console.log(parser.getResult());
