"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var baidu_aip_sdk_1 = require("baidu-aip-sdk");
var fs = require("fs");
var config_1 = require("../../config");
var BaseClient_1 = require("./BaseClient");
var path = require('path');
var RecongniseSpeechErrorByDivision = '-RecongniseSpeechErrorByDivision-';
var RecongniseSpeechErrorByTransForm = '-RecongniseSpeechErrorByTransForm-';
var RecongniseSpeechErrorByBaiduApi = '-RecongniseSpeechErrorByBaiduApi-';
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
var baiduErrorCode = [3300, 3301, 3302, 3304, 3305, 3308, 3310, 3311, 3312];
/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 * 语音识别、合成接口调用量无限。QPS识别默认为10，合成为100
 * 其中会扫描指定目录下的音频文件
 */
var BaiDuOneSentenceClient = /** @class */ (function (_super) {
    __extends(BaiDuOneSentenceClient, _super);
    function BaiDuOneSentenceClient() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BaiDuOneSentenceClient.prototype.prepare = function (_a) {
        var _b = _a.cacheResBasePath, cacheResBasePath = _b === void 0 ? process.cwd() + path.sep + "asset" : _b, _c = _a.audioSrcBasePath, audioSrcBasePath = _c === void 0 ? cacheResBasePath + path.sep + "audio" : _c, _d = _a.divisionPath, divisionPath = _d === void 0 ? cacheResBasePath + path.sep + "divisionCache" : _d, _e = _a.transformPath, transformPath = _e === void 0 ? cacheResBasePath + path.sep + "transformCache" : _e, _f = _a.translateTextPath, translateTextPath = _f === void 0 ? cacheResBasePath + path.sep + "translateTexts" : _f, _g = _a.handleTaskPath, handleTaskPath = _g === void 0 ? cacheResBasePath + path.sep + "audioPathCache" : _g;
        _super.prototype.prepare.call(this, { cacheResBasePath: cacheResBasePath, audioSrcBasePath: audioSrcBasePath, divisionPath: divisionPath, transformPath: transformPath, translateTextPath: translateTextPath, handleTaskPath: handleTaskPath });
        this.client = new baidu_aip_sdk_1.speech(config_1.baiduConfig.APP_ID, config_1.baiduConfig.API_KEY, config_1.baiduConfig.SECRET_KEY);
        // 设置request库的一些参数，例如代理服务地址，超时时间等
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        baidu_aip_sdk_1.HttpClient.setRequestOptions({ timeout: config_1.requestTimeout });
        // 也可以设置拦截每次请求（设置拦截后，调用的setRequestOptions设置的参数将不生效）,
        // 可以按需修改request参数（无论是否修改，必须返回函数调用参数）
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        baidu_aip_sdk_1.HttpClient.setRequestInterceptor(function (requestOptions) {
            // 查看参数
            // Clogger.info(requestOptions)
            // 修改参数
            requestOptions.timeout = config_1.requestTimeout;
            // 返回参数
            return requestOptions;
        });
    };
    BaiDuOneSentenceClient.prototype.handleSingleVoice = function (_a) {
        var translatePath = _a.translatePath, _b = _a.newSuffix, newSuffix = _b === void 0 ? 'pcm' : _b;
        return __awaiter(this, void 0, void 0, function () {
            var voice;
            var _this = this;
            return __generator(this, function (_c) {
                voice = fs.readFileSync(translatePath);
                return [2 /*return*/, new Promise(function (resolve, rejects) {
                        if (translatePath && voice && voice.length > 0) {
                            // 识别本地文件
                            _this.client.recognize(voice, newSuffix, 16000).then(function (result) {
                                _this.isDebug && config_1.Clogger.info('handleSingleVoice recognize voice name:', translatePath, " <recognize>: " + JSON.stringify(result));
                                resolve(result);
                            }, function (err) {
                                _this.isDebug && config_1.Clogger.info('handleSingleVoice err voice name:', translatePath, "   err:" + err);
                                rejects(err);
                            });
                        }
                        else {
                            _this.isDebug && config_1.Clogger.info('handleSingleVoice voice or voicePath is null ');
                            rejects(-1);
                        }
                    })];
            });
        });
    };
    return BaiDuOneSentenceClient;
}(BaseClient_1.BaseClient));
exports.BaiDuOneSentenceClient = BaiDuOneSentenceClient;
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
