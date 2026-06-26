import { IsString, IsUrl, MaxLength } from 'class-validator';

export class KakaoAuthorizeQueryDto {
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  redirectUri!: string;
}

export class KakaoCallbackDto {
  @IsString()
  @MaxLength(500)
  code!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(500)
  redirectUri!: string;
}
