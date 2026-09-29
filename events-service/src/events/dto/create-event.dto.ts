import { IsString, IsDateString, IsInt, Min, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  capacity: number;
}