"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PhoneSessionModel = /** @class */ (function () {
    function PhoneSessionModel() {
        this.id = 1;
    }
    //20161020145043_1006_15902875896
    PhoneSessionModel.prototype.buildModel = function (_a) {
        var _b = _a.id, id = _b === void 0 ? 1 : _b, _c = _a.translateTextArr, translateTextArr = _c === void 0 ? [] : _c, _d = _a.fileName, fileName = _d === void 0 ? "" : _d;
        this.id = id;
        this.fileName = fileName;
        this.call_content_baidu = translateTextArr.join();
        return this;
    };
    return PhoneSessionModel;
}());
exports.PhoneSessionModel = PhoneSessionModel;
/**
 * CREATE TABLE IF NOT EXISTS `call_center_data`.`call_history` (
  `id` int(11) NOT NULL COMMENT '自增主键',
  `call_sheet_id` int(11) NOT NULL DEFAULT '0' COMMENT '通话记录的ID',
  `call_id` int(11) NOT NULL DEFAULT '0' COMMENT '通话ID',
  `call_type` varchar(45) NOT NULL DEFAULT '' COMMENT '呼叫类型包括 : normal普通来电 , dialout外呼通话 , transfer转接电话 , dialtransfer外呼转接',
  `call_no` varchar(255) NOT NULL DEFAULT '' COMMENT '主叫号码',
  `called_no` varchar(255) NOT NULL DEFAULT '' COMMENT '被叫号码',
  `ring` datetime DEFAULT NULL COMMENT '开始呼叫时间',
  `ringing_time` datetime DEFAULT NULL COMMENT '响铃时间',
  `begin` datetime DEFAULT NULL COMMENT '摘机接通时间',
  `end` datetime DEFAULT NULL COMMENT '通话结束时间',
  `queue_time` datetime DEFAULT NULL COMMENT '呼入来电进入技能组时间',
  `queue` varchar(45) NOT NULL DEFAULT '' COMMENT '呼入来电进入的技能组',
  `agent` varchar(45) NOT NULL DEFAULT '' COMMENT '坐席登录名',
  `exten` varchar(45) NOT NULL DEFAULT '' COMMENT '坐席工号',
  `state` varchar(45) NOT NULL DEFAULT '' COMMENT '通话记录状态 : 已接听[dealing] , 振铃未接听[notDeal] , 已留言[voicemail] ,黑名单[blackList] , 排队放弃[queueLeak] , ivr [leak]',
  `monitor_filename` varchar(255) NOT NULL DEFAULT '' COMMENT '录音文件链接地址',
  `pbx` varchar(45) NOT NULL DEFAULT '' COMMENT '账户所在的PBX',
  `agent_name` varchar(45) NOT NULL DEFAULT '' COMMENT '坐席姓名',
  `call_state` varchar(45) NOT NULL DEFAULT '' COMMENT '事件状态 : Ring , Ringing , Link , Hangup ( Unlink也当成Hangup处理 )',
  `province` varchar(45) NOT NULL DEFAULT '' COMMENT '省份',
  `district` varchar(45) NOT NULL DEFAULT '' COMMENT '市区',
  `ivr_key` varchar(45) NOT NULL DEFAULT '' COMMENT 'ivr按键值',
  `call_content_baidu` mediumtext COMMENT '通话内容：语音转文本',
  `call_content_ali` mediumtext COMMENT '通话内容：语音转文本',
  `oss_url`  varchar(255) COMMENT '音频文件存储在oss上的地址',
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='通话记录历史表';


 */
