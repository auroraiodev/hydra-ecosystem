import { IsInt, IsString, IsOptional, Max, Min, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  @IsOptional()
  order_id?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
