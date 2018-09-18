import { BaiDuOneSentenceClient } from "./src/client/impl/BaiDuOneSentenceClient";
import { ISpeechRecongniseClient } from "./src/client/ISpeechRecongnise";

let client: ISpeechRecongniseClient = new BaiDuOneSentenceClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Documents\\GitHub\\speechRecognise\\temp';
client.prepare({  });
client.start();
