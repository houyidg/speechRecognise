"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TimeUtils_1 = require("./../util/TimeUtils");
var AudioRecogniseModel = /** @class */ (function () {
    function AudioRecogniseModel() {
    }
    //20161020145043_1006_15902875896
    AudioRecogniseModel.prototype.buildModel = function (_a) {
        var fileNameExcludeSuffix = _a.fileNameExcludeSuffix, translateTextArr = _a.translateTextArr;
        var fileArr = fileNameExcludeSuffix.split('_');
        this.audioId = fileNameExcludeSuffix;
        this.clientPhone = fileArr[2];
        this.content = translateTextArr.join();
        this.employeeNo = fileArr[1];
        this.translateDate = TimeUtils_1.TimeUtils.getNowAccurateDate();
        this.recordDate = fileArr[0];
        return this;
    };
    return AudioRecogniseModel;
}());
exports.AudioRecogniseModel = AudioRecogniseModel;
/**
 * CREATE TABLE `speech_recognise_result`.`audiorecognisemodel` (
  `audioId` VARCHAR(45) NOT NULL,
  `recordDate` VARCHAR(45) NULL,
  `translateDate` VARCHAR(45) NULL,
  `content` VARCHAR(45) NOT NULL,
  `employeeNo` VARCHAR(45) NULL,
  `clientPhone` VARCHAR(45) NULL,
  PRIMARY KEY (`audioId`),
  UNIQUE INDEX `audioId_UNIQUE` (`audioId` ASC))
  ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8
  COMMENT = 'AudioRecogniseModel';
 */ 
