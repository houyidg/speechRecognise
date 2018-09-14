"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaiDuOneSentenceSpeechRecongniseClient_1 = require("./src/client/impl/BaiDuOneSentenceSpeechRecongniseClient");
var client = new BaiDuOneSentenceSpeechRecongniseClient_1.BaiDuOneSentenceSpeechRecongniseClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
var voiceBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let voiceBasePath = 'E:\\KuGou';
client.prepare({ voiceBasePath: voiceBasePath });
client.start();
