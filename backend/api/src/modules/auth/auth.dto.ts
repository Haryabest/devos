import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Иван Иванов' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'ivan@devos.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ivan@devos.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword123' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ example: 'newpassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
