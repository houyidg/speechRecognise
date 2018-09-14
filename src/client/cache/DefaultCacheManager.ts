import { AudioRecogniseModel } from './../AudioModel';

import { ICacheManager } from './ICacheManager';
import * as fs from "fs";
import * as os from "os";
import { TimeUtils } from '../../util/TimeUtils';
export class DefaultCacheManager implements ICacheManager {
    private lastHandleAudioPaths: Set<String>;//上一次处理的文件路径
    private failHandleAudioPaths: Set<String>;//上一次处理的文件路径
    private cacheAudioBasePath;//以及处理的audio路径文件夹

    public init(cacheAudioBasePath) {
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPaths = new Set();
        this.cacheAudioBasePath = cacheAudioBasePath;
        !fs.existsSync(cacheAudioBasePath) && fs.mkdirSync(cacheAudioBasePath);
    }

    public getTodayCacheTaskPath(): string {
        return this.cacheAudioBasePath + '\\' + TimeUtils.getNowFormatDate();
    }

    public saveTaskPath(path: string): boolean {
        //内存中
        this.lastHandleAudioPaths.add(path);//20161017141228
        this.removeFailTaskPath(path);
        //文件中
        let audioPath = this.getTodayCacheTaskPath();
        let isExist = fs.existsSync(audioPath);
        if (!isExist) {
            let audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return false;
        }
        let content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) < 0) {
            let audioPathContent = path + os.EOL;
            fs.appendFile(audioPath, audioPathContent, (err) => {
                if (err)
                    console.log('CacheManager saveTaskPath err', err);
            });
            return false;
        }
        return true;
    }

    public saveFailTaskPath(path: string) {
        this.failHandleAudioPaths.add(path);
        this.removeLastTaskPathOnlyCache(path);
        this.removeLastTaskPathOnlyFile(path);
    }

    public removeFailTaskPath(path: string) {
        this.failHandleAudioPaths.delete(path);
    }

    public removeLastTaskPathOnlyFile(path: string) {
        let audioPath = this.getTodayCacheTaskPath();
        let content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) > -1) {
            content.replace(path, '');
            let audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return true;
        }
        return false;
    }

    public removeLastTaskPathOnlyCache(path: string) {
        this.lastHandleAudioPaths.delete(path);
    }

    public removeAllTaskPath() {
        this.lastHandleAudioPaths.clear();
        this.failHandleAudioPaths.clear();
    }

    public backUpTaskPathByTimer() {

    }

    public saveTranslateResult(model: AudioRecogniseModel) {

    }
}
