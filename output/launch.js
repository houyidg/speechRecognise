"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaiDuOneSentenceClient_1 = require("./src/client/impl/BaiDuOneSentenceClient");
var log4js = require('log4js');
var path = require('path');
log4js.configure({
    appenders: {
        cheese: {
            type: 'dateFile', filename: "logs" + path.sep, pattern: "yyyy-MM-dd-error.log", alwaysIncludePattern: true, absolute: true, maxLogSize: 104800,
            backups: 10
        }
    },
    categories: { default: { appenders: ['cheese'], level: 'error' } }
});
// const logger = log4js.getLogger('cheese');
// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Comté.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');
var client = new BaiDuOneSentenceClient_1.BaiDuOneSentenceClient();
//C:\Users\Administrator\Desktop\file\语音识别\10月录音
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Desktop\\file\\speechRecognise\\tenMonthRecord';
// let audioSrcBasePath = 'C:\\Users\\Administrator\\Documents\\GitHub\\speechRecognise\\temp';
client.prepare({});
client.start();
