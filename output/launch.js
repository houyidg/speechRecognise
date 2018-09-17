"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaiDuOneSentenceClient_1 = require("./src/client/impl/BaiDuOneSentenceClient");
var client = new BaiDuOneSentenceClient_1.BaiDuOneSentenceClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
var audioSrcBasePath = 'C:\\Users\\Administrator\\Documents\\GitHub\\speechRecognise\\temp';
client.prepare({ audioSrcBasePath: audioSrcBasePath });
client.start();
