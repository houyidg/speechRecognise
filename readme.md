# 一句话语音识别

## node环境 10.9.0
## 百度一句话识别支持
语音识别仅支持以下格式 ：pcm（不压缩）、wav（不压缩，pcm编码）、amr（有损压缩格式）；8k/16k 采样率 16bit 位深的单声道。即：

pcm wav amr 格式三选一。 正常情况请使用pcm。其中wav格式需要使用pcm编码。
采用率二选一 8000 或者 16000。正常情况请使用16000
单声道

## pcm文件音频时长计算
和图像bmp文件一样，[cm文件保存的是未压缩的音频信息。16bits编码是指，每次采样的音频信息用2字节保存。可以对比下bmp文件用分别RGB颜色的信息。16000采样率是指1秒钟采样16000次。常见的音频是44100HZ，即一秒采样44100次。单声道：只有一个声道。

根据这些信息，我们可以计算：1秒的16000采样率音频文件大小是2*16000= 32000字节，约为32k = 1秒。


## ffmpeg获取音频时长
ffmpeg -i 20161017141228_1004_18583386261.mp3 2>&1 | grep 'Duration' | cut -d ' ' -f 4 | sed s/,//


## ffmpeg切割音频
ffmpeg -i 20161017141228_1004_18583386261.mp3 -ss 00:00:00 -t 00:00:30 -acodec copy output.mp3 

参数说明： 
-ss : 指定从那裡开始 
-t : 指定到那裡结束 
-acodec copy : 编码格式和来源档桉相同（就是mp3） 


## ffmpeg转换mp3为pcm
ffmpeg -y  -i aidemo.mp3  -acodec pcm_s16le -f s16le -ac 1 -ar 16000 16k.pcm 

## nodejs package
package-lock.json是当 node_modules 或 package.json 发生变化时自动生成的文件。这个文件主要功能是确定当前安装的包的依赖，以便后续重新安装的时候生成相同的依赖，而忽略项目开发过程中有些依赖已经发生的更新。


## 音频文件格式转换
https://ffmpeg.zeranoe.com/builds/

http://ai.baidu.com/docs#/ASR-Tool-convert/top

## 安装TypeScript，命令行运行：
npm install -g typescript

## 安装fetch
npm install node-fetch --save
## npm 安装百度语音识别sdk
npm install baidu-aip-sdk
## 安装日期库
npm install --save moment
## How to find module “fs” in MS Code with TypeScript?、

You need to include the definition file for node.

TypeScript 2.0+

Install using npm:

npm install --save-dev @types/node
TypeScript < 2.0

If you use typings then you can run this command:

typings install dt~node --global --save
Or if you are using typings < 1.0 run:

typings install node --ambient --save

## ts编译的js输出目录在tsconfig中配置

## nodejs process.cwd():当前项目的执行路径

## nodejs replace全局字符 .replace(/word/g, 'xx')  replace(new RegExp("/","gm"), '\\');

## 修改cmd编码为utf-8 CHCP 65001

## ts Never
never类型表示的是那些永不存在的值的类型。 例如，never类型是那些总是会抛出异常或根本就不会有返回值的函数表达式或箭头函数表达式的返回值类型； 变量也可能是never类型，当它们被永不为真的类型保护所约束时。

## github下载链接
https://github.com/houyidg/speechRecognise/raw/httpbranch/temp/20161018145623_1006_18081970722.mp3
https://github.com/houyidg/speechRecognise/blob/httpbranch/temp/20161018145623_1006_18081970722.mp3

## 下载log4js
npm install log4js -s