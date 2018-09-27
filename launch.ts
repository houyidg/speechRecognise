import { KeDaXunFeiClient } from './src/client/impl/KeDaXunFeiClient';
import { BaiDuOneSentenceClient } from "./src/client/impl/BaiDuOneSentenceClient";
import { ISpeechRecongniseClient } from "./src/client/ISpeechRecongnise";


// const logger = log4js.gsteria.');
let client: ISpeechRecongniseClient = new KeDaXunFeiClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Documents\\GitHub\\speechRecognise\\temp';
client.prepare({});
client.start();
