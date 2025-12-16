export class IdRecognitionData {
  citizenId: string;
  name: string;
  dob: string;
  sex: string;
  nationality: string;
  home: string;
  address: string;
}

export class IdRecognitionResponseDto {
  errorCode: number;
  errorMessage: string;
  data: IdRecognitionData[];
}
