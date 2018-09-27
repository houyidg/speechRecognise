export  interface ISpeechRecongniseClient{
    prepare({});//准备环境
    handleApiResult({});
    start();//开始执行
    stop();//停止
}
