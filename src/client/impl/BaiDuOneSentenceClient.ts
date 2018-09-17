import { FileUtils } from '../../util/FileUtils';
import { MySqlCacheManager } from '../cache/MySqlCacheManager';
import { PhoneSessionModel } from '../PhoneSessionModel';
import { ICacheManager } from '../cache/ICacheManager';
import { TimeUtils } from '../../util/TimeUtils';
import { speech, HttpClient } from "baidu-aip-sdk";
import * as fs from "fs";
import * as os from "os";
import * as moment from 'moment';
import { ISpeechRecongniseClient } from "../ISpeechRecongnise";
import { exec } from "child_process";
import { BAIDU_CONFIG } from '../../config';
const isDebug = false;
const RecongniseSpeechErrorByDivision = '-RecongniseSpeechErrorByDivision-';
const RecongniseSpeechErrorByTransForm = '-RecongniseSpeechErrorByTransForm-';
const RecongniseSpeechErrorByBaiduApi = '-RecongniseSpeechErrorByBaiduApi-';
const timeout = 30 * 60 * 1000;
const scanFileTimeByDay = 9;//每天早上10点开始轮训转换为语音

// 3300	用户输入错误	输入参数不正确	请仔细核对文档及参照demo，核对输入参数
// 3301	用户输入错误	音频质量过差	请上传清晰的音频
// 3302	用户输入错误	鉴权失败	token字段校验失败。请使用正确的API_KEY 和 SECRET_KEY生成
// 3303	服务端问题	语音服务器后端问题	请将api返回结果反馈至论坛或者QQ群
// 3304	用户请求超限	用户的请求QPS超限	请降低识别api请求频率 （qps以appId计算，移动端如果共用则累计）
// 3305	用户请求超限	用户的日pv（日请求量）超限	请“申请提高配额”，如果暂未通过，请降低日请求量
// 3307	服务端问题	语音服务器后端识别出错问题	目前请确保16000的采样率音频时长低于30s，8000的采样率音频时长低于60s。如果仍有问题，请将api返回结果反馈至论坛或者QQ群
// 3308	用户输入错误	音频过长	音频时长不超过60s，请将音频时长截取为60s以下
// 3309	用户输入错误	音频数据问题	服务端无法将音频转为pcm格式，可能是长度问题，音频格式问题等。 请将输入的音频时长截取为60s以下，并核对下音频的编码，是否是8K或者16K， 16bits，单声道。
// 3310	用户输入错误	输入的音频文件过大	语音文件共有3种输入方式： json 里的speech 参数（base64后）； 直接post 二进制数据，及callback参数里url。 分别对应三种情况：json超过10M；直接post的语音文件超过10M；callback里回调url的音频文件超过10M
// 3311	用户输入错误	采样率rate参数不在选项里	目前rate参数仅提供8000,16000两种，填写4000即会有此错误
// 3312	用户输入错误	音频格式format参数不在选项里	目前格式仅仅支持pcm，wav或amr，如填写mp3即会有此错误

const baiduErrorCode = [3300, 3301, 3302, 3304, 3305, 3308, 3310, 3311, 3312];
/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 * 语音识别、合成接口调用量无限。QPS识别默认为10，合成为100
 * 其中会扫描指定目录下的音频文件
 */
export class BaiDuOneSentenceClient implements ISpeechRecongniseClient {
    client: speech;
    cacheManager: ICacheManager;
    scanFileTimeInterval = 60 * 1000;//60 s
    firstScanFileTime = 60 * 1000;//60 s
    qps = 8;//api 可达最大并发度

    public prepare({
        audioSrcBasePath = process.cwd() + "\\asset",
        cacheResBasePath = process.cwd() + "\\asset",
        divisionPath = cacheResBasePath + "\\divisionCache",
        transformPath = cacheResBasePath + "\\transformCache",
        translateTextPath = process.cwd() + "\\translateTexts",
        handleTaskPath = cacheResBasePath + "\\cacheAudioPath" }) {//准备环境
        this.cacheManager = new MySqlCacheManager();
        this.cacheManager.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });
        // 新建一个对象，建议只保存一个对象调用服务接口
        this.client = new speech(BAIDU_CONFIG.APP_ID, BAIDU_CONFIG.API_KEY, BAIDU_CONFIG.SECRET_KEY);
        // 设置request库的一些参数，例如代理服务地址，超时时间等
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        HttpClient.setRequestOptions({ timeout: timeout });
        // 也可以设置拦截每次请求（设置拦截后，调用的setRequestOptions设置的参数将不生效）,
        // 可以按需修改request参数（无论是否修改，必须返回函数调用参数）
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        HttpClient.setRequestInterceptor(function (requestOptions) {
            // 查看参数
            // console.log(requestOptions)
            // 修改参数
            requestOptions.timeout = timeout;
            // 返回参数
            return requestOptions;
        });

        let todayHour: any = moment().format('HH:mm:ss').split(':');
        let todaySecond = parseInt(`${todayHour[0] * 60 * 60}`) + parseInt(`${todayHour[1] * 60}`) + parseInt(`${todayHour[2]}`);
        let todayOffset = scanFileTimeByDay * 60 * 60 - todaySecond;
        if (todayOffset > 0) {//如果今天时间在规定时间之前就延时执行，在之后就直接执行
            this.firstScanFileTime = todayOffset * 1000;
        } else {
            this.firstScanFileTime = 0;
        }
        this.scanFileTimeInterval = 24 * 60 * 60 * 1000;

        console.log('SpeechRecongniseClient this.firstScanFileTime:', this.firstScanFileTime / 1000, '秒     this.scanFileTimeInterval :'
            , this.scanFileTimeInterval / (1000 * 60 * 60), 'h 间隔执行 ');
    }

    public async start() {//开始执行
        try {
            setTimeout(() => {
                this.handle();
                setInterval(() => {
                    this.handle();
                }, this.scanFileTimeInterval);
            }, this.firstScanFileTime);
        } catch (e) {
            console.log('start  error', e);
        }
    }

    private async handle() {
        let meetModels: PhoneSessionModel[];
        let retryModels: PhoneSessionModel[] = [];
        let startTime = new Date().getTime() / 1000;
        while ((meetModels = await this.cacheManager.getNeedHandleFiles()).length > 0 || retryModels.length > 0) {
            meetModels.splice(meetModels.length, 0, ...retryModels);
            console.log('--------------------------------start all Task  总共需要执行的任务:', meetModels.length, ' 包含重试的任务:', retryModels.length, ' \n:', meetModels);
            console.log('\n\r');
            retryModels = [];
            let needHandleTasks = meetModels.splice(0, Math.min(this.qps, meetModels.length));
            console.log('start 建立并发通道数:', needHandleTasks.length);
            let taskPromiseArr = [];
            for (let index = 0, len = needHandleTasks.length; index < len; index++) {
                let needModel = needHandleTasks[index];
                let rs = this.assembleTask(needModel, () => {
                    //拿取剩余的任务执行
                    let nextModel = meetModels.pop();
                    if (nextModel) {
                        console.log('--------------------------------拿取下一个任务：', nextModel, '   等待执行的任务: ', meetModels.length);
                        return this.assembleTask(nextModel, undefined);
                    } else {
                        console.log('--------------------------------并发通道 ', index, ' 执行完毕，等待其他通道！');
                    }
                });
                taskPromiseArr.push(rs);
            }
            let startTime = new Date().getTime() / 1000;
            await Promise.all(taskPromiseArr)
                .then((rs) => {
                    console.log('----------------Promise.all cost time: ', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒 rs:', JSON.stringify(rs));
                }, (e) => {
                    console.log('----------------Promise.all catch  time: ', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒 rs:', JSON.stringify(e));
                });
            //continue get fail task
            retryModels = this.cacheManager.getRetryModelsByToday();
            this.cacheManager.removeAllTaskCacheByOneLoop();
        }
        this.cacheManager.removeAllTaskCacheByAtTime();
        console.log('-----------------------------------------end all Task cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒');
        console.log('\n\r');
    }
    //nextModel
    assembleTask(sessionModel: PhoneSessionModel, nextTaskCallback) {
        let startTime = new Date().getTime() / 1000;
        let fileName = sessionModel.fileName;
        let absolutePath = `${this.cacheManager.getAudioSrcBasePath()}\\${fileName}`;
        let suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
        let fileNameExcludeSuffix = fileName.replace(suffix, '').replace('.', '');
        let audioData = fs.readFileSync(absolutePath);
        let isMp3 = fileName.toLowerCase().indexOf('mp3') > -1;
        console.log('----------------start task  fileName：', fileName, ' suffix:', suffix, '  audio.length:', this.getAudioLen(audioData), ' ----------------');
        //real do 
        return this.startHandleSingleVoice({ sessionModel, absolutePath, fileNameExcludeSuffix, suffix, isMp3 }).then((rs) => {
            this.cacheManager.removeFailTaskPath(fileName);
            let endTime = new Date().getTime() / 1000;
            console.log('----------------end task fileName：', fileName, ' cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice rs：', JSON.stringify(rs), ' ----------------');
            //continue add task 
            if (nextTaskCallback)
                return nextTaskCallback();
        }, (e) => {
            this.cacheManager.saveFailTaskPath(fileName);
            let endTime = new Date().getTime() / 1000;
            console.log('----------------end task catch fileName：', fileName, '  cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice error：', JSON.stringify(e), ' ----------------');
            if (nextTaskCallback)
                return nextTaskCallback();
        });
    }

    async  startHandleSingleVoice({ sessionModel, absolutePath, fileNameExcludeSuffix, suffix, isMp3 }) {
        let rsCode = 1;//1 ok ,2 gettime fail ,3 api fail,4 
        let apiError = [];
        let newSuffix = suffix;

        let rs = await this.getVoicePlayTime(absolutePath);
        isDebug && console.log('playTime:', rs);
        let timeQuanTum = TimeUtils.getSecondByTimeOffset(rs.playTime);
        if (timeQuanTum.length > 1) {
            let translateTextArr: string[] = [];
            apiError = [];
            for (let index = 0, len = timeQuanTum.length; index < len - 1; index++) {
                let startTime = timeQuanTum[index];
                let nextTime = timeQuanTum[index + 1];
                let duration = TimeUtils.getMinDuration(startTime, nextTime);
                let srcPath = absolutePath;
                let divisionPath = this.cacheManager.getDivisionPath() + '\\' + fileNameExcludeSuffix + '_division_' + index + '.' + suffix;
                let nextPath = divisionPath;
                //division
                let rs = await this.divisionVoiceByTime({ startTime, duration, srcPath, divisionPath })
                    .then((rs) => {
                        isDebug && console.log('divisionVoiceByTime rs', rs);
                        if (!isMp3) {
                            return new Promise((rs, rj) => { rs(1); });
                        } else {
                            //change pcm
                            let transformPath = this.cacheManager.getTransformPath() + '\\' + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                            nextPath = transformPath;
                            newSuffix = 'pcm';
                            return this.transformMp3ToPcm({ divisionPath, transformPath });
                        }
                    }).then((rs) => {
                        isDebug && console.log('transformMp3ToPcm rs', rs);
                        // todo 翻译
                        let translatePath = nextPath;
                        return this.handleSingleVoice({ translatePath, newSuffix });
                    }, (rj) => {
                        if (rj) {
                            console.log('handleSingleVoice catch rs', rj);
                            return new Promise((rs, rj) => {
                                rs(rs);
                            });
                        }
                    });
                let { result } = rs;
                if (result && result[0]) {
                    translateTextArr.push(result[0]);
                } else {
                    let { err_no } = rs;
                    if (err_no && baiduErrorCode.indexOf(err_no) > -1) {//音频质量差,不用重试
                    } else {
                        translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                    }
                    apiError.push({ fileName: fileNameExcludeSuffix + '.' + suffix, nextPath: nextPath, rs: rs });
                }
            }
            if (translateTextArr.indexOf(RecongniseSpeechErrorByBaiduApi) > -1) {
                rsCode = 3;
            }
            //存储到数据库
            // //存储到文件
            await this.cacheManager.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
        } else {
            //转换分割音频时间段异常
            rsCode = 2;
            isDebug && console.log('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
        }
        return new Promise((rs, rj) => {
            if (rsCode == 1) {
                rs({ rsCode: rsCode, apiError: apiError });
            } else {
                rj({ rsCode: rsCode, apiError: apiError });
            }
        });
    }

    async handleSingleVoice({ translatePath, newSuffix = 'pcm' }): Promise<any> {
        let voice = fs.readFileSync(translatePath);
        return new Promise((resolve, rejects) => {
            if (translatePath && voice && voice.length > 0) {
                // 识别本地文件
                this.client.recognize(voice, newSuffix, 16000).then((result) => {
                    isDebug && console.log('handleSingleVoice recognize voice name:', translatePath, " <recognize>: " + JSON.stringify(result));
                    resolve(result);
                }, (err) => {
                    isDebug && console.log('handleSingleVoice err voice name:', translatePath, "   err:" + err);
                    rejects(err);
                });
            } else {
                isDebug && console.log('handleSingleVoice voice or voicePath is null ');
                rejects(-1);
            }
        });
    }
    /**
     * return 00:13:02 hh:mm:ss
     * @param voicePath 
     */
    async getVoicePlayTime(voicePath): Promise<{ playTime: string }> {
        let cmdStr = `ffmpeg -i "${voicePath}"`;
        isDebug && console.log('getVoiceTime  cmdStr ', cmdStr);
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
                    isDebug && console.log('getVoiceTime stderr time ', time);
                }
                if ((startIndex = stdout.indexOf("Duration")) > -1) {
                    startIndex = startIndex + matchStrLen + realStartOffset;
                    time = stdout.substring(startIndex, startIndex + endIndex);
                    isDebug && console.log('getVoiceTime  stdout time ', time);
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
        isDebug && console.log('divisionVoiceByTime cmdStr:' + cmdStr);
        return new Promise((resolve, rejects) => {
            exec(cmdStr, (err, stdout, stderr) => {
                // err && console.log('divisionVoiceByTime err:' + err);
                // stdout && console.log('divisionVoiceByTime stdout:' + stdout);
                // stderr && console.log('divisionVoiceByTime stderr:' + stderr);
                resolve(1);
            });
        });
    }

    async transformMp3ToPcm({ divisionPath, transformPath }) {
        let cmdStr = `ffmpeg -y  -i "${divisionPath}"  -acodec pcm_s16le -f s16le -ac 1 -ar 16000  "${transformPath}"`;
        isDebug && console.log('transformMp3ToPcm cmdStr:' + cmdStr);
        return new Promise((resolve, rejects) => {
            exec(cmdStr, (err, stdout, stderr) => {
                // err && console.log('divisionVoiceByTime err:' + err);
                // stdout && console.log('divisionVoiceByTime stdout:' + stdout);
                // stderr && console.log('divisionVoiceByTime stderr:' + stderr);
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

// // 识别本地文件，附带参数
// client.recognize(voiceBuffer, "pcm", 16000， {dev_pid: "1536", cuid: Math.random()}}).then(function (result) {
//     console.log("<recognize>: " + JSON.stringify(result));
// }, function(err) {
//     console.log(err);
// });


// 识别远程语音文件
// client.recognizeByUrl("https://github.com/Baidu-AIP/sdk-demo/blob/master/speech/assets/16k_test.pcm", null,
//     "pcm", 8000).then(function (result) {
//         console.log("语音识别远程音频文件结果: " + JSON.stringify(result));
//     }, function (err) {
//         console.log(err);
//     });