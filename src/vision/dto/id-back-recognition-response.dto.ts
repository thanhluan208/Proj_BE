export class IdBackRecognitionData {
  issueDate: string;
  issueLoc: string;
}

export class IdBackRecognitionResponseDto {
  errorCode: number;
  errorMessage: string;
  data: IdBackRecognitionData[];
}
