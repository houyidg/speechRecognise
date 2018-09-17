"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PhoneSessionModel = /** @class */ (function () {
    function PhoneSessionModel() {
    }
    //20161020145043_1006_15902875896
    PhoneSessionModel.prototype.buildModel = function (_a) {
        var fileNameExcludeSuffix = _a.fileNameExcludeSuffix, translateTextArr = _a.translateTextArr;
        this.id = fileNameExcludeSuffix;
        this.call_content_baidu = translateTextArr.join();
        return this;
    };
    return PhoneSessionModel;
}());
exports.PhoneSessionModel = PhoneSessionModel;
/**
 * CREATE TABLE IF NOT EXISTS `call_center_data`.`call_history` (
  `id` INT(11) NOT NULL COMMENT '自增主键',
  `call_sheet_id` INT(11) NOT NULL DEFAULT 0 COMMENT '通话记录的ID',
  `call_id` INT(11) NOT NULL DEFAULT 0 COMMENT '通话ID',
  `call_type` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '呼叫类型包括 : normal普通来电 , dialout外呼通话 , transfer转接电话 , dialtransfer外呼转接',
  `call_no` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '主叫号码',
  `called_no` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '被叫号码',
  `ring` DATETIME NULL COMMENT '开始呼叫时间',
  `ringing_time` DATETIME NULL COMMENT '响铃时间',
  `begin` DATETIME NULL COMMENT '摘机接通时间',
  `end` DATETIME NULL COMMENT '通话结束时间',
  `queue_time` DATETIME NULL COMMENT '呼入来电进入技能组时间',
  `queue` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '呼入来电进入的技能组',
  `agent` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '坐席登录名',
  `exten` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '坐席工号',
  `state` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '通话记录状态 : 已接听[dealing] , 振铃未接听[notDeal] , 已留言[voicemail] ,黑名单[blackList] , 排队放弃[queueLeak] , ivr [leak]',
  `monitor_filename` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '录音文件链接地址',
  `pbx` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '账户所在的PBX',
  `agent_name` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '坐席姓名',
  `call_state` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '事件状态 : Ring , Ringing , Link , Hangup ( Unlink也当成Hangup处理 )',
  `province` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '省份',
  `district` VARCHAR(45) NOT NULL DEFAULT '' COMMENT '市区',
  `ivr_key` VARCHAR(45) NOT NULL DEFAULT '' COMMENT 'ivr按键值',
  `call_content_baidu` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '通话内容：语音转文本',
  `call_content_alicall_historycall_history` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '通话内容：语音转文本',
  `create_time` DATETIME NULL,
  `update_time` DATETIME NULL COMMENT '修改时间',
  PRIMARY KEY (`id`))
  ENGINE = InnoDB DEFAULT CHARSET=utf8 COMMENT='通话记录历史表';
 */ 
