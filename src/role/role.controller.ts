import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { RoleService } from "./role.service";
import { CreateRoleDto } from "./DTOs/create-role.dto";
import { UpdateRoleDto } from "./DTOs/update-role.dto";
import {
  AdminOnly,
  Public,
} from 'src/common/guards/decorators/auth.decorators';
import { Cachable } from "src/common/guards/decorators/cacheable.decorator";

@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Public()
    @Post()
    create(@Body() data: CreateRoleDto) {
        return this.roleService.createRole(data);
    }

    @Public()
    @Get()
    @Cachable({ ttl: 3600 }) // Cache for 1 hour
    findAll(){
        return this.roleService.findAll();
    }

    @AdminOnly()
    @Get(':id')
    @Cachable({ ttl: 3600 }) // Cache for 1 hour
    findOne(@Param('id', ParseIntPipe) id: number){
        return this.roleService.findOne(id);
    }

    @AdminOnly()
    @Get(':name')
    findOneByName(@Param('name') name: string){
        return this.roleService.findByname(name);
    }

    @AdminOnly()
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateRoleDto){
        return this.roleService.update(id, data);
    }

    @AdminOnly()
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number){
        return this.roleService.remove(id);
    }
}