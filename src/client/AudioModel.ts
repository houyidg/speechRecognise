export class AudioRecogniseModel {
    public audioId: string;
    public recordDate: string;
    public translateDate: string;
    public content: string;
    public employeeNo: string;
    public clientPhone: string;
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