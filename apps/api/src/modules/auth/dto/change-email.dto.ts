import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail()
  newEmail: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
