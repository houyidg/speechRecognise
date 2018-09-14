"use strict";
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
var TimeUtils_1 = require("./util/TimeUtils");
var baidu_aip_sdk_1 = require("baidu-aip-sdk");
var fs = require("fs");
var os = require("os");
var config_1 = require("./config");
var child_process_1 = require("child_process");
var RecongniseSpeechErrorByDivision = '-RecongniseSpeechErrorByDivision-';
var RecongniseSpeechErrorByBaiduApi = '-RecongniseSpeechErrorByBaiduApi-';
var RecongniseSpeechErrorByTransForm = '-RecongniseSpeechErrorByTransForm-';
var timeout = 10 * 60 * 1000;
/**
 * 对mp3,pcm,wav格式音频进行翻译
 * MP3:超过一分钟时长需要分割，再转换为pcm，再通过api翻译成文字写入文件
 * pcm/wav：能翻译时长在1分钟之内的音频，再写入文件中
 *
 * 其中会扫描指定目录下的音频文件
 */
var SpeechRecongniseClient = /** @class */ (function () {
    function SpeechRecongniseClient() {
    }
    SpeechRecongniseClient.prototype.prepare = function (_a) {
        var _b = _a.rootPath, rootPath = _b === void 0 ? process.cwd() : _b, _c = _a.voiceBasePath, voiceBasePath = _c === void 0 ? process.cwd() + "\\asset" : _c, _d = _a.divisionCachePath, divisionCachePath = _d === void 0 ? process.cwd() + "\\asset\\divisionCache" : _d, _e = _a.transformPath, transformPath = _e === void 0 ? process.cwd() + "\\asset\\transformCache" : _e, _f = _a.translateTextBasePath, translateTextBasePath = _f === void 0 ? process.cwd() + "\\asset\\translateText" : _f;
        this.rootPath = rootPath;
        this.voiceBasePath = voiceBasePath;
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
        this.client = new baidu_aip_sdk_1.speech(config_1.APP_ID, config_1.API_KEY, config_1.SECRET_KEY);
        // 设置request库的一些参数，例如代理服务地址，超时时间等
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        baidu_aip_sdk_1.HttpClient.setRequestOptions({ timeout: timeout });
        // 也可以设置拦截每次请求（设置拦截后，调用的setRequestOptions设置的参数将不生效）,
        // 可以按需修改request参数（无论是否修改，必须返回函数调用参数）
        // request参数请参考 https://github.com/request/request#requestoptions-callback
        baidu_aip_sdk_1.HttpClient.setRequestInterceptor(function (requestOptions) {
            // 查看参数
            // console.log(requestOptions)
            // 修改参数
            requestOptions.timeout = timeout;
            // 返回参数
            return requestOptions;
        });
    };
    SpeechRecongniseClient.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var filePaths, index, len, subFile, absolutePath, stat, suffix, fileNameExcludeSuffix, voice, isMp3;
            return __generator(this, function (_a) {
                try {
                    filePaths = fs.readdirSync(this.voiceBasePath);
                    console.log('filePaths:', filePaths);
                    for (index = 0, len = filePaths.length; index < len; index++) {
                        subFile = filePaths[index];
                        absolutePath = this.voiceBasePath + "\\" + subFile;
                        console.log('-----absolutePath:', absolutePath, ' subFile', subFile);
                        stat = fs.lstatSync(absolutePath);
                        if (stat.isDirectory()) {
                            continue;
                        }
                        suffix = subFile.substring(subFile.lastIndexOf('.') + 1, subFile.length);
                        fileNameExcludeSuffix = subFile.replace(suffix, '').replace('.', '');
                        voice = fs.readFileSync(absolutePath);
                        console.log('suffix:', suffix, ' ------voice.length:', this.getVoiceLen(voice));
                        isMp3 = false;
                        if (subFile.toLowerCase().indexOf('mp3') > -1) {
                            isMp3 = true;
                        }
                        else if (subFile.toLowerCase().indexOf('pcm') > -1 || subFile.toLowerCase().indexOf('wav') > -1) { //不需要转换
                            isMp3 = false;
                        }
                        else {
                            console.log('只支持mp3和1分钟时长的pcm和wav格式音频');
                            continue;
                        }
                        try {
                            //real do 
                            this.startHandleSingleVoice({ absolutePath: absolutePath, fileNameExcludeSuffix: fileNameExcludeSuffix, suffix: suffix, isMp3: isMp3 });
                        }
                        catch (e) {
                            console.log('startHandleSingleVoice error', e);
                        }
                    }
                }
                catch (e) {
                    console.log('error', e);
                }
                return [2 /*return*/];
            });
        });
    };
    SpeechRecongniseClient.prototype.startHandleSingleVoice = function (_a) {
        var absolutePath = _a.absolutePath, fileNameExcludeSuffix = _a.fileNameExcludeSuffix, suffix = _a.suffix, isMp3 = _a.isMp3;
        return __awaiter(this, void 0, void 0, function () {
            var translateTextArr, translatePath, rs_1, translateTextPath, rs, timeQuanTum, translateTextArr, index, len, startTime, nextTime, duration, srcPath, divisionPath, rs_2, nextPath, transformPath, translatePath, translateTextPath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!isMp3) return [3 /*break*/, 2];
                        translateTextArr = [];
                        translatePath = absolutePath;
                        return [4 /*yield*/, this.handleSingleVoice({ translatePath: translatePath })];
                    case 1:
                        rs_1 = _b.sent();
                        if (rs_1 && rs_1.err_msg && rs_1.err_msg == 'success.') {
                            translateTextArr.push(rs_1.result[0]);
                        }
                        else {
                            translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                        }
                        console.log('handleSingleVoice !isMp3 rs', rs_1);
                        translateTextPath = this.translateTextBasePath + '\\' + fileNameExcludeSuffix + '.txt';
                        this.saveTranslateTextToFile({ translateTextPath: translateTextPath, translateTextArr: translateTextArr });
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, this.getVoicePlayTime(absolutePath)];
                    case 3:
                        rs = _b.sent();
                        console.log('playTime:', rs);
                        timeQuanTum = TimeUtils_1.TimeUtils.getSecondByTimeOffset(rs.playTime);
                        if (!(timeQuanTum.length > 1)) return [3 /*break*/, 11];
                        translateTextArr = [];
                        index = 0, len = timeQuanTum.length;
                        _b.label = 4;
                    case 4:
                        if (!(index < len - 1)) return [3 /*break*/, 10];
                        startTime = timeQuanTum[index];
                        nextTime = timeQuanTum[index + 1];
                        duration = TimeUtils_1.TimeUtils.getMinDuration(startTime, nextTime);
                        srcPath = absolutePath;
                        divisionPath = this.divisionCachePath + '\\' + fileNameExcludeSuffix + '_division_' + index + '.' + suffix;
                        return [4 /*yield*/, this.divisionVoiceByTime({ startTime: startTime, duration: duration, srcPath: srcPath, divisionPath: divisionPath })];
                    case 5:
                        rs_2 = _b.sent();
                        console.log('divisionVoiceByTime rs', rs_2);
                        nextPath = divisionPath;
                        if (!isMp3) return [3 /*break*/, 7];
                        transformPath = this.transformPath + '\\' + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                        nextPath = transformPath;
                        return [4 /*yield*/, this.transformMp3ToPcm({ divisionPath: divisionPath, transformPath: transformPath })];
                    case 6:
                        rs_2 = _b.sent();
                        console.log('transformMp3ToPcm rs', rs_2);
                        _b.label = 7;
                    case 7:
                        translatePath = nextPath;
                        return [4 /*yield*/, this.handleSingleVoice({ translatePath: translatePath })];
                    case 8:
                        rs_2 = _b.sent();
                        if (rs_2 && rs_2.err_msg && rs_2.err_msg == 'success.') {
                            translateTextArr.push(rs_2.result[0]);
                        }
                        else {
                            translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                        }
                        console.log('handleSingleVoice rs', rs_2);
                        _b.label = 9;
                    case 9:
                        index++;
                        return [3 /*break*/, 4];
                    case 10:
                        console.log('saveTranslateTextToFile translateTextArr', translateTextArr.join(' '));
                        translateTextPath = this.translateTextBasePath + '\\' + fileNameExcludeSuffix + '.txt';
                        this.saveTranslateTextToFile({ translateTextPath: translateTextPath, translateTextArr: translateTextArr });
                        return [3 /*break*/, 12];
                    case 11:
                        //转换分割音频时间段异常
                        console.log('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
                        _b.label = 12;
                    case 12:
                        console.log('timeQuanTum :', timeQuanTum);
                        return [2 /*return*/];
                }
            });
        });
    };
    SpeechRecongniseClient.prototype.saveTranslateTextToFile = function (_a) {
        var translateTextPath = _a.translateTextPath, _b = _a.translateTextArr, translateTextArr = _b === void 0 ? [] : _b;
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    };
    SpeechRecongniseClient.prototype.handleSingleVoice = function (_a) {
        var translatePath = _a.translatePath;
        return __awaiter(this, void 0, void 0, function () {
            var voice;
            var _this = this;
            return __generator(this, function (_b) {
                voice = fs.readFileSync(translatePath);
                return [2 /*return*/, new Promise(function (resolve, rejects) {
                        if (translatePath && voice && voice.length > 0) {
                            // 识别本地文件
                            _this.client.recognize(voice, "pcm", 16000).then(function (result) {
                                console.log('voice name:', translatePath, " <recognize>: " + JSON.stringify(result));
                                resolve(result);
                            }, function (err) {
                                console.log('voice name:', translatePath, "   err:" + err);
                                rejects(err);
                            });
                        }
                        else {
                            console.log('handleSingleVoice voice or voicePath is null ');
                            rejects(-1);
                        }
                    })];
            });
        });
    };
    /**
     * return 00:13:02 hh:mm:ss
     * @param voicePath
     */
    SpeechRecongniseClient.prototype.getVoicePlayTime = function (voicePath) {
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_a) {
                cmdStr = "ffmpeg -i " + voicePath;
                console.log('getVoiceTime  cmdStr ', cmdStr);
                return [2 /*return*/, new Promise(function (resolve, rejects) {
                        child_process_1.exec(cmdStr, { encoding: 'utf8' }, function (err, stdout, stderr) {
                            var time; //Duration: 00:13:02.64
                            var endIndex = '00:13:02'.length;
                            var matchStrLen = "Duration".length;
                            var realStartOffset = ': '.length;
                            var startIndex = -1;
                            if ((startIndex = stderr.indexOf("Duration")) > -1) {
                                startIndex = startIndex + matchStrLen + realStartOffset;
                                time = stderr.substring(startIndex, startIndex + endIndex);
                                console.log('getVoiceTime stderr time ', time);
                            }
                            if ((startIndex = stdout.indexOf("Duration")) > -1) {
                                startIndex = startIndex + matchStrLen + realStartOffset;
                                time = stdout.substring(startIndex, startIndex + endIndex);
                                console.log('getVoiceTime  stdout time ', time);
                            }
                            var rs = { playTime: "-1" };
                            if (time) {
                                rs.playTime = time;
                                resolve(rs);
                            }
                            else {
                                rejects(rs);
                            }
                        });
                    })];
            });
        });
    };
    SpeechRecongniseClient.prototype.divisionVoiceByTime = function (_a) {
        var startTime = _a.startTime, duration = _a.duration, srcPath = _a.srcPath, divisionPath = _a.divisionPath;
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_b) {
                cmdStr = "ffmpeg -i " + srcPath + " -y -ss " + startTime + " -t " + duration + " -acodec copy " + divisionPath;
                console.log('divisionVoiceByTime cmdStr:' + cmdStr);
                return [2 /*return*/, new Promise(function (resolve, rejects) {
                        child_process_1.exec(cmdStr, function (err, stdout, stderr) {
                            // err && console.log('divisionVoiceByTime err:' + err);
                            // stdout && console.log('divisionVoiceByTime stdout:' + stdout);
                            // stderr && console.log('divisionVoiceByTime stderr:' + stderr);
                            resolve(1);
                        });
                    })];
            });
        });
    };
    SpeechRecongniseClient.prototype.transformMp3ToPcm = function (_a) {
        var divisionPath = _a.divisionPath, transformPath = _a.transformPath;
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_b) {
                cmdStr = "ffmpeg -y  -i " + divisionPath + "  -acodec pcm_s16le -f s16le -ac 1 -ar 16000  " + transformPath;
                console.log('transformMp3ToPcm cmdStr:' + cmdStr);
                return [2 /*return*/, new Promise(function (resolve, rejects) {
                        child_process_1.exec(cmdStr, function (err, stdout, stderr) {
                            // err && console.log('divisionVoiceByTime err:' + err);
                            // stdout && console.log('divisionVoiceByTime stdout:' + stdout);
                            // stderr && console.log('divisionVoiceByTime stderr:' + stderr);
                            resolve(1);
                        });
                    })];
            });
        });
    };
    SpeechRecongniseClient.prototype.getVoiceLen = function (voice) {
        return voice && (voice.length / 1024 + 'kb');
    };
    SpeechRecongniseClient.prototype.stop = function () {
    };
    return SpeechRecongniseClient;
}());
exports.SpeechRecongniseClient = SpeechRecongniseClient;
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
