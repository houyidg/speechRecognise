
import { speech, HttpClient } from "baidu-aip-sdk";
import * as fs from "fs";
import { baiduConfig, requestTimeout, Clogger } from '../../config';
import { BaseClient } from './BaseClient';
const path = require('path');
const RecongniseSpeechErrorByDivision = '-RecongniseSpeechErrorByDivision-';
const RecongniseSpeechErrorByTransForm = '-RecongniseSpeechErrorByTransForm-';
const RecongniseSpeechErrorByBaiduApi = '-RecongniseSpeechErrorByBaiduApi-';


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
export class BaiDuOneSentenceClient extends BaseClient {
    client: speech;
    public prepare({
        cacheResBasePath = process.cwd() + path.sep + "asset",
        audioSrcBasePath = cacheResBasePath + path.sep + "audio",
        divisionPath = cacheResBasePath + path.sep + "divisionCache",
        transformPath = cacheResBasePath + path.sep + "transformCache",
        translateTextPath = cacheResBasePath + path.sep + "translateTexts",
        handleTaskPath = cacheResBasePath + path.sep + "audioPathCache" }) {//准备环境
        super.prepare({ cacheResBasePath, audioSrcBasePath, divisionPath, transformPath, translateTextPath, handleTaskPath });
        this.client = new speech(baiduConfig.APP_ID, baiduConfig.API_KEY, baiduConfig.SECRET_KEY);
        // 设置request库的一些参数，例如代理服务地址，超时时间等
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        HttpClient.setRequestOptions({ timeout: requestTimeout });
        // 也可以设置拦截每次请求（设置拦截后，调用的setRequestOptions设置的参数将不生效）,
        // 可以按需修改request参数（无论是否修改，必须返回函数调用参数）
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        HttpClient.setRequestInterceptor(function (requestOptions) {
            // 查看参数
            // Clogger.info(requestOptions)
            // 修改参数
            requestOptions.timeout = requestTimeout;
            // 返回参数
            return requestOptions;
        });
    }

    async handleSingleVoice({ translatePath, newSuffix = 'pcm' }): Promise<any> {
        let voice = fs.readFileSync(translatePath);
        return new Promise((resolve, rejects) => {
            if (translatePath && voice && voice.length > 0) {
                // 识别本地文件
                this.client.recognize(voice, newSuffix, 16000).then((result) => {
                    this.isDebug && Clogger.info('handleSingleVoice recognize voice name:', translatePath, " <recognize>: " + JSON.stringify(result));
                    resolve(result);
                }, (err) => {
                    this.isDebug && Clogger.info('handleSingleVoice err voice name:', translatePath, "   err:" + err);
                    rejects(err);
                });
            } else {
                this.isDebug && Clogger.info('handleSingleVoice voice or voicePath is null ');
                rejects(-1);
            }
        });
    }
    handleApiResult({ translateTextArr, apiError, rs, fileNameExcludeSuffix, suffix, nextPath }) {
        try {
            let { result } = rs;
            if (result && result[0]) {
                translateTextArr.push(result[0]);
                return true;
            } else {
                translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                apiError.push({ fileName: fileNameExcludeSuffix + '.' + suffix, nextPath: nextPath, rs: rs });
            }
        } catch (e) {
            Clogger.error('handleApiResult catch e', e);
        }
        return false;
    }
}

// // 识别本地文件，附带参数
// client.recognize(voiceBuffer, "pcm", 16000， {dev_pid: "1536", cuid: Math.random()}}).then(function (result) {
//     Clogger.info("<recognize>: " + JSON.stringify(result));
// }, function(err) {
//     Clogger.info(err);
// });


// 识别远程语音文件
// client.recognizeByUrl("https://github.com/Baidu-AIP/sdk-demo/blob/master/speech/assets/16k_test.pcm", null,
//     "pcm", 8000).then(function (result) {
//         Clogger.info("语音识别远程音频文件结果: " + JSON.stringify(result));
//     }, function (err) {
//         Clogger.info(err);
//     });