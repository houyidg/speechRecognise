"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var KeDaXunFeiClient_1 = require("./src/client/impl/KeDaXunFeiClient");
// const logger = log4js.gsteria.');
var client = new KeDaXunFeiClient_1.KeDaXunFeiClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Documents\\GitHub\\speechRecognise\\temp';
client.prepare({});
client.start();
