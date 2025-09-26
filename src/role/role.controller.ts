import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { RoleService } from "./role.service";
import { CreateRoleDto } from "./DTOs/create-role.dto";
import { UpdateRoleDto } from "./DTOs/update-role.dto";
import { AdminOnly } from "src/common/guards/decorators/auth.decorators";
import { Cachable } from "src/common/guards/decorators/cacheable.decorator";

@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @AdminOnly()
    @Post()
    create(@Body() data: CreateRoleDto) {
        this.roleService.createRole(data);
    }

    @AdminOnly()
    @Get()
    @Cachable({ ttl: 3600 }) // Cache for 1 hour
    findAll(){
        this.roleService.findAll();
    }

    @AdminOnly()
    @Get(':id')
    @Cachable({ ttl: 3600 }) // Cache for 1 hour
    findOne(@Param('id', ParseIntPipe) id: number){
        this.roleService.findOne(id);
    }

    @AdminOnly()
    @Get(':name')
    findOneByName(@Param('name') name: string){
        this.roleService.findByname(name);
    }

    @AdminOnly()
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateRoleDto){
        this.roleService.update(id, data);
    }

    @AdminOnly()
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number){
        this.roleService.remove(id);
    }
}