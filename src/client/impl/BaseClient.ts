import { FileUtils } from '../../util/FileUtils';
import { MySqlCacheManager } from '../cache/MySqlCacheManager';
import { PhoneSessionModel } from '../PhoneSessionModel';
import { ICacheManager } from '../cache/ICacheManager';
import { TimeUtils } from '../../util/TimeUtils';
import * as fs from "fs";
import * as moment from 'moment';
import { ISpeechRecongniseClient } from "../ISpeechRecongnise";
import { exec } from "child_process";
import { baiduConfig, Elogger, requestTimeout, scanFileTimeByEveryDay, Clogger, scanFileTimeInterval } from '../../config';
const path = require('path');

/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 * 语音识别、合成接口调用量无限。QPS识别默认为10，合成为100
 * 其中会扫描指定目录下的音频文件
 */
export class BaseClient implements ISpeechRecongniseClient {
    protected isDebug = false;
    protected cacheManager: ICacheManager;
    protected scanFileTimeInterval = 60 * 1000;//60 s
    protected firstScanFileTime = 60 * 1000;//60 s

    public prepare({
        cacheResBasePath = process.cwd() + path.sep + "asset",
        audioSrcBasePath = cacheResBasePath + path.sep + "audio",
        divisionPath = cacheResBasePath + path.sep + "divisionCache",
        transformPath = cacheResBasePath + path.sep + "transformCache",
        translateTextPath = cacheResBasePath + path.sep + "translateTexts",
        handleTaskPath = cacheResBasePath + path.sep + "audioPathCache" }) {//准备环境

        this.cacheManager = new MySqlCacheManager();
        this.cacheManager.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });

        this.scanFileTimeInterval = scanFileTimeInterval * 1000;
        let todayHour: any = moment().format('HH:mm:ss').split(':');
        let todaySecond = parseInt(`${todayHour[0] * 60 * 60}`) + parseInt(`${todayHour[1] * 60}`) + parseInt(`${todayHour[2]}`);
        this.firstScanFileTime = (24 * 60 * 60 - todaySecond + scanFileTimeByEveryDay * 60 * 60 + scanFileTimeInterval) * 1000;
        Clogger.info('BaseClient  还剩余', this.firstScanFileTime / 1000, '秒开始定时执行, 每间隔', scanFileTimeInterval, '秒执行一次');
    }

    public async start() {//开始执行
        try {
            this.handle();
            setTimeout(() => {
                this.handle();
                setInterval(() => {
                    this.handle();
                }, this.scanFileTimeInterval);
            }, this.firstScanFileTime);
        } catch (e) {
            Clogger.info('start  error', e);
        }
    }

    private async handle() {
        Clogger.info('\r\n');
        Clogger.info('------------------------start handle------------------------------');
        let meetModels: PhoneSessionModel[];
        let retryModels: PhoneSessionModel[] = [];
        let startTime = new Date().getTime() / 1000;
        while (retryModels.length > 0 || (meetModels = await this.cacheManager.getNeedHandleFiles()).length > 0) {
            meetModels.splice(meetModels.length, 0, ...retryModels);
            Clogger.info('\n\r');
            Clogger.info('--------------------------------loop Task  总共需要执行的任务:', meetModels.length, ' 包含重试的任务:', retryModels.length, ' \n:', meetModels);
            retryModels = [];
            let needHandleTasks = meetModels.splice(0, Math.min(baiduConfig.qps, meetModels.length));
            let concurrenceCount = needHandleTasks.length;
            Clogger.info('start 建立并发通道数:', concurrenceCount);
            let taskPromiseArr = [];
            for (let index = 0; index < concurrenceCount; index++) {
                let needModel = needHandleTasks[index];
                let rs = this.assembleTask(needModel, () => {
                    //拿取剩余的任务执行
                    let nextModel = meetModels.pop();
                    if (nextModel) {
                        Clogger.info('--------------------------------拿取下一个任务：', nextModel, '   等待执行的任务: ', meetModels.length);
                        return this.assembleTask(nextModel, undefined);
                    } else {
                        concurrenceCount--;
                        Clogger.info('--------------------------------并发通道 ', index, ' 执行完毕，还有剩余执行通道:', concurrenceCount);
                    }
                });
                taskPromiseArr.push(rs);
            }
            let startTime = new Date().getTime() / 1000;
            await Promise.all(taskPromiseArr)
                .then((rs) => {
                    Clogger.info('----------------Promise.all cost time: ', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒 rs:', JSON.stringify(rs));
                }, (e) => {
                    Elogger.error('----------------Promise.all catch  time: ', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒 rs:', JSON.stringify(e));
                });
            //continue get fail task
            retryModels = this.cacheManager.getRetryModelsByToday();
            this.cacheManager.removeAllTaskCacheByOneLoop();
        }
        this.cacheManager.removeAllTaskCacheByAtTime();
        Clogger.info('-------------------------end handle all Task cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒---------------------------');
        Clogger.info('\n\r');
    }
    //nextModel
    assembleTask(sessionModel: PhoneSessionModel, nextTaskCallback) {
        let startTime = new Date().getTime() / 1000;
        let fileName = sessionModel.fileName;
        let absolutePath = `${this.cacheManager.getAudioSrcBasePath()}${path.sep}${fileName}`;
        let suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
        let fileNameExcludeSuffix = fileName.replace(suffix, '').replace('.', '');
        let audioData = fs.readFileSync(absolutePath);
        let isMp3 = fileName.toLowerCase().indexOf('mp3') > -1;
        Clogger.info('----------------start task  fileName：', fileName, ' suffix:', suffix, '  audio.length:', this.getAudioLen(audioData), ' ----------------');
        //real do 
        return this.startHandleSingleVoice({ sessionModel, absolutePath, fileNameExcludeSuffix, suffix, isMp3 }).then((rs) => {
            this.cacheManager.removeFailTaskPath(sessionModel);
            let endTime = new Date().getTime() / 1000;
            Clogger.info('----------------end task fileName：', fileName, ' cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice rs：', JSON.stringify(rs), ' ----------------');
            //continue add task 
            if (nextTaskCallback)
                return nextTaskCallback();
        }, (e) => {
            this.cacheManager.saveFailTaskPath(sessionModel);
            let endTime = new Date().getTime() / 1000;
            Elogger.error('----------------end task catch fileName：', fileName, '  cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice error：', JSON.stringify(e), ' ----------------');
            if (nextTaskCallback)
                return nextTaskCallback();
        });
    }

    async  startHandleSingleVoice({ sessionModel, absolutePath, fileNameExcludeSuffix, suffix, isMp3 }) {
        let rsCode = 1;//1 ok ,2 gettime fail ,3 api fail,4 
        let apiError = [];
        let newSuffix = suffix;

        let rs = await this.getVoicePlayTime(absolutePath);
        this.isDebug && Clogger.info('playTime:', rs);
        let timeQuanTum = TimeUtils.getSecondByTimeOffset(rs.playTime);
        if (timeQuanTum.length > 1) {
            let translateTextArr: string[] = [];
            apiError = [];
            for (let index = 0, len = timeQuanTum.length; index < len - 1; index++) {
                let startTime = timeQuanTum[index];
                let nextTime = timeQuanTum[index + 1];
                let duration = TimeUtils.getMinDuration(startTime, nextTime);
                let srcPath = absolutePath;
                let divisionPath = this.cacheManager.getDivisionPath() + path.sep + fileNameExcludeSuffix + '_division_' + index + '.' + suffix;
                let nextPath = divisionPath;
                //division
                let rs = await this.divisionVoiceByTime({ startTime, duration, srcPath, divisionPath })
                    .then((rs) => {
                        this.isDebug && Clogger.info('divisionVoiceByTime rs', rs);
                        if (!isMp3) {
                            return new Promise((rs, rj) => { rs(1); });
                        } else {
                            //change pcm
                            let transformPath = this.cacheManager.getTransformPath() + path.sep + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                            nextPath = transformPath;
                            newSuffix = 'pcm';
                            return this.transformMp3ToPcm({ divisionPath, transformPath });
                        }
                    }).then((rs) => {
                        this.isDebug && Clogger.info('transformMp3ToPcm rs', rs);
                        // todo 翻译
                        let translatePath = nextPath;
                        return this.handleSingleVoice({ translatePath, newSuffix });
                    }, (rj) => {
                        if (rj) {
                            Elogger.error('handleSingleVoice catch rs', rj);
                            return new Promise((rs, rj) => {
                                rs(rs);
                            });
                        }
                    });
                let isApiOk = this.handleApiResult({ translateTextArr, apiError, rs, fileNameExcludeSuffix, suffix, nextPath });
                if (!isApiOk) {
                    rsCode = 3;
                }
            }
            // //存储到文件
            await this.cacheManager.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
        } else {
            //转换分割音频时间段异常
            rsCode = 2;
            this.isDebug && Clogger.info('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
        }
        return new Promise((rs, rj) => {
            if (rsCode == 1) {
                rs({ rsCode: rsCode, apiError: apiError });
            } else {
                rj({ rsCode: rsCode, apiError: apiError });
            }
        });
    }

    handleApiResult({ translateTextArr, apiError, rs, fileNameExcludeSuffix, suffix, nextPath }) {

        return false;
    }

    async handleSingleVoice({ translatePath, newSuffix = 'pcm' }): Promise<any> {

    }
    /**
     * return 00:13:02 hh:mm:ss
     * @param voicePath 
     */
    async getVoicePlayTime(voicePath): Promise<{ playTime: string }> {
        let cmdStr = `ffmpeg -i "${voicePath}"`;
        this.isDebug && Clogger.info('getVoiceTime  cmdStr ', cmdStr);
        return new Promise<{ playTime: string }>((resolve, rejects) => {
            exec(cmdStr, { encoding: 'utf8' }, (err, stdout, stderr) => {
                let time;//Duration: 00:13:02.64
                let endIndex = '00:13:02'.length;
                let matchStrLen = "Duration".length;
                let realStartOffset = ': '.length;
                let startIndex = -1;
                if ((startIndex = stderr.indexOf("Duration")) > -1) {
                    startIndex = startIndex + matchStrLen + realStartOffset;
                    time = stderr.substring(startIndex, startIndex + endIndex);
                    this.isDebug && Clogger.info('getVoiceTime stderr time ', time);
                }
                if ((startIndex = stdout.indexOf("Duration")) > -1) {
                    startIndex = startIndex + matchStrLen + realStartOffset;
                    time = stdout.substring(startIndex, startIndex + endIndex);
                    this.isDebug && Clogger.info('getVoiceTime  stdout time ', time);
                }
                let rs = { playTime: "-1" };
                if (time) {
                    rs.playTime = time;
                    resolve(rs);
                } else {
                    rejects(rs);
                }
            });
        });
    }

    async divisionVoiceByTime({ startTime, duration, srcPath, divisionPath }) {
        let cmdStr = `ffmpeg -i "${srcPath}" -y -ss ${startTime} -t ${duration} -acodec copy "${divisionPath}"`;
        this.isDebug && Clogger.info('divisionVoiceByTime cmdStr:' + cmdStr);
        return new Promise((resolve, rejects) => {
            exec(cmdStr, (err, stdout, stderr) => {
                // err && Clogger.info('divisionVoiceByTime err:' + err);
                // stdout && Clogger.info('divisionVoiceByTime stdout:' + stdout);
                // stderr && Clogger.info('divisionVoiceByTime stderr:' + stderr);
                resolve(1);
            });
        });
    }

    async transformMp3ToPcm({ divisionPath, transformPath }) {
        let cmdStr = `ffmpeg -y  -i "${divisionPath}"  -acodec pcm_s16le -f s16le -ac 1 -ar 16000  "${transformPath}"`;
        this.isDebug && Clogger.info('transformMp3ToPcm cmdStr:' + cmdStr);
        return new Promise((resolve, rejects) => {
            exec(cmdStr, (err, stdout, stderr) => {
                // err && Clogger.info('divisionVoiceByTime err:' + err);
                // stdout && Clogger.info('divisionVoiceByTime stdout:' + stdout);
                // stderr && Clogger.info('divisionVoiceByTime stderr:' + stderr);
                resolve(1);
            });
        });
    }

    getAudioLen(voice) {
        return voice && ((voice.length / 1024).toFixed(0) + 'kb');
    }


    public stop() {//停止 

    }
}
