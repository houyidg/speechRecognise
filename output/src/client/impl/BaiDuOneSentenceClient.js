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
var MySqlCacheManager_1 = require("../cache/MySqlCacheManager");
var TimeUtils_1 = require("../../util/TimeUtils");
var baidu_aip_sdk_1 = require("baidu-aip-sdk");
var fs = require("fs");
var moment = require("moment");
var child_process_1 = require("child_process");
var config_1 = require("../../config");
var isDebug = false;
var RecongniseSpeechErrorByDivision = '-RecongniseSpeechErrorByDivision-';
var RecongniseSpeechErrorByTransForm = '-RecongniseSpeechErrorByTransForm-';
var RecongniseSpeechErrorByBaiduApi = '-RecongniseSpeechErrorByBaiduApi-';
var timeout = 30 * 60 * 1000;
var scanFileTimeByDay = 9; //每天早上10点开始轮训转换为语音
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
var BaiDuOneSentenceClient = /** @class */ (function () {
    function BaiDuOneSentenceClient() {
        this.scanFileTimeInterval = 60 * 1000; //60 s
        this.firstScanFileTime = 60 * 1000; //60 s
        this.qps = 8; //api 可达最大并发度
    }
    BaiDuOneSentenceClient.prototype.prepare = function (_a) {
        var _b = _a.audioSrcBasePath, audioSrcBasePath = _b === void 0 ? process.cwd() + "\\asset" : _b, _c = _a.cacheResBasePath, cacheResBasePath = _c === void 0 ? process.cwd() + "\\asset" : _c, _d = _a.divisionPath, divisionPath = _d === void 0 ? cacheResBasePath + "\\divisionCache" : _d, _e = _a.transformPath, transformPath = _e === void 0 ? cacheResBasePath + "\\transformCache" : _e, _f = _a.translateTextPath, translateTextPath = _f === void 0 ? process.cwd() + "\\translateTexts" : _f, _g = _a.handleTaskPath, handleTaskPath = _g === void 0 ? cacheResBasePath + "\\cacheAudioPath" : _g;
        this.cacheManager = new MySqlCacheManager_1.MySqlCacheManager();
        this.cacheManager.init({ audioSrcBasePath: audioSrcBasePath, cacheResBasePath: cacheResBasePath, handleTaskPath: handleTaskPath, divisionPath: divisionPath, transformPath: transformPath, translateTextPath: translateTextPath });
        // 新建一个对象，建议只保存一个对象调用服务接口
        this.client = new baidu_aip_sdk_1.speech(config_1.BAIDU_CONFIG.APP_ID, config_1.BAIDU_CONFIG.API_KEY, config_1.BAIDU_CONFIG.SECRET_KEY);
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
        var todayHour = moment().format('HH:mm:ss').split(':');
        var todaySecond = parseInt("" + todayHour[0] * 60 * 60) + parseInt("" + todayHour[1] * 60) + parseInt("" + todayHour[2]);
        var todayOffset = scanFileTimeByDay * 60 * 60 - todaySecond;
        if (todayOffset > 0) { //如果今天时间在规定时间之前就延时执行，在之后就直接执行
            this.firstScanFileTime = todayOffset * 1000;
        }
        else {
            this.firstScanFileTime = 0;
        }
        this.scanFileTimeInterval = 24 * 60 * 60 * 1000;
        console.log('SpeechRecongniseClient this.firstScanFileTime:', this.firstScanFileTime / 1000, '秒     this.scanFileTimeInterval :', this.scanFileTimeInterval / (1000 * 60 * 60), 'h 间隔执行 ');
    };
    BaiDuOneSentenceClient.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    setTimeout(function () {
                        _this.handle();
                        setInterval(function () {
                            _this.handle();
                        }, _this.scanFileTimeInterval);
                    }, this.firstScanFileTime);
                }
                catch (e) {
                    console.log('start  error', e);
                }
                return [2 /*return*/];
            });
        });
    };
    BaiDuOneSentenceClient.prototype.handle = function () {
        return __awaiter(this, void 0, void 0, function () {
            var meetModels, retryModels, startTime, _loop_1, this_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        retryModels = [];
                        startTime = new Date().getTime() / 1000;
                        _loop_1 = function () {
                            var needHandleTasks, taskPromiseArr, _loop_2, index, len, startTime_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        meetModels.splice.apply(meetModels, [meetModels.length, 0].concat(retryModels));
                                        console.log('--------------------------------start all Task  总共需要执行的任务:', meetModels.length, ' 包含重试的任务:', retryModels.length, ' \n:', meetModels);
                                        console.log('\n\r');
                                        retryModels = [];
                                        needHandleTasks = meetModels.splice(0, Math.min(this_1.qps, meetModels.length));
                                        console.log('start 建立并发通道数:', needHandleTasks.length);
                                        taskPromiseArr = [];
                                        _loop_2 = function (index, len) {
                                            var needModel = needHandleTasks[index];
                                            var rs = this_1.assembleTask(needModel, function () {
                                                //拿取剩余的任务执行
                                                var nextModel = meetModels.pop();
                                                if (nextModel) {
                                                    console.log('--------------------------------拿取下一个任务：', nextModel, '   等待执行的任务: ', meetModels.length);
                                                    return _this.assembleTask(nextModel, undefined);
                                                }
                                                else {
                                                    console.log('--------------------------------并发通道 ', index, ' 执行完毕，等待其他通道！');
                                                }
                                            });
                                            taskPromiseArr.push(rs);
                                        };
                                        for (index = 0, len = needHandleTasks.length; index < len; index++) {
                                            _loop_2(index, len);
                                        }
                                        startTime_1 = new Date().getTime() / 1000;
                                        return [4 /*yield*/, Promise.all(taskPromiseArr)
                                                .then(function (rs) {
                                                console.log('----------------Promise.all cost time: ', (new Date().getTime() / 1000 - startTime_1).toFixed(0), '秒 rs:', JSON.stringify(rs));
                                            }, function (e) {
                                                console.log('----------------Promise.all catch  time: ', (new Date().getTime() / 1000 - startTime_1).toFixed(0), '秒 rs:', JSON.stringify(e));
                                            })];
                                    case 1:
                                        _a.sent();
                                        //continue get fail task
                                        retryModels = this_1.cacheManager.getRetryModelsByToday();
                                        this_1.cacheManager.removeAllTaskCacheByOneLoop();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this.cacheManager.getNeedHandleFiles()];
                    case 2:
                        if (!((meetModels = _a.sent()).length > 0 || retryModels.length > 0)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4:
                        this.cacheManager.removeAllTaskCacheByAtTime();
                        console.log('-----------------------------------------end all Task cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒');
                        console.log('\n\r');
                        return [2 /*return*/];
                }
            });
        });
    };
    //nextModel
    BaiDuOneSentenceClient.prototype.assembleTask = function (sessionModel, nextTaskCallback) {
        var _this = this;
        var startTime = new Date().getTime() / 1000;
        var fileName = sessionModel.fileName;
        var absolutePath = this.cacheManager.getAudioSrcBasePath() + "\\" + fileName;
        var suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
        var fileNameExcludeSuffix = fileName.replace(suffix, '').replace('.', '');
        var audioData = fs.readFileSync(absolutePath);
        var isMp3 = fileName.toLowerCase().indexOf('mp3') > -1;
        console.log('----------------start task  fileName：', fileName, ' suffix:', suffix, '  audio.length:', this.getAudioLen(audioData), ' ----------------');
        //real do 
        return this.startHandleSingleVoice({ sessionModel: sessionModel, absolutePath: absolutePath, fileNameExcludeSuffix: fileNameExcludeSuffix, suffix: suffix, isMp3: isMp3 }).then(function (rs) {
            _this.cacheManager.removeFailTaskPath(fileName);
            var endTime = new Date().getTime() / 1000;
            console.log('----------------end task fileName：', fileName, ' cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice rs：', JSON.stringify(rs), ' ----------------');
            //continue add task 
            if (nextTaskCallback)
                return nextTaskCallback();
        }, function (e) {
            _this.cacheManager.saveFailTaskPath(fileName);
            var endTime = new Date().getTime() / 1000;
            console.log('----------------end task catch fileName：', fileName, '  cost time: ', (endTime - startTime).toFixed(0), '秒 startHandleSingleVoice error：', JSON.stringify(e), ' ----------------');
            if (nextTaskCallback)
                return nextTaskCallback();
        });
    };
    BaiDuOneSentenceClient.prototype.startHandleSingleVoice = function (_a) {
        var sessionModel = _a.sessionModel, absolutePath = _a.absolutePath, fileNameExcludeSuffix = _a.fileNameExcludeSuffix, suffix = _a.suffix, isMp3 = _a.isMp3;
        return __awaiter(this, void 0, void 0, function () {
            var rsCode, apiError, newSuffix, rs, timeQuanTum, translateTextArr, _loop_3, this_2, index, len;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rsCode = 1;
                        apiError = [];
                        newSuffix = suffix;
                        return [4 /*yield*/, this.getVoicePlayTime(absolutePath)];
                    case 1:
                        rs = _b.sent();
                        isDebug && console.log('playTime:', rs);
                        timeQuanTum = TimeUtils_1.TimeUtils.getSecondByTimeOffset(rs.playTime);
                        if (!(timeQuanTum.length > 1)) return [3 /*break*/, 7];
                        translateTextArr = [];
                        apiError = [];
                        _loop_3 = function (index, len) {
                            var startTime, nextTime, duration, srcPath, divisionPath, nextPath, rs_1, result, err_no;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        startTime = timeQuanTum[index];
                                        nextTime = timeQuanTum[index + 1];
                                        duration = TimeUtils_1.TimeUtils.getMinDuration(startTime, nextTime);
                                        srcPath = absolutePath;
                                        divisionPath = this_2.cacheManager.getDivisionPath() + '\\' + fileNameExcludeSuffix + '_division_' + index + '.' + suffix;
                                        nextPath = divisionPath;
                                        return [4 /*yield*/, this_2.divisionVoiceByTime({ startTime: startTime, duration: duration, srcPath: srcPath, divisionPath: divisionPath })
                                                .then(function (rs) {
                                                isDebug && console.log('divisionVoiceByTime rs', rs);
                                                if (!isMp3) {
                                                    return new Promise(function (rs, rj) { rs(1); });
                                                }
                                                else {
                                                    //change pcm
                                                    var transformPath = _this.cacheManager.getTransformPath() + '\\' + fileNameExcludeSuffix + '_transform_' + index + '.pcm';
                                                    nextPath = transformPath;
                                                    newSuffix = 'pcm';
                                                    return _this.transformMp3ToPcm({ divisionPath: divisionPath, transformPath: transformPath });
                                                }
                                            }).then(function (rs) {
                                                isDebug && console.log('transformMp3ToPcm rs', rs);
                                                // todo 翻译
                                                var translatePath = nextPath;
                                                return _this.handleSingleVoice({ translatePath: translatePath, newSuffix: newSuffix });
                                            }, function (rj) {
                                                if (rj) {
                                                    console.log('handleSingleVoice catch rs', rj);
                                                    return new Promise(function (rs, rj) {
                                                        rs(rs);
                                                    });
                                                }
                                            })];
                                    case 1:
                                        rs_1 = _a.sent();
                                        result = rs_1.result;
                                        if (result && result[0]) {
                                            translateTextArr.push(result[0]);
                                        }
                                        else {
                                            err_no = rs_1.err_no;
                                            if (err_no && baiduErrorCode.indexOf(err_no) > -1) { //音频质量差,不用重试
                                            }
                                            else {
                                                translateTextArr.push(RecongniseSpeechErrorByBaiduApi);
                                            }
                                            apiError.push({ fileName: fileNameExcludeSuffix + '.' + suffix, nextPath: nextPath, rs: rs_1 });
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        index = 0, len = timeQuanTum.length;
                        _b.label = 2;
                    case 2:
                        if (!(index < len - 1)) return [3 /*break*/, 5];
                        return [5 /*yield**/, _loop_3(index, len)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        index++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (translateTextArr.indexOf(RecongniseSpeechErrorByBaiduApi) > -1) {
                            rsCode = 3;
                        }
                        //存储到数据库
                        // //存储到文件
                        return [4 /*yield*/, this.cacheManager.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr)];
                    case 6:
                        //存储到数据库
                        // //存储到文件
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        //转换分割音频时间段异常
                        rsCode = 2;
                        isDebug && console.log('timeQuanTum 转换分割音频时间段异常', timeQuanTum);
                        _b.label = 8;
                    case 8: return [2 /*return*/, new Promise(function (rs, rj) {
                            if (rsCode == 1) {
                                rs({ rsCode: rsCode, apiError: apiError });
                            }
                            else {
                                rj({ rsCode: rsCode, apiError: apiError });
                            }
                        })];
                }
            });
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
                                isDebug && console.log('handleSingleVoice recognize voice name:', translatePath, " <recognize>: " + JSON.stringify(result));
                                resolve(result);
                            }, function (err) {
                                isDebug && console.log('handleSingleVoice err voice name:', translatePath, "   err:" + err);
                                rejects(err);
                            });
                        }
                        else {
                            isDebug && console.log('handleSingleVoice voice or voicePath is null ');
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
    BaiDuOneSentenceClient.prototype.getVoicePlayTime = function (voicePath) {
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_a) {
                cmdStr = "ffmpeg -i \"" + voicePath + "\"";
                isDebug && console.log('getVoiceTime  cmdStr ', cmdStr);
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
                                isDebug && console.log('getVoiceTime stderr time ', time);
                            }
                            if ((startIndex = stdout.indexOf("Duration")) > -1) {
                                startIndex = startIndex + matchStrLen + realStartOffset;
                                time = stdout.substring(startIndex, startIndex + endIndex);
                                isDebug && console.log('getVoiceTime  stdout time ', time);
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
    BaiDuOneSentenceClient.prototype.divisionVoiceByTime = function (_a) {
        var startTime = _a.startTime, duration = _a.duration, srcPath = _a.srcPath, divisionPath = _a.divisionPath;
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_b) {
                cmdStr = "ffmpeg -i \"" + srcPath + "\" -y -ss " + startTime + " -t " + duration + " -acodec copy \"" + divisionPath + "\"";
                isDebug && console.log('divisionVoiceByTime cmdStr:' + cmdStr);
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
    BaiDuOneSentenceClient.prototype.transformMp3ToPcm = function (_a) {
        var divisionPath = _a.divisionPath, transformPath = _a.transformPath;
        return __awaiter(this, void 0, void 0, function () {
            var cmdStr;
            return __generator(this, function (_b) {
                cmdStr = "ffmpeg -y  -i \"" + divisionPath + "\"  -acodec pcm_s16le -f s16le -ac 1 -ar 16000  \"" + transformPath + "\"";
                isDebug && console.log('transformMp3ToPcm cmdStr:' + cmdStr);
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
    BaiDuOneSentenceClient.prototype.getAudioLen = function (voice) {
        return voice && ((voice.length / 1024).toFixed(0) + 'kb');
    };
    BaiDuOneSentenceClient.prototype.stop = function () {
    };
    return BaiDuOneSentenceClient;
}());
exports.BaiDuOneSentenceClient = BaiDuOneSentenceClient;
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
