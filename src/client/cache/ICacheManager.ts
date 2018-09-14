/**
    缓存组件
    *  这次执行任务时保存以及缓存所有路径
    *  这次执行失败时保存以及缓存路径
    *  定时备份执行的任务
    *  定时清除失败任务和执行任务的路径文件
 */
export interface ICacheManager {
    init(cacheAudioBasePath)
    /**
     * @param path 
     * return true 代表已经在处理或者处理完成， false 
     */
    saveTaskPath(path: string): boolean;
    saveFailTaskPath(path: string);
    clearLastTaskPathOnlyCache(path: string);
    clearLastTaskPathOnlyFile(path: string);
    clearFailTaskPath(path: string);
    clearAllTaskPath();
    backupTaskPathByTimer();
    getTodayCacheTaskPath();
}