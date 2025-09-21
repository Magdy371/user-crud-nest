import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

}