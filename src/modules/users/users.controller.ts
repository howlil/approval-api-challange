import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { CreateUserDto } from './dto/create-user.dto';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { UsersService } from './users.service';
  
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() body: CreateUserDto) {
      const user = await this.usersService.create({
        email: body.email,
        name: body.name,
        password: body.password,
        role: body.role,
      });
      const { password: _, ...rest } = user;
      return rest;
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: Request & { user: { sub: string } }) {
      const user = await this.usersService.findById(req.user.sub);
      if (!user) {
        return null;
      }
      const { password: _, ...rest } = user;
      return rest;
    }
  }