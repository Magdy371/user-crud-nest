import { Injectable, ConflictException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './DTOs/create-role.dto';
import { UpdateRoleDto } from './DTOs/update-role.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Role } from '@prisma/client';

@Injectable()
export class RoleService {
  private readonly logger  = new Logger(RoleService.name);
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache,
              private service: PrismaService) {
  }

  async createRole( dto: CreateRoleDto): Promise<Role>{
    const {name} = dto;
    //check if Role name is already Exist
    const roleExist = await this.service.role.findUnique({where: {name},})
    if(roleExist){
      throw new ConflictException('the role is already exist');
    }
    const role = await this.service.role.create({ data: dto},);
    await this.invalidateRoleCache()
    return role;
  }

  async findAll(): Promise<Role[]>{
    const roles = await this.service.role.findMany({
      include:{
        users: { select: {id: true, name: true, email: true}}
      }
    });
    if(!roles){
      throw new NotFoundException(`The table role is Empty`);
    }
     await this.cacheManager.set('roles:all', roles, 300);
    return roles;
  }

  async findOne(id: number): Promise<Role>{
    const role = await this.service.role.findUnique({where: {id},
    include:{
      users: {select: {id:true, name:true, email: true} }
    }});
    if(!role){
      throw new NotFoundException(`the role with id: ${id} not found`);
    }
    return role;
  }

  async findByname(name: string): Promise<Role>{
    const role = await this.service.role.findUnique({where: {name},
    include:{
      users: {select: {id:true, name:true, email: true} }
    }});
    if(!role){
      throw new NotFoundException(`the role with name: ${name} not found`);
    }
    return role;
  }

  async update(id: number, dto: UpdateRoleDto){
    const roleExist = await this.service.role.findUnique({where: {id}});
    if(!roleExist){
      throw new NotFoundException(`the role with id: ${id} not found `);
    }
    const role = await this.service.role.update({
      where: {id},
      data: dto,
      include: {
        users:{select: {id: true, name: true, email: true}}
      }
    })
    await this.invalidateRoleCache()
    return role;  
  }

  async remove(id: number){
    // check if role related to any users
    const userRole = await this.service.user.findMany({
      where: {roleId: id}
    });
    if(userRole.length > 0){
      throw new ConflictException(` Cannot delete this role as it is related to some users`);
    }
    const role = await this.service.role.delete({ where: {id}, });
    await this.invalidateRoleCache()
    return role;
  }

  private async invalidateRoleCache(): Promise<void>{
    await this.cacheManager.del('roles:all');
  }
}