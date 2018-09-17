import { TimeUtils } from './../util/TimeUtils';
export class AudioRecogniseModel {
    public audioId: string;
    public recordDate: string;
    public translateDate: string;
    public content: string;
    public employeeNo: string;
    public clientPhone: string;

    //20161020145043_1006_15902875896
    public buildModel({ fileNameExcludeSuffix, translateTextArr }) {
        let fileArr = fileNameExcludeSuffix.split('_');
        this.audioId = fileNameExcludeSuffix;
        this.clientPhone = fileArr[2];
        this.content = translateTextArr.join();
        this.employeeNo = fileArr[1];
        this.translateDate = TimeUtils.getNowAccurateDate();
        this.recordDate = fileArr[0];
        return this;
    }
}
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