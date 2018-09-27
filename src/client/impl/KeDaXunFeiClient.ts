
import { speech, HttpClient } from "baidu-aip-sdk";
import * as fs from "fs";
import { baiduConfig, requestTimeout, Clogger } from '../../config';
import { BaseClient } from './BaseClient';
const path = require('path');

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
}
