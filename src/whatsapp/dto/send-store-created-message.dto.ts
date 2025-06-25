import { IsString, IsPhoneNumber, Matches } from 'class-validator';

export class SendStoreCreatedMessageDto {
  @IsString()
  @Matches(/^\d{12,13}$/, {
    message: 'O número deve conter DDI + DDD + número, com 12 ou 13 dígitos',
  })
  @IsPhoneNumber('BR')
  phone: string;

  @IsString()
  storeName: string;

  @IsString()
  ownerName: string;
}
