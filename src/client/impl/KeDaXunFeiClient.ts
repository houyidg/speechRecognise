
import * as Xunfei from "xunfeisdk";
import { IATAueType, IATEngineType, ISEAueType, ISECategoryType, ISELanguageType, ISEResultLevelType, TTSAueType, TTSAufType, TTSEngineType, TTSVoiceName } from "xunfeisdk";

import * as fs from "fs";
import { Clogger } from '../../config';
import { BaseClient } from './BaseClient';
const path = require('path');
const RecongniseSpeechErrorByXunFeiApi = '-RecongniseSpeechErrorByXunFei-';
export class KeDaXunFeiClient extends BaseClient {
    client;
    public prepare({
        cacheResBasePath = process.cwd() + path.sep + "asset",
        audioSrcBasePath = cacheResBasePath + path.sep + "audio",
        divisionPath = cacheResBasePath + path.sep + "divisionCache",
        transformPath = cacheResBasePath + path.sep + "transformCache",
        translateTextPath = cacheResBasePath + path.sep + "translateTexts",
        handleTaskPath = cacheResBasePath + path.sep + "audioPathCache" }) {//准备环境
        super.prepare({ cacheResBasePath, audioSrcBasePath, divisionPath, transformPath, translateTextPath, handleTaskPath });
        this.client = new Xunfei.Client("5b8f8ff1");
        this.client.IATAppKey = "e5e368900d0c123616536f3368336da0";
    }

    async handleSingleVoice({ translatePath, newSuffix = 'pcm' }): Promise<any> {
        let rs;
        try {
            let audio = fs.readFileSync(translatePath);
            rs = this.client.IAT(audio, IATEngineType.SMS16K_Mandarin, IATAueType.RAW);
        } catch (error) {
            // Oops...
            Clogger.info('handleSingleVoice error', error);
        }
        return rs;
    }

    handleApiResult({ translateTextArr, apiError, rs, fileNameExcludeSuffix, suffix, nextPath }) {
        try {
            let { data } = rs;
            if (data) {
                translateTextArr.push(data);
                return true;
            } else {
                translateTextArr.push(RecongniseSpeechErrorByXunFeiApi);
                apiError.push({ fileName: fileNameExcludeSuffix + '.' + suffix, nextPath: nextPath, rs: rs });
            }
        } catch (e) {
            Clogger.error('handleApiResult catch e', e);
        }
        return false;
    }
}
