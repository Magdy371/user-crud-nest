import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;
@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url:string;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ required: true })
  responseTime: number;

  @Prop({ default: null })
  userId?: number;

  @Prop({ default: null })
  userAgent?: string;

  @Prop({ default: null })
  ipAddress?: string;

  @Prop({ type: Object, default: {} })
  requestBody?: any;

  @Prop({ type: Object, default: {} })
  queryParams?: any;

  @Prop({ default: Date.now })
  timestamp: Date;

}
export const LogSchema = SchemaFactory.createForClass(Log);