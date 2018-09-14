import { BaiDuOneSentenceSpeechRecongniseClient } from "./src/client/impl/BaiDuOneSentenceSpeechRecongniseClient";
import { ISpeechRecongniseClient } from "./src/client/ISpeechRecongnise";

let client: ISpeechRecongniseClient = new BaiDuOneSentenceSpeechRecongniseClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
let voiceBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let voiceBasePath = 'E:\\KuGou';
client.prepare({ voiceBasePath });
client.start();
