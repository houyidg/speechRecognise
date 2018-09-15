import { rejects } from 'assert';
import { MySqlCacheManager } from './../cache/MySqlCacheManager';
import { AudioRecogniseModel } from './../AudioModel';
import { ICacheManager } from './../cache/ICacheManager';
import { DefaultCacheManager } from '../cache/DefaultCacheManager';
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
const scanFileTimeByDay = 10;//每天早上10点开始轮训转换为语音
/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 * 语音识别、合成接口调用量无限。QPS识别默认为10，合成为100
 * 其中会扫描指定目录下的音频文件
 */
export class BaiDuOneSentenceSpeechRecongniseClient implements ISpeechRecongniseClient {
    client: speech;
    resBasePath: string;
    audioBasePath: string;
    translateTextBasePath: string;
    divisionCachePath: string;
    transformPath: string;
    cacheManager: ICacheManager;
    scanCount = 0;
    scanFileTimeInterval = 60 * 1000;//60 s
    firstScanFileTime = 60 * 1000;//60 s
    qps = 8;//api 可达最大并发度
    supportDocumentFomrat = ['mp3', 'pcm', 'wav'];
    public prepare({ resBasePath = process.cwd() + "\\asset", voiceBasePath = resBasePath,
        divisionCachePath = resBasePath + "\\divisionCache"
        , transformPath = resBasePath + "\\transformCache", translateTextBasePath = resBasePath + "\\translateText",
        cacheManagerPath = resBasePath + "\\cacheAudioPath" }) {//准备环境
        this.audioBasePath = voiceBasePath;
        this.divisionCachePath = divisionCachePath;
        this.transformPath = transformPath;
        this.translateTextBasePath = translateTextBasePath;
        this.resBasePath = resBasePath;
        !fs.existsSync(resBasePath) && fs.mkdirSync(resBasePath);
        !fs.existsSync(voiceBasePath) && fs.mkdirSync(voiceBasePath);
        !fs.existsSync(divisionCachePath) && fs.mkdirSync(divisionCachePath);
        !fs.existsSync(translateTextBasePath) && fs.mkdirSync(translateTextBasePath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        this.cacheManager = new MySqlCacheManager();
        this.cacheManager.init(cacheManagerPath);
        console.log('SpeechRecongniseClient transformPath ', transformPath);
        console.log('SpeechRecongniseClient divisionCachePath ', divisionCachePath);
        console.log('SpeechRecongniseClient basePath', voiceBasePath);
        console.log('SpeechRecongniseClient resBasePath', resBasePath);
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
        this.scanCount++;
        let scanFiles = fs.readdirSync(this.audioBasePath);
        console.log('start  自动过滤非音频文件、已经解析的文件  this.scanCount:', this.scanCount);
        let meetFiles: string[] = scanFiles.filter((fileName) => {
            let absolutePath = `${this.audioBasePath}\\${fileName}`;
            let stat = fs.lstatSync(absolutePath)
            if (!stat.isFile()) {
                console.log('filter ', fileName, '  !stat.isFile():', !stat.isFile());
                return false;
            }
            let isHandle = this.cacheManager.saveTaskPath(fileName);
            if (isHandle) {
                console.log('filter ', fileName, '  isHandle:', isHandle);
                return false;
            }
            let suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
            if (this.supportDocumentFomrat.indexOf(suffix) < 0) {
                console.log('filter ', fileName, '  只支持mp3和1分钟时长的pcm和wav格式音频');
                return false;
            }
            return true;
        });
        let startTime = new Date().getTime() / 1000;
        console.log('--------------------------------start all Task  总共需要执行的任务:', meetFiles.length, ' \n:', meetFiles);
        while (meetFiles.length > 0) {
            console.log('\n\r');
            let maxConcurrence = Math.min(this.qps, meetFiles.length);
            let needHandleTasks = meetFiles.splice(0, maxConcurrence);
            console.log('start 并发执行的任务:', needHandleTasks.length, ' \n:', needHandleTasks);
            let taskPromiseArr = [];
            for (let index = 0, len = needHandleTasks.length; index < len; index++) {
                let fileName = needHandleTasks[index];
                let rs = this.assembleTask(fileName, () => {
                    //拿取剩余的任务执行
                    let nextTask = meetFiles.pop();
                    if (nextTask) {
                        console.log('--------------------------------拿取下一个任务：', nextTask, '   等待执行的任务: ', meetFiles.length);
                        return this.assembleTask(nextTask, undefined);
                    } else {
                        console.log('--------------------------------并发通道 ', index, ' 执行完毕，等待其他通道！');
                    }
                });
                taskPromiseArr.push(rs);
            }
            let startTime = new Date().getTime() / 1000;
            await Promise.all(taskPromiseArr)
                .then((rs) => {
                    let endTime = new Date().getTime() / 1000;
                    console.log('----------------Promise.all cost time: ', (endTime - startTime).toFixed(0), '秒 rs:', JSON.stringify(rs));
                }, (e) => {
                    let endTime = new Date().getTime() / 1000;
                    console.log('----------------Promise.all catch  time: ', (endTime - startTime).toFixed(0), '秒 rs:', JSON.stringify(e));
                });
            //continue get fail task
            let retryFileNameTask: string[] = this.cacheManager.getRetryTaskPathsByToday();
            console.log('--------------------------------需要重新处理的任务:', retryFileNameTask.length, '\n:', retryFileNameTask);
            meetFiles.splice(meetFiles.length, 0, ...retryFileNameTask);
        }
        let endTime = new Date().getTime() / 1000;
        console.log('--------------------------------end all Task cost time:', (endTime - startTime).toFixed(0), '秒');
        console.log('\n\r');
    }

    assembleTask(fileName, nextTaskCallback) {
        let startTime = new Date().getTime() / 1000;
        let absolutePath = `${this.audioBasePath}\\${fileName}`;
        let suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
        let fileNameExcludeSuffix = fileName.replace(suffix, '').replace('.', '');
        let audioData = fs.readFileSync(absolutePath);
        let isMp3 = fileName.toLowerCase().indexOf('mp3') > -1;
        console.log('----------------start task  fileName：', fileName, ' suffix:', suffix, '  audio.length:', this.getAudioLen(audioData), ' ----------------');
        //real do 
        return this.startHandleSingleVoice({ absolutePath, fileNameExcludeSuffix, suffix, isMp3 }).then((rs) => {
            this.cacheManager.removeLastTaskPathOnlyCache(fileName);
            this.cacheManager.removeFailTaskPath(fileName);
            let endTime = new Date().getTime() / 1000;
            console.log('----------------end task fileName：', fileName, ' cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice rs：', JSON.stringify(rs), ' ----------------');
            //continue add task 
            if (nextTaskCallback)
                return nextTaskCallback();
        }, (e) => {
            this.cacheManager.removeLastTaskPathOnlyCache(fileName);
            this.cacheManager.removeLastTaskPathOnlyFile(fileName);
            this.cacheManager.saveFailTaskPath(fileName);
            let endTime = new Date().getTime() / 1000;
            console.log('----------------end task catch fileName：', fileName, '  cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice error：', JSON.stringify(e), ' ----------------');
            if (nextTaskCallback)
                return nextTaskCallback();
        });
    }

    async  startHandleSingleVoice({ absolutePath, fileNameExcludeSuffix, suffix, isMp3 }) {
        let rsCode = 1;//1 ok ,2 gettime fail ,3 api fail,4 
        let apiError = [];
        let newSuffix = suffix;
        if (false) {
            apiError = [];
            let translateTextArr: string[] = [];
            // todo 翻译
            let translatePath = absolutePath;
            let rs = await this.handleSingleVoice({ translatePath });
            if (rs && rs.err_msg && rs.err_msg == 'success.') {
                translateTextArr.push(rs.result[0]);
            } else {
                translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                apiError.push({ index: 1, rs: rs });
                rsCode = 3;
            }
            isDebug && console.log('handleSingleVoice !isMp3 rs', rs);
            //持久化
            let translateTextPath = this.translateTextBasePath + '\\' + fileNameExcludeSuffix + '.txt';
            this.saveTranslateTextToFile({ translateTextPath, translateTextArr });
        } else {
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
                    let divisionPath = this.divisionCachePath + '\\' + fileNameExcludeSuffix + '_division_' + index + '.' + suffix;
                    let nextPath = divisionPath;
                    //division
                    let rs = await this.divisionVoiceByTime({ startTime, duration, srcPath, divisionPath })
                        .then((rs) => {
                            isDebug && console.log('divisionVoiceByTime rs', rs);
                            if (!isMp3) {
                                return new Promise((rs, rj) => { rs(1); });
                            } else {
                                //change pcm
                                let transformPath = this.transformPath + '\\' + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                                nextPath = transformPath;
                                newSuffix = 'pcm';
                                return this.transformMp3ToPcm({ divisionPath, transformPath });
                            }
                        }).then((rs) => {
                            isDebug && console.log('transformMp3ToPcm rs', rs);
                            // todo 翻译
                            let translatePath = nextPath;
                            return this.handleSingleVoice({ translatePath, newSuffix });
                        }).catch((rs) => {
                            if (rs) {
                                console.log('handleSingleVoice catch rs', rs);
                                return new Promise((rs, rj) => {
                                    rs(rs);
                                });
                            }
                        });
                    let { result } = rs;
                    if (result && result[0]) {
                        translateTextArr.push(result[0]);
                    } else {
                        translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                        apiError.push({ fileName: fileNameExcludeSuffix + '.' + suffix, rs: rs });
                    }
                }
                if (translateTextArr.indexOf(RecongniseSpeechErrorByBaiduApi) > -1) {
                    rsCode = 3;
                }
                isDebug && console.log('saveTranslateTextToFile rsList', translateTextArr.join());
                //存储到数据库
                //20161020145043_1006_15902875896
                let fileArr = fileNameExcludeSuffix.split('_');
                let model: AudioRecogniseModel = new AudioRecogniseModel();
                model.audioId = fileNameExcludeSuffix;
                model.clientPhone = fileArr[2];
                model.content = translateTextArr.join();
                model.employeeNo = fileArr[1];
                model.translateDate = TimeUtils.getNowAccurateDate();
                model.recordDate = fileArr[0];
                this.cacheManager.saveTranslateResult(model);
                // //存储到文件
                let translateTextPath = this.translateTextBasePath + '\\' + fileNameExcludeSuffix + '.txt';
                this.saveTranslateTextToFile({ translateTextPath, translateTextArr });
            } else {
                //转换分割音频时间段异常
                rsCode = 2;
                isDebug && console.log('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
            }
        }
        return new Promise((rs, rj) => {
            if (rsCode == 1) {
                rs({ rsCode: rsCode });
            } else {
                rj({ rsCode: rsCode, apiError: apiError });
            }
        });
    }

    saveTranslateTextToFile({ translateTextPath, translateTextArr = [] }) {
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
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