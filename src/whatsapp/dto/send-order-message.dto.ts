import { IsString, IsNumber, Matches } from 'class-validator';

export class SendOrderMessageDto {
  @IsString()
  @Matches(/^\d{12,13}$/, {
    message: 'O número deve conter DDI + DDD + número, com 12 ou 13 dígitos',
  })
  phone: string;

  @IsString()
  customerName: string;

  @IsString()
  orderId: string;

  @IsNumber()
  total: number;
}
