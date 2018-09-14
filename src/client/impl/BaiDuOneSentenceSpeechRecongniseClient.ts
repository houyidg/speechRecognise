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
const scanFileTimeByDay = 17;//每天早上10点开始轮训转换为语音
/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 * 语音识别、合成接口调用量无限。QPS识别默认为10，合成为100
 * 其中会扫描指定目录下的音频文件
 */
export class BaiDuOneSentenceSpeechRecongniseClient implements ISpeechRecongniseClient {
    client: speech;
    audioBasePath: string;
    translateTextBasePath: string;
    divisionCachePath: string;
    transformPath: string;
    rootPath: string;
    cacheManager: ICacheManager;
    scanCount = 0;
    scanFileTimeInterval = 60 * 1000;//60 s
    firstScanFileTime = 60 * 1000;//60 s
    public prepare({ rootPath = process.cwd(), voiceBasePath = process.cwd() + "\\asset", divisionCachePath = process.cwd() + "\\asset\\divisionCache"
        , transformPath = process.cwd() + "\\asset\\transformCache", translateTextBasePath = process.cwd() + "\\asset\\translateText",
        cacheManagerPath = process.cwd() + "\\asset\\cacheAudioPath" }) {//准备环境
        this.rootPath = rootPath;
        this.cacheManager = new DefaultCacheManager();
        this.cacheManager.init(cacheManagerPath);
        this.audioBasePath = voiceBasePath;
        this.divisionCachePath = divisionCachePath;
        this.transformPath = transformPath;
        this.translateTextBasePath = translateTextBasePath;
        !fs.existsSync(divisionCachePath) && fs.mkdirSync(divisionCachePath);
        !fs.existsSync(translateTextBasePath) && fs.mkdirSync(translateTextBasePath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        console.log('SpeechRecongniseClient transformPath ', transformPath);
        console.log('SpeechRecongniseClient divisionCachePath ', divisionCachePath);
        console.log('SpeechRecongniseClient basePath', voiceBasePath);
        console.log('SpeechRecongniseClient rootPath', rootPath);
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
        console.log('start  scanFiles:', scanFiles);
        for (let index = 0, len = scanFiles.length; index < len; index++) {
            let subFile = scanFiles[index];
            let absolutePath = `${this.audioBasePath}\\${subFile}`;
            let stat = fs.lstatSync(absolutePath)
            if (!stat.isFile()) {
                console.log('start  !stat.isFile():', !stat.isFile());
                continue;
            }
            let isHandle = this.cacheManager.saveTaskPath(absolutePath);
            if (isHandle) {
                console.log('start  isHandle:', isHandle);
                continue;
            }
            let suffix = subFile.substring(subFile.lastIndexOf('.') + 1, subFile.length);
            let fileNameExcludeSuffix = subFile.replace(suffix, '').replace('.', '');
            let audioData = fs.readFileSync(absolutePath);
            console.log('start  absolutePath:', absolutePath, ' subFile', subFile, ' suffix:', suffix, '  audio.length:', this.getAudioLen(audioData));

            let isMp3 = false;
            if (subFile.toLowerCase().indexOf('mp3') > -1) {
                isMp3 = true;
            } else if (subFile.toLowerCase().indexOf('pcm') > -1 || subFile.toLowerCase().indexOf('wav') > -1) {//不需要转换
                isMp3 = false;
            } else {
                console.log('start  只支持mp3和1分钟时长的pcm和wav格式音频');
                continue;
            }
            //real do 
            let rs = await this.startHandleSingleVoice({ absolutePath, fileNameExcludeSuffix, suffix, isMp3 }).catch((e) => {
                console.log('start catch startHandleSingleVoice error', e);
            });
            this.cacheManager.clearLastTaskPathOnlyCache(absolutePath);
            console.log('start  startHandleSingleVoice rs', rs);
        }
    }

    async  startHandleSingleVoice({ absolutePath, fileNameExcludeSuffix, suffix, isMp3 }) {
        let rsCode = 1;//1 ok ,2 gettime fail ,3 api fail
        if (!isMp3) {
            let translateTextArr: string[] = [];
            // todo 翻译
            let translatePath = absolutePath;
            let rs = await this.handleSingleVoice({ translatePath });
            if (rs && rs.err_msg && rs.err_msg == 'success.') {
                translateTextArr.push(rs.result[0]);
            } else {
                translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
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
                            //change pcm
                            let transformPath = this.transformPath + '\\' + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                            nextPath = transformPath;
                            return this.transformMp3ToPcm({ divisionPath, transformPath });
                        }).then((rs) => {
                            isDebug && console.log('transformMp3ToPcm rs', rs);
                            // todo 翻译
                            let translatePath = nextPath;
                            return this.handleSingleVoice({ translatePath });
                        }).catch((rs) => {

                            console.log('handleSingleVoice catch rs', rs);
                        });
                    let { result } = rs;
                    if (result && result[0]) {
                        translateTextArr.push(result[0]);
                    } else {
                        translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                    }
                }
                if (translateTextArr.indexOf(RecongniseSpeechErrorByBaiduApi) > -1) {
                    rsCode = 3;
                }
                isDebug && console.log('saveTranslateTextToFile rsList', translateTextArr.join());
                //存储到文件
                let translateTextPath = this.translateTextBasePath + '\\' + fileNameExcludeSuffix + '.txt';
                this.saveTranslateTextToFile({ translateTextPath, translateTextArr });
            } else {
                //转换分割音频时间段异常
                rsCode = 2;
                isDebug && console.log('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
            }
        }
        return new Promise((rs, rj) => {
            if (rsCode != 1) {
                rs({ rsCode: rsCode });
            } else {
                rj({ rsCode: rsCode });
            }
        });
    }

    saveTranslateTextToFile({ translateTextPath, translateTextArr = [] }) {
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    }

    async handleSingleVoice({ translatePath }): Promise<any> {
        let voice = fs.readFileSync(translatePath);
        return new Promise((resolve, rejects) => {
            if (translatePath && voice && voice.length > 0) {
                // 识别本地文件
                this.client.recognize(voice, "pcm", 16000).then((result) => {
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
        return voice && (voice.length / 1024 + 'kb');
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